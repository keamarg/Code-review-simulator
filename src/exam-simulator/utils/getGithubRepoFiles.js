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

// New function to normalize GitHub URLs and extract repo info
function parseGitHubUrl(url) {
  // Remove trailing slash and whitespace
  const cleanUrl = url.trim().replace(/\/$/, "");

  // Handle different GitHub URL formats
  const patterns = [
    // Standard web URLs
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/,
    // API URLs
    /^https?:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)(?:\/.*)?$/,
    // SSH URLs
    /^git@github\.com:([^/]+)\/([^/]+)(?:\.git)?$/,
    // Short format (owner/repo)
    /^([^/\s]+)\/([^/\s]+)$/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      const owner = match[1];
      let repoName = match[2];

      // Remove common suffixes
      repoName = repoName.replace(/\.git$/, "");
      repoName = repoName.replace(/\/.*$/, ""); // Remove path after repo name

      return { owner, repoName };
    }
  }

  throw new Error(
    "Invalid GitHub repository URL format. Please use one of these formats:\n" +
      "• https://github.com/owner/repo\n" +
      "• https://api.github.com/repos/owner/repo\n" +
      "• git@github.com:owner/repo.git\n" +
      "• owner/repo"
  );
}

// Enhanced function to check for rate limit errors
function isRateLimitError(response) {
  if (response.status === 403) {
    // Check for rate limit in response headers or body
    const remainingHeader = response.headers.get("X-RateLimit-Remaining");
    const resetHeader = response.headers.get("X-RateLimit-Reset");

    if (remainingHeader === "0" || resetHeader) {
      return true;
    }
  }
  return response.status === 429; // Too Many Requests
}

// Enhanced function to get human-readable reset time
function getRateLimitResetTime(response) {
  const resetHeader = response.headers.get("X-RateLimit-Reset");
  if (resetHeader) {
    const resetTime = new Date(parseInt(resetHeader) * 1000);
    const now = new Date();
    const minutesUntilReset = Math.ceil((resetTime - now) / 60000);
    return minutesUntilReset > 0 ? minutesUntilReset : 1;
  }
  return 60; // Default to 60 minutes if can't determine
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
  console.log(`🚀 GitHub repo processing: ${repoUrl}`);

  try {
    // Parse and normalize the URL
    const { owner, repoName } = parseGitHubUrl(repoUrl);

    // Simple approach: try once, fail cleanly
    console.log(`🔍 Checking repository '${owner}/${repoName}'...`);

    // Test repository access
    const testResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}`
    );

    // Check for rate limit
    if (isRateLimitError(testResponse)) {
      const resetMinutes = getRateLimitResetTime(testResponse);
      throw new Error(
        `🚨 GitHub API rate limit exceeded.\n\n` +
          `Please try again in ${resetMinutes} minutes.\n\n` +
          `GitHub allows 60 requests per hour for unauthenticated users.`
      );
    }

    // Check for other errors
    if (!testResponse.ok) {
      if (testResponse.status === 404) {
        throw new Error(
          `❌ Repository '${owner}/${repoName}' not found.\n\n` +
            `Please check:\n` +
            `• Repository name is spelled correctly\n` +
            `• Repository exists and is public\n` +
            `• You have permission to access it`
        );
      } else if (testResponse.status === 403) {
        throw new Error(
          `❌ Repository '${owner}/${repoName}' is private or access denied.\n\n` +
            `This tool only works with public repositories.`
        );
      } else {
        throw new Error(
          `❌ Failed to access repository (HTTP ${testResponse.status}).\n\n` +
            `Please try again later.`
        );
      }
    }

    console.log(`✅ Repository accessible, getting files...`);

    // Get root directory contents
    const rootResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/contents/`
    );

    // Check for rate limit on second call
    if (isRateLimitError(rootResponse)) {
      const resetMinutes = getRateLimitResetTime(rootResponse);
      throw new Error(
        `🚨 GitHub API rate limit exceeded.\n\n` +
          `Please try again in ${resetMinutes} minutes.`
      );
    }

    if (!rootResponse.ok) {
      throw new Error(
        `❌ Failed to access repository contents (HTTP ${rootResponse.status}).\n\n` +
          `Please try again later.`
      );
    }

    const items = await rootResponse.json();

    // Process only root directory files
    const codeFiles = items
      .filter((item) => item.type === "file" && isCodeFile(item.name))
      .slice(0, 5); // Max 5 files

    if (codeFiles.length === 0) {
      throw new Error(
        `❌ No code files found in the root directory of '${owner}/${repoName}'.\n\n` +
          `This tool only checks the root directory to minimize API usage.\n\n` +
          `Please try a repository that has code files in the root folder.`
      );
    }

    console.log(`📄 Processing ${codeFiles.length} files...`);

    let result = "";
    for (const item of codeFiles) {
      try {
        const fileResponse = await fetch(item.download_url);

        if (isRateLimitError(fileResponse)) {
          const resetMinutes = getRateLimitResetTime(fileResponse);
          throw new Error(
            `🚨 GitHub API rate limit exceeded.\n\n` +
              `Please try again in ${resetMinutes} minutes.`
          );
        }

        if (!fileResponse.ok) {
          console.warn(
            `⚠️ Skipping ${item.name} (HTTP ${fileResponse.status})`
          );
          continue;
        }

        let content = await fileResponse.text();

        // Limit file size
        if (content.length > 3000) {
          content = content.substring(0, 3000) + "\n... (file truncated)";
        }

        // Remove imports to reduce noise
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

        result += "```\n" + item.path + "\n```\n" + content + "\n```\n\n";
        console.log(`✅ Processed ${item.name}`);
      } catch (error) {
        if (error.message.includes("rate limit")) {
          throw error; // Stop on rate limit
        }
        console.warn(`⚠️ Error processing ${item.name}:`, error.message);
      }
    }

    if (result.trim() === "") {
      throw new Error(
        `❌ No files could be processed from '${owner}/${repoName}'.\n\n` +
          `Please try again later or use a different repository.`
      );
    }

    console.log(`🎯 Successfully processed repository`);
    result += `\n\n📋 **Processing Summary**: Processed ${codeFiles.length} files from root directory.\n`;
    return result;
  } catch (error) {
    console.log(`💥 Repository processing failed: ${error.message}`);
    throw new Error(`Repository Processing Error: ${error.message}`);
  }
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
