import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import AIExaminerPage from "../pages/AIExaminerPage";
import Dashboard from "../pages/Dashboard";
import ExamEditor from "../pages/ExamEditor";
import { RootLayout } from "../layout/RootLayout";
import { ProtectedRoute } from "./../pages/ProtectedRoute";
import LoginPage from "../pages/Login";
import SignupPage from "./../pages/Signup";

const basename = new URL(process.env.PUBLIC_URL || "", window.location.origin)
  .pathname;

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route index element={<LandingPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="create" element={<ExamEditor />} />
        <Route path="exam" element={<ExamEditor />} />
        <Route path="live" element={<AIExaminerPage />} />
      </Route>
    </Route>
  ),
  { basename: basename }
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
