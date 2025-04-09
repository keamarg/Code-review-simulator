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

const TEST_MODE = true;
const EXAM_DURATION_IN_MINUTES = 8; // default duration

interface AIExaminerProps {
  examSimulator?: ExamSimulator;
  onVoiceStart?: () => void; // Added this prop to match GithubRepo
}

function AIExaminerFunction({ examSimulator, onVoiceStart }: AIExaminerProps) {
  const [jsonString, setJSONString] = useState<string>("");
  const [studentTask, setStudentTask] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [prompt, setPrompt] = useState<string>("please talk like a new yorker");
  const { client, setConfig, connected } = useLiveAPIContext();

  const examDurationInMinutes =
    examSimulator?.duration ?? EXAM_DURATION_IN_MINUTES;
  const examDurationInMs = examDurationInMinutes * 60 * 1000;
  const examDurationActiveExam = examDurationInMs - 60 * 1000;

  // Prepare exam questions once when component mounts or when exam simulator changes
  useEffect(() => {
    setIsLoading(false);
    const prepareExam = async () => {
  
      if (!examSimulator || !connected) return;

      try {
        setIsLoading(true);
        if (!TEST_MODE) {
          const examContent = await getExaminerQuestions(examSimulator);

          examSimulator.studentTask = examContent["task-student"];
          
          setPrompt(getPrompt(examSimulator, examDurationActiveExam));
        } else {
          // Simulate loading time in test mode
          /* await new Promise(resolve => setTimeout(resolve, 100000)); */

          const studentTask = `You have 5 minutes to complete the following task:

HTML Task: Create a simple HTML page with a heading and a button. Use proper semantic tags for the structure.

Create a <header> with an <h1> element.
Create a <main> section containing a <button> with the text "Click Me".
Assign an id and class to the button as follows:
id: "demoButton"
class: "btnStyle"
JavaScript Task:

Write a JavaScript function that listens for a click event on the button and performs the following:
Create an array with at least three different numbers.
Use forEach to iterate over the array and log each number to the console.
Use an if statement to check if the array length is greater than 2, and log "Array has more than two elements" to the console.
Remember to implement these tasks using clear and concise code. You do not need to worry about styling for this task.`;
          examSimulator.studentTask = studentTask;
          
          setPrompt(getPrompt(examSimulator, examDurationActiveExam))
        }
        
        setStudentTask(examSimulator.studentTask || "");

        setIsLoading(false);
      } catch (error) {
        console.error("Failed to prepare exam content:", error);
        setIsLoading(false);
      }
    };
    prepareExam();
  }, [connected]);

  // Configure the model once when prompt changes
  useEffect(() => {
    // Notify the parent component that voice is starting
    if (onVoiceStart && connected && prompt) {
      console.log("in here");
      
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

      //examTimers({ client, examDurationInMs });

      // this is for the countdown timer
      onVoiceStart();
    }
  },
  [prompt, connected, setConfig]
  // prompt, onVoiceStart, connected, 
  // setConfig
);

  return (
    <div>
      {isLoading ? (
        <LoadingAnimation isLoading={isLoading} />
      ) : (
        studentTask && (
          <div
            className="student-task bg-white p-6 rounded-md shadow-xl/30 max-w-3xl mx-auto relative mb-12"
            style={{
              animation: "paperDrop 0.6s ease-in-out",
              transformOrigin: "top center",
              maxHeight: "400px",
              overflow: "auto",
            }}
          >
            <ReactMarkdown>{studentTask}</ReactMarkdown>
          </div>
        )
      )}
      <style>
        {`
          @keyframes paperDrop {
            0% {
              transform: translateY(-20px) rotateX(10deg);
              opacity: 0;
            }
            60% {
              transform: translateY(5px) rotateX(-2deg);
            }
            100% {
              transform: translateY(0) rotateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

export const AIExaminer = memo(AIExaminerFunction);
