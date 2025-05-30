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

// Function to detect the project type and main code directory
async function detectProjectStructure(owner, repoName) {
  // Common source directories to check, ordered by priority
  const potentialPaths = [
    // Android
    "app/src/main/java",
    "app/src/main/kotlin",
    // Java/Maven
    "src/main/java",
    "src/main/kotlin",
    // JavaScript/Node.js
    "src",
    "lib",
    // Python
    "src",
    "app",
    // C#/.NET
    "src",
    // Go
    "cmd",
    "pkg",
    "internal",
    // PHP
    "src",
    "app",
    // Ruby
    "lib",
    "app",
    // React/Vue/Angular
    "src/components",
    "src/pages",
    "components",
    "pages",
    // General fallback
    ".",
  ];

  for (const path of potentialPaths) {
    try {
      const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
      const response = await fetch(apiUrl);
      if (response.ok) {
        const items = await response.json();
        // Check if this directory contains code files
        const hasCodeFiles = items.some(
          (item) => item.type === "file" && isCodeFile(item.name)
        );
        if (hasCodeFiles || items.some((item) => item.type === "dir")) {
          return path;
        }
      }
    } catch (error) {
      // Continue to next path if this one fails
      continue;
    }
  }

  // If no specific structure found, return root
  return ".";
}

// Function to check if a file is a code file
function isCodeFile(filename) {
  const codeExtensions = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".vue",
    ".svelte",
    ".java",
    ".kt",
    ".scala",
    ".groovy",
    ".py",
    ".rb",
    ".php",
    ".go",
    ".rs",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".vb",
    ".fs",
    ".swift",
    ".m",
    ".mm",
    ".html",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".sql",
    ".r",
    ".jl",
    ".dart",
    ".elm",
    ".ex",
    ".exs",
    ".clj",
    ".cljs",
    ".hs",
    ".ml",
    ".pl",
    ".sh",
    ".ps1",
  ];

  return codeExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
}

async function getRepoFiles(repoUrl) {
  // Extract the owner and repo name from the URL.
  const regex = /github\.com\/([^/]+)\/([^/]+)/;
  const match = repoUrl.match(regex);
  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }
  const owner = match[1];
  const repoName = match[2].replace(/\.git$/, ""); // Remove .git suffix if present

  // Detect the project structure automatically
  const basePath = await detectProjectStructure(owner, repoName);

  let result = "";
  // Set delay in milliseconds
  const delayMs = 1500;
  const maxFiles = 20; // Limit to prevent overwhelming the AI
  let fileCount = 0;

  // Helper function to delay execution
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Recursive function to process directories
  async function processDirectory(path, depth = 0) {
    // Limit recursion depth to prevent infinite loops
    if (depth > 5 || fileCount >= maxFiles) {
      return;
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${apiUrl}: ${response.status}`);
    }
    const items = await response.json();

    // Sort items to process files first, then directories
    const sortedItems = items.sort((a, b) => {
      if (a.type === "file" && b.type === "dir") return -1;
      if (a.type === "dir" && b.type === "file") return 1;
      return 0;
    });

    for (const item of sortedItems) {
      if (fileCount >= maxFiles) {
        break;
      }

      // Delay before processing each item
      await delay(delayMs);

      if (item.type === "dir") {
        // Skip common non-code directories
        const skipDirs = [
          "node_modules",
          ".git",
          "target",
          "build",
          "dist",
          ".gradle",
          "vendor",
          "__pycache__",
        ];
        if (!skipDirs.includes(item.name)) {
          await processDirectory(item.path, depth + 1);
        }
      } else if (item.type === "file" && isCodeFile(item.name)) {
        // Only process code files
        try {
          const fileResponse = await fetch(item.download_url);
          if (!fileResponse.ok) {
            console.warn(`Failed to fetch file ${item.path}`);
            continue;
          }
          let content = await fileResponse.text();

          // Limit file size to prevent overwhelming the AI
          if (content.length > 5000) {
            content =
              content.substring(0, 5000) + "\n... (file truncated for brevity)";
          }

          // Remove import/include lines to reduce noise
          content = content
            .split("\n")
            .filter((line) => {
              const trimmed = line.trim();
              return (
                (!trimmed.startsWith("import ") &&
                  !trimmed.startsWith("#include") &&
                  !trimmed.startsWith("using ") &&
                  !trimmed.startsWith("require(") &&
                  !trimmed.startsWith("from ")) ||
                trimmed.startsWith("from typing")
              );
            })
            .join("\n");

          // Append the formatted string for this file
          result += "```\n" + item.path + "\n```\n" + content + "\n```\n\n";
          fileCount++;
        } catch (error) {
          console.warn(`Error processing file ${item.path}:`, error);
        }
      }
    }
  }

  await processDirectory(basePath);

  if (result.trim() === "") {
    throw new Error(
      "No code files found in the repository. Please check if the repository URL is correct and contains source code."
    );
  }

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
