export async function getCompletion(prompt, systemPrompt, doesReturnJSON) {
  // Log the prompts being sent to OpenAI
  console.log("🔵 OpenAI API Call - getCompletion:");
  console.log("📋 System Prompt:", systemPrompt);
  console.log("💬 User Prompt:", prompt);
  console.log("🔧 JSON Mode:", doesReturnJSON);

  const apiKeyResponse = await fetch(
    "https://api-key-server-codereview.vercel.app/api/prompt1"
  );

  if (!apiKeyResponse.ok) {
    throw new Error("Failed to fetch API key");
  }

  const apiKey = await apiKeyResponse.json();

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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

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

    console.log(
      "✅ OpenAI Response:",
      content?.substring(0, 200) + (content?.length > 200 ? "..." : "")
    );

    if (doesReturnJSON) {
      try {
        return JSON.parse(content);
      } catch (e) {
        throw new Error("Failed to parse JSON response");
      }
    }

    return content;
  } catch (error) {
    console.error("❌ OpenAI API Error:", error.message);
    throw new Error(error.message);
  }
}

export async function getSessionCompletion(messages, doesReturnJSON = false) {
  // Log the session-based prompts being sent to OpenAI
  console.log("🟢 OpenAI API Call - getSessionCompletion:");
  console.log("💭 Session Messages Count:", messages.length);
  console.log("📚 Full Conversation History:");
  messages.forEach((msg, index) => {
    const preview =
      msg.content.substring(0, 150) + (msg.content.length > 150 ? "..." : "");
    console.log(`  ${index + 1}. [${msg.role.toUpperCase()}]: ${preview}`);
  });
  console.log("🔧 JSON Mode:", doesReturnJSON);

  const apiKeyResponse = await fetch(
    "https://api-key-server-codereview.vercel.app/api/prompt1"
  );

  if (!apiKeyResponse.ok) {
    throw new Error("Failed to fetch API key");
  }

  const apiKey = await apiKeyResponse.json();

  const payload = {
    model: "gpt-4o-mini",
    messages: messages,
  };

  if (doesReturnJSON) {
    payload.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

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

    console.log(
      "✅ OpenAI Session Response:",
      content?.substring(0, 200) + (content?.length > 200 ? "..." : "")
    );

    if (doesReturnJSON) {
      try {
        return JSON.parse(content);
      } catch (e) {
        throw new Error("Failed to parse JSON response");
      }
    }

    return content;
  } catch (error) {
    console.error("❌ OpenAI Session API Error:", error.message);
    throw new Error(error.message);
  }
}

export default getCompletion;
