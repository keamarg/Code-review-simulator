/**
 * Centralized AI Configuration
 * Update these values to change AI model settings across the entire application
 */

export const AI_CONFIG = {
  // Gemini model configuration
  DEFAULT_MODEL: "models/gemini-2.0-flash-live-001",

  // Alternative models (uncomment to use)
  // DEFAULT_MODEL: "models/gemini-1.5-pro",
  // DEFAULT_MODEL: "models/gemini-1.5-flash",
  // DEFAULT_MODEL: "models/gemini-2.0-flash-live-001",
  // DEFAULT_MODEL: "models/gemini-2.0-flash-exp",

  // Voice configuration
  DEFAULT_VOICE: "Aoede", // Options: "Puck", "Charon", "Kore", "Fenrir", "Aoede"

  // Voice Activity Detection (VAD) settings
  VAD_SETTINGS: {
    // Sensitivity levels: "START_SENSITIVITY_HIGH" | "START_SENSITIVITY_LOW"
    START_OF_SPEECH_SENSITIVITY: "START_SENSITIVITY_HIGH",
    END_OF_SPEECH_SENSITIVITY: "END_SENSITIVITY_HIGH",
    SILENCE_DURATION_MS: 500, // How long silence before speech detection ends
    PREFIX_PADDING_MS: 100, // Padding before speech detection starts
  },

  // Timer configuration for code review sessions
  TIMER_SETTINGS: {
    INTRODUCTION_DELAY_MS: 1000, // Delay before AI introduces itself
    TIME_WARNING_BEFORE_END_MS: 60000, // Warning 1 minute before end
  },

  // Response settings
  DEFAULT_RESPONSE_MODALITY: "audio" as const,

  // Session configuration
  SESSION_RESUMPTION_ENABLED: true,

  // Legacy aliases for backward compatibility
  get DEFAULT_SILENCE_DURATION_MS() {
    return this.VAD_SETTINGS.SILENCE_DURATION_MS;
  },
  get DEFAULT_PREFIX_PADDING_MS() {
    return this.VAD_SETTINGS.PREFIX_PADDING_MS;
  },
} as const;

/**
 * Get the current model name
 * Can be overridden by environment variables in the future
 */
export const getCurrentModel = (): string => {
  return process.env.REACT_APP_AI_MODEL || AI_CONFIG.DEFAULT_MODEL;
};

/**
 * Get the current voice name
 */
export const getCurrentVoice = (): string => {
  return process.env.REACT_APP_AI_VOICE || AI_CONFIG.DEFAULT_VOICE;
};

/**
 * Get VAD configuration object
 */
export const getVADConfig = () => ({
  startOfSpeechSensitivity: AI_CONFIG.VAD_SETTINGS.START_OF_SPEECH_SENSITIVITY,
  endOfSpeechSensitivity: AI_CONFIG.VAD_SETTINGS.END_OF_SPEECH_SENSITIVITY,
  silenceDurationMs: AI_CONFIG.VAD_SETTINGS.SILENCE_DURATION_MS,
  prefixPaddingMs: AI_CONFIG.VAD_SETTINGS.PREFIX_PADDING_MS,
});

/**
 * Get timer configuration object
 */
export const getTimerConfig = () => ({
  introductionDelay: AI_CONFIG.TIMER_SETTINGS.INTRODUCTION_DELAY_MS,
  timeWarningBeforeEnd: AI_CONFIG.TIMER_SETTINGS.TIME_WARNING_BEFORE_END_MS,
});
