/**
 * This file has been repurposed from an exam simulator to a code review simulator.
 * The file structure is maintained to allow for easier merging with the original repository.
 */

import React, { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CodeReviewAPIProvider } from "../contexts/LiveAPIContext";
import { useCodeReview } from "../contexts/ExamSimulatorContext";
import { Altair } from "../components/altair/Altair";
import { CountdownTimer } from "../components/CountdownTimer";
import ControlTrayCustom from "../components/control-tray-custom/ControlTrayCustom";
import cn from "classnames";
import Layout from "../components/layout/Layout";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

export default function CodeReviewSession() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || undefined;
  const { reviewScenarios } = useCodeReview();

  const reviewScenario =
    (id && reviewScenarios.find((scenario) => scenario.id === id)) ||
    reviewScenarios[0];

  // Calc review duration (in ms) using scenario settings, fallback to 15 minutes.
  const reviewDurationInMinutes = reviewScenario?.timeLimit || 15;
  const reviewDurationInMs = reviewDurationInMinutes * 60 * 1000;

  // New state to start the countdown only when review has started.
  const [reviewStarted, setReviewStarted] = useState(false);

  // Create a single handler for starting the review
  const handleReviewStart = () => setReviewStarted(true);

  return (
    <Layout>
      <CodeReviewAPIProvider url={uri} apiKey={API_KEY}>
        <div className="code-review-console max-w-4xl mx-auto">
          <main>
            <div>
              <div className="flex justify-between items-center mb-8">
                <h1 className="font-bold text-2xl text-black">
                  Code Review: {reviewScenario?.title || "Live Code Review"}
                </h1>
                {reviewScenario?.language && (
                  <div className="px-4 py-2 bg-blue-100 rounded-lg">
                    <span className="text-blue-800 font-medium">
                      {reviewScenario.language}
                    </span>
                  </div>
                )}
              </div>

              {reviewScenario?.reviewCriteria &&
                reviewScenario.reviewCriteria.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-2">
                      Review Criteria:
                    </h2>
                    <ul className="list-disc list-inside">
                      {reviewScenario.reviewCriteria.map((criterion, index) => (
                        <li key={index} className="text-gray-700">
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Countdown timer for the review session */}
              <CountdownTimer
                totalMs={reviewDurationInMs}
                autoStart={false}
                startTrigger={reviewStarted}
              />

              <Altair
                reviewScenario={reviewScenario}
                onVoiceStart={handleReviewStart}
              />

              <video
                className={cn({
                  hidden: !videoRef.current || !videoStream,
                })}
                style={{
                  width: "20%",
                  position: "fixed",
                  bottom: "25px",
                  right: "25px",
                }}
                ref={videoRef}
                autoPlay
                playsInline
              />
              <ControlTrayCustom
                videoRef={videoRef}
                supportsVideo={true}
                onVideoStreamChange={setVideoStream}
              />
            </div>
          </main>
        </div>
      </CodeReviewAPIProvider>
    </Layout>
  );
}
