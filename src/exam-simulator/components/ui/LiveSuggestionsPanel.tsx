import React, { useEffect, useRef } from "react";
import { Suggestion } from "../../hooks/useLiveSuggestionExtractor";

interface LiveSuggestionsPanelProps {
  suggestions: Suggestion[];
  isProcessing: boolean;
  isVisible: boolean; // This prop might still be useful if panel is used outside popup
}

// CSS for the animation
const animationStyles = `
@keyframes slideInFadeIn {
  0% {
    opacity: 0;
    transform: translateY(-30px); /* Increased initial offset for more slide */
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.suggestion-item-enter {
  animation: slideInFadeIn 0.6s ease-out forwards; /* Slightly longer, smoother ease */
}
`;

// Helper function to convert CSSProperties object to a style string
const toStyleString = (styles: React.CSSProperties | undefined): string => {
  if (!styles) return "";
  return Object.entries(styles)
    .map(([key, value]) => {
      const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${kebabKey}: ${value};`;
    })
    .join(" ");
};

// --- Icon Components Refactor ---

interface FileIconProps {
  iconStyle?: React.CSSProperties;
  className?: string;
}

const FileIconGeneric: React.FC<FileIconProps> = ({ iconStyle, className }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (svgRef.current && iconStyle) {
      svgRef.current.setAttribute("style", toStyleString(iconStyle));
    }
  }, [iconStyle]);
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className} // For margins etc.
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-2 11h-2v2H8v-2H6v-2h2V9h2v2h2v2zm4-10V4.5L17.5 6H16z" />
    </svg>
  );
};

// Other specific FileIcon components (JS, TS, etc.) can be removed if only generic is used,
// or kept for future use if desired. For now, they are unused if SuggestionFileIcon always defaults.

// Simplified SuggestionFileIcon to always use FileIconGeneric
const SuggestionFileIcon: React.FC<{
  passedClassName?: string;
}> = ({ passedClassName }) => {
  const size = "0.875rem"; // w-3.5 h-3.5 -> 0.875rem (14px)
  const fillColor = "var(--tokyo-fg)"; // Default fill color for generic icon

  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    fill: fillColor,
    marginRight: "0.5rem", // Equivalent to mr-2 or 8px
  };

  // Always render FileIconGeneric, passing any non-margin classes
  return (
    <FileIconGeneric
      iconStyle={iconStyle}
      className={passedClassName?.replace(/mr-[0-9]+/g, "")}
    />
  );
};

// Helper component for individual suggestion items
const SuggestionItem: React.FC<{
  suggestion: Suggestion;
  isLatest: boolean;
  itemStyles: React.CSSProperties;
}> = ({ suggestion, isLatest, itemStyles }) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemRef.current) {
      const structuralStyles = `margin-bottom: 20px !important; padding: 1rem !important; border: 1px solid var(--tokyo-border) !important; border-radius: 0.375rem !important; transition: background-color 0.3s ease-in-out !important; opacity: 1 !important;`;
      const themeStyleString = toStyleString(itemStyles);
      const combinedStyle = `${structuralStyles} ${themeStyleString}`;
      itemRef.current.setAttribute("style", combinedStyle);
    }
  }, [suggestion.id, itemStyles]);

  return (
    <div
      ref={itemRef}
      className={`group relative ${isLatest ? "suggestion-item-enter" : ""}`}
    >
      <div className="text-xs mb-1.5 flex justify-between items-center">
        <div
          className="flex items-center gap-2"
          style={{
            color: isLatest
              ? "rgba(var(--tokyo-bg-darker-rgb), 0.85)"
              : "var(--tokyo-comment)",
          }}
        >
          <SuggestionFileIcon passedClassName="" />
          <span className="opacity-80">
            {suggestion.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
        {isLatest && (
          <span
            className="text-xs font-bold text-white px-2 py-1 rounded-full uppercase tracking-wider"
            style={{ backgroundColor: "#F97316" }}
          >
            Latest
          </span>
        )}
      </div>
      <div
        className="text-sm leading-relaxed mt-2.5"
        style={{ color: itemStyles.color || "var(--tokyo-fg)" }}
      >
        {suggestion.text}
      </div>
    </div>
  );
};

export const LiveSuggestionsPanel: React.FC<LiveSuggestionsPanelProps> = ({
  suggestions,
  isProcessing,
  isVisible,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null); // Added ref for the header
  const previousSuggestionsLength = useRef(suggestions.length);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.textContent = animationStyles;
    const targetDocument =
      scrollContainerRef.current?.ownerDocument || document;
    targetDocument.head.appendChild(styleElement);
    return () => {
      if (styleElement.parentNode) {
        targetDocument.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    if (
      scrollContainerRef.current &&
      suggestions.length > previousSuggestionsLength.current
    ) {
      scrollContainerRef.current.scrollTop = 0;
    }
    previousSuggestionsLength.current = suggestions.length;
  }, [suggestions.length]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const crucialStyles = `padding-top: 1.5rem !important; overflow-y: auto !important; flex-grow: 1 !important;`;
      scrollContainerRef.current.setAttribute("style", crucialStyles);
    }
    // Force header padding
    if (headerRef.current) {
      const headerStyle = `padding-left: 1.5rem !important; padding-right: 1.5rem !important; padding-top: 1rem !important; padding-bottom: 1rem !important; border-bottom-width: 1px !important; display: flex !important; align-items: center !important; justify-content: space-between !important; flex-shrink: 0 !important;`;
      // Note: border-color is already applied by inline style, so we don't strictly need to set it here via setAttribute unless that also fails.
      headerRef.current.setAttribute(
        "style",
        headerStyle +
          (headerRef.current.getAttribute("style") || "")
            .replace(/padding-[a-z]+:\s*[^;]+;?/gi, "")
            .replace(/border-bottom-width:\s*[^;]+;?/gi, "")
            .replace(/display:\s*[^;]+;?/gi, "")
            .replace(/align-items:\s*[^;]+;?/gi, "")
            .replace(/justify-content:\s*[^;]+;?/gi, "")
            .replace(/flex-shrink:\s*[^;]+;?/gi, "")
      );
    }
  }, []);

  if (!isVisible) return null;

  const reversedSuggestions = [...suggestions].reverse();

  return (
    <div
      ref={panelRef}
      className="flex flex-col h-full w-full rounded-lg shadow-xl border backdrop-blur-sm overflow-hidden group/panel"
      style={{
        backgroundColor: "var(--tokyo-bg-secondary)",
        borderColor: "var(--tokyo-border)",
        color: "var(--tokyo-fg)",
      }}
    >
      <div
        ref={headerRef} // Added ref
        className="px-6 py-4 border-b flex items-center justify-between flex-shrink-0" // Tailwind classes px-6 (1.5rem) py-4 (1rem)
        style={{ borderColor: "var(--tokyo-border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">Live Suggestions</span>
          {isProcessing && (
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--tokyo-accent)" }}
            />
          )}
        </div>
        <span
          className="text-sm font-semibold px-3 py-1.5 rounded-md"
          style={{
            backgroundColor: "var(--tokyo-comment)",
            color: "var(--tokyo-fg-bright)",
          }}
        >
          {suggestions.length}
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-grow px-4 pb-4 overflow-y-auto scroll-smooth"
      >
        {reversedSuggestions.length === 0 ? (
          <div
            className="text-sm text-center py-6 h-full flex items-center justify-center opacity-75"
            style={{ color: "var(--tokyo-comment)" }}
          >
            {isProcessing ? "Processing suggestions..." : "No suggestions yet."}
          </div>
        ) : (
          reversedSuggestions.map((suggestion, index) => {
            const isLatest = index === 0;

            let itemSpecificStyles: React.CSSProperties = {
              color: "var(--tokyo-fg)",
            };

            if (isLatest) {
              itemSpecificStyles = {
                ...itemSpecificStyles,
                background: `linear-gradient(to bottom, var(--tokyo-accent) 0%, var(--tokyo-accent) 70%, var(--tokyo-accent-hover) 100%)`,
                color: "var(--tokyo-bg-darker)",
                boxShadow:
                  "0 6px 18px -4px rgba(var(--tokyo-accent-rgb), 0.55)",
              };
            } else {
              itemSpecificStyles = {
                ...itemSpecificStyles,
                backgroundColor: "var(--tokyo-bg)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              };
            }

            return (
              <SuggestionItem
                key={suggestion.id}
                suggestion={suggestion}
                isLatest={isLatest}
                itemStyles={itemSpecificStyles}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
