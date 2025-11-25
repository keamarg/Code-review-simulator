/**
 * GitHub-related utility functions
 */

/**
 * Parse GitHub repository URL into owner and repo name
 * Supports multiple URL formats:
 * - https://github.com/owner/repo
 * - https://api.github.com/repos/owner/repo
 * - git@github.com:owner/repo.git
 * - owner/repo
 * @param url GitHub repository URL
 * @returns Object with owner and repoName
 * @throws Error if URL format is invalid
 */
export function parseGitHubUrl(url: string): { owner: string; repoName: string } {
  const trimmed = url.trim().replace(/\/$/, "");
  const cleanUrl = trimmed.replace(/^@(?=https?:\/\/)/, "");
  const patterns = [
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/,
    /^https?:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)(?:\/.*)?$/,
    /^git@github\.com:([^/]+)\/([^/]+)(?:\.git)?$/,
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

/**
 * Check if a filename is a code file based on extension
 * @param filename File name to check
 * @returns True if file has a code extension
 */
export function isCodeFile(filename: string): boolean {
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
    ".swift",
    ".m",
    ".mm",
    ".dart",
    ".r",
    ".R",
    ".jl",
    ".clj",
    ".cljs",
    ".hs",
    ".elm",
    ".ex",
    ".exs",
    ".erl",
    ".hrl",
    ".lua",
    ".pl",
    ".pm",
    ".sh",
    ".bash",
    ".zsh",
    ".fish",
    ".ps1",
    ".bat",
    ".cmd",
    ".sql",
    ".html",
    ".htm",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".xml",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
    ".md",
    ".markdown",
    ".tex",
    ".rkt",
    ".scm",
    ".ss",
    ".lisp",
    ".lsp",
    ".ml",
    ".mli",
    ".fs",
    ".fsi",
    ".fsx",
    ".nim",
    ".cr",
    ".crystal",
    ".zig",
    ".v",
    ".odin",
    ".pas",
    ".pp",
    ".lpr",
    ".dpr",
    ".ada",
    ".adb",
    ".ads",
    ".f90",
    ".f95",
    ".f03",
    ".f08",
    ".for",
    ".ftn",
    ".coffee",
    ".litcoffee",
    ".coffee.md",
    ".iced",
    ".tsx",
    ".jsx",
    ".mjs",
    ".cjs",
    ".es6",
    ".es",
    ".jsm",
    ".svelte",
    ".vue",
    ".ts",
    ".js",
  ];
  const lowerFilename = filename.toLowerCase();
  return codeExtensions.some((ext) => lowerFilename.endsWith(ext));
}




