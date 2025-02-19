import React, { createContext, useState, useContext, useEffect } from "react";
import initialExams from "../exam-simulator/initial-exams.json";

export type ExamSimulator = {
  id: string;
  title: string;
  format: string;
  gradeCriteria: string;
  feedback: string;
  duration: number;
  learningGoals: string;
  task: string; // New task field where teacher writes the exam task
};

interface ExamSimulatorContextValue {
  examSimulators: ExamSimulator[];
  setExamSimulators: React.Dispatch<React.SetStateAction<ExamSimulator[]>>;
}

const ExamSimulatorContext = createContext<ExamSimulatorContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = "examSimulators";

export function ExamSimulatorProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage; if no data, use initialExams loaded from JSON.
  const [examSimulators, setExamSimulators] = useState<ExamSimulator[]>(() => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return localData ? JSON.parse(localData) : initialExams;
  });

  // Update localStorage whenever examSimulators change.
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(examSimulators));
  }, [examSimulators]);

  return (
    <ExamSimulatorContext.Provider value={{ examSimulators, setExamSimulators }}>
      {children}
    </ExamSimulatorContext.Provider>
  );
}

export function useExamSimulators() {
  const context = useContext(ExamSimulatorContext);
  if (context === undefined) {
    throw new Error("useExamSimulators must be used within an ExamSimulatorProvider");
  }
  return context;
}