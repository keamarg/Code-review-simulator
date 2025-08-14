import { API_COMPLETIONS_ENDPOINT } from "../../config/urls";

let CACHED_OPENAI_KEY: string | null = null;
let CACHED_OPENAI_KEY_FETCHED_AT = 0;
const KEY_TTL_MS = 15 * 60 * 1000;

async function getOpenAIKeyFromServer(): Promise<string | null> {
  try {
    if (CACHED_OPENAI_KEY && Date.now() - CACHED_OPENAI_KEY_FETCHED_AT < KEY_TTL_MS) {
      return CACHED_OPENAI_KEY;
    }

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

export async function getCompletion(
  prompt: string,
  systemPrompt: string,
  doesReturnJSON: boolean,
): Promise<any> {
  const payload: any = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    ...(doesReturnJSON ? { response_format: { type: "json_object" } } : {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const key = await getOpenAIKeyFromServer();
    let response = await (async () => {
      if (key) {
        return fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      }
      return fetch(API_COMPLETIONS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    })();

    clearTimeout(timeoutId);

    if (!response.ok) {
      const retryKey = await getOpenAIKeyFromServer();
      if (!retryKey) throw new Error(`Failed to fetch completion: ${response.status}`);
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${retryKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          CACHED_OPENAI_KEY = null;
          CACHED_OPENAI_KEY_FETCHED_AT = 0;
        }
        throw new Error(`Failed to fetch completion: ${response.status}`);
      }
    }

    let data: any;
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
    const content: string | undefined = data?.choices?.[0]?.message?.content;

    if (doesReturnJSON) {
      const tryParse = (text: string) => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      };
      const extractJsonObject = (text?: string | null) => {
        if (!text || typeof text !== "string") return null;
        const fenced =
          text.match(/```\s*json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
        if (fenced && fenced[1]) {
          const parsed = tryParse(fenced[1].trim());
          if (parsed) return parsed;
        }
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

      const parsed = extractJsonObject(content ?? null);
      if (parsed && typeof parsed === "object") return parsed;
      if (typeof content === "string" && content.trim().length > 0) {
        return { "task-student": content.trim() };
      }
      throw new Error("Failed to parse JSON response");
    }

    if (typeof content === "string" && content.trim().length > 0) {
      return content;
    }
    try {
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch {
      return "";
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout - please try again");
    }
    throw new Error(error.message);
  }
}

export async function getSessionCompletion(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  doesReturnJSON = false,
): Promise<any> {
  const payload: any = {
    model: "gpt-4o-mini",
    messages,
    ...(doesReturnJSON ? { response_format: { type: "json_object" } } : {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const key = await getOpenAIKeyFromServer();
    const response = await (async () => {
      if (key) {
        return fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      }
      return fetch(API_COMPLETIONS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    })();

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        CACHED_OPENAI_KEY = null;
        CACHED_OPENAI_KEY_FETCHED_AT = 0;
      }
      throw new Error(`Failed to fetch completion: ${response.status}`);
    }

    let data: any;
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
    const content: string | undefined = data?.choices?.[0]?.message?.content;

    if (doesReturnJSON) {
      try {
        return JSON.parse(content as string);
      } catch (e) {
        throw new Error("Failed to parse JSON response");
      }
    }
    return content;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Request timeout - please try again");
    }
    throw new Error(error.message);
  }
}

export default getCompletion;
