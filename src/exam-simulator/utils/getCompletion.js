// API key cache to prevent repeated Vercel API calls
const apiKeyCache = {
  prompt1: null,
  prompt2: null,
  database: null,
  cacheTime: null,
  cacheDuration: 5 * 60 * 1000, // 5 minutes cache duration
};

// Request deduplication to prevent multiple simultaneous API calls
const pendingRequests = {
  prompt1: null,
  prompt2: null,
  database: null,
};

export async function getCachedApiKey(endpoint) {
  const now = Date.now();

  // Check if we have a valid cached key
  if (
    apiKeyCache[endpoint] &&
    apiKeyCache.cacheTime &&
    now - apiKeyCache.cacheTime < apiKeyCache.cacheDuration
  ) {
    return apiKeyCache[endpoint];
  }

  // Check if there's already a pending request for this endpoint
  if (pendingRequests[endpoint]) {
    console.log(`🔄 Waiting for existing ${endpoint} API key request...`);
    return await pendingRequests[endpoint];
  }

  // Create a new request promise
  const requestPromise = (async () => {
    try {
      console.log(`🔑 Fetching ${endpoint} API key from Vercel...`);

      // Fetch new API key
      const apiKeyResponse = await fetch(
        `https://api-key-server-codereview.vercel.app/api/${endpoint}`
      );

      if (!apiKeyResponse.ok) {
        throw new Error("Failed to fetch API key");
      }

      const apiKey = await apiKeyResponse.json();

      // Cache the key
      apiKeyCache[endpoint] = apiKey;
      apiKeyCache.cacheTime = now;

      console.log(`✅ ${endpoint} API key cached successfully`);
      return apiKey;
    } finally {
      // Clear the pending request
      pendingRequests[endpoint] = null;
    }
  })();

  // Store the pending request
  pendingRequests[endpoint] = requestPromise;

  return await requestPromise;
}

export async function getCompletion(prompt, systemPrompt, doesReturnJSON) {
  const apiKey = await getCachedApiKey("prompt1");

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  };

  if (doesReturnJSON) {
    payload.response_format = { type: "json_object" };
  }

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        "❌ OpenAI API Error:",
        response.status,
        response.statusText
      );
      throw new Error(`Failed to fetch completion: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

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
      console.error("❌ OpenAI API Timeout: Request took too long");
      throw new Error("Request timeout - please try again");
    }
    console.error("❌ OpenAI API Error:", error.message);
    throw new Error(error.message);
  }
}

export async function getSessionCompletion(messages, doesReturnJSON = false) {
  // Log the session-based prompts being sent to OpenAI (reduced verbosity)
  console.log(
    `🟢 OpenAI API Call - getSessionCompletion: ${messages.length} messages`
  );

  const apiKey = await getCachedApiKey("prompt1");

  const payload = {
    model: "gpt-4o-mini",
    messages: messages,
  };

  if (doesReturnJSON) {
    payload.response_format = { type: "json_object" };
  }

  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        "❌ OpenAI Session API Error:",
        response.status,
        response.statusText
      );
      throw new Error(`Failed to fetch completion: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

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
      console.error("❌ OpenAI Session API Timeout: Request took too long");
      throw new Error("Request timeout - please try again");
    }
    console.error("❌ OpenAI Session API Error:", error.message);
    throw new Error(error.message);
  }
}

export default getCompletion;
