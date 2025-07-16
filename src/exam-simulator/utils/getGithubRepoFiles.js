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
// function isRateLimitError(response) {
//   if (response.status === 403) {
//     // Check for rate limit in response headers or body
//     const remainingHeader = response.headers.get("X-RateLimit-Remaining");
//     const resetHeader = response.headers.get("X-RateLimit-Reset");
//
//     if (remainingHeader === "0" || resetHeader) {
//       return true;
//     }
//   }
//   return response.status === 429; // Too Many Requests
// }

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

// Global flag to prevent multiple simultaneous repository processing
let isProcessingRepository = false;

// Function to recursively get all files from a repository
async function getRepoFilesRecursive(
  owner,
  repoName,
  path = "",
  maxFiles = 20,
  maxDepth = 3,
  currentDepth = 0
) {
  if (currentDepth > maxDepth) {
    console.log(`⚠️ Maximum depth ${maxDepth} reached for path: ${path}`);
    return [];
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
    console.log(`🔍 Scanning: ${path || "root"} (depth: ${currentDepth})`);

    let response;
    try {
      response = await fetch(url);
    } catch (fetchError) {
      console.warn(`⚠️ Network error accessing ${path}:`, fetchError);
      return [];
    }

    // Enhanced error handling for 403
    if (response.status === 403) {
      const remaining = response.headers.get("X-RateLimit-Remaining");
      const resetHeader = response.headers.get("X-RateLimit-Reset");
      if (remaining === "0" || resetHeader) {
        const resetMinutes = getRateLimitResetTime(response);
        throw new Error(
          `GitHub API rate limit exceeded during recursive scan.\n\n` +
            `Please try again in ${resetMinutes} minutes.\n\n` +
            `Consider using root-only mode to reduce API usage.`
        );
      } else {
        throw new Error(
          `❌ Repository '${owner}/${repoName}' is private or access is restricted.\n\nOnly public repositories are supported for code reviews.`
        );
      }
    }

    if (!response.ok) {
      console.warn(`⚠️ Failed to access ${path} (HTTP ${response.status})`);
      return [];
    }

    let items;
    try {
      items = await response.json();
    } catch (jsonError) {
      console.warn(`⚠️ JSON parsing error for ${path}:`, jsonError);
      return [];
    }

    if (!Array.isArray(items)) {
      console.warn(`⚠️ Unexpected response format for ${path}`);
      return [];
    }

    const allFiles = [];
    const directories = [];
    const files = [];

    // Separate files and directories
    for (const item of items) {
      if (item.type === "file") {
        files.push(item);
      } else if (item.type === "dir") {
        directories.push(item);
      }
    }

    // Process files first
    for (const item of files) {
      if (allFiles.length >= maxFiles) {
        console.log(`⚠️ Maximum file limit (${maxFiles}) reached`);
        break;
      }

      if (isCodeFile(item.name)) {
        allFiles.push(item);
      }
    }

    // Then recursively process directories
    for (const dir of directories) {
      if (allFiles.length >= maxFiles) {
        break;
      }

      const subFiles = await getRepoFilesRecursive(
        owner,
        repoName,
        dir.path,
        maxFiles - allFiles.length,
        maxDepth,
        currentDepth + 1
      );

      allFiles.push(...subFiles);
    }

    return allFiles;
  } catch (error) {
    if (
      error.message.includes("rate limit") ||
      error.message.includes("private") ||
      error.message.includes("restricted")
    ) {
      throw error; // Re-throw fatal errors
    }
    console.warn(`⚠️ Error scanning ${path}:`, error.message);
    return [];
  }
}

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

