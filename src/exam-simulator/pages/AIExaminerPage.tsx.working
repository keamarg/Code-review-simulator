import React, { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ExamWorkflow } from "../components/ai-examiner/ExamWorkflow";
import ControlTrayCustom from "../components/control-tray-custom/ControlTrayCustom";
import Layout from "../layout/Layout";
import { useGenAILiveContext } from "../../contexts/GenAILiveContext";
import { GenAILiveProvider } from "../../contexts/GenAILiveContext";
import cn from "classnames";
// supabase might not be needed here anymore if ExamWorkflow handles all supabase interactions
// import { supabase } from "../config/supabaseClient";

interface ExamPageContentProps {
  id: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  videoStream: MediaStream | null;
  setVideoStream: (stream: MediaStream | null) => void;
  examIntentStarted: boolean;
  handleStartExamClicked: (isButtonOn: boolean) => void;
}

function ExamPageContent({
  id,
  videoRef,
  videoStream,
  setVideoStream,
  examIntentStarted,
  handleStartExamClicked,
}: ExamPageContentProps) {
  const { client, connected } = useGenAILiveContext();
  const hasNotifiedScreenShareRef = useRef(true);
  const [hasExamEverStarted, setHasExamEverStarted] = useState(false);

  useEffect(() => {
    if (
      videoStream &&
      client &&
      connected &&
      hasNotifiedScreenShareRef.current
    ) {
      console.log("Attempting to send screen share notification...");
      try {
        client.send([
          {
            text: "Ask the user to share their screen. Please acknowledge this and wait for my cue before starting the review.",
          },
        ]);
        hasNotifiedScreenShareRef.current = false;
        console.log("Screen share notification sent and ref set to false.");
      } catch (error) {
        console.error("Failed to send screen share notification:", error);
      }
    }
  }, [videoStream, client, connected]);

  useEffect(() => {
    if (!examIntentStarted) {
      // Reset when exam intent stops, allowing notification for the next session
      console.log(
        "Exam intent stopped. Resetting screen share notification ref."
      );
      hasNotifiedScreenShareRef.current = true;
    } else {
      // Mark that exam has been started at least once
      setHasExamEverStarted(true);
    }
  }, [examIntentStarted]);

  return (
    <div className="streaming-console max-w-2xl mx-auto flex flex-col">
      <div className="pt-10 pr-10 pl-10 mb-10 flex justify-center flex-col">
        <h1 className="mb-8 font-bold text-2xl text-tokyo-fg-bright text-center">
          AI Code Review Exam
        </h1>

        <ExamWorkflow examId={id} examIntentStarted={examIntentStarted} />

        <video
          className={cn({
            hidden: !videoRef.current || !videoStream,
          })}
          style={{
            width: "20%",
            position: "fixed",
            bottom: "25px",
            right: "25px",
            opacity: "0",
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
        onButtonClicked={handleStartExamClicked}
        hasExamStarted={hasExamEverStarted}
      />
    </div>
  );
}

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || undefined; // This is the examId

  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // examIntentStarted is controlled by the ControlTrayCustom button
  const [examIntentStarted, setExamIntentStarted] = useState(false);

  useEffect(() => {
    const apiKeyEndpoint =
      "https://api-key-server-codereview.vercel.app/api/prompt2";
    const fetchApiKey = async () => {
      setIsLoadingKey(true);
      setApiKeyError(null);
      try {
        const response = await fetch(apiKeyEndpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch API key: ${response.statusText}`);
        }
        const key = await response.json();
        if (!key || typeof key !== "string") {
          throw new Error("Invalid API key format received");
        }
        setGeminiApiKey(key);
      } catch (err) {
        console.error("Error fetching API key:", err);
        setApiKeyError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred fetching API key"
        );
      } finally {
        setIsLoadingKey(false);
      }
    };
    fetchApiKey();
  }, []);

  const handleStartExamClicked = (isButtonOn: boolean) => {
    if (isButtonOn) {
      setExamIntentStarted(true);
    } else {
      setExamIntentStarted(false);
    }
  };

  if (isLoadingKey) {
    return (
      <Layout>
        <div>Loading API Key...</div>
      </Layout>
    );
  }

  if (apiKeyError) {
    return (
      <Layout>
        <div className="text-tokyo-fg-bright">
          Error loading API Key: {apiKeyError}
        </div>
      </Layout>
    );
  }

  if (!geminiApiKey) {
    return (
      <Layout>
        <div>API Key not available. Cannot start exam.</div>
      </Layout>
    );
  }

  if (!id) {
    return (
      <Layout>
        <div>No Exam ID specified in URL.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <GenAILiveProvider apiKey={geminiApiKey}>
        <ExamPageContent
          id={id}
          videoRef={videoRef}
          videoStream={videoStream}
          setVideoStream={setVideoStream}
          examIntentStarted={examIntentStarted}
          handleStartExamClicked={handleStartExamClicked}
        />
      </GenAILiveProvider>
    </Layout>
  );
}
