/**
 * This file has been repurposed from an exam simulator to a code review simulator.
 * The file structure is maintained to allow for easier merging with the original repository.
 */

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../exam-simulator/LandingPage";
import LivePage from "../exam-simulator/LivePage";
import Dashboard from "../exam-simulator/Dashboard";
import ExamEditor from "../exam-simulator/ExamEditor";
import { CodeReviewProvider } from "../contexts/ExamSimulatorContext";

export function AppRouter() {
  return (
    <CodeReviewProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/review" element={<LivePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<ExamEditor />} />
          <Route path="/scenario" element={<ExamEditor />} />
        </Routes>
      </BrowserRouter>
    </CodeReviewProvider>
  );
}
