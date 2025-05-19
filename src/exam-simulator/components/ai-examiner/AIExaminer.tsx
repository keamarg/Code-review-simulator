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
import { getExaminerQuestions } from "../../utils/getExaminerQuestions";
import getPrompt from "../../utils/prompt";
import examTimers from "../../hooks/useExamTimers";
import ReactMarkdown from "react-markdown";
import { LoadingAnimation } from "../../components/ui/LoadingAnimation";

const TEST_MODE = false;
const EXAM_DURATION_IN_MINUTES = 8; // default duration

interface AIExaminerProps {
  examSimulator: ExamSimulator;
  onExamStarted: () => void; // Added this prop to match GithubRepo
  examIntentStarted: boolean; // Added this prop to match GithubRepo
}

function AIExaminerFunction({
  examSimulator,
  onExamStarted,
  examIntentStarted,
}: AIExaminerProps) {
  const [studentTask, setStudentTask] = useState<string>("");
  const [prompt, setPrompt] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { client, setConfig, connected, connect, config } = useLiveAPIContext();
  console.log(333);

  const examDurationInMinutes =
    examSimulator?.duration ?? EXAM_DURATION_IN_MINUTES;
  const examDurationActiveExam = examDurationInMinutes - 1;

  const prepareExam = async () => {
    if (!examSimulator) return;

    try {
      const examContent = await getExaminerQuestions(examSimulator);
      const studentTaskAnswer = examContent["task-student"];
      console.log(studentTaskAnswer);

      setPrompt(
        getPrompt.standard(
          examSimulator,
          examDurationActiveExam,
          studentTaskAnswer
        )
      );

      setStudentTask(studentTaskAnswer || "");

      /* setIsLoading(false); */
    } catch (error) {
      console.error("Failed to prepare exam content:", error);
      /* setIsLoading(false); */
    }
  };

  useEffect(() => {
    if (examIntentStarted && prompt) {
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
    } else {
      console.log("Exam intent not started");
    }
  }, [examIntentStarted]);

  useEffect(() => {
    if (!prompt) prepareExam();
  });

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
      {isLoading ? (
        <LoadingAnimation isLoading={isLoading} />
      ) : studentTask ? (
        <div
          className="student-task bg-neutral-15 p-6 rounded-md shadow-lg max-w-3xl mx-auto relative scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 text-dark"
          style={{
            transformOrigin: "top center",
            maxHeight: "400px",
            overflow: "auto",
            borderColor: "var(--Neutral-30)",
          }}
        >
          <ReactMarkdown>{studentTask}</ReactMarkdown>
        </div>
      ) : (
        <div
          className="student-task-ghost bg-neutral-15 p-6 rounded-md shadow-lg max-w-3xl mx-auto relative"
          style={{
            maxHeight: "400px",
            overflow: "hidden",
            borderColor: "var(--Neutral-30)",
          }}
        >
          <div className="ghost-line-dark ghost-line-title-dark mb-4"></div>
          <div className="ghost-line-dark w-3/4 mb-3"></div>
          <div className="ghost-line-dark w-5/6 mb-3"></div>
          <div className="ghost-line-dark w-4/5 mb-3"></div>
          <div className="ghost-line-dark w-2/3 mb-3"></div>
          <div className="ghost-line-dark w-5/6 mb-3"></div>
          <div className="ghost-line-dark w-5/6 mb-3"></div>
          <div className="ghost-line-dark w-4/5 mb-3"></div>
          <div className="ghost-line-dark w-4/5 mb-3"></div>
          <div className="ghost-line-dark w-3/4 mb-3"></div>
          <div className="ghost-line-dark w-2/3 mb-3"></div>
          <div className="ghost-line-dark w-5/6 mb-3"></div>
        </div>
      )}
      <style>
        {`
          @keyframes ghostPulse {
            0% { opacity: 0.5; }
            50% { opacity: 0.7; }
            100% { opacity: 0.5; }
          }

          .ghost-line {
            height: 16px;
            background-color: #e0e0e0;
            border-radius: 4px;
            margin-bottom: 12px;
            animation: ghostPulse 1.5s infinite ease-in-out;
          }

          .ghost-line-title {
            height: 24px;
            width: 60%;
          }
        `}
      </style>
    </div>
  );
}

export const AIExaminer = memo(AIExaminerFunction);
