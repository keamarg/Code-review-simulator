/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const AudioRecordingWorklet = `
class AudioProcessingWorklet extends AudioWorkletProcessor {

  // Reduced buffer size for faster response - 512 samples instead of 1024
  // At 16kHz this is ~32ms chunks (vs 64ms before) for faster voice registration
  buffer = new Int16Array(512);

  // current write index
  bufferWriteIndex = 0;

  // Environment-aware audio gate thresholds - will be set in constructor
  volumeThreshold = 0.0001;
  silenceThreshold = 0.0001;
  maxConsecutiveSilenceFrames = 8; // Reduced from 12 for faster response
  
  // Track recent volume to detect silence vs actual speech
  recentVolumes = [];
  maxRecentVolumes = 2; // Reduced from 3 for faster pattern detection

  // Speech detection parameters
  speechVariationThreshold = 0.01; // Reduced from 0.02 for easier speech detection
  consecutiveSilenceFrames = 0; // Track consecutive silent frames

  constructor() {
    super();
    this.hasAudio = false;
    
    // Listen for environment parameter updates (for runtime changes)
    this.port.onmessage = (event) => {
      if (event.data.type === 'updateEnvironment') {
        this.updateEnvironmentSettings(event.data.environment);
      }
    };
  }

  updateEnvironmentSettings(environment) {
    switch(environment) {
      case 'QUIET':
        // High sensitivity for quiet environments - even more permissive
        this.volumeThreshold = 0.00005; // Reduced from 0.0001 - more sensitive
        this.silenceThreshold = 0.00005; // Reduced from 0.0001 - more sensitive
        this.maxConsecutiveSilenceFrames = 6; // Reduced from 12 - faster response
        break;
      case 'MODERATE':
        // More permissive for moderate noise environments
        this.volumeThreshold = 0.0001; // Reduced from 0.0002 - more permissive
        this.silenceThreshold = 0.0001; // Reduced from 0.0002 - more permissive
        this.maxConsecutiveSilenceFrames = 5; // Reduced from 10 - faster response
        break;
      case 'NOISY':
        // More permissive for noisy environments
        this.volumeThreshold = 0.0002; // Reduced from 0.0003 - more permissive
        this.silenceThreshold = 0.0002; // Reduced from 0.0003 - more permissive
        this.maxConsecutiveSilenceFrames = 4; // Reduced from 8 - faster response
        break;
      default:
        // Default to quiet environment
        this.volumeThreshold = 0.00005;
        this.silenceThreshold = 0.00005;
        this.maxConsecutiveSilenceFrames = 6;
    }
  }

  /**
   * @param inputs Float32Array[][] [input#][channel#][sample#] so to access first inputs 1st channel inputs[0][0]
   * @param outputs Float32Array[][]
   */
  process(inputs) {
    if (inputs[0].length) {
      const channel0 = inputs[0][0];
      
      // Calculate RMS volume for this chunk
      const rms = this.calculateRMS(channel0);
      
      // Track recent volumes for pattern detection
      this.recentVolumes.push(rms);
      if (this.recentVolumes.length > this.maxRecentVolumes) {
        this.recentVolumes.shift();
      }
      
      // Check if this is a silent frame
      if (rms < this.silenceThreshold) {
        this.consecutiveSilenceFrames++;
      } else {
        this.consecutiveSilenceFrames = 0;
      }
      
      // More permissive processing - process more audio for faster response
      const shouldProcess = this.consecutiveSilenceFrames < this.maxConsecutiveSilenceFrames || 
                           rms > this.volumeThreshold * 0.2; // Reduced from 0.3 - even more permissive
      
      if (shouldProcess) {
        this.processChunk(channel0);
      }
    }
    return true;
  }

  calculateRMS(float32Array) {
    let sum = 0;
    for (let i = 0; i < float32Array.length; i++) {
      sum += float32Array[i] * float32Array[i];
    }
    return Math.sqrt(sum / float32Array.length);
  }

  looksLikeSpeech() {
    if (this.recentVolumes.length < 1) return true; // Reduced to 1 for fastest detection
    
    // Check for volume variation patterns typical of speech
    const avgVolume = this.recentVolumes.reduce((a, b) => a + b, 0) / this.recentVolumes.length;
    const maxVolume = Math.max(...this.recentVolumes);
    const minVolume = Math.min(...this.recentVolumes);
    
    // Speech typically has more volume variation than background noise
    const variation = (maxVolume - minVolume) / (avgVolume + 0.001); // Add small value to prevent division by zero
    
    // More permissive speech detection - just check if there's any volume above threshold
    const hasAnyVolume = avgVolume > this.volumeThreshold * 0.3; // Reduced from 0.5 - even more permissive
    
    return hasAnyVolume;
  }

  sendAndClearBuffer(){
    this.port.postMessage({
      event: "chunk",
      data: {
        int16arrayBuffer: this.buffer.slice(0, this.bufferWriteIndex).buffer,
      },
    });
    this.bufferWriteIndex = 0;
  }

  processChunk(float32Array) {
    const l = float32Array.length;
    
    for (let i = 0; i < l; i++) {
      // convert float32 -1 to 1 to int16 -32768 to 32767
      const int16Value = float32Array[i] * 32768;
      this.buffer[this.bufferWriteIndex++] = int16Value;
      if(this.bufferWriteIndex >= this.buffer.length) {
        this.sendAndClearBuffer();
      }
    }

    if(this.bufferWriteIndex >= this.buffer.length) {
      this.sendAndClearBuffer();
    }
  }
}
`;

export default AudioRecordingWorklet;
