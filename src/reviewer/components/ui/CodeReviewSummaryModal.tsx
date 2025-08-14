import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface CodeReviewSummaryModalProps {
  isOpen: boolean;
  summary: string;
  onClose: () => void;
}

export const CodeReviewSummaryModal: React.FC<CodeReviewSummaryModalProps> = ({
  isOpen,
  summary,
  onClose,
}) => {
  const navigate = useNavigate();
  const [copyButtonText, setCopyButtonText] = useState("Copy");

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      // Show brief visual feedback using state instead of DOM manipulation
      setCopyButtonText("Copied!");
      setTimeout(() => {
        setCopyButtonText("Copy");
      }, 1500);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleOk = () => {
    onClose();
    navigate("/");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-tokyo-bg-lighter rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] border border-tokyo-selection min-w-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-tokyo-bg-darker rounded-t-lg px-6 py-4 border-b border-tokyo-selection flex-shrink-0">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Code Review Summary
          </h2>
          <p className="text-tokyo-comment mt-1">
            Here's a summary of the suggested changes from your code review
            session.
          </p>
        </div>

        {/* Content - flexible height with scroll */}
        <div className="p-4 overflow-y-auto min-w-0 flex-1">
          <div className="bg-tokyo-bg rounded-lg p-3 border border-tokyo-selection overflow-hidden min-w-0 w-full">
            {summary === "Generating review summary..." ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-tokyo-accent"></div>
                  <span className="text-tokyo-fg">
                    Generating review summary...
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="text-tokyo-fg text-sm leading-relaxed font-mono break-all overflow-wrap-break-word max-w-full min-w-0 w-full whitespace-pre-line"
                style={{ wordBreak: "break-all", overflowWrap: "break-word" }}
              >
                {summary ||
                  "No specific suggestions were recorded during this session."}
              </div>
            )}
          </div>
        </div>

        {/* Footer - always visible */}
        <div className="bg-tokyo-bg-darker rounded-b-lg px-6 py-4 flex justify-end space-x-3 border-t border-tokyo-selection flex-shrink-0">
          <button
            onClick={handleCopyToClipboard}
            className="px-4 py-2 rounded-md transition-all duration-200 flex items-center border"
            style={{
              backgroundColor: "var(--Neutral-20)",
              borderColor: "var(--tokyo-selection)",
              color: "var(--tokyo-fg-bright)",
            }}
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {copyButtonText}
          </button>
          <button
            onClick={handleOk}
            className="px-6 py-2 rounded-md transition-all duration-200 flex items-center text-white"
            style={{
              backgroundColor: "var(--tokyo-accent)",
            }}
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
