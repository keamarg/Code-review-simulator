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

export type GetAudioContextOptions = AudioContextOptions & {
  id?: string;
};

const map: Map<string, AudioContext> = new Map();

export const audioContext: (
  options?: GetAudioContextOptions
) => Promise<AudioContext> = (() => {
  const didInteract = new Promise((res) => {
    window.addEventListener("pointerdown", res, { once: true });
    window.addEventListener("keydown", res, { once: true });
  });

  return async (options?: GetAudioContextOptions) => {
    try {
      const a = new Audio();
      a.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      await a.play();
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) {
          return ctx;
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    } catch (e) {
      await didInteract;
      if (options?.id && map.has(options.id)) {
        const ctx = map.get(options.id);
        if (ctx) {
          return ctx;
        }
      }
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    }
  };
})();

export const blobToJSON = (blob: Blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const json = JSON.parse(reader.result as string);
        resolve(json);
      } else {
        reject("oops");
      }
    };
    reader.readAsText(blob);
  });

export function base64ToArrayBuffer(base64: string) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Simple logging utility for important application state changes
 * Provides consistent, meaningful logging without being verbose
 */
export const appLogger = {
  // Session lifecycle events
  session: {
    start: () => console.log("🚀 Session started"),
    stop: () => console.log("🛑 Session stopped"),
    pause: () => console.log("⏸️ Session paused"),
    resume: () => console.log("▶️ Session resumed"),
    terminate: () => console.log("💥 Session terminated"),
  },

  // Connection events
  connection: {
    established: () => console.log("✅ Connection established"),
    lost: () => console.log("❌ Connection lost"),
    reconnecting: () => console.log("🔄 Reconnecting..."),
    reconnected: () => console.log("✅ Reconnected successfully"),
  },

  // User actions
  user: {
    startReview: () => console.log("👤 User started review"),
    stopReview: () => console.log("👤 User stopped review"),
    pauseReview: () => console.log("👤 User paused review"),
    resumeReview: () => console.log("👤 User resumed review"),
    changeVoice: (voice: string) =>
      console.log(`🎤 Voice changed to: ${voice}`),
    changeEnvironment: (env: string) =>
      console.log(`🎤 Environment changed to: ${env}`),
    changeScreen: (screenName: string) =>
      console.log(`🖥️ Screen changed to: ${screenName}`),
    mute: () => console.log("🔇 User muted microphone"),
    unmute: () => console.log("🔊 User unmuted microphone"),
  },

  // Timer events
  timer: {
    started: (duration: number) =>
      console.log(`⏱️ Timer started (${Math.round(duration / 60000)}min)`),
    paused: () => console.log("⏱️ Timer paused"),
    resumed: () => console.log("⏱️ Timer resumed"),
    expired: () => console.log("⏱️ Timer expired"),
    introduction: () => console.log("📢 AI introduction sent"),
    farewell: () => console.log("👋 AI farewell sent"),
  },

  // Error events
  error: {
    connection: (error: string) => console.error("❌ Connection error:", error),
    session: (error: string) => console.error("❌ Session error:", error),
    audio: (error: string) => console.error("❌ Audio error:", error),
    general: (error: string) => console.error("❌ Error:", error),
  },

  // Info events
  info: {
    loading: (message: string) => console.log("⏳", message),
    ready: (message: string) => console.log("✅", message),
    warning: (message: string) => console.warn("⚠️", message),
  },
};
