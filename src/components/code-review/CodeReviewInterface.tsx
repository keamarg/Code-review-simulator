/**
 * This file has been repurposed from an exam simulator to a code review simulator.
 * The file structure is maintained to allow for easier merging with the original repository.
 */

import React, { useState } from "react";
import { CodeReviewScenario } from "../../contexts/ExamSimulatorContext";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";

interface CodeReviewInterfaceProps {
  reviewScenario: CodeReviewScenario;
  onReviewStart: () => void;
}

export function CodeReviewInterface({
  reviewScenario,
  onReviewStart,
}: CodeReviewInterfaceProps) {
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [comments, setComments] = useState<
    Array<{ line: number; text: string }>
  >([]);
  const [isReviewing, setIsReviewing] = useState(false);

  const handleStartReview = () => {
    setIsReviewing(true);
    onReviewStart();
  };

  const handleLineClick = (lineNumber: number) => {
    setCurrentLine(lineNumber);
  };

  const handleAddComment = (comment: string) => {
    if (currentLine && comment.trim()) {
      setComments([...comments, { line: currentLine, text: comment }]);
      setCurrentLine(null);
    }
  };

  return (
    <div className="code-review-container">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Code Display */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Code to Review</h3>
              <p className="text-sm text-gray-500">
                Language: {reviewScenario.language}
              </p>
            </div>
            <div className="relative">
              <SyntaxHighlighter
                language={reviewScenario.language.toLowerCase()}
                style={docco}
                showLineNumbers
                wrapLines
                lineProps={(lineNumber) => ({
                  style: {
                    display: "block",
                    cursor: "pointer",
                    backgroundColor:
                      currentLine === lineNumber ? "#f0f9ff" : "transparent",
                  },
                  onClick: () => handleLineClick(lineNumber),
                })}
              >
                {reviewScenario.codeSnippet}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>

        {/* Review Panel */}
        <div className="w-full md:w-80">
          <div className="bg-white rounded-lg shadow-md p-4">
            {!isReviewing ? (
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">
                  Ready to Start Review?
                </h3>
                <button
                  onClick={handleStartReview}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Review
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Review Comments</h3>
                {currentLine && (
                  <div className="mb-4">
                    <textarea
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      placeholder="Add your comment..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>
                )}
                <div className="space-y-4">
                  {comments.map((comment, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">
                        Line {comment.line}
                      </p>
                      <p className="mt-1">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
