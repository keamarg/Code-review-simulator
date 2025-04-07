import React, { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LiveAPIProvider } from "../../contexts/LiveAPIContext";
import { useExamSimulators } from "../contexts/ExamSimulatorContext";
import { Altair as AltairStandard } from "../../components/altair/Altair";
import { Altair as GithubRepo } from "../../components/altair/GithubRepo";
import { CountdownTimer } from "../../components/CountdownTimer";
import ControlTrayCustom from "../components/control-tray-custom/ControlTrayCustom";
import cn from "classnames";
import Layout from "../components/layout/Layout";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || undefined;
  const { examSimulators } = useExamSimulators();

  const examSimulator =
    (id && examSimulators.find((exam) => exam.id === id)) || examSimulators[0];

  // Calc exam duration (in ms) using examSimulator settings, fallback to 8 minutes.
  const examDurationInMinutes = examSimulator?.duration || 8;
  const examDurationInMs = examDurationInMinutes * 60 * 1000;

  // New state to start the countdown only when voice has started.
  const [voiceStarted, setVoiceStarted] = useState(false);

  // Create a single handler for both exam types
  const handleVoiceStart = () => setVoiceStarted(true);

  return (
    <Layout>
      <LiveAPIProvider url={uri} apiKey={API_KEY}>
        <div className="streaming-console max-w-2xl mx-auto">
          <main>
            <div>
              <h1 className="mb-8 font-bold text-2xl text-black">
                Welcome to your {examSimulator.title} exam
              </h1>
              <h2 className="mb-16 line-clamp-2 text-black">
                <strong>Task: </strong>
                {examSimulator.task}
              </h2>

              {/* Countdown timer for both exam types */}
              <CountdownTimer
                totalMs={examDurationInMs}
                autoStart={false}
                startTrigger={voiceStarted}
              />

              {examSimulator.examType === "Github Repo" ? (
                <GithubRepo
                  examSimulator={examSimulator}
                  onVoiceStart={handleVoiceStart}
                />
              ) : (
                <AltairStandard
                  examSimulator={examSimulator}
                  onVoiceStart={handleVoiceStart}
                />
              )}
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
      </LiveAPIProvider>
    </Layout>
  );
}
