import React, { useEffect, useRef } from "react";
import { Suggestion } from "../../hooks/useLiveSuggestionExtractor";

interface LiveSuggestionsPanelProps {
  suggestions: Suggestion[];
  isProcessing: boolean;
  isVisible: boolean;
}

export const LiveSuggestionsPanel: React.FC<LiveSuggestionsPanelProps> = ({
  suggestions,
  isProcessing,
  isVisible,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new suggestions are added
  useEffect(() => {
    if (scrollContainerRef.current && suggestions.length > 0) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [suggestions.length]);

  if (!isVisible) return null;

  // Get the latest suggestion for highlighting
  const latestSuggestion =
    suggestions.length > 0 ? suggestions[suggestions.length - 1] : null;

  return (
    <div className="fixed top-4 right-4 w-80 max-h-96 z-50">
      <div
        className="rounded-lg shadow-lg border backdrop-blur-sm"
        style={{
          backgroundColor: "var(--tokyo-bg-secondary)",
          borderColor: "var(--tokyo-border)",
          color: "var(--tokyo-fg)",
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: "var(--tokyo-border)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Live Suggestions</span>
            {isProcessing && (
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--tokyo-accent)" }}
              />
            )}
          </div>
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              backgroundColor: "var(--tokyo-comment)",
              color: "var(--tokyo-bg)",
            }}
          >
            {suggestions.length}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          {suggestions.length === 0 ? (
            <div
              className="text-sm text-center py-4"
              style={{ color: "var(--tokyo-comment)" }}
            >
              {isProcessing
                ? "Processing suggestions..."
                : "No suggestions yet"}
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="space-y-3 max-h-64 overflow-y-auto scroll-smooth"
            >
              {suggestions.map((suggestion, index) => {
                const isLatest =
                  latestSuggestion && suggestion.id === latestSuggestion.id;

                return (
                  <div
                    key={suggestion.id}
                    className={`p-3 rounded border-l-2 text-sm leading-relaxed transition-all duration-500`}
                    style={{
                      backgroundColor: isLatest
                        ? "var(--tokyo-accent)"
                        : "var(--tokyo-bg)",
                      borderLeftColor: "var(--tokyo-accent)",
                      color: isLatest ? "var(--tokyo-bg)" : "var(--tokyo-fg)",
                      opacity: isLatest ? 1 : 0.85,
                    }}
                  >
                    <div
                      className="text-xs mb-1"
                      style={{
                        color: isLatest
                          ? "var(--tokyo-bg)"
                          : "var(--tokyo-comment)",
                        opacity: isLatest ? 0.8 : 1,
                      }}
                    >
                      {suggestion.timestamp.toLocaleTimeString()}
                    </div>
                    <div className="flex items-start gap-2">
                      <span
                        className="text-xs mt-0.5 flex-shrink-0"
                        style={{
                          color: isLatest
                            ? "var(--tokyo-bg)"
                            : "var(--tokyo-accent)",
                        }}
                      >
                        •
                      </span>
                      <span className="flex-1">{suggestion.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
