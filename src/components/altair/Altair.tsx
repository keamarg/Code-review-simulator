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
import { useCodeReviewAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { CodeReviewScenario } from "../../contexts/ExamSimulatorContext";
import getCodeReviewPrompt from "../../exam-simulator/utils/codeReviewPrompt";

const REVIEW_DURATION_IN_MINUTES = 15; // default duration

interface AltairProps {
  reviewScenario?: CodeReviewScenario;
  onVoiceStart?: () => void;
}

function AltairComponent({ reviewScenario, onVoiceStart }: AltairProps) {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig, connected } = useCodeReviewAPIContext();

  // Calculate dynamic review duration based on reviewScenario. Use fallback if not provided.
  const reviewDurationInMinutes =
    reviewScenario?.timeLimit ?? REVIEW_DURATION_IN_MINUTES;
  const reviewDurationInMs = reviewDurationInMinutes * 60 * 1000;
  const reviewDurationActive = reviewDurationInMs - 60 * 1000;
  const HalfWaySeconds = Math.floor(reviewDurationInMs / 2);

  useEffect(() => {
    if (!connected) return; // only schedule if the client is connected

    // Call onVoiceStart when connected and about to start the review
    if (onVoiceStart) {
      onVoiceStart();
    }

    const introTimer = setTimeout(() => {
      client.send([
        {
          text: `Starting code review for ${
            reviewScenario?.title || "your code"
          }. ${
            reviewScenario?.language
              ? `I'll be reviewing ${reviewScenario.language} code.`
              : "Please show me the code you'd like me to review."
          }`,
        },
      ]);
    }, 1000);

    const halfReviewTimer = setTimeout(() => {
      client.send([
        {
          text: `Half of the review time has passed. Let's continue with the review, focusing on ${
            reviewScenario?.reviewCriteria?.join(", ") ||
            "general code quality aspects"
          }.`,
        },
      ]);
    }, HalfWaySeconds);

    const feedbackTimer = setTimeout(() => {
      client.send([
        {
          text: "Review time is almost up. Please show me any remaining parts of the code you'd like me to review before I provide my final feedback and suggestions.",
        },
      ]);
    }, reviewDurationInMs - 60 * 1000);

    return () => {
      clearTimeout(introTimer);
      clearTimeout(halfReviewTimer);
      clearTimeout(feedbackTimer);
    };
  }, [client, connected, reviewScenario]);

  const reviewTitle = reviewScenario?.title ?? "";
  const learningGoals = reviewScenario?.learningObjectives ?? "";
  const feedback =
    "Provide constructive feedback focusing on code quality, best practices, and potential improvements. Consider language-specific best practices and patterns.";

  const prompt = getCodeReviewPrompt(
    reviewTitle,
    learningGoals,
    feedback,
    "Technical", // Always use Technical reviewer for code reviews
    reviewDurationInMinutes,
    reviewDurationActive,
    reviewScenario
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
  }, [setConfig, prompt]);

  return (
    <div>
      <div className="vega-embed" />
    </div>
  );
}

export const Altair = memo(AltairComponent);
