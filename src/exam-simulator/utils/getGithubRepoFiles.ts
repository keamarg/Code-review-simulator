import prompts from "../../prompts.json";
import { appLogger } from "../../lib/utils";

function getLevelSpecificGuidance(level: string): string {
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

function parseGitHubUrl(url: string): { owner: string; repoName: string } {
  const cleanUrl = url.trim().replace(/\/$/, "");
  const patterns = [
    /^(https?:\/\/github\.com\/)([^/]+)\/([^/]+)(?:\/.*)?$/,
    /^(https?:\/\/api\.github\.com\/repos\/)([^/]+)\/([^/]+)(?:\/.*)?$/,
    /^(git@github\.com:)([^/]+)\/([^/]+)(?:\.git)?$/,
    /^([^\s/]+)\/([^\s/]+)$/,
  ];
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      const owner = match[1];
      let repoName = match[2];
      repoName = repoName.replace(/\.git$/, "");
      repoName = repoName.replace(/\/.*$/, "");
      return { owner, repoName };
    }
  }
  throw new Error(
    "Invalid GitHub repository URL format. Please use one of these formats:\n" +
      "• https://github.com/owner/repo\n" +
      "• https://api.github.com/repos/owner/repo\n" +
      "• git@github.com:owner/repo.git\n" +
      "• owner/repo",
  );
}

function getRateLimitResetTime(response: Response): number {
  const resetHeader = response.headers.get("X-RateLimit-Reset");
  if (resetHeader) {
    const resetTime = new Date(parseInt(resetHeader) * 1000);
    const now = new Date();
    const minutesUntilReset = Math.ceil((resetTime.getTime() - now.getTime()) / 60000);
    return minutesUntilReset > 0 ? minutesUntilReset : 1;
  }
  return 60;
}

function isCodeFile(filename: string): boolean {
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

let isProcessingRepository = false;

async function getRepoFilesRecursive(
  owner: string,
  repoName: string,
  path = "",
  maxFiles = 20,
  maxDepth = 3,
  currentDepth = 0,
): Promise<any[]> {
  if (currentDepth > maxDepth) {
    appLogger.generic.info(`⚠️ Maximum depth ${maxDepth} reached for path: ${path}`);
    return [];
  }
  try {
    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${path}`;
    appLogger.generic.info(`🔍 Scanning: ${path || "root"} (depth: ${currentDepth})`);

    let response: Response;
    try {
      response = await fetch(url);
    } catch (fetchError) {
      appLogger.info.warning(`⚠️ Network error accessing ${path}: ${String(fetchError)}`);
      return [];
    }

    if (response.status === 403) {
      const remaining = response.headers.get("X-RateLimit-Remaining");
      const resetHeader = response.headers.get("X-RateLimit-Reset");
      if (remaining === "0" || resetHeader) {
        const resetMinutes = getRateLimitResetTime(response);
        throw new Error(
          `GitHub API rate limit exceeded during recursive scan.\n\n` +
            `Please try again in ${resetMinutes} minutes.\n\n` +
            `Consider using root-only mode to reduce API usage.`,
        );
      } else {
        throw new Error(
          `❌ Repository '${owner}/${repoName}' is private or access is restricted.\n\nOnly public repositories are supported for code reviews.`,
        );
      }
    }

    if (!response.ok) {
      appLogger.info.warning(`⚠️ Failed to access ${path} (HTTP ${response.status})`);
      return [];
    }

    let items: any;
    try {
      items = await response.json();
    } catch (jsonError) {
      appLogger.info.warning(`⚠️ JSON parsing error for ${path}: ${String(jsonError)}`);
      return [];
    }

    if (!Array.isArray(items)) {
      appLogger.info.warning(`⚠️ Unexpected response format for ${path}`);
      return [];
    }

    const allFiles: any[] = [];
    const directories: any[] = [];
    const files: any[] = [];

    for (const item of items) {
      if (item.type === "file") {
        files.push(item);
      } else if (item.type === "dir") {
        directories.push(item);
      }
    }

    for (const item of files) {
      if (allFiles.length >= maxFiles) {
        appLogger.generic.info(`⚠️ Maximum file limit (${maxFiles}) reached`);
        break;
      }
      if (isCodeFile(item.name)) {
        allFiles.push(item);
      }
    }

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
        currentDepth + 1,
      );
      allFiles.push(...subFiles);
    }

    return allFiles;
  } catch (error: any) {
    if (
      error.message.includes("rate limit") ||
      error.message.includes("private") ||
      error.message.includes("restricted")
    ) {
      throw error;
    }
    appLogger.info.warning(`⚠️ Error scanning ${path}: ${error.message}`);
    return [];
  }
}

type ApiKeyCache = {
  prompt1: string | null;
  prompt2: string | null;
  database: string | null;
  cacheTime: number | null;
  cacheDuration: number;
};

const apiKeyCache: ApiKeyCache = {
  prompt1: null,
  prompt2: null,
  database: null,
  cacheTime: null,
  cacheDuration: 5 * 60 * 1000,
};

const pendingRequests: {
  prompt1: Promise<string> | null;
  prompt2: Promise<string> | null;
  database: Promise<string> | null;
} = {
  prompt1: null,
  prompt2: null,
  database: null,
};

const repositoryCache: {
  data: Map<string, { data: any; timestamp: number }>;
  cacheDuration: number;
} = {
  data: new Map(),
  cacheDuration: 10 * 60 * 1000,
};

export async function getCachedApiKey(
  endpoint: "prompt1" | "prompt2" | "database",
): Promise<string> {
  const now = Date.now();
  if (
    apiKeyCache[endpoint] &&
    apiKeyCache.cacheTime &&
    now - apiKeyCache.cacheTime < apiKeyCache.cacheDuration
  ) {
    return apiKeyCache[endpoint] as string;
  }
  if (pendingRequests[endpoint]) {
    appLogger.generic.info(`🔄 Waiting for existing ${endpoint} API key request...`);
    return await pendingRequests[endpoint]!;
  }
  const requestPromise = (async () => {
    try {
      appLogger.generic.info(`🔑 Fetching ${endpoint} API key from Vercel...`);
      const apiKeyResponse = await fetch(
        `https://api-key-server-codereview.vercel.app/api/${endpoint}`,
      );
      if (!apiKeyResponse.ok) {
        throw new Error("Failed to fetch API key");
      }
      const apiKey = await apiKeyResponse.json();
      apiKeyCache[endpoint] = apiKey;
      apiKeyCache.cacheTime = now;
      appLogger.generic.info(`✅ ${endpoint} API key cached successfully`);
      return apiKey as string;
    } finally {
      pendingRequests[endpoint] = null;
    }
  })();
  pendingRequests[endpoint] = requestPromise;
  return await requestPromise;
}

