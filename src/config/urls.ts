// Centralized external URLs and API endpoints
// For local development, you can override via environment variables at build time

export const API_SERVER_BASE: string =
  process.env.REACT_APP_API_SERVER_BASE ||
  "https://api-key-server-codereview.vercel.app";

export const API_COMPLETIONS_ENDPOINT: string = `${API_SERVER_BASE}/api/prompt1`;
export const API_GEMINI_ENDPOINT: string = `${API_SERVER_BASE}/api/prompt2`;
export const API_SUPABASE_ENDPOINT: string = `${API_SERVER_BASE}/api/database`;
