import React, { useState, useEffect, useRef } from "react";
import { warmLayoutAssets } from "../../utils/preloadAssets";
import twoScreenSetupImage from "../../../two-screen-setup.jpg";
import { VAD_ENVIRONMENTS, getCurrentVADEnvironment } from "../../../config/aiConfig";
import { mediaStreamService } from "../../lib/mediaStreamService";

interface ReviewSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartReview: (
    type: string,
    developerLevel: string,
    repoUrl?: string,
    fullScan?: boolean,
  ) => void;
  fixedType?: string;
  fixedDeveloperLevel?: string;
  reviewDescription?: string;
  reviewTitle?: string;
  // For quick start: allow pre-filling values without making them fixed (editable)
  initialType?: string;
  initialDeveloperLevel?: string;
  initialRepoUrl?: string;
  initialFullScan?: boolean;
}

export const ReviewSetupModal: React.FC<ReviewSetupModalProps> = ({
  isOpen,
  onClose,
  onStartReview,
  fixedType,
  fixedDeveloperLevel,
  reviewDescription,
  reviewTitle,
  initialType,
  initialDeveloperLevel,
  initialRepoUrl,
  initialFullScan,
}) => {
  // Custom mode: values are fixed and cannot be changed
  // Quick start: values can be pre-filled but are editable
  const isCustomMode = !!fixedType && !initialType;

  const [type, setType] = useState(initialType || fixedType || "Standard");
  const [developerLevel, setDeveloperLevel] = useState(
    initialDeveloperLevel || fixedDeveloperLevel || "intermediate",
  );
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl || "");
  const [repoUrlError, setRepoUrlError] = useState("");
  const [fullScan, setFullScan] = useState(initialFullScan || false);
  const [isFocused, setIsFocused] = useState(false);
  const [environment, setEnvironment] = useState<keyof typeof VAD_ENVIRONMENTS>(
    getCurrentVADEnvironment(),
  );

  // Screen sharing state
  const [screenSharingGranted, setScreenSharingGranted] = useState(false);
  const [isRequestingScreenShare, setIsRequestingScreenShare] = useState(false);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect Safari
  const isSafari =
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
    !navigator.userAgent.toLowerCase().includes("chrome");

  const getRepoUrlError = (url: string): string => {
    if (!url.trim()) {
      return ""; // Don't show error for empty field
    }

    try {
      const cleanUrl = url.trim().replace(/\/$/, "");
      const patterns = [
        /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/,
        /^https?:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)(?:\/.*)?$/,
        /^git@github\.com:([^/]+)\/([^/]+)(?:\.git)?$/,
        /^([^/\s]+)\/([^/\s]+)$/,
      ];

      const hasValidFormat = patterns.some((pattern) => cleanUrl.match(pattern));
      if (!hasValidFormat) {
        return "Invalid GitHub repository URL format";
      }
      return ""; // No error
    } catch (error) {
      return "Invalid GitHub repository URL format";
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

    // Store video stream in service so CodeReviewPage can pick it up
    if (videoStreamRef.current) {
      mediaStreamService.setStream(videoStreamRef.current);
    }

    // Persist chosen environment before starting so connect reads it
    localStorage.setItem("ai_vad_environment", environment);

    // Navigate to /live - don't close modal here, let navigation handle it
    // Closing modal might interfere with navigation
    onStartReview(type, developerLevel, type === "Github Repo" ? repoUrl : "", fullScan);
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

  const handleShareScreen = async () => {
    if (isSafari) {
      setScreenShareError(
        "Safari is not currently supported. Please use Chrome, Firefox, or Edge.",
      );
      return;
    }

    setIsRequestingScreenShare(true);
    setScreenShareError(null);

    try {
      const videoStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      videoStreamRef.current = videoStream;

      setScreenSharingGranted(true);
      setIsRequestingScreenShare(false);
    } catch (error) {
      setIsRequestingScreenShare(false);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setScreenShareError("Screen sharing was cancelled or denied. Please try again.");
      } else {
        setScreenShareError(
          `Failed to start screen sharing: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Warm fonts and icon glyphs as soon as modal opens to avoid layout shift when session UI renders
      warmLayoutAssets();
    }
  }, [isOpen]);

  // Reset screen sharing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setScreenSharingGranted(false);
      setScreenShareError(null);
      setIsRequestingScreenShare(false);
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((track) => track.stop());
        videoStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [isOpen]);

  // Set video element source when screen sharing is granted
  useEffect(() => {
    if (screenSharingGranted && videoStreamRef.current && videoRef.current) {
      const videoOnlyStream = new MediaStream(videoStreamRef.current.getVideoTracks());
      videoRef.current.srcObject = videoOnlyStream;
    }
  }, [screenSharingGranted]);

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
            <div className="flex-1 flex flex-col pr-2" style={{ maxHeight: "70vh" }}>
              {isCustomMode && (
                <div className="mb-4 text-sm space-y-1">
                  <p>
                    <span className="font-medium">Title:</span> {reviewTitle}
                  </p>
                  <p>
                    <span className="font-medium">Type:</span> {fixedType}
                  </p>
                  <p>
                    <span className="font-medium">Level:</span> {fixedDeveloperLevel}
                  </p>
                </div>
              )}

              {/* Removed duplicate environment selector; single instance remains below developer level */}

              {isCustomMode && reviewDescription && (
                <div className="mb-6 flex-grow flex flex-col overflow-hidden">
                  <label className="block text-tokyo-fg-bright text-sm font-medium mb-2">
                    Description
                  </label>
                  <div className="relative flex-grow overflow-y-auto pr-2">
                    <p className="text-tokyo-fg whitespace-pre-wrap">{reviewDescription}</p>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-tokyo-bg-lighter to-transparent pointer-events-none"></div>
                  </div>
                </div>
              )}

              {/* Developer Experience Level */}
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
                    This will determine the depth and style of feedback during the review.
                  </p>
                </div>
              )}

              {/* Microphone Sensitivity (Environment) */}
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
                        d="M9 19V6a2 2 0 012-2h2a2 2 0 012 2v13m-6 0h6"
                      />
                    </svg>
                    Microphone sensitivity (environment)
                  </div>
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value as keyof typeof VAD_ENVIRONMENTS)}
                  className="w-full px-4 py-2 border border-tokyo-selection bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent transition-colors"
                >
                  {Object.entries(VAD_ENVIRONMENTS).map(([key, env]) => (
                    <option key={key} value={key}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>

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

              {/* Removed duplicate environment block; consolidated above */}

              {/* GitHub Repository URL Input - CONDITIONALLY RENDERED */}
              {type === "Github Repo" && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-tokyo-fg-bright text-sm font-medium mb-2 flex items-center gap-2">
                      <span className="flex items-center">
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
                      </span>
                      <span className="relative group">
                        <svg
                          className="h-4 w-4 text-tokyo-accent cursor-pointer ml-1"
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
                        <span
                          className="absolute left-0 mt-2 w-full bg-tokyo-bg-lightest bg-opacity-95 text-xs text-tokyo-fg-bright px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 border border-tokyo-selection whitespace-pre-line backdrop-blur-sm"
                          style={{ minWidth: "400px", maxWidth: "100%" }}
                        >
                          <div className="font-medium mb-2">Supported formats:</div>
                          <ul className="list-disc pl-5">
                            <li>https://github.com/owner/repo</li>
                            <li>owner/repo</li>
                            <li>git@github.com:owner/repo.git</li>
                            <li>https://api.github.com/repos/owner/repo</li>
                          </ul>
                        </span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={handleRepoUrlChange}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="https://github.com/user/repository or user/repository"
                      className={`w-full px-4 py-2 border bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent transition-colors ${
                        repoUrlError && !isFocused && repoUrl.trim()
                          ? "border-red-500 text-red-400"
                          : "border-tokyo-selection"
                      }`}
                    />
                    {repoUrlError && !isFocused && repoUrl.trim() && (
                      <div className="mt-2 text-sm text-red-400 whitespace-pre-line">
                        {repoUrlError}
                      </div>
                    )}
                  </div>

                  {/* Include subdirectories toggle */}
                  <div className="flex items-center mt-2">
                    <label className="flex items-center text-tokyo-fg-bright text-sm font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fullScan}
                        onChange={(e) => setFullScan(e.target.checked)}
                        className="mr-2 accent-tokyo-accent"
                      />
                      Include subdirectories
                    </label>
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
                  For the best experience, we recommend using a two-screen setup so you can share
                  your code on one screen while viewing the AI suggestions on the other.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Screen Sharing Section */}
        {!screenSharingGranted && (
          <div className="px-6 py-4 border-t border-tokyo-selection bg-tokyo-bg-darker">
            {isSafari && (
              <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-center">
                <p className="font-semibold mb-2">Safari is not currently supported</p>
                <p className="text-sm">
                  Please use Chrome, Firefox, or Edge to start a code review session.
                </p>
              </div>
            )}
            {screenShareError && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded text-red-800 text-center">
                <p className="text-sm">{screenShareError}</p>
              </div>
            )}
            <div className="flex justify-end space-x-3">
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
                onClick={handleShareScreen}
                disabled={
                  isRequestingScreenShare || isSafari || (type === "Github Repo" && !repoValid)
                }
                className="px-6 py-2 rounded-md transition-all duration-200 flex items-center text-white hover:shadow-lg transform hover:scale-102 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                {isRequestingScreenShare ? "Requesting screen sharing..." : "Share screen"}
              </button>
            </div>
          </div>
        )}

        {/* Start Review Button (appears after screen sharing) */}
        {screenSharingGranted && (
          <div className="px-6 py-4 border-t border-tokyo-selection bg-tokyo-bg-darker">
            {videoRef.current && (
              <div className="mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full rounded-lg border border-tokyo-selection"
                  style={{ maxHeight: "200px" }}
                />
              </div>
            )}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-800 text-center">
              <p className="text-sm font-semibold">Screen sharing active!</p>
              <p className="text-xs mt-1">
                Click "Start Review" below to begin your code review session.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  if (videoStreamRef.current) {
                    videoStreamRef.current.getTracks().forEach((track) => track.stop());
                    videoStreamRef.current = null;
                  }
                  setScreenSharingGranted(false);
                  setScreenShareError(null);
                }}
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
                Change Screen
              </button>
              <button
                onClick={() => {
                  // Stop screen sharing and go back to first screen (setup form)
                  if (videoStreamRef.current) {
                    videoStreamRef.current.getTracks().forEach((track) => track.stop());
                    videoStreamRef.current = null;
                  }
                  // Reset screen sharing state to go back to first screen
                  setScreenSharingGranted(false);
                  setScreenShareError(null);
                  // Don't call onClose - just reset to first screen
                }}
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
                Start Review
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
