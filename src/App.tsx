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
import { AppRouter } from "./exam-simulator/navigation/AppRouter";

function App() {
  useEffect(() => {
    // Handle browser refresh - redirect to home page
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Store a flag to indicate this was a refresh
      sessionStorage.setItem("wasRefreshed", "true");
    };

    // Check if this page load was from a refresh
    const wasRefreshed = sessionStorage.getItem("wasRefreshed");
    if (wasRefreshed) {
      // Clear the flag
      sessionStorage.removeItem("wasRefreshed");

      // Get the basename from the current URL to match the router configuration
      const basename = new URL(
        process.env.PUBLIC_URL || "",
        window.location.origin
      ).pathname;
      const homePath = basename + "/";

      // Redirect to home page using the correct path
      window.location.href = homePath;
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="bg-neutral-dark">
      <AppRouter />
    </div>
  );
}

export default App;
