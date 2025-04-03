/**
 * This file has been repurposed from an exam simulator to a code review simulator.
 * The file structure is maintained to allow for easier merging with the original repository.
 */

import React, { createContext, useState, useContext, useEffect } from "react";
import initialReviewScenarios from "../data/initial-review-scenarios.json";

export interface CodeReviewScenario {
  id: string;
  title: string;
  codeSnippet: string;
  language: string;
  reviewCriteria: string[];
  timeLimit: number;
  issues: string[];
  learningObjectives: string;
  difficulty: string;
  category: string;
  developerExperience: "junior" | "mid" | "senior";
}

interface CodeReviewContextValue {
  reviewScenarios: CodeReviewScenario[];
  setReviewScenarios: React.Dispatch<
    React.SetStateAction<CodeReviewScenario[]>
  >;
}

const CodeReviewContext = createContext<CodeReviewContextValue | undefined>(
  undefined
);

const LOCAL_STORAGE_KEY = "codeReviewScenarios";

export function CodeReviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize with empty array
  const [reviewScenarios, setReviewScenarios] = useState<CodeReviewScenario[]>(
    []
  );

  // Clear localStorage on mount
  useEffect(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  // Update localStorage whenever reviewScenarios change.
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reviewScenarios));
  }, [reviewScenarios]);

  return (
    <CodeReviewContext.Provider value={{ reviewScenarios, setReviewScenarios }}>
      {children}
    </CodeReviewContext.Provider>
  );
}

export function useCodeReview() {
  const context = useContext(CodeReviewContext);
  if (context === undefined) {
    throw new Error("useCodeReview must be used within a CodeReviewProvider");
  }
  return context;
}
