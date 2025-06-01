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
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ExamSimulator } from "../../types/ExamSimulator";
import { getCurrentModel, getTimerConfig } from "../../config/aiConfig"; // Import centralized config
import prompts from "../../prompts.json";

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

  // Calculate dynamic exam duration based on examSimulator. Use fallback if not provided.
  const examDurationInMinutes =
    examSimulator?.duration ?? EXAM_DURATION_IN_MINUTES;
  const examDurationInMs = examDurationInMinutes * 60 * 1000;
  const examDurationActiveExam = examDurationInMs - 60 * 1000;
  const HalfWaySeconds = Math.floor(examDurationInMs / 2);
  const halfExamRemainingMinutes = examDurationInMinutes / 2;

  useEffect(() => {
    if (!connected) return; // only schedule if the client is connected

    // Call onVoiceStart when connected and about to start the exam
    if (onVoiceStart) {
      onVoiceStart();
    }

    const timerConfig = getTimerConfig();

    const introTimer = setTimeout(() => {
      client.send([{ text: prompts.timerMessages.introduction }]);
    }, timerConfig.introductionDelay);

    const halfExamTimer = setTimeout(() => {
      // eslint-disable-next-line no-template-curly-in-string
      const halfTimeMessage = prompts.timerMessages.halfTime.replace(
        "${remainingMinutes}",
        halfExamRemainingMinutes.toString()
      );

      client.send([
        {
          text: halfTimeMessage,
        },
      ]);
    }, HalfWaySeconds);

    const finalWarningTimer = setTimeout(() => {
      client.send([
        {
          text: prompts.timerMessages.timeAlmostUp,
        },
      ]);
    }, examDurationInMs - timerConfig.timeWarningBeforeEnd);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(halfExamTimer);
      clearTimeout(finalWarningTimer);
    };
  }, [
    client,
    connected,
    halfExamRemainingMinutes,
    HalfWaySeconds,
    examDurationInMs,
  ]);

  const prompt = "";

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

  const prepareExamQuestions = async () => {
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

      console.log("Exam content prepared:", examContent);
    } catch (error) {
      console.error("Failed to prepare exam content:", error);
    } */
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
