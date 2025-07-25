import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  useSearchParams,
  useLocation,
  useNavigate,
  useBlocker,
} from "react-router-dom";
import Layout from "../layout/Layout";
import { ExamWorkflow } from "../components/ai-examiner/ExamWorkflow";
import { useGenAILiveContext } from "../../contexts/GenAILiveContext";
import { GenAILiveProvider } from "../../contexts/GenAILiveContext";
import { ReviewSetupModal } from "../components/ui/ReviewSetupModal";
import { ExamSimulator } from "../../types/ExamSimulator";
import { getSupabaseClient } from "../config/supabaseClient";
import {
  useLiveSuggestionExtractor,
  Suggestion,
} from "../hooks/useLiveSuggestionExtractor";
import { LiveSuggestionsPanel } from "../components/ui/LiveSuggestionsPanel";
import { LoadingAnimation } from "../components/ui/LoadingAnimation";
import cn from "classnames";
import { mediaStreamService } from "../lib/mediaStreamService";
import sessionService from "../lib/sessionService";
import { appLogger } from "../../lib/utils";
import { AI_CONFIG } from "../../config/aiConfig";
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
  initialRepoUrl?: string;
  isReadyForAutoTrigger?: boolean;
  onVoiceChangeReady: (handler: (newVoice: string) => void) => void;
  onEnvironmentChangeReady: (handler: (newEnvironment: string) => void) => void;
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
  initialRepoUrl,
  isReadyForAutoTrigger,
  onVoiceChangeReady,
  onEnvironmentChangeReady,
}: ExamPageContentProps) {
  const { client, connected } = useGenAILiveContext();

  // Create voice change handler and pass it up
  const handleVoiceChange = useCallback(
    async (newVoice: string) => {
      if (!connected) {
        // Voice preference saved (not in session)
        return;
      }

      try {
        // Changing voice during active session

        // Use the new changeVoice method that preserves session context
        const success = await client.changeVoice(newVoice);

        if (!success) {
          appLogger.error.session("Voice change failed");
        }
      } catch (error) {
        console.error("Error changing voice:", error);
      }
    },
    [client, connected]
  );

  // Create environment change handler and pass it up
  const handleEnvironmentChange = useCallback(
    async (newEnvironment: string) => {
      if (!connected) {
        // Environment preference saved (not in session)
        return;
      }

      try {
        // Changing environment during active session

        // Use the new changeEnvironment method that preserves session context
        const success = await client.changeEnvironment(newEnvironment);

        if (!success) {
          appLogger.error.session("Environment change failed");
        }
      } catch (error) {
        console.error("Error changing environment:", error);
      }
    },
    [client, connected]
  );

  // Pass the voice change handler up to parent
  useEffect(() => {
    onVoiceChangeReady(handleVoiceChange);
  }, [handleVoiceChange, onVoiceChangeReady]);

  // Pass the environment change handler up to parent
  useEffect(() => {
    onEnvironmentChangeReady(handleEnvironmentChange);
  }, [handleEnvironmentChange, onEnvironmentChangeReady]);

  useEffect(() => {
    if (client) {
      onClientReady(client);
    }
  }, [client, onClientReady]);

  // Track connection state for loading animation
  useEffect(() => {
    if (examIntentStarted && !connected) {
      // Connection starting logic
    } else if (connected) {
      // Connection established logic
    } else if (!examIntentStarted) {
      // Connection not started logic
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
          onLoadingStateChange={onLoadingStateChange}
          videoRef={videoRef}
          supportsVideo={true}
          onVideoStreamChange={setVideoStream}
          onButtonClicked={handleStartExamClicked}
          forceStopAudio={forceStopAudio}
          forceStopVideo={forceStopVideo}
          quickStartExam={quickStartExam}
          onButtonReady={onButtonReady}
          onScreenShareCancelled={onScreenShareCancelled}
          hideMainButton={!examIntentStarted}
          initialRepoUrl={initialRepoUrl}
          isReadyForAutoTrigger={isReadyForAutoTrigger}
          onEnvironmentChange={handleEnvironmentChange}
        />

        {/* Live Suggestions Panel - Now shown inline when review is active */}
        {examIntentStarted && AI_CONFIG.FEATURES.LIVE_SUGGESTION_EXTRACTION && (
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
    fullScan?: boolean;
  } | null;

  // Generate a temporary ID for quick start
  const id =
    examId ||
    (quickStartData?.quickStart ? `quickstart-${Date.now()}` : undefined);

  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Initialize videoStream state with the stream from the service
  useEffect(() => {
    const stream = mediaStreamService.getStream();
    if (stream && !videoStream) {
      // Received video stream from media stream service
      setVideoStream(stream);
    }
  }, [videoStream]);

  // This effect ensures the video element's srcObject is updated when videoStream changes.
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, videoRef]);

  // examIntentStarted is controlled by the ControlTrayCustom button
  const [examIntentStarted, setExamIntentStarted] = useState(false);

  // Track initialization phase to prevent redundant sessionService calls
  const isInitializingRef = useRef(true);
  const hasSessionStartedRef = useRef(false);

  // Manage sessionService calls explicitly only when sessions actually start/stop
  useEffect(() => {
    // Skip during initialization phase
    if (isInitializingRef.current) {
      return;
    }

    if (examIntentStarted && !hasSessionStartedRef.current) {
      // Session is actually starting
      hasSessionStartedRef.current = true;
      sessionService.startReview();
      appLogger.session.start();
    } else if (!examIntentStarted && hasSessionStartedRef.current) {
      // Session is actually stopping
      hasSessionStartedRef.current = false;
      sessionService.stopReview();
      appLogger.session.stop();
    }
  }, [examIntentStarted]);

  // Mark initialization as complete after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitializingRef.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Force stop audio flag for timer expiration
  const [forceStopAudio, setForceStopAudio] = useState(false);

  // Force stop video/screen sharing flag for timer expiration
  const [forceStopVideo, setForceStopVideo] = useState(false);

  // Store client reference for session termination
  const [genaiClient, setGenaiClient] = useState<any>(null);
  const genaiClientRef = useRef(genaiClient);
  genaiClientRef.current = genaiClient;

  const videoStreamRef = useRef(videoStream);
  videoStreamRef.current = videoStream;

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasSessionStartedRef.current &&
      currentLocation.pathname !== nextLocation.pathname
  );

  const cleanupAfterProceedRef = useRef(false);

  // Initialize live suggestion extractor
  const { suggestions, extractSuggestions, clearAllSuggestions, isProcessing } =
    useLiveSuggestionExtractor();

  // Store quick start exam data
  const [quickStartExam, setQuickStartExam] = useState<any>(null);

  // State for custom exam modal
  const [customExam, setCustomExam] = useState<ExamSimulator | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isReadyForAutoTrigger, setIsReadyForAutoTrigger] = useState(false);

  const [customRepoUrl, setCustomRepoUrl] = useState<string | undefined>();

  // Helper to queue a fallback that flips examIntentStarted after 2s if auto-trigger fails
  const queueAutoStartFallback = () => {
    if (autoTriggerTimeoutRef.current) {
      clearTimeout(autoTriggerTimeoutRef.current);
    }

    autoTriggerTimeoutRef.current = setTimeout(() => {
      if (shouldAutoTriggerRef.current && !hasAutoTriggeredRef.current) {
        // Show the tray to the user by starting the exam, but DO NOT clear the
        // auto-trigger flag; this ensures that once the tray mounts it will
        // still auto-click the hidden button to request permissions.
        setExamIntentStarted(true);
      }
    }, 2000);
  };

  // Track if we should auto-trigger the button when it becomes available
  const shouldAutoTriggerRef = useRef(false);
  const autoTriggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoTriggeredRef = useRef(false); // Track if we've already auto-triggered to prevent repeats

  // Create temporary exam for quick start
  useEffect(() => {
    if (quickStartData?.quickStart && !examId && !quickStartExam) {
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
        fullScan: quickStartData.fullScan, // Add fullScan option
      };
      setQuickStartExam(tempExam);
    }
  }, [
    quickStartData?.quickStart,
    examId,
    id,
    quickStartExam,
    quickStartData?.developerLevel,
    quickStartData?.fullScan,
    quickStartData?.repoUrl,
    quickStartData?.type,
  ]);

  // Auto-start exam for quick start with autoStart flag
  useEffect(() => {
    if (
      quickStartData?.autoStart &&
      quickStartExam &&
      !examIntentStarted &&
      !hasAutoTriggeredRef.current
    ) {
      shouldAutoTriggerRef.current = true;
      setIsReadyForAutoTrigger(true);

      // Set a timeout to trigger if the button doesn't become available quickly
      autoTriggerTimeoutRef.current = setTimeout(() => {
        if (shouldAutoTriggerRef.current && !hasAutoTriggeredRef.current) {
          // Only set examIntentStarted if we're past initialization
          if (!isInitializingRef.current) {
            setExamIntentStarted(true);
          }
          shouldAutoTriggerRef.current = false;
          hasAutoTriggeredRef.current = true;
        }
      }, 2000);
    }
  }, [quickStartData?.autoStart, quickStartExam, examIntentStarted]);

  // Permanently disable auto-trigger once any review starts
  useEffect(() => {
    if (examIntentStarted && !hasAutoTriggeredRef.current) {
      shouldAutoTriggerRef.current = false;
      hasAutoTriggeredRef.current = true;
      if (autoTriggerTimeoutRef.current) {
        clearTimeout(autoTriggerTimeoutRef.current);
        autoTriggerTimeoutRef.current = null;
      }
    }
  }, [examIntentStarted]);

  // This is the one true cleanup function.
  const shutdownSession = useCallback(() => {
    // Trigger audio stop through the forceStopAudio mechanism
    setForceStopAudio(true);

    // Then terminate the session
    if (genaiClientRef.current) {
      genaiClientRef.current.terminateSession();
    }

    // Stop all media tracks
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }

    // Update global state only if session was actually active
    if (hasSessionStartedRef.current) {
      sessionService.stopReview();
      hasSessionStartedRef.current = false;
    }

    // Reset component state
    setExamIntentStarted(false);
  }, [setVideoStream]);

  const handleEndReview = () => {
    // This function is now just a wrapper for UI state changes.
    setForceStopAudio(true);
    setForceStopVideo(true);
    appLogger.user.stopReview();
    shutdownSession();

    setTimeout(() => {
      setForceStopAudio(false);
      setForceStopVideo(false);
    }, 100);
  };

  // Handle timer expiration - reset state and force stop audio/video
  const handleTimerExpired = () => {
    shutdownSession();
    clearAllSuggestions();
  };

  const handleClientReady = useCallback((client: any) => {
    setGenaiClient(client);
  }, []);

  // Callback for when the control button is ready for auto-triggering
  const handleButtonReady = useCallback((triggerButton: () => void) => {
    if (shouldAutoTriggerRef.current && !hasAutoTriggeredRef.current) {
      shouldAutoTriggerRef.current = false;
      hasAutoTriggeredRef.current = true;

      if (autoTriggerTimeoutRef.current) {
        clearTimeout(autoTriggerTimeoutRef.current);
        autoTriggerTimeoutRef.current = null;
      }

      setTimeout(() => {
        triggerButton();
      }, 100);
    } else if (hasAutoTriggeredRef.current) {
      // Ignore subsequent calls
    } else {
      // Ignore button ready call
    }
  }, []);

  // Handle screen sharing cancellation in quick start - navigate back to landing page
  const handleScreenShareCancelled = useCallback(() => {
    // For quick start, go back to landing page and offer to reopen modal
    if (quickStartData?.quickStart) {
      navigate("/", { state: { reopenQuickStart: true } });
    }
    // For custom reviews, just reopen the setup modal on the same page
    else {
      setShowSetupModal(true);
    }
  }, [quickStartData?.quickStart, navigate]);

  // Terminate session on page reload/close
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasSessionStartedRef.current) {
        // Trigger audio stop through the forceStopAudio mechanism
        setForceStopAudio(true);
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Only shutdown if we're past initialization and have an active session
      if (!isInitializingRef.current && hasSessionStartedRef.current) {
        shutdownSession();
      }
    };
  }, [shutdownSession]);

  // Handle blocker state
  useEffect(() => {
    if (!blocker) return;

    if (blocker.state === "blocked") {
      const shouldLeave = window.confirm(
        "You have an active code review session. Are you sure you want to leave? The session will be terminated."
      );

      if (shouldLeave) {
        // Trigger audio stop through the forceStopAudio mechanism
        setForceStopAudio(true);
        // Mark that we still need to clean up once the navigation actually happens
        cleanupAfterProceedRef.current = true;
        blocker.proceed();
      } else {
        blocker.reset();
      }
    } else if (
      blocker.state === "unblocked" &&
      cleanupAfterProceedRef.current
    ) {
      // Navigation has finished; run cleanup exactly once
      cleanupAfterProceedRef.current = false;
      // Only shutdown if we have an active session
      if (hasSessionStartedRef.current) {
        shutdownSession();
      }
    }
  }, [blocker, shutdownSession]);

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
    const fetchApiKey = async () => {
      setIsLoadingKey(true);
      setApiKeyError(null);
      try {
        // Import the cached API key function
        const { getCachedApiKey } = await import("../utils/getCompletion.js");
        const key = await getCachedApiKey("prompt2");
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
      // Logging is now handled in ExamWorkflow.handleButtonClicked
    }
    // Removed the warning since pause/resume now uses different flow
  };

  // Fetch exam data when in custom mode (not quick start)
  useEffect(() => {
    if (!quickStartData?.quickStart && id) {
      const fetchExam = async () => {
        try {
          const supabaseClient = await getSupabaseClient();
          const { data, error } = await supabaseClient
            .from("exams")
            .select("*")
            .eq("id", id)
            .single();

          if (!error && data) {
            setCustomExam(data as ExamSimulator);
            // Only open modal if we are not already in autoStart flow or exam started
            if (!quickStartData?.autoStart && !examIntentStarted) {
              setShowSetupModal(true);
            }
          }
        } catch (error) {
          console.error("Error fetching exam data:", error);
        }
      };
      fetchExam();
    }
  }, [
    quickStartData?.quickStart,
    quickStartData?.autoStart,
    id,
    examIntentStarted,
  ]);

  // Handler for custom modal start
  const handleCustomStartReview = (
    reviewType: string,
    developerLevel: string,
    repoUrl?: string,
    fullScan?: boolean
  ) => {
    // store repo url for ExamWorkflow usage
    setCustomRepoUrl(repoUrl);

    // Create a unified exam object that merges the stored exam data with user selections
    if (customExam) {
      const unifiedExam = {
        ...customExam,
        repoUrl: repoUrl,
        fullScan: fullScan,
      };
      setQuickStartExam(unifiedExam);
    }

    // Trigger automatic start just like quick-start flow
    shouldAutoTriggerRef.current = true;
    setIsReadyForAutoTrigger(true);
    queueAutoStartFallback();

    // Close the modal
    setShowSetupModal(false);
  };

  const [voiceChangeHandler, setVoiceChangeHandler] = useState<
    ((newVoice: string) => void) | null
  >(null);

  const [environmentChangeHandler, setEnvironmentChangeHandler] = useState<
    ((newEnvironment: string) => void) | null
  >(null);

  const handleVoiceChangeReady = (handler: (newVoice: string) => void) => {
    setVoiceChangeHandler(() => handler);
  };

  const handleEnvironmentChangeReady = (
    handler: (newEnvironment: string) => void
  ) => {
    setEnvironmentChangeHandler(() => handler);
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
    <Layout
      onVoiceChange={voiceChangeHandler || undefined}
      onEnvironmentChange={environmentChangeHandler || undefined}
      isSessionActive={examIntentStarted}
    >
      <GenAILiveProvider apiKey={geminiApiKey}>
        {/* Custom exam setup modal */}
        {showSetupModal && customExam && (
          <ReviewSetupModal
            isOpen={showSetupModal}
            onClose={() => {
              setShowSetupModal(false);
              navigate("/");
            }}
            onStartReview={handleCustomStartReview}
            fixedType={customExam.type}
            fixedDeveloperLevel={customExam.learning_goals}
            examTitle={customExam.title}
            examDescription={customExam.description}
          />
        )}
        <ExamPageContent
          id={id}
          videoRef={videoRef}
          videoStream={videoStream}
          setVideoStream={setVideoStream}
          examIntentStarted={examIntentStarted}
          handleStartExamClicked={handleStartExamClicked}
          onEndReview={handleEndReview}
          onTimerExpired={handleTimerExpired}
          triggerManualStop={false}
          onClientReady={handleClientReady}
          forceStopAudio={forceStopAudio}
          forceStopVideo={forceStopVideo}
          onTranscriptChunk={extractSuggestions}
          suggestions={suggestions}
          isProcessing={isProcessing}
          onLoadingStateChange={() => {}}
          quickStartExam={quickStartExam}
          onButtonReady={handleButtonReady}
          onScreenShareCancelled={handleScreenShareCancelled}
          initialRepoUrl={quickStartData?.repoUrl || customRepoUrl}
          isReadyForAutoTrigger={isReadyForAutoTrigger}
          onVoiceChangeReady={handleVoiceChangeReady}
          onEnvironmentChangeReady={handleEnvironmentChangeReady}
        />
      </GenAILiveProvider>
    </Layout>
  );
}
