// Centralized external URLs and API endpoints (CommonJS/JS compatible)

export const API_SERVER_BASE =
  process.env.REACT_APP_API_SERVER_BASE ||
  "https://api-key-server-codereview.vercel.app";

export const API_COMPLETIONS_ENDPOINT = `${API_SERVER_BASE}/api/prompt1`;
export const API_GEMINI_ENDPOINT = `${API_SERVER_BASE}/api/prompt2`;
export const API_SUPABASE_ENDPOINT = `${API_SERVER_BASE}/api/database`;
