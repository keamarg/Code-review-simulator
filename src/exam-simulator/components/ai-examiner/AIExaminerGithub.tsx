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
import React, { useEffect, useState, memo } from "react";
import { useLiveAPIContext } from "../../../contexts/LiveAPIContext";
import { ExamSimulator } from "../../contexts/ExamSimulatorContext";
import getPrompt from "../../utils/prompt";
import examTimers from "../../hooks/useExamTimers";
import getRepoQuestions from "../../utils/getGithubRepoFiles.js";

const TEST_MODE = false;
const EXAM_DURATION_IN_MINUTES = 8; // default duration

interface AIExaminerProps {
  examSimulator: ExamSimulator;
  onExamStarted: () => void; // Added this prop to match GithubRepo
  examIntentStarted: boolean; // Added this prop to match GithubRepo
}

function GithubRepoFunction({
  examSimulator,
  onExamStarted,
  examIntentStarted,
}: AIExaminerProps) {
  const [jsonString, setJSONString] = useState<string>("");
  const [studentTask, setStudentTask] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [repoUrl, setRepoUrl] = useState<string>("");
  const { client, setConfig, connected, connect, config } = useLiveAPIContext();

  const examDurationInMinutes =
    examSimulator?.duration ?? EXAM_DURATION_IN_MINUTES;
  const examDurationActiveExam = examDurationInMinutes;

  useEffect(() => {
    if (examIntentStarted) {
      const fetch = async () => {
        setIsLoading(true);

        const githubQuestions = await getRepoQuestions(
          repoUrl,
          examSimulator.learning_goals
        );

        const prompt = getPrompt.github(
          examSimulator,
          examDurationActiveExam,
          githubQuestions
        );

        // When the setConfig is called the config will be changed and that is tracked by the useEffect below
        setConfig({
          model: "models/gemini-2.0-flash-exp",
          generationConfig: {
            responseModalities: "audio",
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
            },
          },
          systemInstruction: {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        });

        setIsLoading(false);
      };

      fetch();
    } else {
      console.log("Exam intent not started");
    }
  }, [examIntentStarted]);

  useEffect(() => {
    // Kind of a cheat way of checking if the config has changed from the original from use-live-api.tsx line 48
    if (config.hasOwnProperty("systemInstruction")) {
      // Then the correct config has been set and we can start the exam
      connect();

      // this is for the countdown timer
      if (onExamStarted) onExamStarted();

      examTimers({
        client,
        examDurationInMs: examDurationActiveExam * 60 * 1000,
      });
    }
  }, [config]);

  return (
    <div>
      <div className="flex flex-col mb-12">
        <label className="mb-4" htmlFor="github-repo">
          Insert your GitHub repository URL
        </label>
        <input
          id="github-repo"
          placeholder="GitHub repository URL"
          className="border p-2 mb-4 rounded bg-tokyo-base border-tokyo-selection text-tokyo-fg"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        {isLoading && (
          <p className="text-tokyo-comment text-center">
            Preparing your code review...
          </p>
        )}
      </div>
    </div>
  );
}

export const GithubRepo = memo(GithubRepoFunction);
