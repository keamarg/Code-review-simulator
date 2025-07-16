// API Server Configuration
// This allows switching between local development and production endpoints

const isDevelopment = process.env.NODE_ENV === "development";

// Local development: use localhost for the API key server
// Production: use the deployed Vercel URL
export const API_SERVER_BASE_URL = isDevelopment
  ? "http://localhost:3001" // Local API key server
  : "https://api-key-server-codereview.vercel.app"; // Production API key server

// API endpoints
export const API_ENDPOINTS = {
  OPENAI: `${API_SERVER_BASE_URL}/api/prompt1`,
  GEMINI: `${API_SERVER_BASE_URL}/api/prompt2`,
  SUPABASE: `${API_SERVER_BASE_URL}/api/database`,
} as const;

// Helper function to get endpoint URL
export function getApiEndpoint(endpoint: keyof typeof API_ENDPOINTS): string {
  return API_ENDPOINTS[endpoint];
}
