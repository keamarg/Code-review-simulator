import React, { useState } from "react";
import { ExamSimulator } from "../../../types/ExamSimulator";
import { useEffect, useMemo } from "react";
import { getExaminerQuestions } from "../../utils/getExaminerQuestions";
import getRepoQuestions from "../../utils/getGithubRepoFiles.js";
import getPrompt from "../../utils/prompt";

interface ReviewSetupModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** "quick" for quick-start, "custom" for a stored custom review */
  mode: "quick" | "custom";
  /** The exam definition (required for custom mode) */
  exam?: ExamSimulator | null;
  /** Close handler */
  onClose: () => void;
  /** Invoked when the user clicks the Start Review button. For quick-start we return
   * (type, developerLevel, repoUrl); for custom we return (repoUrl).
   */
  onStartReview: (
    args:
      | {
          mode: "quick";
          type: string;
          developerLevel: string;
          repoUrl?: string;
          fullScan?: boolean;
        }
      | { mode: "custom"; repoUrl?: string; fullScan?: boolean }
  ) => void;
}

// Re-use the GitHub URL validation from QuickStartModal
const isValidGithubUrl = (url: string) => {
  if (!url.trim()) return false;
  const patterns = [
    /^https?:\/\/github\.com\/[^/]+\/[^/]+(?:\/.*)?$/,
    /^https?:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+(?:\/.*)?$/,
    /^git@github\.com:[^/]+\/[^/]+(?:\.git)?$/,
    /^[^/\s]+\/[^/\s]+$/,
  ];
  return patterns.some((p) => p.test(url.trim()));
};

