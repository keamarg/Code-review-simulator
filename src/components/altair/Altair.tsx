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

const EXAM_DURATION_IN_MINUTES = 8; // default duration

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
  const { client, setConfig, connected } = useLiveAPIContext();
  const examinerType = examSimulator?.examinerType ?? "Friendly";
  
  // Calculate dynamic exam duration based on examSimulator. Use fallback if not provided.
  const examDurationInMinutes = examSimulator?.duration ?? EXAM_DURATION_IN_MINUTES;
  const examDurationInMs = examDurationInMinutes * 60 * 1000;
  const examDurationActiveExam = examDurationInMs - 60 * 1000;
  
  useEffect(() => {
    if (!connected) return; // only schedule if the client is connected

    // Original exam introduction message after 1 second
    const introTimer = setTimeout(() => {
      client.send([{ text: "Please introduce the exam" }]);
    }, 1 * 1000);

    // Send message at half the exam duration
    const halfExamTimer = setTimeout(() => {
      client.send([
        { text: "Half of the exam has passed, and there are 4 minutes remaining. Dont tell the student about this message, just carry on" },
      ]);
    }, Math.floor(examDurationInMs / 2));

    // Send message for grading near the end of the exam
    const gradingTimer = setTimeout(() => {
      client.send([
        { text: "Exam time is almost up. Please provide a grade and feedback." },
      ]);
    }, examDurationInMs - (60 * 1000));

    return () => {
      clearTimeout(introTimer);
      clearTimeout(halfExamTimer);
      clearTimeout(gradingTimer);
    };
  }, [client, connected, examDurationInMs]);

  // Log the examSimulator if provided
  useEffect(() => {
    if (examSimulator) {
      console.log("Altair component received examSimulator:", examSimulator);
    }
  }, [examSimulator]);

  const examTitle = examSimulator?.title ?? "";
  const learningGoals = examSimulator?.learningGoals ?? "";
  let gradeCriteria = examSimulator?.gradeCriteria ?? "";
  const feedback = examSimulator?.feedback ?? "";
  const task = examSimulator?.task ?? "";

  if(gradeCriteria === '7-skala') {
    gradeCriteria = `12 	Den fremragende præstation 	Karakteren 12 gives for den fremragende præstation, der demonstrerer udtømmende opfyldelse af fagets mål, med ingen eller få uvæsentlige mangler 	A
10 	Den fortrinlige præstation 	Karakteren 10 gives for den fortrinlige præstation, der demonstrerer omfattende opfyldelse af fagets mål, med nogle mindre væsentlige mangler 	B
7 	Den gode præstation 	Karakteren 7 gives for den gode præstation, der demonstrerer opfyldelse af fagets mål, med en del mangler 	C
4 	Den jævne præstation 	Karakteren 4 gives for den jævne præstation, der demonstrerer en mindre grad af opfyldelse af fagets mål, med adskillige væsentlige mangler 	D
02 	Den tilstrækkelige præstation 	Karakteren 02 gives for den tilstrækkelige præstation, der demonstrerer den minimalt acceptable grad af opfyldelse af fagets mål 	E
00 	Den utilstrækkelige præstation 	Karakteren 00 gives for den utilstrækkelige præstation, der ikke demonstrerer en acceptabel grad af opfyldelse af fagets mål 	Fx
-3 	Den ringe præstation 	Karakteren -3 gives for den helt uacceptable præstation 	F`
  } else if(gradeCriteria === 'bestået-ikke-bestået') {
    gradeCriteria = `Bestået/Ikke bestået`
  } else if(gradeCriteria === 'no-grade') {
    gradeCriteria = `The student should not get a grade!`
  }

  const prompt = `You are a ${examinerType.toLowerCase()} examiner running a ${examDurationInMinutes} minute ${examSimulator?.title || "exam"} exam. 

Here is how the exam should proceed:
1. Start the exam by introducing yourself, the exam and the steps of the exam. If relevant ask the student to share their screen
2. Given the task. Come up with a specific task for the student to solve in ${examDurationActiveExam / 60000} minutes (1 minute for grade and feedback). Please just explain the student the first part of the task. And then built on that, when the student have completed that.
3. Run the exam, asking questions and evaluating the student's competencies.
4. Give the student a grade and feedback.

The competencies you are examining are:
${learningGoals}

Here is how you should grade the exam:
${gradeCriteria}

Here is how you should give feedback:
${feedback}

Here is the task for the exam:
${task}

Important notes about conducting the exam:
- You dont have time to evaluate all learning goals so pick some of them and ask about that
- Ask about the student's thinking, encourage them to think aloud 
- examine if the student understands the code he/she is writing.
- Please never explain what code is doing. You are running an exam so you need to focus on evaluating the students competencies within the learning goals!
- Dont say what the student have done. Just say things like: "that looks good"
- If the student is doing well ask harder questions. If the student is struggling ask easier questions.
- If the student is stuck, give hints to help the student move forward.`;

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
      tools: [
        { googleSearch: {} },
        { functionDeclarations: [declaration] },
      ],
    });
  }, [setConfig]);

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
