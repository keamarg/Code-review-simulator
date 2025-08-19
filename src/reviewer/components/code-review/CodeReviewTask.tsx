// Re-create the minimal CodeReviewTaskDisplay here to remove AIExaminer naming completely
import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import { LoadingAnimation } from "../ui/LoadingAnimation";

interface CodeReviewTaskProps {
  studentTask: string;
  isLoading: boolean;
}

function CodeReviewTaskDisplayComponent({ studentTask, isLoading }: CodeReviewTaskProps) {
  if (isLoading) {
    return (
      <div
        className="student-task-loading bg-neutral-15 p-6 rounded-md shadow-lg max-w-3xl mx-auto relative flex flex-col items-center justify-center"
        style={{ maxHeight: "400px", minHeight: "200px", borderColor: "var(--Neutral-30)" }}
      >
        <LoadingAnimation isLoading={true} />
        <p className="text-center text-tokyo-fg-dim mt-4">Generating code review task...</p>
      </div>
    );
  }
  if (!studentTask) {
    return <div className="text-center p-6 text-tokyo-fg">No task information available.</div>;
  }
  return (
    <div
      className="student-task bg-neutral-15 p-6 rounded-md shadow-lg max-w-3xl mx-auto relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 text-dark"
      style={{
        transformOrigin: "top center",
        maxHeight: "400px",
        overflow: "auto",
        borderColor: "var(--Neutral-30)",
      }}
    >
      <ReactMarkdown>{studentTask}</ReactMarkdown>
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-neutral-15 to-transparent pointer-events-none rounded-b-md"></div>
    </div>
  );
}

export const CodeReviewTaskDisplay = memo(CodeReviewTaskDisplayComponent);
