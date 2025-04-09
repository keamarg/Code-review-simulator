export async function getCompletion(prompt, systemPrompt, doesReturnJSON) {
    const payload = {
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
        ]
    };

    if (doesReturnJSON) {
        payload.response_format = {type: "json_object"};
    }

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
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
        throw new Error(error.message);
    }
}

export default getCompletion;