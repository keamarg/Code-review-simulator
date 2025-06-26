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

  // send and clear buffer every 1024 samples, 
  // which at 16khz is about 16 times a second (reduced from 2048 for faster response)
  buffer = new Int16Array(1024);

  // current write index
  bufferWriteIndex = 0;

  // Audio gate threshold to prevent feedback (adjust as needed)
  volumeThreshold = 0.001; // Much lower threshold - reduced from 0.01 to 0.001
  
  // Track recent volume to detect silence vs actual speech
  recentVolumes = [];
  maxRecentVolumes = 5; // Reduced from 10 to 5 for faster response

  constructor() {
    super();
    this.hasAudio = false;
  }

  /**
   * @param inputs Float32Array[][] [input#][channel#][sample#] so to access first inputs 1st channel inputs[0][0]
   * @param outputs Float32Array[][]
   */
  process(inputs) {
    if (inputs[0].length) {
      const channel0 = inputs[0][0];
      // Temporarily disable advanced processing - just process all audio
      this.processChunk(channel0);
      
      // TODO: Re-enable smart processing once we confirm basic functionality
      /*
      // Calculate RMS volume for this chunk
      const rms = this.calculateRMS(channel0);
      
      // Track recent volumes for pattern detection
      this.recentVolumes.push(rms);
      if (this.recentVolumes.length > this.maxRecentVolumes) {
        this.recentVolumes.shift();
      }
      
      // Only process if volume is above threshold and shows speech characteristics
      if (rms > this.volumeThreshold && this.looksLikeSpeech()) {
        this.processChunk(channel0);
      }
      */
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
    if (this.recentVolumes.length < 2) return true; // Reduced from 3 to 2, allow through faster
    
    // Check for volume variation patterns typical of speech
    const avgVolume = this.recentVolumes.reduce((a, b) => a + b, 0) / this.recentVolumes.length;
    const maxVolume = Math.max(...this.recentVolumes);
    const minVolume = Math.min(...this.recentVolumes);
    
    // Speech typically has more volume variation than AI feedback echoes
    const variation = (maxVolume - minVolume) / (avgVolume + 0.001); // Add small value to prevent division by zero
    return variation > 0.1; // Much lower requirement - reduced from 0.5 to 0.1
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
