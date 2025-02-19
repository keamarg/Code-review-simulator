import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../exam-simulator/LandingPage";
import LivePage from "../exam-simulator/LivePage";
import Dashboard from "../exam-simulator/Dashboard";
import ExamEditor from "../exam-simulator/ExamEditor";
import { ExamSimulatorProvider } from "../contexts/ExamSimulatorContext";

export function AppRouter() {
  return (
    <ExamSimulatorProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<ExamEditor />} />
          <Route path="/exam" element={<ExamEditor />} />
        </Routes>
      </BrowserRouter>
    </ExamSimulatorProvider>
  );
}