export const ReviewSetupModal: React.FC<ReviewSetupModalProps> = ({
  isOpen,
  mode,
  exam,
  onClose,
  onStartReview,
}) => {
  const [type, setType] = useState<string>(
    mode === "quick" ? "Standard" : exam?.type || "Standard"
  );
  const [developerLevel, setDeveloperLevel] = useState<string>(
    mode === "quick" ? "intermediate" : exam?.learning_goals || "intermediate"
  );
  const [repoUrl, setRepoUrl] = useState<string>("");
  const [repoUrlError, setRepoUrlError] = useState<string>("");
  const [fullScan, setFullScan] = useState<boolean>(false);

  // Track prompt-preparation state
  const [isPreparing, setIsPreparing] = useState<boolean>(false);

  // GitHub URL validity
  const repoValid = useMemo(() => {
    if (mode !== "custom" || !exam) return false;
    if (exam.type !== "Github Repo") return true;
    return isValidGithubUrl(repoUrl);
  }, [mode, exam, repoUrl]);

  // Kick off prompt preparation as soon as conditions are satisfied
  useEffect(() => {
    if (mode !== "custom" || !exam) return;

    const shouldPrepare = exam.type === "Github Repo" ? repoValid : true;
    if (!shouldPrepare || isPreparing) return;

    let cancelled = false;
    setIsPreparing(true);

    (async () => {
      try {
        if (exam.type === "Github Repo") {
          await getRepoQuestions(repoUrl, exam.learning_goals, {
            fullScan,
            maxFiles: fullScan ? 20 : 5,
            maxDepth: 3,
          });
        } else {
          await getExaminerQuestions(exam);
        }
      } catch (e) {
        console.error("Prompt preparation error in modal:", e);
      } finally {
        if (!cancelled) setIsPreparing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, exam, repoValid, repoUrl, fullScan]);

  // Button state & label
  const buttonDisabled =
    exam?.type === "Github Repo" ? !repoValid || isPreparing : isPreparing;
  const buttonLabel = isPreparing
    ? "Preparing review…"
    : exam?.type === "Github Repo" && !repoValid
    ? "Enter valid repo URL"
    : "Share screen & start review";

  if (!isOpen) return null;

  const handleStartClick = () => {
    if (
      type === "Github Repo" ||
      (exam?.type === "Github Repo" && mode === "custom")
    ) {
      if (!isValidGithubUrl(repoUrl)) {
        setRepoUrlError("Please enter a valid GitHub repository URL");
        return;
      }
    }

    if (mode === "quick") {
      onStartReview({ mode: "quick", type, developerLevel, repoUrl, fullScan });
    } else {
      onStartReview({ mode: "custom", repoUrl, fullScan });
    }
  };

  /* Gradient mask for overflow indication */
  const gradientStyle: React.CSSProperties = {
    maskImage: "linear-gradient(180deg, #000 80%, transparent)",
    WebkitMaskImage: "linear-gradient(180deg, #000 80%, transparent)",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-tokyo-bg-lighter rounded-lg shadow-xl max-w-4xl w-full border border-tokyo-selection">
        {/* Header */}
        <div className="bg-tokyo-bg-darker rounded-t-lg px-6 py-4 border-b border-tokyo-selection">
          <h2 className="text-xl font-bold text-tokyo-fg-bright">
            {mode === "quick"
              ? "Quick Start Code Review"
              : "Custom Code Review"}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === "quick" && (
            <div className="flex flex-col space-y-6">
              {/* Developer Level */}
              <div>
                <label className="block text-tokyo-fg-bright text-sm font-medium mb-2">
                  Developer Experience Level
                </label>
                <select
                  className="w-full px-4 py-2 border border-tokyo-selection bg-tokyo-bg text-tokyo-fg-bright rounded-md"
                  value={developerLevel}
                  onChange={(e) => setDeveloperLevel(e.target.value)}
                >
                  <option value="junior">Junior Developer</option>
                  <option value="intermediate">Intermediate Developer</option>
                  <option value="senior">Senior Developer</option>
                </select>
              </div>

              {/* Review Type */}
              <div>
                <label className="block text-tokyo-fg-bright text-sm font-medium mb-2">
                  Code Review Type
                </label>
                <select
                  className="w-full px-4 py-2 border border-tokyo-selection bg-tokyo-bg text-tokyo-fg-bright rounded-md"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="Standard">Standard</option>
                  <option value="Github Repo">Github Repo</option>
                </select>
              </div>
            </div>
          )}

          {mode === "custom" && exam && (
            <div
              className="overflow-y-auto max-h-60 pr-2"
              style={gradientStyle}
            >
              <dl className="space-y-4">
                <div>
                  <dt className="font-medium text-tokyo-fg-bright">Title</dt>
                  <dd className="text-tokyo-fg whitespace-pre-wrap">
                    {exam.title}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-tokyo-fg-bright">
                    Description
                  </dt>
                  <dd className="text-tokyo-fg whitespace-pre-wrap">
                    {exam.description}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-tokyo-fg-bright">Type</dt>
                  <dd className="text-tokyo-fg">{exam.type}</dd>
                </div>
                {exam.duration > 0 && (
                  <div>
                    <dt className="font-medium text-tokyo-fg-bright">
                      Duration (minutes)
                    </dt>
                    <dd className="text-tokyo-fg">{exam.duration}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium text-tokyo-fg-bright">
                    Developer Level
                  </dt>
                  <dd className="text-tokyo-fg">{developerLevel}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* GitHub Repo URL – visible in both modes when type is Github Repo */}
          {(type === "Github Repo" || exam?.type === "Github Repo") && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-tokyo-fg-bright text-sm font-medium mb-2">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2 border bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none ${
                    repoUrlError ? "border-red-500" : "border-tokyo-selection"
                  }`}
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    if (repoUrlError) setRepoUrlError("");
                  }}
                  placeholder="https://github.com/owner/repo or owner/repo"
                />
                {repoUrlError && (
                  <p className="text-sm text-red-400 mt-2">{repoUrlError}</p>
                )}
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
                        Full scan may use 10-30 API calls vs 2-7 for root-only
                      </span>
                    </div>
                    <div className="mt-2 text-tokyo-fg text-xs">
                      <strong>Limits:</strong> Max 20 files, up to 3 directories
                      deep
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-tokyo-bg border border-tokyo-selection text-tokyo-fg rounded-md hover:bg-tokyo-bg-lightest"
            >
              Cancel
            </button>
            <button
              onClick={handleStartClick}
              disabled={buttonDisabled}
              className={`px-6 py-2 rounded-md transition-colors flex items-center space-x-2 ${
                buttonDisabled
                  ? "bg-tokyo-bg-lightest text-tokyo-comment cursor-not-allowed"
                  : "bg-tokyo-accent hover:bg-tokyo-accent-darker text-white"
              }`}
            >
              {isPreparing ? (
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              <span>{buttonLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
