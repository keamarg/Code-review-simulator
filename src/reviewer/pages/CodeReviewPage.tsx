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

  // Generate ID: use reviewId if present (custom mode), otherwise generate one for quick start
  const id = reviewId || (quickStartData?.quickStart ? `quickstart-${Date.now()}` : undefined);

  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  // Handle stream from landing page (quick start)
  useEffect(() => {
    const stream = mediaStreamService.getStream();
    if (stream) {
      if (!videoStream) setVideoStream(stream);
    }
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

  const [reviewTemplate, setReviewTemplate] = useState<any>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isReadyForAutoTrigger, setIsReadyForAutoTrigger] = useState(false);
  const shouldAutoTriggerRef = useRef(false);
  const autoTriggerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoTriggeredRef = useRef(false);
  const hasClosedModalRef = useRef(false);
  const hasShownModalRef = useRef(false); // Track if modal has been shown to prevent reopening
  const hasAttemptedToShowModalRef = useRef(false); // Track if we've attempted to show modal (prevents double-show)
  const [shouldFadeInSessionUi, setShouldFadeInSessionUi] = useState(false);

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

  const queueAutoStartFallback = useCallback(() => {
    if (autoTriggerTimeoutRef.current) clearTimeout(autoTriggerTimeoutRef.current);
    autoTriggerTimeoutRef.current = setTimeout(() => {
      if (shouldAutoTriggerRef.current && !hasAutoTriggeredRef.current) {
        setReviewIntentStarted(true);
      }
    }, 2000);
  }, []);

  // Load review template: from DB for custom mode, create temporary one for quick start
  // This runs once when the component mounts or when reviewId/quickStartData changes
  useEffect(() => {
    // CRITICAL: Don't run if modal was closed or review started - this prevents reopening
    // Check these FIRST before anything else
    if (
      hasClosedModalRef.current ||
      hasEverStartedRef.current ||
      reviewIntentStarted ||
      hasAttemptedToShowModalRef.current ||
      hasShownModalRef.current
    ) {
      return;
    }

    // If stream already exists (from LandingPage modal), skip showing modal
    // The user already went through the modal on LandingPage
    const existingStream = mediaStreamService.getStream();
    if (existingStream && existingStream.active) {
      // Stream exists from LandingPage - don't show modal again
      hasClosedModalRef.current = true;
      hasShownModalRef.current = true;
      hasAttemptedToShowModalRef.current = true;
    }

    // Don't reload if we already have a template (template exists means we've already loaded)
    if (reviewTemplate) {
      return;
    }

    const loadReview = async () => {
      if (reviewId) {
        // Custom mode: load from database
        try {
          const supabaseClient = await getSupabaseClient();
          const { data, error } = await supabaseClient
            .from("exams")
            .select("*")
            .eq("id", reviewId)
            .single();
          if (!error && data) {
            setReviewTemplate(data);
            // Mark that we've attempted to show modal and show it
            if (!hasShownModalRef.current && !hasClosedModalRef.current) {
              hasAttemptedToShowModalRef.current = true;
              hasShownModalRef.current = true;
              setShowSetupModal(true);
            }
          }
        } catch (error) {
          appLogger.error.general(error instanceof Error ? error.message : String(error));
        }
      } else if (quickStartData?.quickStart && id) {
        // Quick start: create temporary template (same structure as custom mode)
        const tempReview = {
          id: id,
          title: "Code Review",
          description:
            "A code review session focusing on code quality improvements and best practices.",
          type: quickStartData.type || "Standard",
          duration: 0, // Quick start has no timer
          learning_goals: quickStartData.developerLevel || "intermediate",
          is_public: false,
          created_at: new Date().toISOString(),
          user_id: "quickstart",
          repoUrl: quickStartData.repoUrl,
          fullScan: quickStartData.fullScan,
        };
        setReviewTemplate(tempReview);

        // Check if stream already exists (from LandingPage modal)
        const existingStream = mediaStreamService.getStream();
        if (existingStream && existingStream.active) {
          // Stream exists from LandingPage - user already went through modal there
          // Don't show modal again, let the normal stream detection flow handle starting
          hasClosedModalRef.current = true;
          hasShownModalRef.current = true;
          hasAttemptedToShowModalRef.current = true;
          // Don't show modal - stream is already set up from LandingPage
        } else {
          // No stream yet - show modal to get screen share
          if (!hasShownModalRef.current && !hasClosedModalRef.current) {
            hasAttemptedToShowModalRef.current = true;
            hasShownModalRef.current = true;
            setShowSetupModal(true);
          }
        }
      }
    };
    loadReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reviewId,
    quickStartData?.quickStart,
    quickStartData?.type,
    quickStartData?.developerLevel,
    quickStartData?.repoUrl,
    quickStartData?.fullScan,
    id,
    reviewIntentStarted, // Include this so effect knows when review starts and can exit early
    // reviewTemplate intentionally excluded - we check it inside the effect
  ]);

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

  const handleButtonReady = useCallback(
    (triggerButton: () => void) => {
      if (videoStream) {
        return;
      }
      if (shouldAutoTriggerRef.current && !hasAutoTriggeredRef.current) {
        shouldAutoTriggerRef.current = false;
        hasAutoTriggeredRef.current = true;
        if (autoTriggerTimeoutRef.current) {
          clearTimeout(autoTriggerTimeoutRef.current);
          autoTriggerTimeoutRef.current = null;
        }
        setTimeout(() => triggerButton(), 100);
      }
    },
    [videoStream],
  );

  const handleScreenShareCancelled = useCallback(() => {
    if (quickStartData?.quickStart) {
      navigate("/", { state: { reopenQuickStart: true } });
    } else {
      // Don't reopen modal if it was already closed or session started
      if (hasEverStartedRef.current || hasClosedModalRef.current || hasShownModalRef.current) {
        setShowSetupModal(false);
      } else {
        hasShownModalRef.current = true;
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

  // Unified function to start review from template (identical for both modes)
  const startReviewFromTemplate = useCallback(
    (
      template: any | null,
      reviewType: string,
      developerLevel: string,
      repoUrl?: string,
      fullScan?: boolean,
    ) => {
      if (!template) return;

      // Mark modal as closed FIRST to prevent any effects from reopening it
      hasClosedModalRef.current = true;
      hasShownModalRef.current = true;
      hasAttemptedToShowModalRef.current = true;

      // Close modal immediately
      setShowSetupModal(false);

      // Start the review intent
      setReviewIntentStarted(true);

      // Update template with user selections (same for both modes)
      // This happens after modal is closed and refs are set, so it won't trigger modal to reopen
      const finalReview = {
        ...template,
        type: reviewType,
        learning_goals: developerLevel,
        repoUrl: repoUrl || template.repoUrl,
        fullScan: fullScan ?? template.fullScan,
        title:
          reviewType === "Github Repo"
            ? "GitHub Repository Review"
            : reviewType === "Standard"
              ? "Standard Code Review"
              : "Code Review",
        // Preserve the original description from the template - don't overwrite it
        // Only use fallback if template doesn't have a description
        description:
          template.description && template.description.trim()
            ? template.description
            : reviewType === "Github Repo"
              ? `Code review of GitHub repository: ${repoUrl || template.repoUrl || "Repository URL not provided"}`
              : "A code review session focusing on code quality improvements and best practices.",
      };
      setReviewTemplate(finalReview);

      shouldAutoTriggerRef.current = true;
      setIsReadyForAutoTrigger(true);
      queueAutoStartFallback();
    },
    [queueAutoStartFallback],
  );

  // Unified handler - identical for both modes
  const handleStartReview = (
    reviewType: string,
    developerLevel: string,
    repoUrl?: string,
    fullScan?: boolean,
  ) => {
    startReviewFromTemplate(reviewTemplate, reviewType, developerLevel, repoUrl, fullScan);
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

  // Determine if this is quick start (only affects modal props, not session behavior)
  const isQuickStart = Boolean(quickStartData?.quickStart);

  // Modal props: custom mode has fixed values, quick start has initial (editable) values
  const modalFixedType = isQuickStart ? undefined : reviewTemplate?.type;
  const modalFixedDeveloperLevel = isQuickStart ? undefined : reviewTemplate?.learning_goals;
  const modalInitialType = isQuickStart
    ? quickStartData?.type || reviewTemplate?.type || "Standard"
    : undefined;
  const modalInitialDeveloperLevel = isQuickStart
    ? quickStartData?.developerLevel || reviewTemplate?.learning_goals || "intermediate"
    : undefined;
  const modalInitialRepoUrl = isQuickStart
    ? quickStartData?.repoUrl || reviewTemplate?.repoUrl
    : undefined;
  const modalInitialFullScan = isQuickStart
    ? (quickStartData?.fullScan ?? reviewTemplate?.fullScan)
    : undefined;

  return (
    <Layout
      isSessionActive={reviewIntentStarted}
      onVoiceChange={(newVoice) => {
        localStorage.setItem("ai_voice_setting", newVoice);
        setRequestedVoice(newVoice);
      }}
    >
      <GenAILiveProvider apiKey={geminiApiKey}>
        {/* Unified setup modal - same component for both modes */}
        {showSetupModal && reviewTemplate && (
          <ReviewSetupModal
            isOpen={showSetupModal}
            onClose={() => {
              hasClosedModalRef.current = true;
              hasShownModalRef.current = true;
              hasAttemptedToShowModalRef.current = true;
              setShowSetupModal(false);
              navigate("/");
            }}
            onStartReview={handleStartReview}
            fixedType={modalFixedType}
            fixedDeveloperLevel={modalFixedDeveloperLevel}
            reviewTitle={isQuickStart ? undefined : reviewTemplate?.title}
            reviewDescription={isQuickStart ? undefined : reviewTemplate?.description}
            initialType={modalInitialType}
            initialDeveloperLevel={modalInitialDeveloperLevel}
            initialRepoUrl={modalInitialRepoUrl}
            initialFullScan={modalInitialFullScan}
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
              reviewTemplate={reviewTemplate}
              onButtonReady={handleButtonReady}
              onScreenShareCancelled={handleScreenShareCancelled}
              hideMainButton={false}
              initialRepoUrl={reviewTemplate?.repoUrl}
              isReadyForAutoTrigger={isReadyForAutoTrigger}
              onEnvironmentChange={() => {}}
              requestedVoice={requestedVoice}
              onSharingReady={handleSharingReady}
              onUiFadeReady={() => {}}
              sessionUiReady={shouldFadeInSessionUi}
              reviewDurationMs={
                reviewTemplate?.duration ? Number(reviewTemplate.duration) * 60 * 1000 : 0
              }
            />
            {/* Show UserPromptInput and LiveSuggestions when review has started */}
            {reviewIntentStarted && (
              <div className="mt-8">
                <div className="mb-4">
                  <UserPromptInput />
                </div>
                {AI_CONFIG.FEATURES.LIVE_SUGGESTION_EXTRACTION && (
                  <LiveSuggestionsPanel
                    suggestions={suggestions}
                    isProcessing={isProcessing}
                    isVisible={true}
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