function getCachedRepositoryData(
  repoUrl: string,
  options: Record<string, any> = {},
): string | null {
  const cacheKey = `${repoUrl}-${JSON.stringify(options)}`;
  const now = Date.now();
  const cached = repositoryCache.data.get(cacheKey);
  if (cached && now - cached.timestamp < repositoryCache.cacheDuration) {
    appLogger.generic.info(`📦 Using cached repository data for: ${repoUrl}`);
    return cached.data;
  }
  return null;
}

function cacheRepositoryData(repoUrl: string, options: Record<string, any> = {}, data: string) {
  const cacheKey = `${repoUrl}-${JSON.stringify(options)}`;
  const now = Date.now();
  repositoryCache.data.set(cacheKey, {
    data,
    timestamp: now,
  });
  appLogger.generic.info(`📦 Cached repository data for: ${repoUrl}`);
}

async function getRepoFiles(
  repoUrl: string,
  options: { fullScan?: boolean; maxFiles?: number; maxDepth?: number } = {},
): Promise<any[]> {
  if (isProcessingRepository) {
    throw new Error("Repository processing already in progress. Please wait.");
  }
  isProcessingRepository = true;
  try {
    const { fullScan = false, maxFiles = fullScan ? 20 : 5, maxDepth = 3 } = options;
    const cachedData = getCachedRepositoryData(repoUrl, options);
    if (cachedData) {
      return cachedData as unknown as any[];
    }
    const { owner, repoName } = parseGitHubUrl(repoUrl);

    let testResponse: Response;
    try {
      testResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}`);
    } catch (fetchError) {
      appLogger.error.general(`Fetch error for repository check: ${String(fetchError)}`);
      throw new Error(
        `❌ Network error while checking repository '${owner}/${repoName}'.\n\n` +
          `This could be due to:\n` +
          `• Network connectivity issues\n` +
          `• GitHub API being temporarily unavailable\n` +
          `• CORS or browser security restrictions\n\n` +
          `Please check your internet connection and try again.`,
      );
    }
    if (testResponse.status === 403) {
      const remaining = testResponse.headers.get("X-RateLimit-Remaining");
      const resetHeader = testResponse.headers.get("X-RateLimit-Reset");
      if (remaining === "0" || resetHeader) {
        const resetMinutes = getRateLimitResetTime(testResponse);
        throw new Error(
          `GitHub API rate limit exceeded.\n\nPlease try again in ${resetMinutes} minutes.`,
        );
      } else {
        throw new Error(
          `❌ Repository '${owner}/${repoName}' is private or access is restricted.\n\nOnly public repositories are supported for code reviews.`,
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
            `Try: https://github.com/${owner}/${repoName}`,
        );
      } else {
        throw new Error(
          `❌ Failed to access repository '${owner}/${repoName}' (HTTP ${testResponse.status}).\n\n` +
            `Please try again later.`,
        );
      }
    }

    let codeFiles: any[] = [];
    if (fullScan) {
      appLogger.generic.info(`🔄 Starting full repository scan...`);
      codeFiles = await getRepoFilesRecursive(owner, repoName, "", maxFiles, maxDepth);
    } else {
      let rootResponse: Response;
      try {
        rootResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/`);
      } catch (fetchError) {
        appLogger.error.general(`Fetch error for repository contents: ${String(fetchError)}`);
        throw new Error(
          `❌ Network error while accessing repository contents for '${owner}/${repoName}'.\n\n` +
            `This could be due to:\n` +
            `• Network connectivity issues\n` +
            `• GitHub API being temporarily unavailable\n` +
            `• Repository having unusual structure or permissions\n\n` +
            `Please try again later or use a different repository.`,
        );
      }
      if (rootResponse.status === 403) {
        const remaining = rootResponse.headers.get("X-RateLimit-Remaining");
        const resetHeader = rootResponse.headers.get("X-RateLimit-Reset");
        if (remaining === "0" || resetHeader) {
          const resetMinutes = getRateLimitResetTime(rootResponse);
          throw new Error(
            `GitHub API rate limit exceeded.\n\nPlease try again in ${resetMinutes} minutes.`,
          );
        } else {
          throw new Error(
            `❌ Repository '${owner}/${repoName}' is private or access is restricted.\n\nOnly public repositories are supported for code reviews.`,
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
              `Please try a different repository with files in the root directory.`,
          );
        } else {
          throw new Error(
            `❌ Failed to access repository contents (HTTP ${rootResponse.status}).\n\n` +
              `Please try again later.`,
          );
        }
      }
      let items: any;
      try {
        items = await rootResponse.json();
      } catch (jsonError) {
        appLogger.error.general(`JSON parsing error for repository contents: ${String(jsonError)}`);
        throw new Error(
          `❌ Invalid response format from GitHub API for '${owner}/${repoName}'.\n\n` +
            `This could indicate:\n` +
            `• GitHub API returning unexpected data\n` +
            `• Network corruption during data transfer\n\n` +
            `Please try again later.`,
        );
      }
      if (!Array.isArray(items)) {
        appLogger.error.general(`Unexpected response format from GitHub API`);
        throw new Error(
          `❌ Unexpected repository structure for '${owner}/${repoName}'.\n\n` +
            `The repository contents are not in the expected format.\n\n` +
            `Please try a different repository.`,
        );
      }
      codeFiles = items
        .filter((item: any) => item.type === "file" && isCodeFile(item.name))
        .slice(0, maxFiles);
    }

    if (codeFiles.length === 0) {
      if (fullScan) {
        throw new Error(
          `❌ No code files found in repository '${owner}/${repoName}'.\n\n` +
            `Scanned entire repository up to ${maxDepth} levels deep but found no recognizable code files.\n\n` +
            `Please try a repository that contains code files.`,
        );
      } else {
        let rootResponse: Response;
        try {
          rootResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/`);
          const items = await rootResponse.json();
          if (Array.isArray(items)) {
            const allFiles = items.filter((item: any) => item.type === "file");
            const allFolders = items.filter((item: any) => item.type === "dir");
            if (allFiles.length === 0 && allFolders.length === 0) {
              throw new Error(
                `❌ Repository '${owner}/${repoName}' is completely empty.\n\n` +
                  `Please try a repository that contains files.`,
              );
            } else if (allFiles.length === 0) {
              throw new Error(
                `❌ Repository '${owner}/${repoName}' contains only folders in the root directory.\n\n` +
                  `Found ${allFolders.length} folder(s) but no files.\n\n` +
                  `Try enabling full scan mode to search subdirectories, or use a repository with files in the root folder.`,
              );
            } else {
              throw new Error(
                `❌ No code files found in the root directory of '${owner}/${repoName}'.\n\n` +
                  `Found ${allFiles.length} file(s) but none are recognized as code files.\n\n` +
                  `Try enabling full scan mode to search subdirectories, or use a repository with code files in the root folder.`,
              );
            }
          }
        } catch (e) {
          throw new Error(
            `❌ No code files found in the root directory of '${owner}/${repoName}'.\n\n` +
              `Try enabling full scan mode to search subdirectories.`,
          );
        }
      }
    }

    let result = "";
    let processedCount = 0;
    let fatalError: Error | null = null;
    for (const item of codeFiles) {
      try {
        let fileResponse: Response;
        try {
          fileResponse = await fetch(item.download_url);
        } catch (fetchError) {
          appLogger.info.warning(`⚠️ Network error fetching ${item.name}: ${String(fetchError)}`);
          continue;
        }
        if (fileResponse.status === 403) {
          const remaining = fileResponse.headers.get("X-RateLimit-Remaining");
          const resetHeader = fileResponse.headers.get("X-RateLimit-Reset");
          if (remaining === "0" || resetHeader) {
            const resetMinutes = getRateLimitResetTime(fileResponse);
            fatalError = new Error(
              `GitHub API rate limit exceeded.\n\nPlease try again in ${resetMinutes} minutes.`,
            );
            break;
          } else {
            fatalError = new Error(
              `❌ Repository '${owner}/${repoName}' is private or access is restricted.\n\nOnly public repositories are supported for code reviews.`,
            );
            break;
          }
        }
        if (!fileResponse.ok) {
          appLogger.info.warning(`⚠️ Skipping ${item.name} (HTTP ${fileResponse.status})`);
          continue;
        }
        let content: string;
        try {
          content = await fileResponse.text();
        } catch (textError) {
          appLogger.info.warning(`⚠️ Error reading content of ${item.name}: ${String(textError)}`);
          continue;
        }
        if (content.length > 3000) {
          content = content.substring(0, 3000) + "\n... (file truncated)";
        }
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
      } catch (error: any) {
        if (
          error.message.includes("rate limit") ||
          error.message.includes("private") ||
          error.message.includes("restricted")
        ) {
          fatalError = error;
          break;
        }
        appLogger.info.warning(`⚠️ Error processing ${item.name}: ${error.message}`);
      }
    }
    if (fatalError) {
      throw fatalError;
    }
    if (result.trim() === "") {
      throw new Error(
        `❌ No files could be processed from '${owner}/${repoName}'.\n\n` +
          `All ${codeFiles.length} code files encountered errors during processing.\n\n` +
          `Please try again later or use a different repository.`,
      );
    }
    const scanMode = fullScan ? "full repository scan" : "root directory only";
    const depthInfo = fullScan ? ` (up to ${maxDepth} levels deep)` : "";
    result += `\n\n📋 **Processing Summary**: Processed ${processedCount} files from ${scanMode}${depthInfo}.\n`;
    cacheRepositoryData(repoUrl, options, result);
    return result as unknown as any[];
  } catch (error: any) {
    throw new Error(`Repository Processing Error: ${error.message}`);
  } finally {
    isProcessingRepository = false;
  }
}

