/**
 * Centralized AI Configuration
 * Update these values to change AI model settings across the entire application
 */

export const AI_CONFIG = {
  // Gemini model configuration
  DEFAULT_MODEL: "models/gemini-2.0-flash-live-001",

  // Alternative models (uncomment to use)
  // DEFAULT_MODEL: "models/gemini-1.5-pro",
  // DEFAULT_MODEL: "models/gemini-2.5-flash-preview-native-audio-dialog",
  // DEFAULT_MODEL: "models/gemini-2.0-flash-exp",
  // DEFAULT_MODEL: "models/gemini-2.5-flash-preview-04-17", // Not Live API compatible
  // DEFAULT_MODEL: "models/gemini-2.5-flash-preview-05-20", // Not Live API compatible

  // Voice configuration
  DEFAULT_VOICE: "Puck", // Changed from "Aoede" to "Puck" to test if voice-specific issue

  // Voice Activity Detection (VAD) settings
  VAD_SETTINGS: {
    // Sensitivity levels: "START_SENSITIVITY_HIGH" | "START_SENSITIVITY_LOW"
    START_OF_SPEECH_SENSITIVITY: "START_SENSITIVITY_HIGH", // High to detect user voice
    END_OF_SPEECH_SENSITIVITY: "END_SENSITIVITY_LOW", // Low to prevent AI cutoffs
    SILENCE_DURATION_MS: 1000, // Back to more standard 1 second
    PREFIX_PADDING_MS: 200, // Standard padding
  },

  // Timer configuration for code review sessions
  TIMER_SETTINGS: {
    INTRODUCTION_DELAY_MS: 1000, // Delay before AI introduces itself
    TIME_WARNING_BEFORE_END_MS: 60000, // Warning 1 minute before end (not used anymore)
    FINAL_WARNING_BEFORE_END_MS: 7000, // Farewell message 7 seconds before end
  },

  // Response settings
  DEFAULT_RESPONSE_MODALITY: "audio" as const,

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
  finalWarningBeforeEnd: AI_CONFIG.TIMER_SETTINGS.FINAL_WARNING_BEFORE_END_MS,
});
