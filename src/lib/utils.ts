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

export const audioContext: (options?: GetAudioContextOptions) => Promise<AudioContext> = (() => {
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
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Simple logging utility for important application state changes
 * Provides consistent, meaningful logging without being verbose
 */
type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

const LOG_LEVEL: LogLevel =
  (process.env.REACT_APP_LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "error" : "debug");

const levelToWeight: Record<Exclude<LogLevel, "silent">, number> = {
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

const currentWeight = LOG_LEVEL === "silent" ? 0 : levelToWeight[LOG_LEVEL] || 0;

const canLog = (needed: keyof typeof levelToWeight) => currentWeight >= levelToWeight[needed];

const logInfo = (...args: any[]) => {
  if (canLog("info")) console.log(...args);
};
const logWarn = (...args: any[]) => {
  if (canLog("warn")) console.warn(...args);
};
const logError = (...args: any[]) => {
  if (canLog("error")) console.error(...args);
};

export const appLogger = {
  // Session lifecycle events
  session: {
    start: () => logInfo("🚀 Session started"),
    stop: () => logInfo("🛑 Session stopped"),
    pause: () => logInfo("⏸️ Session paused"),
    resume: () => logInfo("▶️ Session resumed"),
    terminate: () => logInfo("💥 Session terminated"),
  },

  // Connection events
  connection: {
    established: () => logInfo("✅ Connection established"),
    lost: () => logWarn("❌ Connection lost"),
    reconnecting: () => logInfo("🔄 Reconnecting..."),
    reconnected: () => logInfo("✅ Reconnected successfully"),
  },

  // User actions
  user: {
    startReview: () => logInfo("👤 User started review"),
    stopReview: () => logInfo("👤 User stopped review"),
    pauseReview: () => logInfo("👤 User paused review"),
    resumeReview: () => logInfo("👤 User resumed review"),
    changeVoice: (voice: string) => logInfo(`🎤 Voice changed to: ${voice}`),
    changeEnvironment: (env: string) => logInfo(`🎤 Environment changed to: ${env}`),
    changeScreen: (screenName: string) => logInfo(`🖥️ Screen changed to: ${screenName}`),
    mute: () => logInfo("🔇 User muted microphone"),
    unmute: () => logInfo("🔊 User unmuted microphone"),
  },

  // Timer events
  timer: {
    started: (duration: number) => logInfo(`⏱️ Timer started (${Math.round(duration / 60000)}min)`),
    paused: () => logInfo("⏱️ Timer paused"),
    resumed: () => logInfo("⏱️ Timer resumed"),
    expired: () => logInfo("⏱️ Timer expired"),
    introduction: () => logInfo("📢 AI introduction sent"),
    farewell: () => logInfo("👋 AI farewell sent"),
  },

  // Error events
  error: {
    connection: (error: string) => logError("❌ Connection error:", error),
    session: (error: string) => logError("❌ Session error:", error),
    audio: (error: string) => logError("❌ Audio error:", error),
    general: (error: string) => logError("❌ Error:", error),
  },

  // Info events
  info: {
    loading: (message: string) => logInfo("⏳", message),
    ready: (message: string) => logInfo("✅", message),
    warning: (message: string) => logWarn("⚠️", message),
  },
  // Generic logging for cases that don't fit structured categories
  generic: {
    info: (...args: any[]) => logInfo(...args),
    warn: (...args: any[]) => logWarn(...args),
    error: (...args: any[]) => logError(...args),
  },
};
