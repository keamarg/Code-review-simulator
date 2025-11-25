/**
 * Barrel export for utility functions
 * This file re-exports utilities from focused modules for backward compatibility
 * New code should import directly from the specific utility modules
 */

// Audio context utilities
export { audioContext, type GetAudioContextOptions } from "./utils/audio-context";

// Base64 encoding/decoding utilities
export { base64ToArrayBuffer, blobToJSON } from "./utils/base64";

// Error handling utilities
export {
  getErrorMessage,
  isNetworkError,
  isTimeoutError,
} from "./utils/error-handling";

// GitHub utilities
export { parseGitHubUrl, isCodeFile } from "./utils/github";

// Logging utilities
export { appLogger } from "./utils/logger";

// String similarity utilities
export { levenshteinDistance, calculateSimilarity } from "./utils/string-similarity";
