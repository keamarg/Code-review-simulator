import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../exam-simulator/pages/LandingPage";
import LivePage from "../exam-simulator/pages/AIExaminerPage";
import Dashboard from "../exam-simulator/pages/Dashboard";
import ExamEditor from "../exam-simulator/pages/ExamEditor";

export function AppRouter() {
  return (
    
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<ExamEditor />} />
          <Route path="/exam" element={<ExamEditor />} />
        </Routes>
      </BrowserRouter>
    
  );
}
