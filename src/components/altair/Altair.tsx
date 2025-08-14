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
import ReactMarkdown from "react-markdown";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ExamSimulator } from "../../types/ExamSimulator";
import { appLogger } from "../../lib/utils";
// import { getCurrentModel, getTimerConfig } from "../../config/aiConfig";
// import prompts from "../../prompts.json";

// const EXAM_DURATION_IN_MINUTES = 10; // default duration

interface AltairProps {
  examSimulator?: ExamSimulator;
  onVoiceStart?: () => void; // Added this prop to match GithubRepo
}

function AltairComponent({ examSimulator, onVoiceStart }: AltairProps) {
  // const [jsonString] = useState<string>("");
  // New state variable to store the task for the student
  const [studentTask] = useState<string>("");
  const { connected } = useLiveAPIContext();

  // Calculate dynamic exam duration based on examSimulator. Use fallback if not provided.
  // const examDurationInMinutes =
  //   examSimulator?.duration ?? EXAM_DURATION_IN_MINUTES;
  // const examDurationInMs = examDurationInMinutes * 60 * 1000;
  // const examDurationActiveExam = examDurationInMs - 60 * 1000;

  useEffect(() => {
    if (!connected) return;

    // Call onVoiceStart when connected and about to start the exam
    if (onVoiceStart) {
      onVoiceStart();
    }

    // Timer setup is now handled by useExamTimers.ts - no duplicate timers needed here
  }, [connected, onVoiceStart]);

  // const prompt = "";

  /* useEffect(() => {
    setConfig({
      model: getCurrentModel(),
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
  }, [setConfig]); */

  // const prepareExamQuestions = async () => {
  /*  try {
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

      appLogger.generic.info("Exam content prepared:", examContent);
    } catch (error) {
      appLogger.error.general(
        error instanceof Error ? error.message : String(error)
      );
    } */
  // };

  return (
    <div>
      <div className="vega-embed" />
      {studentTask && (
        <div className="student-task">
          <h3>Exam Task for Student</h3>
          <ReactMarkdown>{studentTask}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export const Altair = memo(AltairComponent);
