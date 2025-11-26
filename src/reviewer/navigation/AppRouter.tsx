import React from "react";
import {
  createHashRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import CodeReviewPage from "../pages/CodeReviewPage";
import Dashboard from "../pages/Dashboard";
import ReviewTemplateEditor from "../pages/ReviewTemplateEditor";
import { RootLayout } from "../layout/RootLayout";
import { ProtectedRoute } from "./../pages/ProtectedRoute";
import LoginPage from "../pages/Login";
import SignupPage from "./../pages/Signup";

// With hash routing, basename is not needed since hash is always relative to current page
const router = createHashRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      <Route index element={<LandingPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="signup" element={<SignupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="create" element={<ReviewTemplateEditor />} />
        <Route path="live" element={<CodeReviewPage />} />
      </Route>
    </Route>,
  ),
);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