export async function getRepoQuestions(
  repoUrl: string,
  developerLevel: string,
  options: { fullScan?: boolean; maxFiles?: number; maxDepth?: number } = {},
): Promise<string> {
  const cacheKey = `${repoUrl}-${developerLevel}-${JSON.stringify(options)}`;
  const now = Date.now();
  const cached = repositoryCache.data.get(cacheKey);
  if (cached && now - cached.timestamp < repositoryCache.cacheDuration) {
    appLogger.generic.info(`🤖 Using cached AI questions for: ${repoUrl}`);
    return cached.data as string;
  }

  const repoContents = await getRepoFiles(repoUrl, options);
  const levelGuidance = getLevelSpecificGuidance(developerLevel || "intermediate");
  let promptTemplate: string = (prompts as any).taskPrompts.repoQuestions;
  let prompt = promptTemplate
    .replace("${repoContents}", repoContents as unknown as string)
    .replace("${learningGoals}", levelGuidance);
  prompt = prompt.replace(/\\n/g, "\n");
  const systemPrompt: string = (prompts as any).systemPrompts.githubRepoQuestions;
  const { getCompletion } = await import("./getCompletion");
  const answer = await getCompletion(prompt, systemPrompt, false);
  repositoryCache.data.set(cacheKey, {
    data: answer,
    timestamp: now,
  });
  appLogger.generic.info(`🤖 Cached AI questions for: ${repoUrl}`);
  return answer as string;
}

export default getRepoQuestions;
