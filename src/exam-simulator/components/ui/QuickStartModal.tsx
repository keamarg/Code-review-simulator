import React, { useState } from "react";
import twoScreenSetupImage from "../../../two-screen-setup.jpg";

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartReview: (
    type: string,
    developerLevel: string,
    repoUrl?: string
  ) => void;
}

export const QuickStartModal: React.FC<QuickStartModalProps> = ({
  isOpen,
  onClose,
  onStartReview,
}) => {
  const [type, setType] = useState("Standard");
  const [developerLevel, setDeveloperLevel] = useState("intermediate");
  const [repoUrl, setRepoUrl] = useState("");

  const handleStartReview = () => {
    // Validate GitHub repo URL if needed
    if (type === "Github Repo" && !repoUrl.trim()) {
      alert("Please enter a GitHub repository URL before starting.");
      return;
    }

    onStartReview(type, developerLevel, type === "Github Repo" ? repoUrl : "");
  };

  const handleTypeChange = (newType: string) => {
    setType(newType);
    // Reset repo URL when switching away from GitHub type
    if (newType !== "Github Repo") {
      setRepoUrl("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-tokyo-bg-lighter rounded-lg shadow-xl max-w-4xl w-full border border-tokyo-selection">
        {/* Header */}
        <div className="bg-tokyo-bg-darker rounded-t-lg px-6 py-4 border-b border-tokyo-selection">
          <h2 className="text-xl font-bold text-tokyo-fg-bright flex items-center">
            <svg
              className="h-6 w-6 mr-3"
              style={{ color: "var(--tokyo-accent)" }}
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
            Quick Start Code Review
          </h2>
          <p className="text-tokyo-comment mt-1">
            Set up your code review preferences and start immediately
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex gap-6">
            {/* Left Side - Form Fields */}
            <div className="flex-1">
              {/* Developer Experience Dropdown - MOVED TO FIRST */}
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

              {/* Code Review Type Dropdown - MOVED TO SECOND */}
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
                >
                  <option value="Standard">Standard</option>
                  <option value="Github Repo">Github Repo</option>
                </select>
              </div>

              {/* GitHub Repository URL Input - CONDITIONALLY RENDERED */}
              {type === "Github Repo" && (
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
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      GitHub Repository URL
                    </div>
                  </label>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/user/repository"
                    className="w-full px-4 py-2 border border-tokyo-selection bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent transition-colors"
                  />
                  <p className="text-xs text-tokyo-comment mt-1">
                    Enter the full GitHub repository URL you want to review
                  </p>
                </div>
              )}
            </div>

            {/* Right Side - Two-Screen Setup Recommendation */}
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
                <p className="text-xs text-tokyo-comment leading-relaxed">
                  For the best experience, use{" "}
                  <span className="text-tokyo-fg-bright font-medium">
                    two screens
                  </span>
                  : keep the AI code reviewer on one screen while your code
                  editor is on the other. This allows for seamless interaction
                  during the review session.
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
