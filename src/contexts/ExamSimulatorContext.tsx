import React, { createContext, useState, useContext, useEffect } from "react";

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

const defaultExamSimulator: ExamSimulator = {
  id: "default-1",
  title: "Webteknologi eksamen",
  format: "Livecoding",
  gradeCriteria: "7 trins skalaen",
  feedback: "Instant feedback provided.",
  duration: 20,
  learningGoals: "The student should be able to solve a problem using html, css and js",
  task: "Build a responsive website using HTML, CSS, and JavaScript.", // default task
};

const defaultExamSimulator2: ExamSimulator = {
  id: "test",
  title: "asd",
  format: "asd",
  gradeCriteria: "asd",
  feedback: "asd",
  duration: 20,
  learningGoals: "Tasd",
  task: "Complete the given coding challenge.", // default task
};

const LOCAL_STORAGE_KEY = "examSimulators";

export function ExamSimulatorProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from local storage if available, else fall back to defaults
  const [examSimulators, setExamSimulators] = useState<ExamSimulator[]>(() => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    return localData ? JSON.parse(localData) : [defaultExamSimulator, defaultExamSimulator2];
  });

  // Whenever examSimulators changes, update local storage
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