// Repository cache to avoid re-processing the same repository
const repositoryCache = {
  data: new Map(),
  cacheDuration: 10 * 60 * 1000, // 10 minutes cache duration
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

// Function to get cached repository data
function getCachedRepositoryData(repoUrl, options = {}) {
  const cacheKey = `${repoUrl}-${JSON.stringify(options)}`;
  const now = Date.now();

  const cached = repositoryCache.data.get(cacheKey);
  if (cached && now - cached.timestamp < repositoryCache.cacheDuration) {
    console.log(`📦 Using cached repository data for: ${repoUrl}`);
    return cached.data;
  }

  return null;
}

// Function to cache repository data
function cacheRepositoryData(repoUrl, options = {}, data) {
  const cacheKey = `${repoUrl}-${JSON.stringify(options)}`;
  const now = Date.now();

  repositoryCache.data.set(cacheKey, {
    data,
    timestamp: now,
  });

  console.log(`📦 Cached repository data for: ${repoUrl}`);
}

async function getRepoFiles(repoUrl, options = {}) {
  // Prevent multiple simultaneous calls
  if (isProcessingRepository) {
    throw new Error("Repository processing already in progress. Please wait.");
  }

  isProcessingRepository = true;

  try {
    const {
      fullScan = false,
      maxFiles = fullScan ? 20 : 5,
      maxDepth = 3,
    } = options;

    // Check cache first
    const cachedData = getCachedRepositoryData(repoUrl, options);
    if (cachedData) {
      return cachedData;
    }

    // Parse and normalize the URL
    const { owner, repoName } = parseGitHubUrl(repoUrl);

    // Test repository access with better error handling
    let testResponse;
    try {
      testResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}`
      );
    } catch (fetchError) {
      console.error(`Fetch error for repository check:`, fetchError);
      throw new Error(
        `❌ Network error while checking repository '${owner}/${repoName}'.\n\n` +
          `This could be due to:\n` +
          `• Network connectivity issues\n` +
          `• GitHub API being temporarily unavailable\n` +
          `• CORS or browser security restrictions\n\n` +
          `Please check your internet connection and try again.`
      );
    }

    // Enhanced error handling for 403
    if (testResponse.status === 403) {
      const remaining = testResponse.headers.get("X-RateLimit-Remaining");
      const resetHeader = testResponse.headers.get("X-RateLimit-Reset");
      if (remaining === "0" || resetHeader) {
        const resetMinutes = getRateLimitResetTime(testResponse);
        throw new Error(
          `GitHub API rate limit exceeded.\n\nPlease try again in ${resetMinutes} minutes.`
        );
      } else {
        throw new Error(
          `❌ Repository '${owner}/${repoName}' is private or access is restricted.\n\nOnly public repositories are supported for code reviews.`
        );
      }
    }

    if (!testResponse.ok) {
      if (testResponse.status === 404) {
        throw new Error(
          `❌ Repository '${owner}/${repoName}' not found.\n\n` +
            `Please check:\n` +
            `• Repository name is correct\n` +
            `• Repository is public (private repos not supported)\n` +
            `• Repository exists and is accessible\n\n` +
            `Try: https://github.com/${owner}/${repoName}`
        );
      } else {
        throw new Error(
          `❌ Failed to access repository '${owner}/${repoName}' (HTTP ${testResponse.status}).\n\n` +
            `Please try again later.`
        );
      }
    }

    let codeFiles = [];

    if (fullScan) {
      // Full repository scan
      console.log(`🔄 Starting full repository scan...`);
      codeFiles = await getRepoFilesRecursive(
        owner,
        repoName,
        "",
        maxFiles,
        maxDepth
      );
    } else {
      // Root directory only (existing logic)
      let rootResponse;
      try {
        rootResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/`
        );
      } catch (fetchError) {
        console.error(`Fetch error for repository contents:`, fetchError);
        throw new Error(
          `❌ Network error while accessing repository contents for '${owner}/${repoName}'.\n\n` +
            `This could be due to:\n` +
            `• Network connectivity issues\n` +
            `• GitHub API being temporarily unavailable\n` +
            `• Repository having unusual structure or permissions\n\n` +
            `Please try again later or use a different repository.`
        );
      }

      // Enhanced error handling for 403
      if (rootResponse.status === 403) {
        const remaining = rootResponse.headers.get("X-RateLimit-Remaining");
        const resetHeader = rootResponse.headers.get("X-RateLimit-Reset");
        if (remaining === "0" || resetHeader) {
          const resetMinutes = getRateLimitResetTime(rootResponse);
          throw new Error(
            `GitHub API rate limit exceeded.\n\nPlease try again in ${resetMinutes} minutes.`
          );
        } else {
          throw new Error(
            `❌ Repository '${owner}/${repoName}' is private or access is restricted.\n\nOnly public repositories are supported for code reviews.`
          );
        }
      }

      if (!rootResponse.ok) {
        if (rootResponse.status === 404) {
          throw new Error(
            `❌ Repository contents not found for '${owner}/${repoName}'.\n\n` +
              `This could happen if:\n` +
              `• The repository is completely empty\n` +
              `• The repository has unusual permissions\n` +
              `• The repository structure is not standard\n\n` +
              `Please try a different repository with files in the root directory.`
          );
        } else {
          throw new Error(
            `❌ Failed to access repository contents (HTTP ${rootResponse.status}).\n\n` +
              `Please try again later.`
          );
        }
      }

      let items;
      try {
        items = await rootResponse.json();
      } catch (jsonError) {
        console.error(`JSON parsing error for repository contents:`, jsonError);
        throw new Error(
          `❌ Invalid response format from GitHub API for '${owner}/${repoName}'.\n\n` +
            `This could indicate:\n` +
            `• GitHub API returning unexpected data\n` +
            `• Network corruption during data transfer\n\n` +
            `Please try again later.`
        );
      }

      // Validate that items is an array
      if (!Array.isArray(items)) {
        console.error(`Unexpected response format:`, items);
        throw new Error(
          `❌ Unexpected repository structure for '${owner}/${repoName}'.\n\n` +
            `The repository contents are not in the expected format.\n\n` +
            `Please try a different repository.`
        );
      }

      // Process only root directory files
      codeFiles = items
        .filter((item) => item.type === "file" && isCodeFile(item.name))
        .slice(0, maxFiles);
    }

    if (codeFiles.length === 0) {
      if (fullScan) {
        throw new Error(
          `❌ No code files found in repository '${owner}/${repoName}'.\n\n` +
            `Scanned entire repository up to ${maxDepth} levels deep but found no recognizable code files.\n\n` +
            `Please try a repository that contains code files.`
        );
      } else {
        // Root-only mode error handling (existing logic)
        let rootResponse;
        try {
          rootResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/contents/`
          );
          const items = await rootResponse.json();

          if (Array.isArray(items)) {
            const allFiles = items.filter((item) => item.type === "file");
            const allFolders = items.filter((item) => item.type === "dir");

            if (allFiles.length === 0 && allFolders.length === 0) {
              throw new Error(
                `❌ Repository '${owner}/${repoName}' is completely empty.\n\n` +
                  `Please try a repository that contains files.`
              );
            } else if (allFiles.length === 0) {
              throw new Error(
                `❌ Repository '${owner}/${repoName}' contains only folders in the root directory.\n\n` +
                  `Found ${allFolders.length} folder(s) but no files.\n\n` +
                  `Try enabling full scan mode to search subdirectories, or use a repository with files in the root folder.`
              );
            } else {
              throw new Error(
                `❌ No code files found in the root directory of '${owner}/${repoName}'.\n\n` +
                  `Found ${allFiles.length} file(s) but none are recognized as code files.\n\n` +
                  `Try enabling full scan mode to search subdirectories, or use a repository with code files in the root folder.`
              );
            }
          }
        } catch (e) {
          // Fallback error message
          throw new Error(
            `❌ No code files found in the root directory of '${owner}/${repoName}'.\n\n` +
              `Try enabling full scan mode to search subdirectories.`
          );
        }
      }
    }

    let result = "";
    let processedCount = 0;
    let fatalError = null;

    for (const item of codeFiles) {
      try {
        let fileResponse;
        try {
          fileResponse = await fetch(item.download_url);
        } catch (fetchError) {
          console.warn(`⚠️ Network error fetching ${item.name}:`, fetchError);
          continue; // Skip this file and continue with others
        }

        // Enhanced error handling for 403
        if (fileResponse.status === 403) {
          const remaining = fileResponse.headers.get("X-RateLimit-Remaining");
          const resetHeader = fileResponse.headers.get("X-RateLimit-Reset");
          if (remaining === "0" || resetHeader) {
            const resetMinutes = getRateLimitResetTime(fileResponse);
            fatalError = new Error(
              `GitHub API rate limit exceeded.\n\nPlease try again in ${resetMinutes} minutes.`
            );
            break;
          } else {
            fatalError = new Error(
              `❌ Repository '${owner}/${repoName}' is private or access is restricted.\n\nOnly public repositories are supported for code reviews.`
            );
            break;
          }
        }

        if (!fileResponse.ok) {
          console.warn(
            `⚠️ Skipping ${item.name} (HTTP ${fileResponse.status})`
          );
          continue;
        }

        let content;
        try {
          content = await fileResponse.text();
        } catch (textError) {
          console.warn(`⚠️ Error reading content of ${item.name}:`, textError);
          continue; // Skip this file and continue with others
        }

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
        processedCount++;
      } catch (error) {
        if (
          error.message.includes("rate limit") ||
          error.message.includes("private") ||
          error.message.includes("restricted")
        ) {
          fatalError = error;
          break;
        }
        console.warn(`⚠️ Error processing ${item.name}:`, error.message);
      }
    }

    if (fatalError) {
      throw fatalError;
    }

    if (result.trim() === "") {
      throw new Error(
        `❌ No files could be processed from '${owner}/${repoName}'.\n\n` +
          `All ${codeFiles.length} code files encountered errors during processing.\n\n` +
          `Please try again later or use a different repository.`
      );
    }

    const scanMode = fullScan ? "full repository scan" : "root directory only";
    const depthInfo = fullScan ? ` (up to ${maxDepth} levels deep)` : "";
    result += `\n\n📋 **Processing Summary**: Processed ${processedCount} files from ${scanMode}${depthInfo}.\n`;

    // Cache the result
    cacheRepositoryData(repoUrl, options, result);

    return result;
  } catch (error) {
    throw new Error(`Repository Processing Error: ${error.message}`);
  } finally {
    isProcessingRepository = false;
  }
}

