import React, { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LiveAPIProvider } from "../contexts/LiveAPIContext";
import { useExamSimulators } from "../contexts/ExamSimulatorContext";
import SidePanel from "../components/side-panel/SidePanel";
import { Altair } from "../components/altair/Altair";
import ControlTrayCustom from "../components/control-tray-custom/ControlTrayCustom";
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
        <div className="streaming-console max-w-2xl mx-auto">
          {/* <SidePanel /> */}
          <main>
            <div className="">
              <h1 className="mb-8 font-bold text-2xl">
                Welcome to your {examSimulator.title} exam
              </h1>
              <h2 className="mb-12 line-clamp-2">
                <strong>Task: </strong>{examSimulator.task}
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
              <ControlTrayCustom
                videoRef={videoRef}
                supportsVideo={true}
                onVideoStreamChange={setVideoStream}
              >
                {/* put your own buttons here */}
              </ControlTrayCustom>

            </div>
          </main>
        </div>
      </LiveAPIProvider>
    </Layout>
  );
}
