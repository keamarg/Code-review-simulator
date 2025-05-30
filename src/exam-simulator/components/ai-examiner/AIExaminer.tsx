import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
// LoadingAnimation might still be needed if ExamWorkflow delegates loading UI for the task itself
// For now, assuming ExamWorkflow handles the "isLoadingPrompt" state and shows its own LoadingAnimation or this ghost loader.

interface AIExaminerDisplayProps {
  studentTask: string; // Markdown content for the student's task
  isLoading: boolean;  // True if the task content is currently loading
}

/**
 * AIExaminer (Display Component)
 *
 * This component is responsible for rendering the student's task (as Markdown)
 * or a ghost loader if the task content is loading.
 * All logic related to fetching data, managing exam state, and interacting
 * with the LiveAPIContext has been moved to ExamWorkflow.tsx.
 */
function AIExaminerDisplayComponent({
  studentTask,
  isLoading,
}: AIExaminerDisplayProps) {
  if (isLoading) {
    // Ghost loader (styles should ideally be centralized or passed via props if varying)
    return (
      <div
        className="student-task-ghost bg-neutral-15 p-6 rounded-md shadow-lg max-w-3xl mx-auto relative"
        style={{
          maxHeight: "400px",
          overflow: "hidden",
          borderColor: "var(--Neutral-30)",
        }}
      >
        <div className="ghost-line-dark ghost-line-title-dark mb-4"></div>
        <div className="ghost-line-dark w-3/4 mb-3"></div>
        <div className="ghost-line-dark w-5/6 mb-3"></div>
        <div className="ghost-line-dark w-4/5 mb-3"></div>
        <div className="ghost-line-dark w-2/3 mb-3"></div>
        <div className="ghost-line-dark w-5/6 mb-3"></div>
        <div className="ghost-line-dark w-5/6 mb-3"></div>
        <div className="ghost-line-dark w-4/5 mb-3"></div>
        <div className="ghost-line-dark w-4/5 mb-3"></div>
        <div className="ghost-line-dark w-3/4 mb-3"></div>
        <div className="ghost-line-dark w-2/3 mb-3"></div>
        <div className="ghost-line-dark w-5/6 mb-3"></div>
        {/* Styles are now expected to be handled by ExamWorkflow or globally */}
      </div>
    );
  }

  if (!studentTask) {
    // Optionally, display a message if no task is available and not loading
    return (
      <div className="text-center p-6 text-tokyo-fg">
        No task information available.
      </div>
    );
  }

  return (
    <div
      className="student-task bg-neutral-15 p-6 rounded-md shadow-lg max-w-3xl mx-auto relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 text-dark"
      style={{
        transformOrigin: "top center",
        maxHeight: "400px", // Consider making this configurable via props if needed
        overflow: "auto",
        borderColor: "var(--Neutral-30)", // Ensure CSS variables are available
      }}
    >
      <ReactMarkdown>{studentTask}</ReactMarkdown>
    </div>
  );
}

// Renaming the exported component to reflect its new role if desired,
// or keep as AIExaminer if ExamWorkflow will conditionally render it.
// For clarity, let's rename the memoized component.
export const AIExaminerDisplay = memo(AIExaminerDisplayComponent);
