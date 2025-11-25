/**
 * Application logging utility
 * Provides consistent, meaningful logging without being verbose
 */

type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

const LOG_LEVEL: LogLevel =
  (process.env.REACT_APP_LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "error" : "warn");

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

/**
 * Structured application logger
 * Provides categorized logging methods for different aspects of the application
 */
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


