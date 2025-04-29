import React, { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LiveAPIProvider } from "../../contexts/LiveAPIContext";
import { useExamSimulators } from "../contexts/ExamSimulatorContext";
import { AIExaminer } from "../components/ai-examiner/AIExaminer";
import { Altair as GithubRepo } from "../components/ai-examiner/AIExaminerWithGithubRepo";
import { CountdownTimer } from "../components/CountdownTimer";
import ControlTrayCustom from "../components/control-tray-custom/ControlTrayCustom";
import cn from "classnames";
import Layout from "../layout/Layout";

//const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
const API_KEY = "asdddsasd" as string;
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
  const [examStarted, setExamStarted] = useState(false);
  
  // the intent is because the exam simulator is not yet started. The user has clicked the button and now we need to create the questions
  const [examIntentStarted, setExamIntentStarted] = useState(false);

  // Create a single handler for both exam types
  const handleExamStarted = () => setExamStarted(true);

  const onStartExamClicked = (isButtonOn: boolean) => {

    if(isButtonOn) {
      setExamIntentStarted(true)
    } else {
      setExamIntentStarted(false)
    }
  }
  
  return (
    <Layout>
      <LiveAPIProvider url={uri} apiKey={API_KEY}>
        <div className="streaming-console max-w-2xl mx-auto flex flex-col">
          
            <div className="pt-10 pr-10 pl-10 mb-10 flex justify-center flex-col">
              <h1 className="mb-8 font-bold text-2xl text-black text-center">
              Welcome to your {examSimulator.title} exam
              </h1>

              {/* Countdown timer for both exam types */}
              <CountdownTimer
              totalMs={examDurationInMs}
              autoStart={false}
              startTrigger={examStarted}
              />

              {examSimulator.examType === "Github Repo" ? (
              <GithubRepo
                examSimulator={examSimulator}
                onVoiceStart={handleExamStarted}
              />
              ) : (
              <AIExaminer
                examSimulator={examSimulator}
                onExamStarted={handleExamStarted}
                examIntentStarted={examIntentStarted}
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
                opacity: "0"
              }}
              ref={videoRef}
              autoPlay
              playsInline
              />
            </div>
          
            <ControlTrayCustom
                videoRef={videoRef}
                supportsVideo={true}
                onVideoStreamChange={setVideoStream}
                onButtonClicked={onStartExamClicked}
              />
        </div>
      </LiveAPIProvider>
    </Layout>
  );
}
