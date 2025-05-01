async function getRepoFiles(repoUrl) {
    // Extract the owner and repo name from the URL.
    const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = repoUrl.match(regex);
    if (!match) {
        throw new Error('Invalid GitHub repository URL');
    }
    const owner = match[1];    const repoName = match[2];
    // Convert repo name to app name by replacing dashes with underscores
    const appName = repoName.replace(/-/g, '_');

    // Define the base folder path based on the app name
    const basePath = `app/src/main/java/com/example/${appName}`;
    let result = '';
    // Set delay in milliseconds
    const delayMs = 1500;

    // Helper function to delay execution
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Recursive function to process directories
    async function processDirectory(path) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${apiUrl}: ${response.status}`);
        }
        const items = await response.json();

        for (const item of items) {
            // Delay before processing each item
            await delay(delayMs);
            if (item.type === 'dir') {
                // Recurse into subdirectories
                await processDirectory(item.path);
            } else if (item.type === 'file') {
                // Fetch the raw content of the file using the download_url
                const fileResponse = await fetch(item.download_url);
                if (!fileResponse.ok) {
                    throw new Error(`Failed to fetch file ${item.path}`);
                }
                let content = await fileResponse.text();
                // Remove lines that start with "import"
                content = content
                    .split('\n')
                    .filter(line => !line.trim().startsWith('import '))
                    .join('\n');
                // Append the formatted string for this file
                result += "```\n" + item.path + "\n```\n" + content + "\n```\n\n";
            }
        }
    }

    await processDirectory(basePath);
    return result;
}

// New function to get exam questions based on repoContents and learningGoals
export async function getRepoQuestions(repoUrl, learningGoals) {
  
  const repoContents = await getRepoFiles(repoUrl)

  const prompt = `
Given the following repository contents:
${repoContents}

And the following learning goals:
${learningGoals}
Please provide a list of exam questions that cover the learning goals effectively. Some of the questions should refer to specific files. When referring to the files add the full path. Only answer with the questions

It is an 9 minute exam.
  `.trim();

  const payload = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an exam examiner." },
      { role: "user", content: prompt },
    ],
  };
    

  const apiKeyResponse = await fetch("https://api-key-server-sigma.vercel.app/prompt1");
  if (!apiKeyResponse.ok) {
      throw new Error("Failed to fetch API key");
  }

  const apiKey = await apiKeyResponse.json();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch exam questions: ${response.status}`);
  }

  const data = await response.json();
  const answer =
    data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return answer;
}

export default getRepoQuestions;