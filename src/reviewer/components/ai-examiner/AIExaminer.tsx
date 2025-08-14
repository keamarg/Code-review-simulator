import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import { LoadingAnimation } from "../ui/LoadingAnimation";
// LoadingAnimation might still be needed if ExamWorkflow delegates loading UI for the task itself
// For now, assuming ExamWorkflow handles the "isLoadingPrompt" state and shows its own LoadingAnimation or this ghost loader.

interface AIExaminerDisplayProps {
  studentTask: string; // Markdown content for the student's task
  isLoading: boolean; // True if the task content is currently loading
}

/**
 * AIExaminer (Display Component)
 *
 * This component is responsible for rendering the student's task (as Markdown)
 * or a loading animation if the task content is loading.
 * All logic related to fetching data, managing exam state, and interacting
 * with the LiveAPIContext has been moved to ExamWorkflow.tsx.
 */
function AIExaminerDisplayComponent({
  studentTask,
  isLoading,
}: AIExaminerDisplayProps) {
  if (isLoading) {
    // Show animated loading with task generation message
    return (
      <div
        className="student-task-loading bg-neutral-15 p-6 rounded-md shadow-lg max-w-3xl mx-auto relative flex flex-col items-center justify-center"
        style={{
          maxHeight: "400px",
          minHeight: "200px",
          borderColor: "var(--Neutral-30)",
        }}
      >
        <LoadingAnimation isLoading={true} />
        <p className="text-center text-tokyo-fg-dim mt-4">
          Generating code review task...
        </p>
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
      {/* Gradient overlay to indicate more content below */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-neutral-15 to-transparent pointer-events-none rounded-b-md"></div>
    </div>
  );
}

// Renaming the exported component to reflect its new role if desired,
// or keep as AIExaminer if ExamWorkflow will conditionally render it.
// For clarity, let's rename the memoized component.
export const AIExaminerDisplay = memo(AIExaminerDisplayComponent);
