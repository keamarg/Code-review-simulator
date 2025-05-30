import { createClient } from "@supabase/supabase-js";

const apiKeyResponse = await fetch(
  "https://api-key-server-codereview.vercel.app/api/database"
);
if (!apiKeyResponse.ok) {
  throw new Error("Failed to fetch API key");
}

const apiKey = await apiKeyResponse.json();

export const supabase = createClient(
  "https://gzoltpvnxwjoeycomcby.supabase.co",
  apiKey
);
