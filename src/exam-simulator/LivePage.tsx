import React, { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import { useExamSimulators } from "../contexts/ExamSimulatorContext";
import SidePanel from "../components/side-panel/SidePanel";
import { Altair } from "../components/altair/Altair";
import ControlTray from "../components/control-tray/ControlTray";
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

  console.log(examSimulator);

  return (
    <Layout>
      <LiveAPIProvider url={uri} apiKey={API_KEY}>
        <div className="streaming-console">
          {/* <SidePanel /> */}
          <main>
            <div className="">
              <h1 className="mb-4 font-bold text-2xl">
                Welcome to your {examSimulator.title} exam
              </h1>
              <h2>
                To get started{" "}
                <ol className="list-[auto] list-outside ml-4 pl-4">
                  <li>Click on the blue Play button ▶️</li>
                  <li>Share your screen 🖥️</li>
                  <li>Say hi to your AI examiner 👋</li>
                </ol>
              </h2>
              <Altair examSimulator={examSimulator} />
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
    </Layout>
  );
}
