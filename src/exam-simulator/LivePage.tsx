import React, { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import { useExamSimulators } from "../contexts/ExamSimulatorContext";
import SidePanel from "../components/side-panel/SidePanel";
import { Altair } from "../components/altair/Altair";
import ControlTray from "../components/control-tray/ControlTray";
import cn from "classnames";

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
  // Find the matching examSimulator by id, or fall back to the first one  
  const examSimulator =
    (id && examSimulators.find((exam) => exam.id === id)) || examSimulators[0];
  
  console.log(examSimulator);
    
  return (
    <LiveAPIProvider url={uri} apiKey={API_KEY}>
      <h1>Velkommen til din {examSimulator.title} eksamen</h1>
      <div className="streaming-console">
        <SidePanel />
        <main>
          <div className="main-app-area">
            <Altair examSimulator={examSimulator} />
            <video
              className={cn("stream", {
                hidden: !videoRef.current || !videoStream,
              })}
              ref={videoRef}
              autoPlay
              playsInline
            />
          </div>
          <ControlTray
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
          >
            {/* put your own buttons here */}
          </ControlTray>
        </main>
      </div>
    </LiveAPIProvider>
  );
}
