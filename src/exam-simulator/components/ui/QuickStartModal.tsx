import React, { useState, useEffect } from "react";
import twoScreenSetupImage from "../../../two-screen-setup.jpg";
import getGithubRepoFiles from "../../utils/getGithubRepoFiles";

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartReview: (
    type: string,
    developerLevel: string,
    repoUrl?: string,
    fullScan?: boolean
  ) => void;
  fixedType?: string;
  fixedDeveloperLevel?: string;
  examDescription?: string;
  examTitle?: string;
}

export const QuickStartModal: React.FC<QuickStartModalProps> = ({
  isOpen,
  onClose,
  onStartReview,
  fixedType,
  fixedDeveloperLevel,
  examDescription,
  examTitle,
}) => {
  const isCustomMode = !!fixedType;

  const [type, setType] = useState(fixedType || "Standard");
  const [developerLevel, setDeveloperLevel] = useState(
    fixedDeveloperLevel || "intermediate"
  );
  const [repoUrl, setRepoUrl] = useState("");
  const [repoUrlError, setRepoUrlError] = useState("");
  const [fullScan, setFullScan] = useState(false);

  const getRepoUrlError = (url: string): string => {
    if (!url.trim()) {
      return "Please enter a GitHub repository URL";
    }

    try {
      const cleanUrl = url.trim().replace(/\/$/, "");
      const patterns = [
        /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/,
        /^https?:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)(?:\/.*)?$/,
        /^git@github\.com:([^/]+)\/([^/]+)(?:\.git)?$/,
        /^([^/\s]+)\/([^/\s]+)$/,
      ];

      const hasValidFormat = patterns.some((pattern) =>
        cleanUrl.match(pattern)
      );
      if (!hasValidFormat) {
        return (
          "Invalid GitHub repository URL format. Please use one of these formats:\n" +
          "• https://github.com/owner/repo\n" +
          "• https://api.github.com/repos/owner/repo\n" +
          "• git@github.com:owner/repo.git\n" +
          "• owner/repo"
        );
      }
      return ""; // No error
    } catch (error) {
      return "Invalid repository URL format";
    }
  };

  useEffect(() => {
    if (type === "Github Repo") {
      const error = getRepoUrlError(repoUrl);
      setRepoUrlError(error);
    } else {
      setRepoUrlError("");
    }
  }, [repoUrl, type]);

  // Valid GitHub URL
  const repoValid = (() => {
    if (type !== "Github Repo") return true;
    if (!repoUrl.trim()) return false;
    return getRepoUrlError(repoUrl) === "";
  })();

  const handleStartReview = () => {
    if (type === "Github Repo" && !repoValid) return;

    onStartReview(
      type,
      developerLevel,
      type === "Github Repo" ? repoUrl : "",
      fullScan
    );
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType !== "Github Repo") {
      setRepoUrl("");
    }
  };

  const handleRepoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-tokyo-bg-lighter rounded-lg shadow-xl max-w-4xl w-full border border-tokyo-selection">
        {/* Header */}
        <div className="bg-tokyo-bg-darker rounded-t-lg px-6 py-4 border-b border-tokyo-selection">
          <h2 className="text-xl font-bold text-tokyo-fg-bright flex items-center">
            {isCustomMode ? "Custom Code Review" : "Quick Start Code Review"}
          </h2>
          <p className="text-tokyo-comment mt-1">
            Set up your code review preferences and start immediately
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* Left Side - Form Fields */}
            <div
              className="flex-1 flex flex-col pr-2"
              style={{ maxHeight: "70vh" }}
            >
              {isCustomMode && (
                <div className="mb-4 text-sm space-y-1">
                  <p>
                    <span className="font-medium">Title:</span> {examTitle}
                  </p>
                  <p>
                    <span className="font-medium">Type:</span> {fixedType}
                  </p>
                  <p>
                    <span className="font-medium">Level:</span>{" "}
                    {fixedDeveloperLevel}
                  </p>
                </div>
              )}

              {!isCustomMode && (
                <div className="mb-6">
                  <label className="block text-tokyo-fg-bright text-sm font-medium mb-2">
                    <div className="flex items-center">
                      <svg
                        className="h-4 w-4 mr-2 text-tokyo-comment"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      Developer Experience Level
                    </div>
                  </label>
                  <select
                    value={developerLevel}
                    onChange={(e) => setDeveloperLevel(e.target.value)}
                    className="w-full px-4 py-2 border border-tokyo-selection bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent transition-colors"
                    disabled={!!fixedDeveloperLevel}
                  >
                    <option value="junior">Junior Developer</option>
                    <option value="intermediate">Intermediate Developer</option>
                    <option value="senior">Senior Developer</option>
                  </select>
                  <p className="text-xs text-tokyo-comment mt-1">
                    This will determine the depth and style of feedback provided
                    during the code review.
                  </p>
                </div>
              )}

              {isCustomMode && examDescription && (
                <div className="mb-6 flex-grow flex flex-col overflow-hidden">
                  <label className="block text-tokyo-fg-bright text-sm font-medium mb-2">
                    Description
                  </label>
                  <div className="relative flex-grow overflow-y-auto pr-2">
                    <p className="text-tokyo-fg whitespace-pre-wrap">
                      {examDescription}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-tokyo-bg-lighter to-transparent pointer-events-none"></div>
                  </div>
                </div>
              )}

              {/* Code Review Type Dropdown */}
              {!isCustomMode && (
                <div className="mb-6">
                  <label className="block text-tokyo-fg-bright text-sm font-medium mb-2">
                    <div className="flex items-center">
                      <svg
                        className="h-4 w-4 mr-2 text-tokyo-comment"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Code review type
                    </div>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-4 py-2 border border-tokyo-selection bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent transition-colors"
                    disabled={isCustomMode}
                  >
                    <option value="Standard">Standard</option>
                    <option value="Github Repo">Github Repo</option>
                  </select>
                </div>
              )}

              {/* GitHub Repository URL Input - CONDITIONALLY RENDERED */}
              {type === "Github Repo" && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-tokyo-fg-bright text-sm font-medium mb-2">
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-2 text-tokyo-comment"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        GitHub Repository URL
                      </div>
                    </label>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={handleRepoUrlChange}
                      placeholder="https://github.com/user/repository or user/repository"
                      className={`w-full px-4 py-2 border bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent transition-colors ${
                        repoUrlError
                          ? "border-red-500"
                          : "border-tokyo-selection"
                      }`}
                    />
                    {repoUrlError && (
                      <div className="mt-2 text-sm text-red-400 whitespace-pre-line">
                        {repoUrlError}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-tokyo-comment">
                      <p className="font-medium">Supported formats:</p>
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• https://github.com/owner/repo</li>
                        <li>• owner/repo</li>
                        <li>• git@github.com:owner/repo.git</li>
                        <li>• https://api.github.com/repos/owner/repo</li>
                      </ul>
                    </div>
                  </div>

                  {/* Full Scan Toggle */}
                  <div className="bg-tokyo-bg-darker p-4 rounded-lg border border-tokyo-selection">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="block text-tokyo-fg-bright text-sm font-medium mb-1">
                          Full Repository Scan
                        </label>
                        <p className="text-tokyo-fg text-xs">
                          {fullScan
                            ? "Scans all files in all subdirectories (uses more API calls)"
                            : "Scans only files in the root directory (API efficient)"}
                        </p>
                      </div>
                      <div className="ml-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fullScan}
                            onChange={(e) => setFullScan(e.target.checked)}
                            className="sr-only"
                          />
                          <div
                            className={`w-11 h-6 rounded-full border-2 transition-colors ${
                              fullScan
                                ? "bg-tokyo-accent border-tokyo-accent"
                                : "bg-tokyo-bg border-tokyo-selection"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                fullScan ? "translate-x-5" : "translate-x-0"
                              }`}
                            ></div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {fullScan && (
                      <div className="mt-3 p-3 bg-tokyo-bg rounded border border-tokyo-selection">
                        <div className="flex items-center text-tokyo-fg-bright text-xs">
                          <svg
                            className="w-4 h-4 mr-2 text-yellow-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          <span>
                            Full scan may use 10-30 API calls vs 2-7 for
                            root-only
                          </span>
                        </div>
                        <div className="mt-2 text-tokyo-fg text-xs">
                          <strong>Limits:</strong> Max 20 files, up to 3
                          directories deep
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side - Two-Screen Setup Recommendation (always) */}
            <div className="flex-1">
              <div className="bg-tokyo-bg-darker rounded-lg p-4 border border-tokyo-selection h-full flex flex-col">
                <h3 className="text-tokyo-fg-bright text-sm font-medium mb-3 flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-tokyo-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Recommended Setup: Two Screens
                </h3>
                <div className="bg-tokyo-bg rounded-md p-3 mb-3 flex-1 flex items-center">
                  <img
                    src={twoScreenSetupImage}
                    alt="Two-screen setup illustration showing code review interface on one screen and code editor on another"
                    className="w-full h-auto rounded-md border border-tokyo-selection"
                  />
                </div>
                <p className="text-tokyo-comment text-xs mb-4">
                  For the best experience, we recommend using a two-screen setup
                  so you can share your code on one screen while viewing the AI
                  suggestions on the other.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-tokyo-bg-darker rounded-b-lg px-6 py-4 flex justify-end space-x-3 border-t border-tokyo-selection">
          <button
            onClick={onClose}
            className="px-4 py-2 border font-medium transition-all duration-200 rounded-md"
            style={{
              backgroundColor: "#334155",
              color: "#e2e8f0",
              borderColor: "#475569",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#475569";
              e.currentTarget.style.color = "#f1f5f9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#334155";
              e.currentTarget.style.color = "#e2e8f0";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStartReview}
            className="px-6 py-2 rounded-md transition-all duration-200 flex items-center text-white hover:shadow-lg transform hover:scale-102"
            style={{
              background: "linear-gradient(to right, #f97316, #ea580c)",
            }}
            disabled={type === "Github Repo" && !repoValid}
          >
            <svg
              className="h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Share screen & start review
          </button>
        </div>
      </div>
    </div>
  );
};
