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
  private hasLoggedIgnoring: boolean = false; // Track if we've already logged the ignoring message

  constructor(public sampleRate = 16000) {
    super();
  }

  async start(existingStream?: MediaStream) {
    // Don't start if already recording or in the process of starting
    if (this.recording || this.starting) {
      console.log("🎤 AudioRecorder: Already recording or starting, skipping");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }

    console.log("🎤 AudioRecorder: Starting audio recording process...");

    this.starting = new Promise(async (resolve, reject) => {
      try {
        // Use existing stream if provided, otherwise get new one
        if (existingStream) {
          console.log("🎤 AudioRecorder: Using provided audio MediaStream");
          this.stream = existingStream;
        } else {
          console.log(
            "🎤 AudioRecorder: Getting new MediaStream (audio only)..."
          );
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
        const actualSampleRate = settings.sampleRate || 44100; // fallback to 44.1kHz

        console.log(
          `🎤 AudioRecorder: MediaStream sample rate: ${actualSampleRate}Hz`
        );

        // Create AudioContext using shared utility (handles autoplay policy)
        console.log("🎤 AudioRecorder: Creating AudioContext...");
        this.audioContext = await audioContext({
          sampleRate: this.sampleRate,
          // Don't reuse AudioContext on resume - create fresh one to avoid processing delays
          // id: "audio-recorder-context", // Reuse the same AudioContext instance
        });
        console.log(
          `✅ AudioRecorder: Created AudioContext with ${this.audioContext.sampleRate}Hz`
        );

        // Fresh AudioContext for each session
        console.log("✅ AudioRecorder: AudioContext ready (fresh instance)");

        // Create source node
        this.source = this.audioContext.createMediaStreamSource(this.stream);
        console.log("✅ AudioRecorder: Created MediaStreamAudioSourceNode");

        const workletName = "audio-recorder-worklet";
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

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
            // Only log this message once to prevent console spam
            if (!this.hasLoggedIgnoring) {
              console.log(
                "🎤 AudioRecorder: Worklet received data but recording is false, ignoring (suppressing further messages)"
              );
              this.hasLoggedIgnoring = true;
            }
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
        this.hasLoggedIgnoring = false; // Reset logging flag for new recording session
        console.log("✅ AudioRecorder: Successfully started recording");
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
    console.log("🎤 AudioRecorder: Stop called, setting recording to false");
    // Immediately set recording to false to prevent new data emission
    this.recording = false;
    this.hasLoggedIgnoring = false; // Reset for next session

    // its plausible that stop would be called before start completes
    // such as if the websocket immediately hangs up
    const handleStop = async () => {
      console.log("🎤 AudioRecorder: Executing handleStop...");
      // Disconnect the worklets first to stop data flow
      if (this.recordingWorklet) {
        console.log("🎤 AudioRecorder: Disconnecting recording worklet");
        this.recordingWorklet.disconnect();
        this.recordingWorklet = undefined;
      }
      if (this.vuWorklet) {
        console.log("🎤 AudioRecorder: Disconnecting VU worklet");
        this.vuWorklet.disconnect();
        this.vuWorklet = undefined;
      }

      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      // Close the AudioContext since we're not reusing it anymore
      if (this.audioContext && this.audioContext.state !== "closed") {
        try {
          await this.audioContext.close();
        } catch (closeError) {
          console.warn(
            "🎤 AudioRecorder: Error closing AudioContext:",
            closeError
          );
        }
      }
      this.stream = undefined;
      // Clear AudioContext reference since we're not reusing it
      this.audioContext = undefined;
      this.source = undefined;
      this.recording = false; // Ensure recording flag is reset
      console.log("🎤 AudioRecorder: Stop completed");
    };

    if (this.starting) {
      console.log(
        "🎤 AudioRecorder: Start in progress, will stop after start completes"
      );
      this.starting.then(handleStop);
      return;
    }
    handleStop();
  }
}
// Force rebuild Fri Jun  6 12:52:24 CEST 2025
