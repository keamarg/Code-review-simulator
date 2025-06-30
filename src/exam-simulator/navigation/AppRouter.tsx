import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import AIExaminerPage from "../pages/AIExaminerPage";
import Dashboard from "../pages/Dashboard";
import ExamEditor from "../pages/ExamEditor";

import { AuthProvider } from "./../contexts/AuthContext";
import { ProtectedRoute } from "./../pages/ProtectedRoute";
import LoginPage from "../pages/Login";
import SignupPage from "./../pages/Signup";

const basename = new URL(process.env.PUBLIC_URL || "", window.location.origin)
  .pathname;

// The authentication is created via anthropic: https://claude.ai/chat/563676a5-b56e-40d3-b58e-4e33ccaf962f
export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<ExamEditor />} />
            <Route path="/exam" element={<ExamEditor />} />
            <Route path="/live" element={<AIExaminerPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
