/**
 * Error handling utilities for consistent error processing
 */

/**
 * Safely extract error message from unknown error type
 * @param error Unknown error (could be Error, string, or anything)
 * @param fallback Fallback message if error cannot be converted to string
 * @returns Error message string
 */
export function getErrorMessage(error: unknown, fallback = "An unknown error occurred"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return fallback;
}

/**
 * Check if error is a network/abort error (expected in some contexts)
 * @param error Error to check
 * @returns True if error is a network/abort error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return true;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }
  return false;
}

/**
 * Check if error is a timeout error
 * @param error Error to check
 * @returns True if error is a timeout
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === "AbortError" || error.message.includes("timeout");
  }
  return false;
}


