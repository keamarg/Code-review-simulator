import React, { useRef, useState, useEffect, useCallback } from "react";
import { useSearchParams, useLocation, useNavigate, useBlocker } from "react-router-dom";
import Layout from "../layout/Layout";
import { CodeReviewWorkflow } from "../components/code-review/CodeReviewWorkflow.impl";
import { GenAILiveProvider } from "../../contexts/GenAILiveContext";
import { ReviewSetupModal } from "../components/ui/ReviewSetupModal";
import { getSupabaseClient } from "../config/supabaseClient";
import { useLiveSuggestionExtractor } from "../hooks/useLiveSuggestionExtractor";
import { LiveSuggestionsPanel } from "../components/ui/LiveSuggestionsPanel";
import { UserPromptInput } from "../components/ui/UserPromptInput";
import { LoadingAnimation } from "../components/ui/LoadingAnimation";
import cn from "classnames";
import { mediaStreamService } from "../lib/mediaStreamService";
import sessionService from "../lib/sessionService";
import { appLogger } from "../../lib/utils";
import { AI_CONFIG } from "../../config/aiConfig";

export default function CodeReviewPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const reviewId = searchParams.get("id");
  const quickStartData = (location.state as any) || null;

  const id = reviewId || (quickStartData?.quickStart ? `quickstart-${Date.now()}` : undefined);

  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  useEffect(() => {
    const stream = mediaStreamService.getStream();
    if (stream && !videoStream) setVideoStream(stream);
  }, [videoStream]);

  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream, videoRef]);

  const [reviewIntentStarted, setReviewIntentStarted] = useState(false);
  const isInitializingRef = useRef(true);
  const hasSessionStartedRef = useRef(false);
  const hasEverStartedRef = useRef(false);

  useEffect(() => {
    if (isInitializingRef.current) return;
    if (reviewIntentStarted && !hasSessionStartedRef.current) {
      hasSessionStartedRef.current = true;
      hasEverStartedRef.current = true;
      sessionService.startReview();
      appLogger.session.start();
    } else if (!reviewIntentStarted && hasSessionStartedRef.current) {
      hasSessionStartedRef.current = false;
      sessionService.stopReview();
      appLogger.session.stop();
    }
  }, [reviewIntentStarted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      isInitializingRef.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const [forceStopAudio, setForceStopAudio] = useState(false);
  const [forceStopVideo, setForceStopVideo] = useState(false);
  const genaiClientRef = useRef<any>(null);
  const [requestedVoice, setRequestedVoice] = useState<string | undefined>(
    localStorage.getItem("ai_voice_setting") || undefined,
  );

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasSessionStartedRef.current && currentLocation.pathname !== nextLocation.pathname,
  );
  const cleanupAfterProceedRef = useRef(false);

  const { suggestions, extractSuggestions, clearAllSuggestions, isProcessing } =
    useLiveSuggestionExtractor();

  const [quickStartReview, setQuickStartReview] = useState<any>(null);
  const [customReview, setCustomReview] = useState<any>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isReadyForAutoTrigger, setIsReadyForAutoTrigger] = useState(false);
  const [customRepoUrl, setCustomRepoUrl] = useState<string | undefined>();
  const shouldAutoTriggerRef = useRef(false);
  const autoTriggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoTriggeredRef = useRef(false);
  const [shouldFadeInSessionUi, setShouldFadeInSessionUi] = useState(false);
  const [uiFadeReady, setUiFadeReady] = useState(false);
  const handleSharingReady = useCallback(() => {
    const fontsAny = (document as any).fonts;
    const ready: Promise<any> | undefined = fontsAny?.ready;
    if (ready && typeof ready.then === "function") {
      ready.then(() => setShouldFadeInSessionUi(true)).catch(() => setShouldFadeInSessionUi(true));
    } else {
      setShouldFadeInSessionUi(true);
    }
  }, []);

  useEffect(() => {
    const fetchApiKey = async () => {
      setIsLoadingKey(true);
      setApiKeyError(null);
      try {
        const { API_GEMINI_ENDPOINT } = await import("../../config/urls");
        const response = await fetch(API_GEMINI_ENDPOINT, { method: "GET" });
        if (!response.ok) throw new Error(`Failed to load API key (${response.status})`);
        const key = await response.json();
        if (!key || typeof key !== "string") throw new Error("Invalid API key format received");
        setGeminiApiKey(key);
      } catch (err) {
        appLogger.error.general(err instanceof Error ? err.message : String(err));
        setApiKeyError(
          err instanceof Error ? err.message : "An unknown error occurred fetching API key",
        );
      } finally {
        setIsLoadingKey(false);
      }
    };
    fetchApiKey();
  }, []);

  const queueAutoStartFallback = () => {
    if (autoTriggerTimeoutRef.current) clearTimeout(autoTriggerTimeoutRef.current);
    autoTriggerTimeoutRef.current = setTimeout(() => {
      if (shouldAutoTriggerRef.current && !hasAutoTriggeredRef.current) {
        setReviewIntentStarted(true);
      }
    }, 2000);
  };

  useEffect(() => {
    if (quickStartData?.quickStart && !reviewId && !quickStartReview) {
      const tempReview = {
        id: id,
        title:
          quickStartData.type === "Github Repo"
            ? "GitHub Repository Review"
            : "General Code Review",
        description:
          quickStartData.type === "Github Repo"
            ? `Code review of GitHub repository: ${quickStartData.repoUrl || "Repository URL not provided"}`
            : "A general code review session focusing on code quality improvements and best practices.",
        type: quickStartData.type || "Standard",
        duration: 0,
        learning_goals: quickStartData.developerLevel || "intermediate",
        is_public: false,
        created_at: new Date().toISOString(),
        user_id: "quickstart",
        repoUrl: quickStartData.repoUrl,
        fullScan: quickStartData.fullScan,
      };
      setQuickStartReview(tempReview);
    }
  }, [
    quickStartData?.quickStart,
    reviewId,
    id,
    quickStartReview,
    quickStartData?.developerLevel,
    quickStartData?.fullScan,
    quickStartData?.repoUrl,
    quickStartData?.type,
  ]);

  useEffect(() => {
    if (
      quickStartData?.autoStart &&
      quickStartReview &&
      !reviewIntentStarted &&
      !hasAutoTriggeredRef.current
    ) {
      shouldAutoTriggerRef.current = true;
      setIsReadyForAutoTrigger(true);
      autoTriggerTimeoutRef.current = setTimeout(() => {
        if (shouldAutoTriggerRef.current && !hasAutoTriggeredRef.current) {
          if (!isInitializingRef.current) {
            setReviewIntentStarted(true);
          }
          shouldAutoTriggerRef.current = false;
          hasAutoTriggeredRef.current = true;
        }
      }, 2000);
    }
  }, [quickStartData?.autoStart, quickStartReview, reviewIntentStarted]);

  useEffect(() => {
    if (reviewIntentStarted && !hasAutoTriggeredRef.current) {
      shouldAutoTriggerRef.current = false;
      hasAutoTriggeredRef.current = true;
      if (autoTriggerTimeoutRef.current) {
        clearTimeout(autoTriggerTimeoutRef.current);
        autoTriggerTimeoutRef.current = null;
      }
    }
  }, [reviewIntentStarted]);

  const shutdownSession = useCallback(() => {
    setForceStopAudio(true);
    if (genaiClientRef.current) genaiClientRef.current.terminateSession();
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    if (hasSessionStartedRef.current) {
      sessionService.stopReview();
      hasSessionStartedRef.current = false;
    }
    setReviewIntentStarted(false);
  }, [videoStream]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasSessionStartedRef.current) {
        setForceStopAudio(true);
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (!isInitializingRef.current && hasSessionStartedRef.current) shutdownSession();
    };
  }, [shutdownSession]);

  const handleEndReview = () => {
    // Summary modal is now handled inside workflow, but keep cleanup here for when modal closes
    setForceStopAudio(true);
    setForceStopVideo(true);
    appLogger.user.stopReview();
    shutdownSession();
    setTimeout(() => {
      setForceStopAudio(false);
      setForceStopVideo(false);
    }, 100);
  };

  const handleTimerExpired = () => {
    shutdownSession();
    clearAllSuggestions();
  };

  // Client ready hook reserved for future use

  const handleButtonReady = useCallback((triggerButton: () => void) => {
    if (shouldAutoTriggerRef.current && !hasAutoTriggeredRef.current) {
      shouldAutoTriggerRef.current = false;
      hasAutoTriggeredRef.current = true;
      if (autoTriggerTimeoutRef.current) {
        clearTimeout(autoTriggerTimeoutRef.current);
        autoTriggerTimeoutRef.current = null;
      }
      setTimeout(() => triggerButton(), 100);
    }
  }, []);

  const handleScreenShareCancelled = useCallback(() => {
    if (quickStartData?.quickStart) {
      navigate("/", { state: { reopenQuickStart: true } });
    } else {
      // Do not reopen the setup modal after a pause or cancel; keep user in session view
      if (hasEverStartedRef.current) {
        setShowSetupModal(false);
      } else {
        setShowSetupModal(true);
      }
    }
  }, [quickStartData?.quickStart, navigate]);

  useEffect(() => {
    if (!blocker) return;
    if (blocker.state === "blocked") {
      const shouldLeave = window.confirm(
        "You have an active code review session. Are you sure you want to leave? The session will be terminated.",
      );
      if (shouldLeave) {
        setForceStopAudio(true);
        cleanupAfterProceedRef.current = true;
        blocker.proceed();
      } else {
        blocker.reset();
      }
    } else if (blocker.state === "unblocked" && cleanupAfterProceedRef.current) {
      cleanupAfterProceedRef.current = false;
      if (hasSessionStartedRef.current) shutdownSession();
    }
  }, [blocker, shutdownSession]);

  useEffect(() => {
    const getReview = async () => {
      try {
        const supabaseClient = await getSupabaseClient();
        const { data, error } = await supabaseClient
          .from("exams")
          .select("*")
          .eq("id", id)
          .single();
        if (!error && data) {
          setCustomReview(data);
          // Only show setup modal before the first session has ever started
          if (!quickStartData?.autoStart && !reviewIntentStarted && !hasEverStartedRef.current) {
            setShowSetupModal(true);
          }
        }
      } catch (error) {
        appLogger.error.general(error instanceof Error ? error.message : String(error));
      }
    };
    if (!quickStartData?.quickStart && id) getReview();
  }, [quickStartData?.quickStart, quickStartData?.autoStart, id, reviewIntentStarted]);

  const handleCustomStartReview = (
    reviewType: string,
    developerLevel: string,
    repoUrl?: string,
    fullScan?: boolean,
  ) => {
    setCustomRepoUrl(repoUrl);
    if (customReview) {
      const unifiedReview = { ...customReview, repoUrl, fullScan };
      setQuickStartReview(unifiedReview);
    }
    shouldAutoTriggerRef.current = true;
    setIsReadyForAutoTrigger(true);
    queueAutoStartFallback();
    setShowSetupModal(false);
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
        <div className="text-tokyo-fg-bright">Error loading API Key: {apiKeyError}</div>
      </Layout>
    );
  }
  if (!geminiApiKey) {
    return (
      <Layout>
        <div>API Key not available. Cannot start review.</div>
      </Layout>
    );
  }
  if (!id) {
    return (
      <Layout>
        <div className="text-tokyo-fg-bright text-center py-8">
          <h2 className="text-xl font-bold mb-4">No Code Review Session</h2>
          <p className="mb-4">No review ID specified and no quick start data found.</p>
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
      isSessionActive={reviewIntentStarted}
      onVoiceChange={(newVoice) => {
        localStorage.setItem("ai_voice_setting", newVoice);
        setRequestedVoice(newVoice);
      }}
    >
      <GenAILiveProvider apiKey={geminiApiKey}>
        {showSetupModal && customReview && (
          <ReviewSetupModal
            isOpen={showSetupModal}
            onClose={() => {
              setShowSetupModal(false);
              navigate("/");
            }}
            onStartReview={handleCustomStartReview}
            fixedType={customReview.type}
            fixedDeveloperLevel={customReview.learning_goals}
            reviewTitle={customReview.title}
            reviewDescription={customReview.description}
          />
        )}
        <div
          className="streaming-console max-w-2xl mx-auto flex flex-col"
          style={{ minHeight: 560 }}
        >
          <div className="pt-10 pr-10 pl-10 mb-10 flex justify-center flex-col">
            <h1 className="mb-8 font-bold text-2xl text-tokyo-fg-bright text-center">
              AI Code Review
            </h1>
            <CodeReviewWorkflow
              reviewId={id}
              reviewIntentStarted={reviewIntentStarted}
              onTimerExpired={handleTimerExpired}
              onManualStop={handleEndReview}
              onTranscriptChunk={extractSuggestions}
              liveSuggestions={suggestions}
              onLoadingStateChange={() => {}}
              videoRef={videoRef}
              supportsVideo={true}
              onVideoStreamChange={setVideoStream}
              onButtonClicked={(on: boolean) => setReviewIntentStarted(on)}
              forceStopAudio={forceStopAudio}
              forceStopVideo={forceStopVideo}
              quickStartReview={quickStartReview}
              onButtonReady={handleButtonReady}
              onScreenShareCancelled={handleScreenShareCancelled}
              hideMainButton={false}
              initialRepoUrl={quickStartData?.repoUrl || customRepoUrl}
              isReadyForAutoTrigger={isReadyForAutoTrigger}
              onEnvironmentChange={() => {}}
              requestedVoice={requestedVoice}
              onSharingReady={handleSharingReady}
              onUiFadeReady={() => setUiFadeReady(true)}
              sessionUiReady={shouldFadeInSessionUi}
              reviewDurationMs={
                quickStartReview?.duration
                  ? Number(quickStartReview.duration) * 60 * 1000
                  : customReview?.duration
                    ? Number(customReview.duration) * 60 * 1000
                    : 0
              }
            />
            {reviewIntentStarted && (
              <div className="mt-8" style={{ display: uiFadeReady ? undefined : "none" }}>
                <div className="mb-4">
                  <UserPromptInput />
                </div>
                {AI_CONFIG.FEATURES.LIVE_SUGGESTION_EXTRACTION && (
                  <LiveSuggestionsPanel
                    suggestions={suggestions}
                    isProcessing={isProcessing}
                    isVisible={uiFadeReady}
                    fadeIn={true}
                  />
                )}
              </div>
            )}
          </div>

          <video
            className={cn({ hidden: !videoRef.current || !videoStream })}
            style={{ width: "20%", position: "fixed", bottom: "25px", right: "25px", opacity: "0" }}
            ref={videoRef}
            autoPlay
            playsInline
          />
        </div>
      </GenAILiveProvider>
    </Layout>
  );
}
