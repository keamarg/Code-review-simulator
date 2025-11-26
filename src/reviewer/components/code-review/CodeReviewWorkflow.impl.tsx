import React, { useCallback, useEffect, useRef, useState } from "react";
import ControlTrayCustom from "../control-tray-custom/ControlTrayCustom";
import { useGenAILiveContext } from "../../../contexts/GenAILiveContext";
import { getCurrentModel } from "../../../config/aiConfig";
import { createLiveConfig } from "../../utils/liveConfigUtils";
// import prompts from "../../../prompts.json";
// Timer is now rendered inline in the ControlTrayCustom via props
import { CodeReviewSummaryModal } from "../ui/CodeReviewSummaryModal";
import { useConversationTracker } from "../../hooks/useConversationTracker";
import { appLogger } from "../../../lib/utils";
import reviewPrompts from "../../utils/prompt";
import { getRepoQuestions as fetchRepoQuestions } from "../../utils/getGithubRepoFiles";
import { useAuth } from "../../contexts/AuthContext";

type LiveSuggestion = { text: string; timestamp: Date };

export interface CodeReviewWorkflowProps {
  reviewId: string;
  reviewIntentStarted: boolean;
  onTimerExpired?: () => void;
  onManualStop?: () => void;
  onTranscriptChunk?: (chunk: string) => void;
  liveSuggestions?: LiveSuggestion[];
  onLoadingStateChange?: (isLoading: boolean) => void;
  onButtonReady?: (triggerButton: () => void) => void;
  onScreenShareCancelled?: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  onButtonClicked?: (isButtonOn: boolean) => void;
  forceStopAudio?: boolean;
  forceStopVideo?: boolean;
  reviewTemplate?: any;
  hideMainButton?: boolean;
  initialRepoUrl?: string;
  isReadyForAutoTrigger?: boolean;
  onEnvironmentChange?: (environment: string) => void;
  reviewDurationMs?: number;
  requestedVoice?: string;
  onSharingReady?: () => void;
  /** Optional synced session UI flag to control tray container visibility */
  sessionUiReady?: boolean;
  onUiFadeReady?: () => void;
  /** Optional callback to receive the text input tracker function */
  onTextInputTrackerReady?: (trackTextInput: (text: string) => void) => void;
  /** Callback when a repository error is detected (private, not found, or rate limit) */
  onRepositoryError?: (
    repoUrl: string,
    errorType: "private" | "notFound" | "rateLimit",
    minutesRemaining?: number,
  ) => void;
  /** Repository error state from parent - used to hide loading message */
  repositoryError?: {
    repoUrl: string;
    errorType: "private" | "notFound" | "rateLimit";
    minutesRemaining?: number;
  } | null;
}

