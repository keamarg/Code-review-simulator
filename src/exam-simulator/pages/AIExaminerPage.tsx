import React, { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { LiveAPIProvider } from "../../contexts/LiveAPIContext";
import { ExamWorkflow } from "../components/ai-examiner/ExamWorkflow"; // New component
import ControlTrayCustom from "../components/control-tray-custom/ControlTrayCustom";
import cn from "classnames";
import Layout from "../layout/Layout";
// supabase might not be needed here anymore if ExamWorkflow handles all supabase interactions
// import { supabase } from "../config/supabaseClient"; 
import { useLiveAPIContext } from "../../contexts/LiveAPIContext"; // For PageContent

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

// Define PageContent sub-component here or import if it were in a separate file
interface PageContentProps {
  examId: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  videoStream: MediaStream | null;
  setVideoStream: (stream: MediaStream | null) => void;
  examIntentStarted: boolean;
  handleStartExamClicked: (isButtonOn: boolean) => void;
}

function PageContent({ 
  examId, 
  videoRef, 
  videoStream, 
  setVideoStream, 
  examIntentStarted,
  handleStartExamClicked 
}: PageContentProps) {
  const { client, connected } = useLiveAPIContext();
  const hasNotifiedScreenShareRef = useRef(true);

  useEffect(() => {
    if (videoStream && client && connected && hasNotifiedScreenShareRef.current) {
      console.log("Attempting to send screen share notification...");
      try {
        client.send([{ text: "The user has started sharing their screen. Please acknowledge this and wait for my cue before starting the review." }]);
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
      console.log("Exam intent stopped. Resetting screen share notification ref.");
      hasNotifiedScreenShareRef.current = true;
    }
  }, [examIntentStarted]);

  return (
    <div className="streaming-console max-w-2xl mx-auto flex flex-col">
      <div className="pt-10 pr-10 pl-10 mb-10 flex justify-center flex-col">
        <h1 className="mb-8 font-bold text-2xl text-tokyo-fg-bright text-center">
          AI Code Review Exam
        </h1>
        
        <ExamWorkflow
          examId={examId}
          examIntentStarted={examIntentStarted}
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
  const [apiKeyError, setApiKeyError] = useState<string | null>(null); // Renamed error state for clarity

  useEffect(() => {
    const apiKeyEndpoint = "https://api-key-server-codereview.vercel.app/api/prompt2";
    const fetchApiKey = async () => {
      setIsLoadingKey(true);
      setApiKeyError(null);
      try {
        const response = await fetch(apiKeyEndpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch API key: ${response.statusText}`);
        }
        const key = await response.json(); // Assume it's the key string directly or { key: "value" }
        if (!key || typeof key !== "string") { // Adjust if key is in an object
          throw new Error("Invalid API key format received");
        }
        setGeminiApiKey(key);
      } catch (err) {
        console.error("Error fetching API key:", err);
        setApiKeyError(
          err instanceof Error ? err.message : "An unknown error occurred fetching API key"
        );
      } finally {
        setIsLoadingKey(false);
      }
    };
    fetchApiKey();
  }, []);

  // examIntentStarted is controlled by the ControlTrayCustom button
  const [examIntentStarted, setExamIntentStarted] = useState(false);

  const handleStartExamClicked = (isButtonOn: boolean) => {
    if (isButtonOn) {
      setExamIntentStarted(true); // User intends to start
    } else {
      setExamIntentStarted(false); // User intends to stop/reset (if applicable)
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
      <LiveAPIProvider url={uri} apiKey={geminiApiKey}>
        <div className="streaming-console max-w-2xl mx-auto flex flex-col">
          <div className="pt-10 pr-10 pl-10 mb-10 flex justify-center flex-col">
            {/* Title might need to be fetched by ExamWorkflow and passed up, or ExamWorkflow renders it */}
            {/* For now, keep a generic title or let ExamWorkflow handle its own title */}
             <h1 className="mb-8 font-bold text-2xl text-tokyo-fg-bright text-center">
              AI Code Review Exam
            </h1>
            
            <ExamWorkflow
              examId={id}
              examIntentStarted={examIntentStarted}
              // onExamStarted is now handled internally by ExamWorkflow if CountdownTimer moves there
            />
            
            <video
              className={cn({
                hidden: !videoRef.current || !videoStream, // videoStream comes from ControlTrayCustom
              })}
              style={{
                width: "20%",
                position: "fixed",
                bottom: "25px",
                right: "25px",
                opacity: "0", // This style likely makes the video invisible
              }}
              ref={videoRef}
              autoPlay
              playsInline
            />
          </div>

          <ControlTrayCustom
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream} // Manages video stream state
            onButtonClicked={handleStartExamClicked} // Manages examIntentStarted state
          />
        </div>
      </LiveAPIProvider>
    </Layout>
  );
}
