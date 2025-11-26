import React from "react";

interface PrivateRepositoryErrorProps {
  repoUrl?: string;
  errorType?: "private" | "notFound" | "rateLimit";
  minutesRemaining?: number;
  onReturnToSetup: () => void;
}

export const PrivateRepositoryError: React.FC<PrivateRepositoryErrorProps> = ({
  repoUrl,
  errorType = "private",
  minutesRemaining,
  onReturnToSetup,
}) => {
  const isNotFound = errorType === "notFound";
  const isRateLimit = errorType === "rateLimit";

  return (
    <div className="my-6">
      <div className="max-w-2xl mx-auto p-6 bg-tokyo-bg-lighter border border-tokyo-selection rounded-lg">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg
              className="h-6 w-6 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-tokyo-fg-brightest mb-2">
              {isRateLimit
                ? "GitHub API Rate Limit Exceeded"
                : isNotFound
                  ? "Repository Not Found"
                  : "Private Repository Detected"}
            </h3>
            <p className="text-tokyo-fg mb-4">
              {isRateLimit ? (
                <>
                  The GitHub API rate limit has been exceeded. Please try again in{" "}
                  <strong>{minutesRemaining || "a few"}</strong>{" "}
                  {minutesRemaining === 1 ? "minute" : "minutes"}.
                </>
              ) : isNotFound ? (
                <>
                  The repository {repoUrl ? `"${repoUrl}"` : "you specified"} was not found. Please
                  check that the repository name is correct and that it exists on GitHub.
                </>
              ) : (
                <>
                  The repository {repoUrl ? `"${repoUrl}"` : "you specified"} is private or access
                  is restricted. Only public repositories are supported for code reviews.
                </>
              )}
            </p>
            <p className="text-sm text-tokyo-fg-dimmed mb-4">
              {isRateLimit
                ? "GitHub limits API requests to prevent abuse. You can try again later or use a different repository."
                : isNotFound
                  ? "Make sure the repository URL is correct and try again."
                  : "To proceed, please use a public repository or make the repository public on GitHub."}
            </p>
            <button
              onClick={onReturnToSetup}
              className="text-sm font-semibold px-3 py-1.5 rounded-md"
              style={{
                backgroundColor: "var(--tokyo-accent)",
                color: "#ffffff",
                cursor: "pointer",
                transition: "background-color 150ms ease-in-out, opacity 150ms ease-in-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--tokyo-accent-darker)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--tokyo-accent)";
              }}
            >
              Return to Setup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
