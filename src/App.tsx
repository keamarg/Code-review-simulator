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

import React, { useEffect } from "react";
import "./App.scss";
import { AppRouter } from "./reviewer/navigation/AppRouter";

function App() {
  useEffect(() => {
    // Handle browser refresh - redirect to home page
    // Use a guard to prevent multiple redirects
    if ((window as any).__redirecting) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Store a flag to indicate this was a refresh
      sessionStorage.setItem("wasRefreshed", "true");
    };

    // Check if this page load was from a refresh
    const wasRefreshed = sessionStorage.getItem("wasRefreshed");
    if (wasRefreshed) {
      // Clear the flag immediately
      sessionStorage.removeItem("wasRefreshed");

      // With hash routing, check the hash instead of pathname
      const currentPath = window.location.hash.replace('#', '') || '/';

      // Only redirect if we're not already on the home page to prevent loops
      if (currentPath !== '/' && currentPath !== '') {
        (window as any).__redirecting = true;
        // With hash routing, just update the hash to redirect to home
        window.location.hash = '#/';
        return;
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Clear redirect flag on unmount
      (window as any).__redirecting = false;
    };
  }, []);

  return (
    <div className="bg-neutral-dark">
      <AppRouter />
    </div>
  );
}

export default App;
