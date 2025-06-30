import React, { useRef, useState, useEffect, useCallback } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
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
  quickStartExam: any;
  onButtonReady: (triggerButton: () => void) => void;
  onScreenShareCancelled?: () => void;
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
  quickStartExam,
  onButtonReady,
  onScreenShareCancelled,
}: ExamPageContentProps) {
  const { client, connected } = useGenAILiveContext();
  const hasNotifiedScreenShareRef = useRef(true);
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

  // Monitor examIntentStarted state changes for debugging
  useEffect(() => {
    // Removed excessive logging to prevent button blinking
  }, [examIntentStarted, videoStream, forceStopAudio, forceStopVideo]);

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
          forceStopAudio={forceStopAudio}
          forceStopVideo={forceStopVideo}
          quickStartExam={quickStartExam}
          onButtonReady={onButtonReady}
          onScreenShareCancelled={onScreenShareCancelled}
        />

        {/* Live Suggestions Panel - Now shown inline when review is active */}
        {examIntentStarted && videoStream && (
          <div className="mt-8">
            <LiveSuggestionsPanel
              suggestions={suggestions}
              isProcessing={isProcessing}
              isVisible={true}
            />
          </div>
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
            opacity: "0",
          }}
          ref={videoRef}
          autoPlay
          playsInline
        />
      </div>

      {/* Remove the popup window completely */}
    </div>
  );
}

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle quick start or regular exam ID
  const examId = searchParams.get("id");
  const quickStartData = location.state as {
    quickStart?: boolean;
    autoStart?: boolean;
    type?: string;
    developerLevel?: string;
    repoUrl?: string;
  } | null;

  // Generate a temporary ID for quick start sessions
  const id =
    examId ||
    (quickStartData?.quickStart ? `quickstart-${Date.now()}` : undefined);

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

  // Store quick start exam data
  const [quickStartExam, setQuickStartExam] = useState<any>(null);

  // Track if we should auto-trigger the button when it becomes available
  const shouldAutoTriggerRef = useRef(false);
  const autoTriggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoTriggeredRef = useRef(false); // Track if we've already auto-triggered to prevent repeats

  // Create temporary exam for quick start
  useEffect(() => {
    if (quickStartData?.quickStart && !examId) {
      const tempExam = {
        id: id,
        title:
          quickStartData.type === "Github Repo"
            ? "GitHub Repository Review"
            : "General Code Review",
        description:
          quickStartData.type === "Github Repo"
            ? `Code review of GitHub repository: ${
                quickStartData.repoUrl || "Repository URL not provided"
              }`
            : "A general code review session focusing on code quality improvements and best practices.",
        type: quickStartData.type || "Standard",
        duration: 0, // No duration limit for quick start
        learning_goals: quickStartData.developerLevel || "intermediate",
        is_public: false,
        created_at: new Date().toISOString(),
        user_id: "quickstart",
        repoUrl: quickStartData.repoUrl, // Add repo URL for GitHub type
      };
      setQuickStartExam(tempExam);
      console.log("🚀 Quick start exam created:", tempExam);
    }
  }, [quickStartData, examId, id]);

  // Auto-start exam for quick start with autoStart flag
  useEffect(() => {
    if (
      quickStartData?.autoStart &&
      quickStartExam &&
      !examIntentStarted &&
      !hasAutoTriggeredRef.current
    ) {
      console.log(
        "🚀 Auto-start requested - setting trigger flag (initial load only)"
      );
      shouldAutoTriggerRef.current = true;

      // Set a timeout to trigger if the button doesn't become available quickly
      autoTriggerTimeoutRef.current = setTimeout(() => {
        if (shouldAutoTriggerRef.current && !hasAutoTriggeredRef.current) {
          console.log("🚀 Auto-start timeout - triggering manual start");
          setExamIntentStarted(true);
          shouldAutoTriggerRef.current = false;
          hasAutoTriggeredRef.current = true;
        }
      }, 2000);
    }
  }, [quickStartData?.autoStart, quickStartExam, examIntentStarted]);

  // Permanently disable auto-trigger once any review starts
  useEffect(() => {
    if (examIntentStarted && !hasAutoTriggeredRef.current) {
      console.log(
        "🚀 Review started - permanently disabling auto-trigger for this session"
      );
      shouldAutoTriggerRef.current = false;
      hasAutoTriggeredRef.current = true;
      if (autoTriggerTimeoutRef.current) {
        clearTimeout(autoTriggerTimeoutRef.current);
        autoTriggerTimeoutRef.current = null;
      }
    }
  }, [examIntentStarted]);

  const handleEndReview = () => {
    console.log("🛑 AIExaminerPage: handleEndReview called", {
      examIntentStarted,
      forceStopAudio,
      forceStopVideo,
    });

    // Reset auto-trigger flag to prevent inappropriate re-triggering
    shouldAutoTriggerRef.current = false;
    // Note: NOT resetting hasAutoTriggeredRef here - we want it to stay true
    // to prevent auto-trigger from starting new reviews after this review ends
    if (autoTriggerTimeoutRef.current) {
      clearTimeout(autoTriggerTimeoutRef.current);
      autoTriggerTimeoutRef.current = null;
    }

    // Terminate the AI session completely if client is available
    if (genaiClient) {
      console.log("🛑 AIExaminerPage: Terminating genaiClient session");
      genaiClient.terminateSession();
    }

    // Force stop audio and video, end the exam
    console.log(
      "🛑 AIExaminerPage: Setting force stop flags and examIntentStarted to false"
    );
    setForceStopAudio(true);
    setForceStopVideo(true);
    setExamIntentStarted(false);

    // Reset force stop after a longer delay to ensure everything stops
    setTimeout(() => {
      console.log("🛑 AIExaminerPage: Resetting force stop flags");
      setForceStopAudio(false);
      setForceStopVideo(false);
    }, 3000);
  };

  // Add a new handler for summary modal close
  const handleSummaryModalClose = () => {
    // For quick start, go back to home instead of dashboard
    if (quickStartData?.quickStart) {
      navigate("/");
    } else {
      navigate("/dashboard");
    }
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

  // Callback for when the control button is ready for auto-triggering
  const handleButtonReady = useCallback((triggerButton: () => void) => {
    if (shouldAutoTriggerRef.current && !hasAutoTriggeredRef.current) {
      console.log("🚀 Button ready - triggering auto-start");
      shouldAutoTriggerRef.current = false;
      hasAutoTriggeredRef.current = true; // Mark as triggered to prevent repeats

      // Clear timeout since we're triggering now
      if (autoTriggerTimeoutRef.current) {
        clearTimeout(autoTriggerTimeoutRef.current);
        autoTriggerTimeoutRef.current = null;
      }

      // Small delay to ensure everything is initialized
      setTimeout(() => {
        triggerButton();
      }, 100);
    } else if (hasAutoTriggeredRef.current) {
      console.log(
        "🚫 Auto-trigger already completed - ignoring subsequent calls"
      );
    } else {
      console.log("🚫 Auto-trigger flag not set - ignoring button ready call");
    }
  }, []);

  // Handle screen sharing cancellation in quick start - navigate back to landing page
  const handleScreenShareCancelled = useCallback(() => {
    if (quickStartData?.quickStart) {
      console.log(
        "🚫 Screen sharing cancelled in quick start - returning to landing page"
      );
      navigate("/", { state: { reopenQuickStart: true } });
    }
  }, [quickStartData?.quickStart, navigate]);

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
      // Clean up auto-trigger timeout
      if (autoTriggerTimeoutRef.current) {
        clearTimeout(autoTriggerTimeoutRef.current);
      }
    };
  }, [genaiClient]);

  // Stop video stream when forceStopVideo is triggered
  useEffect(() => {
    if (forceStopVideo && videoStream) {
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
    console.log("🎛️ AIExaminerPage: handleStartExamClicked called", {
      isButtonOn,
      currentExamIntentStarted: examIntentStarted,
    });

    // Only handle starting the exam - stopping is handled by the red button
    if (isButtonOn) {
      console.log("🎛️ AIExaminerPage: Setting examIntentStarted to true");
      setExamIntentStarted(true);
    } else {
      console.log(
        "⚠️ AIExaminerPage: handleStartExamClicked called with false - this should not happen anymore!"
      );
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
        <div className="text-tokyo-fg-bright text-center py-8">
          <h2 className="text-xl font-bold mb-4">No Code Review Session</h2>
          <p className="mb-4">
            No exam ID specified and no quick start data found.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-tokyo-accent hover:bg-tokyo-accent-darker text-white px-6 py-2 rounded-md transition-colors"
          >
            Go to Home
          </button>
        </div>
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
          quickStartExam={quickStartExam}
          onButtonReady={handleButtonReady}
          onScreenShareCancelled={handleScreenShareCancelled}
        />
      </GenAILiveProvider>
    </Layout>
  );
}
