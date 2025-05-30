/**
 * Centralized AI Configuration
 * Update these values to change AI model settings across the entire application
 */

export const AI_CONFIG = {
  // Gemini model configuration
  DEFAULT_MODEL: "models/gemini-2.0-flash-live-001", //"models/gemini-2.0-flash-exp",

  // Alternative models (uncomment to use)
  // DEFAULT_MODEL: "models/gemini-1.5-pro",
  // DEFAULT_MODEL: "models/gemini-1.5-flash",

  // Voice configuration
  DEFAULT_VOICE: "Puck", // Options: "Puck", "Charon", "Kore", "Fenrir", "Aoede"

  // Audio settings
  DEFAULT_SILENCE_DURATION_MS: 1000,
  DEFAULT_PREFIX_PADDING_MS: 100,

  // Response settings
  DEFAULT_RESPONSE_MODALITY: "audio" as const,
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
