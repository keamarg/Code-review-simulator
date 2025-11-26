/**
 * Centralized AI Configuration
 * Update these values to change AI model settings across the entire application
 */

// Environment-specific VAD settings
export const VAD_ENVIRONMENTS = {
  QUIET: {
    name: "Quiet Environment",
    description: "Home office, library, or quiet workspace",
    settings: {
      START_OF_SPEECH_SENSITIVITY: "START_SENSITIVITY_HIGH" as const,
      END_OF_SPEECH_SENSITIVITY: "END_SENSITIVITY_LOW" as const,
      SILENCE_DURATION_MS: 200, // Reduced from 300 for faster response
      PREFIX_PADDING_MS: 5, // Reduced from 10 for faster response
    },
  },
  MODERATE: {
    name: "Moderate Environment",
    description: "Office with some background noise, coffee shop",
    settings: {
      START_OF_SPEECH_SENSITIVITY: "START_SENSITIVITY_LOW" as const,
      END_OF_SPEECH_SENSITIVITY: "END_SENSITIVITY_LOW" as const,
      SILENCE_DURATION_MS: 300, // Reduced from 500 for faster response
      PREFIX_PADDING_MS: 10, // Reduced from 20 for faster response
    },
  },
  NOISY: {
    name: "Noisy Environment",
    description: "Open office, public space, or high background noise",
    settings: {
      START_OF_SPEECH_SENSITIVITY: "START_SENSITIVITY_LOW" as const,
      END_OF_SPEECH_SENSITIVITY: "END_SENSITIVITY_LOW" as const,
      SILENCE_DURATION_MS: 400, // Reduced from 700 for faster response
      PREFIX_PADDING_MS: 20, // Reduced from 50 for faster response
    },
  },
} as const;

export const AI_CONFIG = {
  // Gemini model configuration
  //DEFAULT_MODEL: "models/gemini-2.0-flash-live-001",
  DEFAULT_MODEL: "models/gemini-2.5-flash-native-audio-preview-09-2025",

  // Alternative models (uncomment to use)
  // DEFAULT_MODEL: "models/gemini-1.5-pro",
  // DEFAULT_MODEL: "models/gemini-2.5-flash-preview-native-audio-dialog",
  // DEFAULT_MODEL: "models/gemini-2.0-flash-exp",
  // DEFAULT_MODEL: "models/gemini-2.5-flash-preview-04-17", // Not Live API compatible
  // DEFAULT_MODEL: "models/gemini-2.5-flash-preview-05-20", // Not Live API compatible
  // DEFAULT_MODEL: "models/gemini-2.5-flash-native-audio-preview-09-2025",

  // Voice configuration
  DEFAULT_VOICE: "Aoede", // Breezy and relaxed voice

  // Voice Activity Detection (VAD) settings - now uses environment-based defaults
  VAD_SETTINGS: VAD_ENVIRONMENTS.QUIET.settings, // Default to quiet environment

  // Timer configuration for code review sessions
  TIMER_SETTINGS: {
    INTRODUCTION_DELAY_MS: 200, // Reduced delay before AI introduces itself (was 1000ms)
    TIME_WARNING_BEFORE_END_MS: 60000, // Warning 1 minute before end (not used anymore)
    FINAL_WARNING_BEFORE_END_MS: 7000, // Farewell message 7 seconds before end
  },

  // Response settings
  DEFAULT_RESPONSE_MODALITY: "audio" as const,

  // Feature flags
  FEATURES: {
    LIVE_SUGGESTION_EXTRACTION: true, // Set to true to enable live suggestions
  },

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
 * Checks localStorage for user preference, then environment variable, then default
 */
export const getCurrentVoice = (): string => {
  // Check localStorage for user's voice preference first
  const savedVoice = localStorage.getItem("ai_voice_setting");
  if (savedVoice) {
    return savedVoice;
  }

  // Fall back to environment variable or default
  return process.env.REACT_APP_AI_VOICE || AI_CONFIG.DEFAULT_VOICE;
};

/**
 * Get the current VAD environment
 * Checks localStorage for user preference, then defaults to QUIET
 */
export const getCurrentVADEnvironment = (): keyof typeof VAD_ENVIRONMENTS => {
  const savedEnvironment = localStorage.getItem("ai_vad_environment");
  if (savedEnvironment && savedEnvironment in VAD_ENVIRONMENTS) {
    return savedEnvironment as keyof typeof VAD_ENVIRONMENTS;
  }
  return "QUIET"; // Default to quiet environment
};

/**
 * Get VAD configuration object based on current environment
 */
export const getVADConfig = () => {
  const currentEnvironment = getCurrentVADEnvironment();
  const environmentSettings = VAD_ENVIRONMENTS[currentEnvironment].settings;

  return {
    startOfSpeechSensitivity: environmentSettings.START_OF_SPEECH_SENSITIVITY,
    endOfSpeechSensitivity: environmentSettings.END_OF_SPEECH_SENSITIVITY,
    silenceDurationMs: environmentSettings.SILENCE_DURATION_MS,
    prefixPaddingMs: environmentSettings.PREFIX_PADDING_MS,
  };
};

/**
 * Get timer configuration object
 */
export const getTimerConfig = () => ({
  introductionDelay: AI_CONFIG.TIMER_SETTINGS.INTRODUCTION_DELAY_MS,
  timeWarningBeforeEnd: AI_CONFIG.TIMER_SETTINGS.TIME_WARNING_BEFORE_END_MS,
  finalWarningBeforeEnd: AI_CONFIG.TIMER_SETTINGS.FINAL_WARNING_BEFORE_END_MS,
});
