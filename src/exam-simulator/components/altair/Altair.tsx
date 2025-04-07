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
import React, { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../../contexts/LiveAPIContext";
import { ToolCall } from "../../../multimodal-live-types";
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { ExamSimulator } from "../../contexts/ExamSimulatorContext";
import { getExaminerQuestions } from "../../utils/getExaminerQuestions";
import getPrompt from "../../utils/prompt";

const EXAM_DURATION_IN_MINUTES = 8; // default duration

interface AltairProps {
  examSimulator?: ExamSimulator;
  onVoiceStart?: () => void; // Added this prop to match GithubRepo
}

function AltairComponent({ examSimulator, onVoiceStart }: AltairProps) {
  const [jsonString, setJSONString] = useState<string>("");
  // New state variable to store the task for the student
  const [studentTask, setStudentTask] = useState<string>("");
  const { client, setConfig, connected } = useLiveAPIContext();
  const examinerType = examSimulator?.examinerType ?? "Friendly";

  // Calculate dynamic exam duration based on examSimulator. Use fallback if not provided.
  const examDurationInMinutes =
    examSimulator?.duration ?? EXAM_DURATION_IN_MINUTES;
  const examDurationInMs = examDurationInMinutes * 60 * 1000;
  const examDurationActiveExam = examDurationInMs - 60 * 1000;
  const HalfWaySeconds = Math.floor(examDurationInMs / 2);

  useEffect(() => {
    if (!connected) return; // only schedule if the client is connected

    // Call onVoiceStart when connected and about to start the exam
    if (onVoiceStart) {
      onVoiceStart();
    }

    const introTimer = setTimeout(() => {
      client.send([{ text: "Please introduce the exam" }]);
    }, 1000);

    const halfExamTimer = setTimeout(() => {
      client.send([
        {
          text: `Half of the exam has passed, and there are ${HalfWaySeconds} minutes remaining. Dont tell the student about this message, just carry on`,
        },
      ]);
    }, HalfWaySeconds);

    const gradingTimer = setTimeout(() => {
      client.send([
        {
          text: "Exam time is almost up. Please provide a grade and feedback.",
        },
      ]);
    }, examDurationInMs - 60 * 1000);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(halfExamTimer);
      clearTimeout(gradingTimer);
    };
  }, [client, connected]);

  const prompt = getPrompt(
    examSimulator?.title || "",
    examSimulator?.learningGoals || "",
    examSimulator?.gradeCriteria || "",
    examSimulator?.feedback || "",
    examSimulator?.task || "",
    examinerType,
    examDurationInMinutes,
    examDurationActiveExam,
    examSimulator
  );

  useEffect(() => {
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
  }, [setConfig]);

  const prepareExamQuestions = async () => {
    if (!examSimulator?.learningGoals) return;

    try {
      const examContent = await getExaminerQuestions(
        examSimulator.learningGoals,
        examDurationInMinutes,
        examSimulator.title,
        examSimulator.task
      );

      // Send the examiner questions to the AI examiner
      client.send([
        {
          text: `Here are suggested questions for the exam:\n${examContent["questions-examiner"]}\n\nPlease use these as a guide when examining the student.`,
        },
      ]);

      // Display the task for the student in the UI.
      setStudentTask(examContent["task-student"]);

      console.log("Exam content prepared:", examContent);
    } catch (error) {
      console.error("Failed to prepare exam content:", error);
    }
  };

  return (
    <div>
      <div className="vega-embed" />
      {studentTask && (
        <div className="student-task">
          <h3>Exam Task for Student</h3>
          <div dangerouslySetInnerHTML={{ __html: studentTask }} />
        </div>
      )}
    </div>
  );
}

export const Altair = memo(AltairComponent);