// Function to get exam questions based on repoContents and developer level
export async function getRepoQuestions(repoUrl, developerLevel, options = {}) {
  // Create a cache key that includes all parameters
  const cacheKey = `${repoUrl}-${developerLevel}-${JSON.stringify(options)}`;
  const now = Date.now();

  // Check if we have cached questions
  const cached = repositoryCache.data.get(cacheKey);
  if (cached && now - cached.timestamp < repositoryCache.cacheDuration) {
    console.log(`🤖 Using cached AI questions for: ${repoUrl}`);
    return cached.data;
  }

  const repoContents = await getRepoFiles(repoUrl, options);

  // Get level-specific guidance based on developer level
  const levelGuidance = getLevelSpecificGuidance(
    developerLevel || "intermediate"
  );

  // Get the prompt template from prompts.json and replace variables
  let promptTemplate = prompts.taskPrompts.repoQuestions;
  let prompt = promptTemplate
    // eslint-disable-next-line no-template-curly-in-string
    .replace("${repoContents}", repoContents)
    // eslint-disable-next-line no-template-curly-in-string
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

  // Import the cached API key function
  const { getCachedApiKey } = await import("./getCompletion.js");
  const apiKey = await getCachedApiKey("prompt1");

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

  // Cache the AI-generated questions
  repositoryCache.data.set(cacheKey, {
    data: answer,
    timestamp: now,
  });

  console.log(`🤖 Cached AI questions for: ${repoUrl}`);

  return answer;
}

export default getRepoQuestions;