export function CodeReviewWorkflow(props: CodeReviewWorkflowProps) {
  const {
    reviewId,
    reviewIntentStarted,
    videoRef,
    supportsVideo,
    onVideoStreamChange,
    onButtonClicked,
    onButtonReady,
    onScreenShareCancelled,
    onManualStop,
    hideMainButton = false,
    forceStopAudio,
    forceStopVideo,
    isReadyForAutoTrigger,
    onEnvironmentChange,
    reviewDurationMs = 0,
    requestedVoice,
    onSharingReady,
    sessionUiReady,
    onUiFadeReady,
    onTextInputTrackerReady,
    repositoryError,
    reviewTemplate,
    onRepositoryError,
    onTranscriptChunk,
    initialRepoUrl,
  } = props;

  const { connected, connect, disconnect, client } = useGenAILiveContext();
  const lastIntentRef = useRef<boolean>(false);
  const hasSentIntroRef = useRef<boolean>(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState<string>("Generating review summary...");
  const lastIntroAtRef = useRef<number | null>(null);
  const awaitingPostIntroNudgeRef = useRef<boolean>(false);
  const lastUserSpeechAtRef = useRef<number>(0);
  const isConnectingRef = useRef<boolean>(false);
  const isReconnectingRef = useRef<boolean>(false);
  const [promptText, setPromptText] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState<string | undefined>(undefined);
  const [hasAiStartedSpeaking, setHasAiStartedSpeaking] = useState<boolean>(false);
  const [fadeReady, setFadeReady] = useState<boolean>(false);
  const sessionUidRef = useRef<string>("");
  const repositoryErrorUrlRef = useRef<string | null>(null);

  const { user } = useAuth();
  const { generateSummaryWithOpenAI, clearConversation, saveTranscriptToDatabase, trackTextInput } =
    useConversationTracker(client, onTranscriptChunk);

  // Default config no longer used; prompt-driven config is prepared before connect

  // Track repo URL from props
  useEffect(() => {
    if (initialRepoUrl) setRepoUrl(initialRepoUrl);
  }, [initialRepoUrl]);

  // Reset repository error ref when error is cleared (new review started) or repo URL changes
  useEffect(() => {
    if (!repositoryError) {
      repositoryErrorUrlRef.current = null;
    }
  }, [repositoryError]);

  // Reset error ref when repo URL changes (user trying a different repo)
  useEffect(() => {
    const currentRepoUrl = repoUrl || reviewTemplate?.repoUrl;
    if (
      currentRepoUrl &&
      repositoryErrorUrlRef.current &&
      repositoryErrorUrlRef.current !== currentRepoUrl
    ) {
      repositoryErrorUrlRef.current = null;
    }
  }, [repoUrl, reviewTemplate?.repoUrl]);

  // Generate a fresh session UID when a new intent starts to avoid reusing persisted timer state
  useEffect(() => {
    if (reviewIntentStarted && !sessionUidRef.current) {
      sessionUidRef.current = String(Date.now());
    }
    if (!reviewIntentStarted) {
      sessionUidRef.current = "";
    }
  }, [reviewIntentStarted]);

  // Preflight validation for starting the first screen share in GitHub Repo mode
  const preflightMessage = useCallback(() => {
    try {
      const qt = reviewTemplate;
      if (!qt) return null;
      if (qt.type !== "Github Repo") return null;
      const effective = (repoUrl || qt.repoUrl || "").toString().trim();
      if (!effective) return "Invalid GitHub repository URL format";
      const clean = effective.replace(/\/$/, "");
      const patterns = [
        /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/,
        /^https?:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)(?:\/.*)?$/,
        /^git@github\.com:([^/]+)\/([^/]+)(?:\.git)?$/,
        /^([^/\s]+)\/([^/\s]+)$/,
      ];
      const ok = patterns.some((p) => clean.match(p));
      return ok ? null : "Invalid GitHub repository URL format";
    } catch {
      return "Invalid GitHub repository URL format";
    }
  }, [reviewTemplate, repoUrl]);

  // Prepare prompt content when starting review
  useEffect(() => {
    const prepareContent = async () => {
      if (!reviewId || !reviewTemplate) return;

      const effectiveUrl = (repoUrl || reviewTemplate.repoUrl) as string | undefined;

      // Don't retry if we've already encountered a repository error for THIS specific repo
      if (effectiveUrl && repositoryErrorUrlRef.current === effectiveUrl) {
        return;
      }

      const durationMinutes = Number(reviewTemplate.duration || 0);
      try {
        let builtPrompt = "";
        if (reviewTemplate.type === "Github Repo" && effectiveUrl) {
          const questions = await fetchRepoQuestions(
            effectiveUrl,
            reviewTemplate.learning_goals || "intermediate",
            { fullScan: !!reviewTemplate.fullScan },
          );
          builtPrompt = reviewPrompts.github(reviewTemplate, durationMinutes, questions as any);
        } else if (reviewTemplate.type === "Standard") {
          builtPrompt = reviewPrompts.standard(reviewTemplate, durationMinutes, "");
        } else {
          builtPrompt = reviewPrompts.general(reviewTemplate, "");
        }
        setPromptText(builtPrompt);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        appLogger.error.general(errorMessage);

        // Check if this is a repository error (private, not found, or rate limit)
        if (effectiveUrl && onRepositoryError) {
          // Extract minutes from rate limit error message
          const rateLimitMatch = errorMessage.match(/try again in (\d+) minutes?/i);
          const minutesRemaining = rateLimitMatch ? parseInt(rateLimitMatch[1], 10) : undefined;

          if (
            errorMessage.includes("rate limit") ||
            errorMessage.includes("Rate limit") ||
            errorMessage.includes("rate limit exceeded")
          ) {
            // Mark that we've encountered a repository error for THIS repo to prevent retries
            repositoryErrorUrlRef.current = effectiveUrl;
            onRepositoryError(effectiveUrl, "rateLimit", minutesRemaining);
          } else if (
            errorMessage.includes("private") ||
            errorMessage.includes("restricted") ||
            errorMessage.includes("Private Repository")
          ) {
            // Mark that we've encountered a repository error for THIS repo to prevent retries
            repositoryErrorUrlRef.current = effectiveUrl;
            onRepositoryError(effectiveUrl, "private");
          } else if (
            errorMessage.includes("not found") ||
            errorMessage.includes("404") ||
            (errorMessage.includes("Repository") && errorMessage.includes("not found"))
          ) {
            // Mark that we've encountered a repository error for THIS repo to prevent retries
            repositoryErrorUrlRef.current = effectiveUrl;
            onRepositoryError(effectiveUrl, "notFound");
          }
        }
      } finally {
        // no-op; preparing prompt no longer toggles a local loading flag
      }
    };

    // Only prepare once per session; avoid re-preparing during transient reconnects (e.g., change screen)
    // Also don't retry if we've already encountered a repository error for the current repo
    const currentRepoUrl = (repoUrl || reviewTemplate?.repoUrl) as string | undefined;
    const shouldSkip = currentRepoUrl && repositoryErrorUrlRef.current === currentRepoUrl;

    if (
      reviewIntentStarted &&
      !connected &&
      !isConnectingRef.current &&
      !promptText &&
      !shouldSkip
    ) {
      prepareContent();
    }
  }, [
    reviewIntentStarted,
    connected,
    reviewId,
    reviewTemplate,
    repoUrl,
    promptText,
    onRepositoryError,
  ]);

  // Connect when prompt is ready (avoid reconnecting during active change-screen)
  useEffect(() => {
    if (!reviewIntentStarted || connected || !promptText || isConnectingRef.current) return;
    isConnectingRef.current = true;
    lastIntentRef.current = true;
    // Pass requested voice at initial connect
    const cfg = createLiveConfig(promptText, {
      voiceName: requestedVoice,
    });
    connect(getCurrentModel(), cfg)
      .catch(() => {
        lastIntentRef.current = false;
      })
      .finally(() => {
        isConnectingRef.current = false;
      });
  }, [reviewIntentStarted, connected, promptText, requestedVoice, connect]);

  // Handle stop
  useEffect(() => {
    if (!reviewIntentStarted && lastIntentRef.current && connected) {
      lastIntentRef.current = false;
      disconnect();
      hasSentIntroRef.current = false;
    }
  }, [reviewIntentStarted, connected, disconnect]);

  // Auto-start cue: trigger the AI to begin speaking once on first connect
  useEffect(() => {
    if (!connected || !lastIntentRef.current || !client || hasSentIntroRef.current) return;
    try {
      const startCue =
        "Please begin the code review as instructed: greet briefly, confirm you can see my screen, and ask me to show the main file(s) I want reviewed.";
      client.send([{ text: startCue }]);
      hasSentIntroRef.current = true;
      lastIntroAtRef.current = Date.now();
      // Do not schedule any post-intro nudge to avoid duplicate prompts
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, reviewDurationMs]);

  // Timer-driven intro disabled to avoid scripted user prompt
  const handleIntroduction = useCallback(() => {
    if (!client || hasSentIntroRef.current) return;
    hasSentIntroRef.current = true;
    lastIntroAtRef.current = Date.now();
    awaitingPostIntroNudgeRef.current = true;
  }, [client, hasSentIntroRef]);

  const handleFarewell = useCallback(() => {
    if (!client) return;
    // No scripted farewell message
    appLogger.timer.farewell();
  }, [client]);

  const handleTimerExpired = useCallback(() => {
    // On timer expiry, generate and show the summary modal instead of delegating to parent shutdown
    (async () => {
      try {
        const summary = await generateSummaryWithOpenAI();
        setSummaryText(summary);
      } catch {
        // keep default summary text
      } finally {
        setShowSummary(true);
      }
    })();
  }, [generateSummaryWithOpenAI]);

  // Post-intro nudge if user is silent after AI's first turn completes
  useEffect(() => {
    if (!client) return;

    const handleUserTranscript = (text: string) => {
      if (!text || typeof text !== "string") return;
      lastUserSpeechAtRef.current = Date.now();
      if (awaitingPostIntroNudgeRef.current) {
        awaitingPostIntroNudgeRef.current = false;
      }
    };

    const handleTurnComplete = () => {
      // Disable post-intro nudge to prevent a second automatic user prompt
      if (awaitingPostIntroNudgeRef.current) {
        awaitingPostIntroNudgeRef.current = false;
      }
    };

    client.on("userTranscript", handleUserTranscript);
    client.on("turncomplete", handleTurnComplete);
    return () => {
      client.off("userTranscript", handleUserTranscript);
      client.off("turncomplete", handleTurnComplete);
    };
  }, [client]);

  // Detect first AI transcript to render controls only after AI starts
  useEffect(() => {
    if (!client) return;
    const handleAITranscriptStart = (text: string) => {
      if (!hasAiStartedSpeaking && text && typeof text === "string") {
        setHasAiStartedSpeaking(true);
      }
    };
    client.on("transcript", handleAITranscriptStart);
    return () => {
      client.off("transcript", handleAITranscriptStart);
    };
  }, [client, hasAiStartedSpeaking]);

  // Send a resume message when resuming from a deliberate pause (from history)
  // Note: resume message is wired directly in onButtonClicked wrapper below, matching history

  useEffect(() => {
    if (onLoadingStateChange) onLoadingStateChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { onLoadingStateChange } = props;

  const handleEndReviewClick = useCallback(async () => {
    // Stop everything IMMEDIATELY - don't wait for summary
    if (onManualStop) {
      onManualStop();
    }

    // Determine if this is a quick start (no reviewId means quick start)
    const isQuickStart = !reviewId || reviewId.startsWith("quickstart-");

    // Generate summary in background (non-blocking)
    generateSummaryWithOpenAI()
      .then(async (summary) => {
        setSummaryText(summary);

        // Save transcript to database if user is authenticated
        if (user?.id) {
          try {
            await saveTranscriptToDatabase(
              user.id,
              isQuickStart ? null : reviewId,
              summary,
              isQuickStart,
              user.email,
            );
          } catch (error) {
            // Log error but don't block showing summary
            appLogger.error.general(
              `Failed to save transcript: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }

        setShowSummary(true);
      })
      .catch(() => {
        // keep default summary text
        setShowSummary(true);
      });
  }, [generateSummaryWithOpenAI, onManualStop, reviewId, user, saveTranscriptToDatabase]);

  const handleSummaryClose = useCallback(() => {
    setShowSummary(false);
    clearConversation();
    if (onManualStop) onManualStop();
  }, [clearConversation, onManualStop]);

  // Auto-resume connection on transient closes (e.g., during Change Screen)
  useEffect(() => {
    if (!client) return;

    const handleClose = async () => {
      // Only try to resume if the user hasn't paused/stopped
      if (!reviewIntentStarted) return;
      if (isConnectingRef.current || isReconnectingRef.current) return;
      isReconnectingRef.current = true;
      try {
        // Prefer session resumption to preserve context
        const resumed = await (client as any).reconnectWithResumption?.();
        if (!resumed) {
          // Fallback to a normal reconnect with the existing config if available
          const cfg = (client as any).getConfig?.();
          const model = (client as any).model;
          if (cfg && model) {
            await connect(model, cfg);
          } else if (promptText) {
            // Last resort: rebuild minimal config from promptText
            const newCfg = createLiveConfig(promptText);
            await connect(getCurrentModel(), newCfg);
          }
        }
      } catch (e) {
        // Log as connection error but don't disrupt UI
        appLogger.error.connection(e instanceof Error ? e.message : String(e));
      } finally {
        isReconnectingRef.current = false;
      }
    };

    (client as any).on?.("close", handleClose);
    return () => {
      (client as any).off?.("close", handleClose);
    };
  }, [client, reviewIntentStarted, promptText, connect]);

  // Compute a single flag: show UI when sharing is ready; do not block on AI speech
  const uiFadeReady = Boolean(sessionUiReady);

  // Add a small delay before fade-in to let layout stabilize
  useEffect(() => {
    if (!uiFadeReady) {
      setFadeReady(false);
      return;
    }
    const t = setTimeout(() => setFadeReady(true), 160);
    return () => clearTimeout(t);
  }, [uiFadeReady]);

  useEffect(() => {
    if (fadeReady) {
      try {
        onUiFadeReady && onUiFadeReady();
      } catch {}
    }
  }, [fadeReady, onUiFadeReady]);

  // Expose trackTextInput to parent component
  useEffect(() => {
    if (trackTextInput && onTextInputTrackerReady) {
      onTextInputTrackerReady(trackTextInput);
    }
  }, [trackTextInput, onTextInputTrackerReady]);

  return (
    <div>
      {
        <ControlTrayCustom
          videoRef={videoRef}
          supportsVideo={supportsVideo}
          onVideoStreamChange={onVideoStreamChange}
          onButtonClicked={(on) => {
            try {
              (window as any).__cr_prevPaused = (window as any).__cr_prevPaused ?? false;
              // When turning ON after having been paused, send a brief resume cue
              if (on && (window as any).__cr_prevPaused && client) {
                client.send([{ text: "Session resumed. Please continue with the code review." }]);
              }
              (window as any).__cr_prevPaused = !on;
            } catch {}
            if (onButtonClicked) onButtonClicked(on);
          }}
          onButtonReady={onButtonReady}
          onScreenShareCancelled={onScreenShareCancelled}
          preflightCheck={preflightMessage}
          onEndReview={handleEndReviewClick}
          hideMainButton={hideMainButton}
          forceStopAudio={forceStopAudio}
          forceStopVideo={forceStopVideo}
          isReadyForAutoTrigger={isReadyForAutoTrigger}
          onEnvironmentChange={onEnvironmentChange}
          showActions={fadeReady || connected || Boolean(reviewIntentStarted)}
          showIndicators={fadeReady || connected || Boolean(reviewIntentStarted)}
          onSharingReady={onSharingReady}
          fadeInContainer={fadeReady}
          visibleContainer={fadeReady || connected || Boolean(reviewIntentStarted)}
          timerTotalMs={reviewDurationMs}
          timerStartTrigger={connected}
          timerOnTimeUp={handleTimerExpired}
          timerOnIntroduction={handleIntroduction}
          timerOnFarewell={handleFarewell}
          timerPersistKey={`cr_timer_${reviewId}_${sessionUidRef.current || "new"}`}
        />
      }

      {/* Show loading message only when review is starting and not yet faded in */}
      {/* Hide once fadeReady is true (UI has appeared) or when there's a repository error */}
      {reviewIntentStarted && !fadeReady && !repositoryError && (
        <div className="my-6">
          <div className="text-center text-tokyo-fg-dim mt-2">Preparing code review content...</div>
        </div>
      )}

      {/* Timer now shown inline with action buttons via ControlTrayCustom when configured */}

      <CodeReviewSummaryModal
        isOpen={showSummary}
        summary={summaryText}
        onClose={handleSummaryClose}
      />
    </div>
  );
}
