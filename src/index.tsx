/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Global error handlers (especially important for Safari)
// MUST be set up BEFORE anything else runs to catch errors early
// Safari will reload the page on unhandled errors, so we catch them here
// Only add the listeners once to prevent duplicate handlers
if (!(window as any).__errorHandlersAdded) {
  // Handle unhandled promise rejections
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      console.error("Unhandled promise rejection:", event.reason);
      // Prevent default behavior (page reload in Safari)
      event.preventDefault();
      // Log the error but don't crash the app
      if (event.reason instanceof Error) {
        console.error("Error details:", event.reason.message, event.reason.stack);
      }
      // Return false to indicate we handled it
      return false;
    },
    { capture: true },
  );

  // Handle uncaught errors
  window.addEventListener(
    "error",
    (event) => {
      console.error("Uncaught error:", event.error || event.message);
      // Prevent default behavior
      event.preventDefault();
      // Return false to indicate we handled it
      return false;
    },
    { capture: true },
  );

  (window as any).__errorHandlersAdded = true;
}

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
/* 
<React.StrictMode>
    <App />
  </React.StrictMode>
*/

root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
