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

import { EventEmitter } from "events";
import VolMeterWorket from "./worklets/vol-meter";
import AudioRecordingWorklet from "./worklets/audio-processing";
import { createWorketFromSrc } from "./audioworklet-registry";
import { audioContext } from "./utils";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {
    super();
  }

  // Helper method to get environment-specific thresholds
  private getEnvironmentThreshold(
    environment: string,
    type: "volume" | "silence" | "frames"
  ): number {
    switch (environment) {
      case "QUIET":
        return type === "frames" ? 12 : 0.0001;
      case "MODERATE":
        return type === "frames" ? 10 : 0.0002;
      case "NOISY":
        return type === "frames" ? 8 : 0.0003;
      default:
        return type === "frames" ? 12 : 0.0001;
    }
  }

  // Method to update environment settings in the worklet
  updateEnvironment(environment: string) {
    if (this.recordingWorklet && this.recording) {
      this.recordingWorklet.port.postMessage({
        type: "updateEnvironment",
        environment: environment,
      });
    }
  }

  async start(existingStream?: MediaStream) {
    // Don't start if already recording or in the process of starting
    if (this.recording || this.starting) {
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }

    this.starting = new Promise(async (resolve, reject) => {
      try {
        // Use existing stream if provided, otherwise get new one
        if (existingStream) {
          this.stream = existingStream;
        } else {
          this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
            },
          });
        }

        // Get the actual sample rate from the MediaStream
        const audioTrack = this.stream.getAudioTracks()[0];
        const settings = audioTrack.getSettings();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const actualSampleRate = settings.sampleRate || 44100; // fallback to 44.1kHz

        // Create AudioContext using shared utility (handles autoplay policy)
        this.audioContext = await audioContext({
          sampleRate: this.sampleRate,
          // Don't reuse AudioContext on resume - create fresh one to avoid processing delays
          // id: "audio-recorder-context", // Reuse the same AudioContext instance
        });

        // Create source node
        this.source = this.audioContext.createMediaStreamSource(this.stream);

        // Get current environment from localStorage
        const currentEnvironment =
          localStorage.getItem("ai_vad_environment") || "QUIET";

        // Create unique worklet name to avoid caching issues on refresh
        const workletName = `audio-recorder-worklet-${Date.now()}`;

        // Create environment-specific worklet source with correct initial thresholds
        const environmentSpecificWorklet = AudioRecordingWorklet.replace(
          "volumeThreshold = 0.0001;",
          `volumeThreshold = ${this.getEnvironmentThreshold(
            currentEnvironment,
            "volume"
          )};`
        )
          .replace(
            "silenceThreshold = 0.0001;",
            `silenceThreshold = ${this.getEnvironmentThreshold(
              currentEnvironment,
              "silence"
            )};`
          )
          .replace(
            "maxConsecutiveSilenceFrames = 12;",
            `maxConsecutiveSilenceFrames = ${this.getEnvironmentThreshold(
              currentEnvironment,
              "frames"
            )};`
          );

        const src = createWorketFromSrc(
          workletName,
          environmentSpecificWorklet
        );

        // Register worklet, ignore "already registered" errors
        try {
          await this.audioContext.audioWorklet.addModule(src);
        } catch (error) {
          // Ignore "already registered" errors, they're harmless
          if (
            !(
              error instanceof Error &&
              error.message.includes("already registered")
            )
          ) {
            throw error; // Re-throw if it's a different error
          }
        }

        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName
        );

        this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
          // Check if recording is still active before emitting data
          if (!this.recording) {
            return;
          }

          // worklet processes recording floats and messages converted buffer
          const arrayBuffer = ev.data.data.int16arrayBuffer;

          if (arrayBuffer) {
            const arrayBufferString = arrayBufferToBase64(arrayBuffer);
            this.emit("data", arrayBufferString);
          }
        };
        this.source.connect(this.recordingWorklet);

        // vu meter worklet
        const vuWorkletName = "vu-meter";
        const vuSrc = createWorketFromSrc(vuWorkletName, VolMeterWorket);

        // Register VU worklet, ignore "already registered" errors
        try {
          await this.audioContext.audioWorklet.addModule(vuSrc);
        } catch (error) {
          // Ignore "already registered" errors, they're harmless
          if (
            !(
              error instanceof Error &&
              error.message.includes("already registered")
            )
          ) {
            throw error; // Re-throw if it's a different error
          }
        }

        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);

        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emit("volume", ev.data.volume);
        };

        this.source.connect(this.vuWorklet);
        this.recording = true;
        resolve();
        this.starting = null;
      } catch (error) {
        console.error("🎤 AudioRecorder: Error during startup:", error);
        this.recording = false;
        this.starting = null;
        reject(error);
      }
    });

    return this.starting;
  }

  stop() {
    // Immediately set recording to false to prevent new data emission
    this.recording = false;

    // Immediately disconnect worklets to stop data flow
    if (this.recordingWorklet) {
      this.recordingWorklet.disconnect();
      this.recordingWorklet = undefined;
    }
    if (this.vuWorklet) {
      this.vuWorklet.disconnect();
      this.vuWorklet = undefined;
    }

    // its plausible that stop would be called before start completes
    // such as if the websocket immediately hangs up
    const handleStop = async () => {
      // Worklets are already disconnected above, just clean up the rest

      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      // Close the AudioContext since we're not reusing it anymore
      if (this.audioContext && this.audioContext.state !== "closed") {
        try {
          await this.audioContext.close();
        } catch (closeError) {
          // Error closing AudioContext
        }
      }
      this.stream = undefined;
      // Clear AudioContext reference since we're not reusing it
      this.audioContext = undefined;
      this.source = undefined;
      this.recording = false; // Ensure recording flag is reset
    };

    if (this.starting) {
      // Start in progress, will stop after start completes
      this.starting.then(handleStop);
      return;
    }
    handleStop();
  }
}
// Force rebuild Fri Jun  6 12:52:24 CEST 2025
