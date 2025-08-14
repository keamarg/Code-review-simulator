import { API_COMPLETIONS_ENDPOINT } from "../../config/urls";

// In-memory cache for server-fetched OpenAI key to avoid repeated GETs
let CACHED_OPENAI_KEY = null;
let CACHED_OPENAI_KEY_FETCHED_AT = 0;
const KEY_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Fallback to direct OpenAI call using a key retrieved from backend if proxy fails
async function getOpenAIKeyFromServer() {
  try {
    // Use cached key if still fresh
    if (
      CACHED_OPENAI_KEY &&
      Date.now() - CACHED_OPENAI_KEY_FETCHED_AT < KEY_TTL_MS
    ) {
      return CACHED_OPENAI_KEY;
    }

    // Use the same configured endpoint; server treats GET as key fetch
    const res = await fetch(API_COMPLETIONS_ENDPOINT, { method: "GET" });
    if (!res.ok) return null;
    const key = await res.json();
    if (typeof key === "string") {
      CACHED_OPENAI_KEY = key;
      CACHED_OPENAI_KEY_FETCHED_AT = Date.now();
      return key;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCompletion(prompt, systemPrompt, doesReturnJSON) {
  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    ...(doesReturnJSON ? { response_format: { type: "json_object" } } : {}),
  };

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Prefer direct OpenAI using server-fetched key (works for saved reviews)
    const key = await getOpenAIKeyFromServer();
    let response;
    if (key) {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } else {
      response = await fetch(API_COMPLETIONS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Fallback: direct OpenAI call if proxy is unavailable
      const key = await getOpenAIKeyFromServer();
      if (!key)
        throw new Error(`Failed to fetch completion: ${response.status}`);
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) {
        // Invalidate cached key on authorization error
        if (response.status === 401 || response.status === 403) {
          CACHED_OPENAI_KEY = null;
          CACHED_OPENAI_KEY_FETCHED_AT = 0;
        }
        throw new Error(`Failed to fetch completion: ${response.status}`);
      }
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      const txt = await response.text();
      try {
        data = JSON.parse(txt);
      } catch {
        data = { choices: [{ message: { content: txt } }] };
      }
    }
    const content = data?.choices?.[0]?.message?.content;

    if (doesReturnJSON) {
      // Robust JSON extraction: handle fences and extra text
      const tryParse = (text) => {
        try {
          return JSON.parse(text);
        } catch (_) {
          return null;
        }
      };

      const extractJsonObject = (text) => {
        if (!text || typeof text !== "string") return null;
        // Prefer fenced ```json blocks
        const fenced =
          text.match(/```\s*json\s*([\s\S]*?)```/i) ||
          text.match(/```\s*([\s\S]*?)```/i);
        if (fenced && fenced[1]) {
          const parsed = tryParse(fenced[1].trim());
          if (parsed) return parsed;
        }
        // Fallback: scan for first JSON object by brace counting
        const start = text.indexOf("{");
        if (start >= 0) {
          let depth = 0;
          for (let i = start; i < text.length; i++) {
            const ch = text[i];
            if (ch === "{") depth++;
            else if (ch === "}") {
              depth--;
              if (depth === 0) {
                const candidate = text.slice(start, i + 1);
                const parsed = tryParse(candidate);
                if (parsed) return parsed;
                break;
              }
            }
          }
        }
        return null;
      };

      const parsed = extractJsonObject(content);
      if (parsed && typeof parsed === "object") return parsed;

      // Last resort: wrap content as task
      if (typeof content === "string" && content.trim().length > 0) {
        return { "task-student": content.trim() };
      }
      throw new Error("Failed to parse JSON response");
    }

    // Plain text path: ensure we return a meaningful string even if content is missing
    if (typeof content === "string" && content.trim().length > 0) {
      return content;
    }
    // Fallback: stringify data or return empty string
    try {
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch {
      return "";
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout - please try again");
    }
    throw new Error(error.message);
  }
}

export async function getSessionCompletion(messages, doesReturnJSON = false) {
  // Log the session-based prompts being sent to OpenAI (reduced verbosity)
  // Intentionally reduced logging in production

  const payload = {
    model: "gpt-4o-mini",
    messages: messages,
    ...(doesReturnJSON ? { response_format: { type: "json_object" } } : {}),
  };

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Previous working behavior: prefer direct OpenAI using server-fetched key; fall back to proxy
    const key = await getOpenAIKeyFromServer();
    let response;
    if (key) {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } else {
      response = await fetch(API_COMPLETIONS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Invalidate cached key on authorization error
      if (response.status === 401 || response.status === 403) {
        CACHED_OPENAI_KEY = null;
        CACHED_OPENAI_KEY_FETCHED_AT = 0;
      }
      throw new Error(`Failed to fetch completion: ${response.status}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      const txt = await response.text();
      try {
        data = JSON.parse(txt);
      } catch {
        data = { choices: [{ message: { content: txt } }] };
      }
    }
    const content = data?.choices?.[0]?.message?.content;

    if (doesReturnJSON) {
      try {
        return JSON.parse(content);
      } catch (e) {
        throw new Error("Failed to parse JSON response");
      }
    }

    return content;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout - please try again");
    }
    throw new Error(error.message);
  }
}

export default getCompletion;
