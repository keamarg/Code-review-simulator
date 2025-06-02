import React, { useRef, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Layout from "../layout/Layout";
import ControlTrayCustom from "../components/control-tray-custom/ControlTrayCustom";
import { ExamWorkflow } from "../components/ai-examiner/ExamWorkflow";
import { useGenAILiveContext } from "../../contexts/GenAILiveContext";
import { GenAILiveProvider } from "../../contexts/GenAILiveContext";
import {
  useLiveSuggestionExtractor,
  Suggestion,
} from "../hooks/useLiveSuggestionExtractor";
import { LiveSuggestionsPanel } from "../components/ui/LiveSuggestionsPanel";
import { LoadingAnimation } from "../components/ui/LoadingAnimation";
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
  onEndReview: () => void;
  onTimerExpired: () => void;
  triggerManualStop: boolean;
  onClientReady: (client: any) => void;
  forceStopAudio: boolean;
  forceStopVideo: boolean;
  onTranscriptChunk: (chunk: string) => void;
  suggestions: Suggestion[];
  isProcessing: boolean;
  onLoadingStateChange: (isLoading: boolean) => void;
}

function ExamPageContent({
  id,
  videoRef,
  videoStream,
  setVideoStream,
  examIntentStarted,
  handleStartExamClicked,
  onEndReview,
  onTimerExpired,
  triggerManualStop,
  onClientReady,
  forceStopAudio,
  forceStopVideo,
  onTranscriptChunk,
  suggestions,
  isProcessing,
  onLoadingStateChange,
}: ExamPageContentProps) {
  const { client, connected } = useGenAILiveContext();
  const hasNotifiedScreenShareRef = useRef(true);
  const [hasExamEverStarted, setHasExamEverStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTaskLoading, setIsTaskLoading] = useState(false);

  useEffect(() => {
    if (
      videoStream &&
      client &&
      connected &&
      hasNotifiedScreenShareRef.current
    ) {
      try {
        client.send([
          {
            // text: "Ask the user to share their screen. Please acknowledge this and wait for my cue before starting the review.", // DISABLED
          },
        ]);
        hasNotifiedScreenShareRef.current = false;
      } catch (error) {
        console.error("Failed to send screen share notification:", error);
      }
    }
  }, [videoStream, client, connected]);

  useEffect(() => {
    if (examIntentStarted) {
      setHasExamEverStarted(true);
    }
  }, [examIntentStarted]);

  useEffect(() => {
    if (client) {
      onClientReady(client);
    }
  }, [client, onClientReady]);

  // Track connection state for loading animation
  useEffect(() => {
    if (examIntentStarted && !connected) {
      setIsConnecting(true);
    } else if (connected) {
      setIsConnecting(false);
    } else if (!examIntentStarted) {
      setIsConnecting(false);
    }
  }, [examIntentStarted, connected]);

  return (
    <div className="streaming-console max-w-2xl mx-auto flex flex-col">
      <div className="pt-10 pr-10 pl-10 mb-10 flex justify-center flex-col">
        <h1 className="mb-8 font-bold text-2xl text-tokyo-fg-bright text-center">
          AI Code Review
        </h1>

        <ExamWorkflow
          examId={id}
          examIntentStarted={examIntentStarted}
          onTimerExpired={onTimerExpired}
          onManualStop={onEndReview}
          onTranscriptChunk={onTranscriptChunk}
          liveSuggestions={suggestions}
          onLoadingStateChange={setIsTaskLoading}
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
          onButtonClicked={handleStartExamClicked}
          hasExamStarted={hasExamEverStarted}
          forceStopAudio={forceStopAudio}
          forceStopVideo={forceStopVideo}
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

      {/* Live Suggestions Panel */}
      <LiveSuggestionsPanel
        suggestions={suggestions}
        isProcessing={isProcessing}
        isVisible={examIntentStarted}
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

  // Force stop audio flag for timer expiration
  const [forceStopAudio, setForceStopAudio] = useState(false);

  // Force stop video/screen sharing flag for timer expiration
  const [forceStopVideo, setForceStopVideo] = useState(false);

  // Trigger for manual stop
  const [triggerManualStop, setTriggerManualStop] = useState(false);

  // Add guard to prevent cascading state changes during cleanup
  const isManualStopInProgress = useRef(false);

  // Store client reference for session termination
  const [genaiClient, setGenaiClient] = useState<any>(null);

  // Track task loading state
  const [isTaskLoading, setIsTaskLoading] = useState(false);

  // Initialize live suggestion extractor
  const {
    suggestions,
    persistedSuggestions,
    extractSuggestions,
    clearAllSuggestions,
    isProcessing,
  } = useLiveSuggestionExtractor();

  const navigate = useNavigate();

  const handleEndReview = () => {
    // Terminate the AI session completely if client is available
    if (genaiClient) {
      genaiClient.terminateSession();
    }

    // Force stop audio and video, end the exam
    setForceStopAudio(true);
    setForceStopVideo(true);
    setExamIntentStarted(false);

    // Reset force stop after a longer delay to ensure everything stops
    setTimeout(() => {
      setForceStopAudio(false);
      setForceStopVideo(false);
    }, 3000);
  };

  // Add a new handler for summary modal close
  const handleSummaryModalClose = () => {
    navigate("/dashboard");
  };

  // Handle timer expiration - reset state and force stop audio/video
  const handleTimerExpired = () => {
    // Terminate the AI session completely if client is available
    if (genaiClient) {
      genaiClient.terminateSession();
    }

    // Force stop audio and video, end the exam
    setForceStopAudio(true);
    setForceStopVideo(true);
    setExamIntentStarted(false);

    // Clear all suggestions since review is complete
    clearAllSuggestions();

    // Reset force stop after a delay
    setTimeout(() => {
      setForceStopAudio(false);
      setForceStopVideo(false);
    }, 3000);
  };

  // Handle manual stop - show summary instead of immediate redirect
  const handleManualStop = () => {
    console.log("🛑 Manual stop initiated");
    handleEndReview();
  };

  const handleClientReady = useCallback((client: any) => {
    setGenaiClient(client);
  }, []);

  // Terminate session on page reload/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (genaiClient) {
        genaiClient.terminateSession();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Also terminate on component unmount
      if (genaiClient) {
        genaiClient.terminateSession();
      }
    };
  }, [genaiClient]);

  // Stop video stream when forceStopVideo is triggered
  useEffect(() => {
    if (forceStopVideo && videoStream) {
      // Stop all tracks in the video stream to end screen sharing
      videoStream.getTracks().forEach((track) => {
        track.stop();
      });
      setVideoStream(null);
    }
  }, [forceStopVideo, videoStream]);

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
        <LoadingAnimation isLoading={true} />
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
          onEndReview={handleEndReview}
          onTimerExpired={handleTimerExpired}
          triggerManualStop={triggerManualStop}
          onClientReady={handleClientReady}
          forceStopAudio={forceStopAudio}
          forceStopVideo={forceStopVideo}
          onTranscriptChunk={extractSuggestions}
          suggestions={suggestions}
          isProcessing={isProcessing}
          onLoadingStateChange={setIsTaskLoading}
        />
      </GenAILiveProvider>
    </Layout>
  );
}
