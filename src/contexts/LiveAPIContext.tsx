/**
 * This file has been repurposed from an exam simulator to a code review simulator.
 * The file structure is maintained to allow for easier merging with the original repository.
 */

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

import { createContext, FC, ReactNode, useContext } from "react";
import { useLiveAPI, UseLiveAPIResults } from "../hooks/use-live-api";

const CodeReviewAPIContext = createContext<UseLiveAPIResults | undefined>(
  undefined
);

export type CodeReviewAPIProviderProps = {
  children: ReactNode;
  url?: string;
  apiKey: string;
};

export const CodeReviewAPIProvider: FC<CodeReviewAPIProviderProps> = ({
  url,
  apiKey,
  children,
}) => {
  const codeReviewAPI = useLiveAPI({ url, apiKey });

  return (
    <CodeReviewAPIContext.Provider value={codeReviewAPI}>
      {children}
    </CodeReviewAPIContext.Provider>
  );
};

export const useCodeReviewAPIContext = () => {
  const context = useContext(CodeReviewAPIContext);
  if (!context) {
    throw new Error(
      "useCodeReviewAPIContext must be used within a CodeReviewAPIProvider"
    );
  }
  return context;
};
