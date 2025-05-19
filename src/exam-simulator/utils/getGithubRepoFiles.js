import prompts from "../../prompts.json";

// Function to get level-specific guidance for repo questions
function getLevelSpecificGuidance(level) {
  switch (level) {
    case "junior":
      return `Focus on reviewing fundamental aspects of the code:
- Code readability and clarity
- Naming conventions and consistency
- Basic error handling approaches
- Code organization and structure
- Documentation and commenting practices
- Simple design patterns implementation`;

    case "intermediate":
      return `Focus on reviewing intermediate aspects of the code:
- Appropriate use of design patterns
- Performance considerations
- Code reusability and modularity
- Testing approaches
- Error handling strategies
- API design principles`;

    case "senior":
      return `Focus on reviewing advanced aspects of the code:
- Architecture and system design
- Scalability considerations
- Advanced design patterns
- Performance optimization techniques
- Security best practices
- Code maintainability and technical debt`;

    default:
      return `Focus on general code quality aspects:
- Code structure and organization
- Readability and maintainability
- Best practices implementation
- Performance considerations`;
  }
}

async function getRepoFiles(repoUrl) {
  // Extract the owner and repo name from the URL.
  const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
  const match = repoUrl.match(regex);
  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }
  const owner = match[1];
  const repoName = match[2];
  // Convert repo name to app name by replacing dashes with underscores
  const appName = repoName.replace(/-/g, "_");

  // Define the base folder path based on the app name
  const basePath = `app/src/main/java/com/example/${appName}`;
  let result = "";
  // Set delay in milliseconds
  const delayMs = 1500;

  // Helper function to delay execution
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
      if (item.type === "dir") {
        // Recurse into subdirectories
        await processDirectory(item.path);
      } else if (item.type === "file") {
        // Fetch the raw content of the file using the download_url
        const fileResponse = await fetch(item.download_url);
        if (!fileResponse.ok) {
          throw new Error(`Failed to fetch file ${item.path}`);
        }
        let content = await fileResponse.text();
        // Remove lines that start with "import"
        content = content
          .split("\n")
          .filter((line) => !line.trim().startsWith("import "))
          .join("\n");
        // Append the formatted string for this file
        result += "```\n" + item.path + "\n```\n" + content + "\n```\n\n";
      }
    }
  }

  await processDirectory(basePath);
  return result;
}

// Function to get exam questions based on repoContents and developer level
export async function getRepoQuestions(repoUrl, developerLevel) {
  const repoContents = await getRepoFiles(repoUrl);

  // Get level-specific guidance based on developer level
  const levelGuidance = getLevelSpecificGuidance(
    developerLevel || "intermediate"
  );

  // Get the prompt template from prompts.json and replace variables
  let promptTemplate = prompts.taskPrompts.repoQuestions;
  let prompt = promptTemplate
    .replace("${repoContents}", repoContents)
    .replace("${learningGoals}", levelGuidance);

  // Replace escaped newlines with actual newlines
  prompt = prompt.replace(/\\n/g, "\n");

  // Get the system prompt from prompts.json
  const systemPrompt = prompts.systemPrompts.githubRepoQuestions;

  const payload = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  };

  const apiKeyResponse = await fetch(
    "https://api-key-server-codereview.vercel.app/api/prompt1"
  );
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
    throw new Error(`Failed to fetch review questions: ${response.status}`);
  }

  const data = await response.json();
  const answer =
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;
  return answer;
}

export default getRepoQuestions;
