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
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { ExamSimulator } from "../../contexts/ExamSimulatorContext";

interface AltairProps {
  examSimulator?: ExamSimulator;
}

const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      json_graph: {
        type: SchemaType.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

function AltairComponent({ examSimulator }: AltairProps) {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig } = useLiveAPIContext();

  // Log the examSimulator if provided
  useEffect(() => {
    if (examSimulator) {
      console.log("Altair component received examSimulator:", examSimulator);
    }
  }, [examSimulator]);

  const examTitle = examSimulator?.title ?? "";
  const learningGoals = examSimulator?.learningGoals ?? "";
  const gradeCriteria = examSimulator?.gradeCriteria ?? "";
  const feedback = examSimulator?.feedback ?? "";

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are an experienced lecturer running a ${examTitle} exam. 
            The competencies you are examining are:
            ${learningGoals}
            
            Here is how you should grade the exam:
            ${gradeCriteria}

            Here is how you should give feedback:
            ${feedback}

            You dont have time to evaluate all learning goals so pick some of them and ask about that. 
            Ask about the student's thinking, and also examine if the student understands the code he/she is writing. When done, give the student a grade.`,
          },
        ],
      },
      tools: [
        { googleSearch: {} },
        { functionDeclarations: [declaration] },
      ],
    });
  }, [setConfig, examTitle, learningGoals, gradeCriteria, feedback]);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log("got toolcall", toolCall);
      const fc = toolCall.functionCalls.find((fc) => fc.name === declaration.name);
      if (fc) {
        const str = (fc.args as any).json_graph;
        setJSONString(str);
      }
      if (toolCall.functionCalls.length) {
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls.map((fc) => ({
                response: { output: { success: true } },
                id: fc.id,
              })),
            }),
          200,
        );
      }
    };
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);

  return <div className="vega-embed" ref={embedRef} />;
}

export const Altair = memo(AltairComponent);
