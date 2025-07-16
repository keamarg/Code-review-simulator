import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { getSupabaseClient } from "../../config/supabaseClient";
import { useGenAILiveContext } from "../../../contexts/GenAILiveContext";
import { ExamSimulator } from "../../../types/ExamSimulator";
import { getExaminerQuestions } from "../../utils/getExaminerQuestions";
import getRepoQuestions from "../../utils/getGithubRepoFiles.js"; // Assuming .js is correct
import getPrompt from "../../utils/prompt";
import { createLiveConfig } from "../../utils/liveConfigUtils"; // Import the new utility
import { LoadingAnimation } from "../ui/LoadingAnimation"; // Check path
import { AIExaminerDisplay } from "./AIExaminer"; // Import the refactored display component
import { CountdownTimer } from "../CountdownTimer"; // Import CountdownTimer
import { getCurrentModel } from "../../../config/aiConfig"; // Import centralized config
import { useConversationTracker } from "../../hooks/useConversationTracker"; // New hook for tracking conversation
import { CodeReviewSummaryModal } from "../ui/CodeReviewSummaryModal"; // New modal component
import { ReconnectionBanner } from "../ui/ReconnectionBanner"; // New reconnection banner
import ControlTrayCustom from "../control-tray-custom/ControlTrayCustom"; // Correct import for ControlTrayCustom
import prompts from "../../../prompts.json"; // Import prompts for introduction message
import { appLogger } from "../../../lib/utils";

interface ExamWorkflowProps {
  examId: string;
  examIntentStarted: boolean; // Controlled by AIExaminerPage via ControlTrayCustom
  onTimerExpired?: () => void; // New callback to notify parent when timer expires
  onManualStop?: () => void; // New callback for manual stop
  onTranscriptChunk?: (chunk: string) => void; // Callback for live suggestion extraction
  liveSuggestions?: Array<{ text: string; timestamp: Date }>; // Live suggestions from the suggestion extractor
  onLoadingStateChange?: (isLoading: boolean) => void; // New callback to notify parent of loading state
  onButtonReady?: (triggerButton: () => void) => void; // Callback to notify when button is ready for auto-triggering
  onScreenShareCancelled?: () => void; // Callback for when screen sharing is cancelled
  // Pass-through props for ControlTrayCustom
  videoRef: React.RefObject<HTMLVideoElement>;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  onButtonClicked?: (isButtonOn: boolean) => void;
  forceStopAudio?: boolean;
  forceStopVideo?: boolean;
  quickStartExam?: any; // Optional quick start exam data
  /**
   * When true, the main connect / start button in ControlTrayCustom should be hidden from the UI.
   */
  hideMainButton?: boolean;
  /**
   * If provided, used as the initial GitHub repository URL (for custom mode where the
   * user selects the repo in a setup modal).
   */
  initialRepoUrl?: string;
  isReadyForAutoTrigger?: boolean;
  /**
   * Callback to update environment settings in the audio recorder
   */
  onEnvironmentChange?: (environment: string) => void;
}

export function ExamWorkflow({
  examId,
  examIntentStarted,
  onTimerExpired,
  onManualStop,
  onTranscriptChunk,
  liveSuggestions,
  onLoadingStateChange,
  onButtonReady,
  videoRef,
  supportsVideo,
  onVideoStreamChange,
  onButtonClicked,
  forceStopAudio,
  forceStopVideo,
  quickStartExam,
  onScreenShareCancelled,
  hideMainButton = false,
  initialRepoUrl,
  isReadyForAutoTrigger,
  onEnvironmentChange,
}: ExamWorkflowProps) {
  const { client, connected, connect, stopAudio } = useGenAILiveContext();
  const [examSimulator, setExamSimulator] = useState<ExamSimulator | null>(
    null
  );
  const [isLoadingExamData, setIsLoadingExamData] = useState(false);
  const [examError, setExamError] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState(""); // State to manage GitHub repository URL
  const [githubQuestions, setGithubQuestions] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [studentTask, setStudentTask] = useState("");
  const [examStarted, setExamStarted] = useState(false);
  const [liveConfig, setLiveConfig] = useState<any>(null);
  const isConnectingRef = useRef(false);
  const activeConnectionRef = useRef(false);
  const hasUsedQuickStartRef = useRef(false); // Track if we've already used quick start data
  const isReconnectingRef = useRef(false); // Track reconnecting state for timeout
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track reconnection timeout
  const isPreparingContentRef = useRef(false); // Track if content preparation is in progress

  // New state for summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<string>("");

  // New state for network status banner
  const [showReconnectionBanner, setShowReconnectionBanner] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Track deliberate pause to avoid showing network banner
  const [isDeliberatelyPaused, setIsDeliberatelyPaused] = useState(false);

  // Track previous pause state for resume detection
  const previousPauseStateRef = useRef(isDeliberatelyPaused);

  // Use conversation tracker hook
  const { getConversationSummary, clearConversation } = useConversationTracker(
    client,
    onTranscriptChunk
  );

  // Immediately stop AI voice when forceStopAudio is triggered
  useEffect(() => {
    if (forceStopAudio) {
      stopAudio();
    }
  }, [forceStopAudio, stopAudio]);

  // GitHub URL validation function
  const isValidGitHubUrl = (url: string): boolean => {
    if (!url.trim()) return false;

    // Support multiple GitHub URL formats
    const githubUrlPatterns = [
      /^https?:\/\/github\.com\/[^/]+\/[^/]+\/?$/,
      /^https?:\/\/api\.github\.com\/repos\/[^/]+\/[^/]+\/?$/,
      /^git@github\.com:[^/]+\/[^/]+\.git$/,
      /^[^/]+\/[^/]+$/,
    ];

    return githubUrlPatterns.some((pattern) => pattern.test(url.trim()));
  };

  // Show ControlTray as soon as we have exam data. For GitHub repo exams we still
  // require a valid repo URL (since the tray sends it to the AI), but for all other
  // exam types we don’t need to delay while the prompt is generated.
  const shouldShowControlTray = examSimulator
    ? examSimulator.type === "Github Repo"
      ? isValidGitHubUrl(repoUrl)
      : true
    : false;

  // Removed debug logging useEffect that was causing excessive re-renders

  // Track AI responses to capture last message for reconnection
  useEffect(() => {
    if (client) {
      const handleAITranscript = (event: any) => {
        // Only hide banner if we're not waiting for a specific reconnection response
        if (showReconnectionBanner && !isReconnecting) {
          // We're showing the banner but not actively reconnecting, so this is a normal transcript
          setShowReconnectionBanner(false);
        }

        // Always reset the reconnecting flag when AI responds
        setIsReconnecting(false);

        // Clear reconnection timeout if it exists
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
          // AI responded - cleared reconnection timeout and reset flags
        }
      };

      client.on("transcript", handleAITranscript);

      return () => {
        client.off("transcript", handleAITranscript);
      };
    }
  }, [client, showReconnectionBanner, isReconnecting]);

  // Watch for deliberate resume to send "let's continue" prompt
  useEffect(() => {
    if (client && connected) {
      // Check if we just resumed from a deliberate pause
      if (previousPauseStateRef.current && !isDeliberatelyPaused && connected) {
        client.send([
          {
            text: "Session resumed. Please continue with the code review.",
          },
        ]);
      }

      // Update the ref for next time
      previousPauseStateRef.current = isDeliberatelyPaused;
    }
  }, [client, connected, isDeliberatelyPaused]);

  // Only use exam duration if it's explicitly set (> 0), otherwise unlimited session
  const examDurationInMinutes = useMemo(() => {
    return examSimulator?.duration || 0;
  }, [examSimulator?.duration]);

  const examDurationActiveExamMs = useMemo(() => {
    return examDurationInMinutes * 60 * 1000;
  }, [examDurationInMinutes]);

  // Automatic reconnect handler - starts immediately when network is restored
  const handleAutomaticReconnect = useCallback(async () => {
    setIsReconnecting(true);

    try {
      // Instead of using client.reconnectWithResumption(), trigger the normal connection flow
      // by temporarily resetting the connection guards to allow the normal useEffect to run

      // Reset connection guards to allow normal connection
      isConnectingRef.current = false;
      activeConnectionRef.current = false;

      // The normal connection useEffect will now run and establish the connection
      // This is the same flow that works when the user speaks

      // Set up a timeout to check if connection was successful
      reconnectTimeoutRef.current = setTimeout(() => {
        if (connected) {
          // Send introduction message to make AI speak
          if (client) {
            client.send([
              {
                text: "Connection restored. Please continue with the code review where we left off.",
              },
            ]);

            // Banner will be hidden when AI responds to this prompt (handled by transcript effect)
            // Don't hide banner here - wait for AI response
          }
        } else {
          setIsReconnecting(false);
          // Retry after 5 seconds
          setTimeout(() => {
            if (showReconnectionBanner && !isDeliberatelyPaused) {
              handleAutomaticReconnect();
            }
          }, 5000);
        }
      }, 3000); // Give 3 seconds for connection to establish

      // Don't reset isReconnecting here - let the AI response handle it
      return;
    } catch (error) {
      console.error("❌ Automatic reconnection failed:", error);
      setIsReconnecting(false);

      // Retry after 5 seconds
      setTimeout(() => {
        if (showReconnectionBanner && !isDeliberatelyPaused) {
          handleAutomaticReconnect();
        }
      }, 5000);
    }
  }, [connected, client, showReconnectionBanner, isDeliberatelyPaused]);

  // Network connectivity monitoring - automatic reconnection with spinner
  useEffect(() => {
    if (!client) return;

    // Simple offline detection - automatically start reconnection process
    const handleOffline = () => {
      // Only show banner if not deliberately paused and exam is started
      if (examStarted && !isDeliberatelyPaused) {
        // Cut the AI audio immediately in the browser
        stopAudio();

        setShowReconnectionBanner(true);
        setIsReconnecting(false); // Reset reconnecting flag for fresh offline state

        // Clear any existing reconnection timeout from previous attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      }
    };

    const handleOnline = () => {
      // Automatically start reconnection when network comes back
      if (examStarted && showReconnectionBanner && !isDeliberatelyPaused) {
        handleAutomaticReconnect();
      }
    };

    // Only listen to browser network events - let session resumption handle WebSocket naturally
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [
    client,
    examStarted,
    showReconnectionBanner,
    isDeliberatelyPaused,
    stopAudio,
    handleAutomaticReconnect, // Add handleAutomaticReconnect to dependencies
  ]);

  // ------------------------------------------------------------
  // Handle unexpected websocket close (e.g. during Change-Screen)
  useEffect(() => {
    if (!client) return;

    const handleClose = () => {
      // Check if a voice change is in progress - if so, don't interfere
      if (client.isVoiceChangeInProgress) {
        return;
      }

      // Mark connection as inactive so the normal connection effect can run again
      activeConnectionRef.current = false;
      isConnectingRef.current = false;

      // If the user hasn’t deliberately paused, show the banner and let the
      // existing automatic-reconnect logic kick in.
      if (examIntentStarted && !isDeliberatelyPaused) {
        setShowReconnectionBanner(true);
        handleAutomaticReconnect();
      }
    };

    client.on("close", handleClose);
    return () => {
      client.off("close", handleClose);
    };
  }, [
    client,
    examIntentStarted,
    isDeliberatelyPaused,
    handleAutomaticReconnect,
  ]);
  // ------------------------------------------------------------

  // Unified handler for both timer expiration and manual stop
  const handleSessionEnd = useCallback(
    async (reason: "timer" | "manual") => {
      // Clean up timers first to prevent side effects
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Reset connection guards
      isConnectingRef.current = false;
      activeConnectionRef.current = false;
      isPreparingContentRef.current = false; // Reset content preparation flag

      // Force terminate any active session immediately
      if (client) {
        try {
          client.terminateSession();
        } catch (error) {
          console.warn("Error terminating session:", error);
        }
      }

      // Don't terminate session here - let parent handle it to avoid double termination
      // The parent will call shutdownSession() which includes terminateSession()

      // Generate summary
      if (onLoadingStateChange) {
        onLoadingStateChange(true);
      }

      try {
        const summary = await getConversationSummary(
          {
            title: examSimulator?.title,
            description: examSimulator?.description,
            duration: examSimulator?.duration,
          },
          liveSuggestions
        );
        setReviewSummary(summary);
        setShowSummaryModal(true);
      } catch (error) {
        console.error("Error generating summary:", error);
        setReviewSummary("Error generating summary. Please try again.");
        setShowSummaryModal(true);
      } finally {
        if (onLoadingStateChange) {
          onLoadingStateChange(false);
        }
      }

      // Reset session tracking
      setExamStarted(false);
      setShowReconnectionBanner(false);
      setIsReconnecting(false); // Reset reconnecting flag

      // Reset deliberate pause flag for next session
      setIsDeliberatelyPaused(false);

      // Notify parent components
      if (reason === "timer" && onTimerExpired) {
        onTimerExpired();
      } else if (reason === "manual" && onManualStop) {
        onManualStop();
      }
    },
    [
      getConversationSummary,
      examSimulator,
      liveSuggestions,
      onLoadingStateChange,
      onTimerExpired,
      onManualStop,
      client,
    ]
  );

  // Handle timer expiration - now calls unified handler
  const handleTimeUp = useCallback(async () => {
    await handleSessionEnd("timer");
  }, [handleSessionEnd]);

  // Handle manual stop - now calls unified handler
  const handleManualStopInternal = useCallback(() => {
    handleSessionEnd("manual");
  }, [handleSessionEnd]);

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      // Clean up reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Reset connection guards and session tracking
      isConnectingRef.current = false;
      activeConnectionRef.current = false;
      isPreparingContentRef.current = false; // Reset content preparation flag
      setShowReconnectionBanner(false);
      setIsReconnecting(false); // Reset reconnecting flag

      // Reset deliberate pause flag
      setIsDeliberatelyPaused(false);

      // Terminate any active session
      if (client) {
        client.terminateSession();
      }
    };
  }, [client]);

  // Fetch exam data from Supabase or use quickStartExam
  useEffect(() => {
    if (!examId) {
      setExamError("No Exam ID provided.");
      setIsLoadingExamData(false);
      return;
    }

    // If quickStartExam is provided, use it directly
    if (quickStartExam && !hasUsedQuickStartRef.current) {
      setExamSimulator(quickStartExam as ExamSimulator);
      setIsLoadingExamData(false);
      hasUsedQuickStartRef.current = true; // Mark as used to prevent duplicate logging
      return;
    }

    // Skip if we've already used quick start data
    if (quickStartExam && hasUsedQuickStartRef.current) {
      return;
    }

    // Otherwise, fetch from Supabase as normal
    const fetchExamSimulator = async () => {
      setIsLoadingExamData(true);
      setExamError("");
      try {
        const supabaseClient = await getSupabaseClient();
        const { data, error } = await supabaseClient
          .from("exams")
          .select("*")
          .eq("id", examId)
          .single();

        if (error) throw error;
        setExamSimulator(data as ExamSimulator); // Cast if necessary, ensure type alignment
      } catch (err) {
        console.error("Error fetching exam simulator:", err);
        setExamError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoadingExamData(false);
      }
    };

    fetchExamSimulator();
  }, [examId, quickStartExam]);

  // This effect will merge the `fullScan` property into the `examSimulator`
  // when it's provided via the `quickStartExam` prop in a custom flow.
  useEffect(() => {
    if (
      examSimulator &&
      !quickStartExam?.type && // This is a custom flow, not a quick-start exam
      quickStartExam?.fullScan !== undefined &&
      examSimulator.fullScan !== quickStartExam.fullScan
    ) {
      setExamSimulator(
        (prev) =>
          ({
            ...prev,
            fullScan: quickStartExam.fullScan,
          } as ExamSimulator)
      );
    }
  }, [quickStartExam?.fullScan, quickStartExam?.type, examSimulator]);

  // Initialize repo URL from quick start exam data if available
  useEffect(() => {
    if (quickStartExam?.repoUrl && quickStartExam?.type === "Github Repo") {
      setRepoUrl(quickStartExam.repoUrl);
    }
  }, [quickStartExam?.repoUrl, quickStartExam?.type]);

  // If parent passes an initial repo URL (e.g., from setup modal), populate it once.
  useEffect(() => {
    if (initialRepoUrl && !repoUrl) {
      setRepoUrl(initialRepoUrl);
    }
  }, [initialRepoUrl, repoUrl]);

  // Add a ref to track fatal errors and prevent retries
  const fatalErrorRef = useRef<string | null>(null);
  const lastErrorTimeRef = useRef<number>(0);
  const previousRepoUrlRef = useRef<string>("");

  // Global flag to completely disable GitHub processing
  const [isGitHubDisabled, setIsGitHubDisabled] = useState(false);

  // Helper function to check if an error is fatal
  const isFatalError = useCallback((errorMessage: string) => {
    return (
      errorMessage.includes("rate limit") ||
      errorMessage.includes("private") ||
      errorMessage.includes("restricted")
    );
  }, []);

  // Manual reset function for users
  const resetGitHubError = useCallback(() => {
    console.log("🔄 Manual reset of GitHub error state");
    setExamError("");
    fatalErrorRef.current = null;
    lastErrorTimeRef.current = 0;
    isPreparingContentRef.current = false;
    setIsGitHubDisabled(false);
    hasTriggeredInitialLoad.current = false; // Reset trigger flag
  }, []);

  // Reset error state and processing flag when repository URL changes
  useEffect(() => {
    // Only reset if the URL actually changed (not just when error state changes)
    if (repoUrl !== previousRepoUrlRef.current) {
      console.log(
        "Repository URL actually changed from",
        previousRepoUrlRef.current,
        "to",
        repoUrl
      );
      previousRepoUrlRef.current = repoUrl;

      if (examError && isFatalError(examError)) {
        console.log("Repository URL changed, resetting error state");
        setExamError("");
        isPreparingContentRef.current = false;
        fatalErrorRef.current = null;
        lastErrorTimeRef.current = 0;
        setIsGitHubDisabled(false);
        hasTriggeredInitialLoad.current = false; // Reset trigger flag
      }
    }
  }, [repoUrl, examError, isFatalError]);

  // Reset trigger flags when exam simulator changes
  useEffect(() => {
    if (examSimulator?.id !== lastExamSimulatorId.current) {
      console.log("Exam simulator changed, resetting trigger flags");
      hasTriggeredInitialLoad.current = false;
      lastExamSimulatorId.current = examSimulator?.id || null;
    }
  }, [examSimulator?.id]);

  // Prepare exam content (questions, prompt)
  const prepareExamContent = useCallback(async () => {
    if (isPreparingContentRef.current || !examSimulator) {
      return;
    }

    // Check global GitHub disabled flag
    if (isGitHubDisabled) {
      return;
    }

    // Check for fatal errors that should prevent retries
    if (fatalErrorRef.current) {
      return;
    }

    // Check for rate limit cooldown (wait 5 minutes after rate limit error)
    const now = Date.now();
    if (
      lastErrorTimeRef.current > 0 &&
      now - lastErrorTimeRef.current < 5 * 60 * 1000
    ) {
      return;
    }

    isPreparingContentRef.current = true;
    setIsLoadingPrompt(true);

    // Only clear non-fatal errors
    if (examError && !isFatalError(examError)) {
      setExamError(""); // Clear any previous errors
    }

    try {
      let finalPrompt = "";

      // Check if this is a quick start session (duration = 0)
      const isQuickStart = examSimulator.duration === 0;

      if (examSimulator.type === "Github Repo") {
        if (!repoUrl) {
          setIsLoadingPrompt(false);
          setExamError(
            "GitHub repository URL is required to start this exam type."
          );
          return;
        }

        const githubQuestionsResult = await getRepoQuestions(
          repoUrl,
          examSimulator.learning_goals,
          examSimulator?.fullScan
            ? {
                fullScan: examSimulator.fullScan,
                maxFiles: examSimulator.fullScan ? 20 : 5,
                maxDepth: 3,
              }
            : undefined
        );
        setGithubQuestions(githubQuestionsResult);

        finalPrompt = getPrompt.github(
          examSimulator,
          examDurationInMinutes,
          githubQuestionsResult
        );

        setStudentTask(
          "Review the provided GitHub repository based on the learning goals."
        );
      } else if (isQuickStart) {
        // Quick start general review - no questions generation needed
        const studentTaskAnswer =
          "Show me the code you'd like me to review, and I'll provide specific suggestions for improvement.";
        setStudentTask(studentTaskAnswer);
        finalPrompt = getPrompt.general(examSimulator, studentTaskAnswer);
      } else {
        // Standard exam type
        const examContent = await getExaminerQuestions(examSimulator);
        const studentTaskAnswer = examContent["task-student"];
        setStudentTask(studentTaskAnswer || "No task defined.");
        finalPrompt = getPrompt.standard(
          examSimulator,
          examDurationInMinutes,
          studentTaskAnswer
        );
      }
      setPrompt(finalPrompt);
    } catch (error) {
      console.error("❌ Failed to prepare exam content:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load exam questions/prompt";
      setExamError(`Error: ${errorMessage}`);

      // If it's a fatal error (rate limit or private repo), set up prevention
      if (isFatalError(errorMessage)) {
        fatalErrorRef.current = errorMessage;
        lastErrorTimeRef.current = Date.now();
        setIsGitHubDisabled(true); // Set global flag
        // Keep the error state and don't reset isPreparingContentRef to prevent retries
        return;
      }
    } finally {
      setIsLoadingPrompt(false);
      isPreparingContentRef.current = false;
    }
  }, [
    examSimulator,
    repoUrl,
    examDurationInMinutes,
    isGitHubDisabled,
    examError,
    isFatalError,
  ]);

  // Add refs to track state changes and prevent unnecessary triggers
  const hasTriggeredInitialLoad = useRef(false);
  const lastExamSimulatorId = useRef<string | null>(null);
  const lastExamIntentStarted = useRef(false);
  const lastPrompt = useRef<string | null>(null);

  // Consolidated effect for content preparation and exam intent handling
  useEffect(() => {
    // Don't trigger if there's a fatal error or GitHub is disabled
    if (fatalErrorRef.current || isGitHubDisabled) {
      return;
    }

    // Handle exam simulator changes
    if (examSimulator?.id !== lastExamSimulatorId.current) {
      hasTriggeredInitialLoad.current = false;
      lastExamSimulatorId.current = examSimulator?.id || null;
    }

    // Handle exam intent changes
    if (examIntentStarted !== lastExamIntentStarted.current) {
      lastExamIntentStarted.current = examIntentStarted;
      if (examIntentStarted) {
        hasTriggeredInitialLoad.current = false;
      }
    }

    // Determine if we should prepare content
    const shouldPrepareContent =
      examSimulator &&
      !hasTriggeredInitialLoad.current &&
      !isLoadingPrompt &&
      !isPreparingContentRef.current;

    if (shouldPrepareContent) {
      hasTriggeredInitialLoad.current = true;

      if (examSimulator.type === "Github Repo") {
        const isQuickStart = examSimulator.duration === 0;
        if (isQuickStart && repoUrl) {
          prepareExamContent();
        } else if (examIntentStarted) {
          prepareExamContent();
        }
      } else {
        // Standard exam types - prepare immediately
        prepareExamContent();
      }
    }

    // Handle exam intent for content setup (when content is already prepared)
    if (examIntentStarted && examSimulator && !isPreparingContentRef.current) {
      if (examSimulator.type === "Github Repo") {
        const isQuickStart = examSimulator.duration === 0;

        if (isQuickStart) {
          // For quick start, the content should already be prepared
          if (prompt && prompt !== lastPrompt.current) {
            lastPrompt.current = prompt;
            const newConfig = createLiveConfig(prompt);
            setLiveConfig(newConfig);
          } else if (prompt && prompt === lastPrompt.current) {
            // Prompt is already set and processed, but liveConfig might not be set
            const newConfig = createLiveConfig(prompt);
            setLiveConfig(newConfig);
          } else if (!repoUrl) {
            setExamError(
              "Please enter a GitHub repository URL before starting."
            );
          } else if (!isLoadingPrompt) {
            // Fallback: if somehow content wasn't prepared, prepare it now
            prepareExamContent();
          }
        } else {
          // Normal GitHub repo - prepare content when exam starts
          if (!prompt) {
            prepareExamContent();
          } else if (prompt && prompt !== lastPrompt.current) {
            lastPrompt.current = prompt;
            const newConfig = createLiveConfig(prompt);
            setLiveConfig(newConfig);
          }
        }
      } else {
        // Standard exam types - content should already be prepared
        if (prompt && prompt !== lastPrompt.current) {
          lastPrompt.current = prompt;
          const newConfig = createLiveConfig(prompt);
          setLiveConfig(newConfig);
        } else if (!isLoadingPrompt) {
          // Fallback: if somehow content wasn't prepared, prepare it now
          prepareExamContent();
        }
      }
    }
  }, [
    examIntentStarted,
    examSimulator,
    repoUrl,
    isGitHubDisabled,
    prompt,
    isLoadingPrompt,
    prepareExamContent,
  ]);

  // Extract complex expression to avoid linter warning
  const liveConfigText = liveConfig?.systemInstruction?.parts?.[0]?.text;

  // Effect to set live config when prompt is available (for quick start scenarios)
  useEffect(() => {
    if (prompt && prompt !== lastPrompt.current && !isLoadingPrompt) {
      lastPrompt.current = prompt;
      const newConfig = createLiveConfig(prompt);
      setLiveConfig(newConfig);
    }
  }, [prompt, isLoadingPrompt, examSimulator?.type, examSimulator?.duration]);

  // Effect to connect and start timers when config is set and intent is active
  useEffect(() => {
    if (
      examIntentStarted &&
      liveConfigText &&
      !connected &&
      !isConnectingRef.current &&
      !activeConnectionRef.current &&
      !isDeliberatelyPaused // Don't reconnect if user deliberately paused
    ) {
      isConnectingRef.current = true;

      // Reset session tracking for new connection
      setShowReconnectionBanner(false);

      connect(getCurrentModel(), liveConfig)
        .then(() => {
          activeConnectionRef.current = true;
          setExamStarted(true);
          appLogger.connection.established();

          // Timer setup is now handled by CountdownTimer callbacks
          // No separate timer system needed - messages are triggered by CountdownTimer
        })
        .catch((error) => {
          appLogger.error.connection("Failed to connect: " + error);
          setExamError("Failed to connect to the exam server.");
          isConnectingRef.current = false;
          activeConnectionRef.current = false;
        });
    }
  }, [
    examIntentStarted,
    liveConfigText,
    connected,
    connect,
    isDeliberatelyPaused,
    liveConfig,
  ]); // Added missing liveConfig dependency

  // Separate effect for cleanup when exam intent stops
  useEffect(() => {
    if (!examIntentStarted && connected) {
      // Clean up when exam intent stops (but not during network issues)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Only disconnect if we're not in a network-related state
      if (!isReconnecting && !showReconnectionBanner) {
        client.disconnect();
      }
      setExamStarted(false);
      isConnectingRef.current = false;
      activeConnectionRef.current = false;
    }
  }, [
    examIntentStarted,
    connected,
    client,
    isReconnecting,
    showReconnectionBanner,
  ]);

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingStateChange) {
      onLoadingStateChange(isLoadingPrompt);
    }
  }, [isLoadingPrompt, onLoadingStateChange]);

  // Update ref when state changes
  useEffect(() => {
    isReconnectingRef.current = isReconnecting;
  }, [isReconnecting]);

  // Wrapped onButtonClicked to track deliberate pause actions
  const handleButtonClicked = (isButtonOn: boolean) => {
    if (connected && !isButtonOn) {
      // Button is being turned off while connected - this is a deliberate pause
      setIsDeliberatelyPaused(true);
      setShowReconnectionBanner(false); // Hide any network banner
      appLogger.user.pauseReview();
    } else if (!connected && isButtonOn && isDeliberatelyPaused) {
      // Button is being turned on while not connected and we were paused - this is a resume
      setIsDeliberatelyPaused(false);
      appLogger.user.resumeReview();
    } else if (!connected && isButtonOn && !isDeliberatelyPaused) {
      // Button is being turned on while not connected and we weren't paused - this is a fresh start
      setIsDeliberatelyPaused(false);
    }

    // Call the original handler (but don't log startReview here since it's handled by parent)
    if (onButtonClicked) {
      onButtonClicked(isButtonOn);
    }
  };

  // Handle timer messages with error handling and network awareness
  const handleIntroduction = useCallback(() => {
    if (client) {
      try {
        client.send([{ text: prompts.timerMessages.introduction }]);
        appLogger.timer.introduction();
      } catch (error) {
        appLogger.error.session(
          "Failed to send introduction message: " + error
        );
        // Don't set flag if message failed - CountdownTimer will handle retry logic
      }
    } else {
      appLogger.error.session("No client available for introduction message");
    }
  }, [client]);

  const handleFarewell = useCallback(() => {
    if (client) {
      try {
        client.send([{ text: prompts.timerMessages.farewell }]);
        appLogger.timer.farewell();
      } catch (error) {
        appLogger.error.session("Failed to send farewell message: " + error);
        // Don't set flag if message failed - CountdownTimer will handle retry logic
      }
    } else {
      appLogger.error.session("No client available for farewell message");
    }
  }, [client]);

  // Handle introduction message for unlimited sessions
  const hasSentUnlimitedIntro = useRef(false);
  useEffect(() => {
    if (
      examDurationActiveExamMs === 0 && // Unlimited session
      examStarted && // Session is active
      client && // Client is available
      !hasSentUnlimitedIntro.current // Haven't sent intro yet
    ) {
      hasSentUnlimitedIntro.current = true;
      // Small delay to ensure client is ready
      setTimeout(() => {
        if (client) {
          handleIntroduction();
        }
      }, 500);
    }
  }, [examDurationActiveExamMs, examStarted, client, handleIntroduction]);

  if (
    !examSimulator ||
    isLoadingExamData ||
    (examSimulator.type === "Github Repo" && isLoadingPrompt)
  ) {
    return (
      <div className="my-6">
        <LoadingAnimation isLoading={true} />
        <p className="text-center text-tokyo-fg-dim mt-2">
          {examSimulator?.type === "Github Repo"
            ? "Processing GitHub repository... This may take a moment."
            : "Preparing code review content"}
        </p>
      </div>
    );
  }

  if (examError) {
    const isRateLimitError = examError.includes("rate limit");
    const isPrivateRepoError =
      examError.includes("private") || examError.includes("restricted");

    const handleRetry = () => {
      console.log("User requested retry, resetting error state");
      resetGitHubError();
    };

    return (
      <div className="my-6 p-4 border border-tokyo-red bg-tokyo-red/10 rounded-lg">
        <div className="text-red-500 mb-3">
          <strong>Error:</strong> {examError}
        </div>

        {isPrivateRepoError && (
          <div className="text-sm text-tokyo-fg-dim mb-3">
            <p>Only public repositories are supported. Please:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Use a public repository</li>
              <li>Make the repository public if you own it</li>
              <li>Try a different repository</li>
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleRetry}
            className="px-3 py-1 bg-tokyo-blue text-white rounded text-sm hover:bg-tokyo-blue/80 transition-colors"
          >
            Try Again
          </button>
          {isRateLimitError && (
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-tokyo-orange text-white rounded text-sm hover:bg-tokyo-orange/80 transition-colors"
            >
              Refresh Page
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-tokyo-fg-bright text-center">
        {examSimulator.title}
      </h1>

      {/* Only show countdown timer for sessions with duration limits */}
      {examDurationActiveExamMs > 0 && (
        <CountdownTimer
          totalMs={examDurationActiveExamMs}
          autoStart={false} // Will be controlled by examStarted state
          startTrigger={examStarted}
          pauseTrigger={isDeliberatelyPaused || showReconnectionBanner} // Use the REAL pause state from ControlTray
          isDeliberatePause={isDeliberatelyPaused} // Use the REAL deliberate pause state
          onTimeUp={handleTimeUp} // New callback for timer expiration
          onIntroduction={handleIntroduction} // New callback for introduction message
          onFarewell={handleFarewell} // New callback for farewell message
        />
      )}

      {/* For unlimited sessions, send introduction message directly */}
      {examDurationActiveExamMs === 0 && examStarted && (
        <div style={{ display: "none" }}>
          {/* Hidden div for unlimited sessions - introduction handled by useEffect */}
        </div>
      )}

      {examSimulator.type === "Github Repo" && (
        <div className="my-6">
          {/* Added margin for spacing */}
          <label htmlFor="github-repo-url" className="block mb-2 text-tokyo-fg">
            GitHub Repository URL:
          </label>
          <input
            type="text"
            id="github-repo-url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
            className="border p-2 rounded w-full bg-tokyo-base border-tokyo-selection text-tokyo-fg"
            disabled={examIntentStarted || isLoadingPrompt}
          />
          {examIntentStarted && !repoUrl && (
            <div className="mt-2 text-tokyo-orange">
              Please enter a GitHub repository URL above.
            </div>
          )}
        </div>
      )}

      {/* Display student task area for standard exams */}
      {examSimulator.type !== "Github Repo" && (
        <AIExaminerDisplay
          studentTask={studentTask}
          isLoading={isLoadingPrompt}
        />
      )}

      {/* Code Review Summary Modal */}
      <CodeReviewSummaryModal
        isOpen={showSummaryModal}
        summary={
          examSimulator?.type === "Github Repo" && githubQuestions
            ? `=== REVIEW FOCUS AREAS ===\n${githubQuestions}\n========================\n\n${reviewSummary}`
            : reviewSummary
        }
        onClose={() => {
          setShowSummaryModal(false);
          clearConversation(); // Clear the conversation history
        }}
      />

      {/* Network Status Banner */}
      <ReconnectionBanner
        isVisible={showReconnectionBanner && !isDeliberatelyPaused}
        isReconnecting={isReconnecting}
        timeLeft={undefined}
        onReconnect={undefined} // No manual reconnect button needed - automatic reconnection
        onEndSession={() => {}}
        showReconnectButton={false} // Always false - no manual button needed
      />

      {/* ControlTrayCustom is rendered here, with direct handler */}
      {shouldShowControlTray && (
        <ControlTrayCustom
          videoRef={videoRef}
          supportsVideo={supportsVideo}
          onVideoStreamChange={onVideoStreamChange}
          onButtonClicked={handleButtonClicked}
          forceStopAudio={forceStopAudio}
          forceStopVideo={forceStopVideo}
          onButtonReady={onButtonReady}
          onScreenShareCancelled={onScreenShareCancelled}
          onEndReview={handleManualStopInternal}
          hideMainButton={hideMainButton}
          isReadyForAutoTrigger={isReadyForAutoTrigger}
          onEnvironmentChange={onEnvironmentChange}
        />
      )}

      {/* Show helper text when GitHub URL is required but not provided */}
      {examSimulator?.type === "Github Repo" &&
        !isValidGitHubUrl(repoUrl) &&
        !isLoadingPrompt && (
          <div className="text-center text-tokyo-fg-dim mt-4 p-4 bg-tokyo-bg-lighter rounded-lg border border-tokyo-selection">
            <p className="mb-2">
              <span className="material-symbols-outlined text-tokyo-orange mr-2">
                info
              </span>
              Please enter a valid GitHub repository URL above to start the code
              review
            </p>
            <p className="text-sm text-tokyo-fg-dim">
              Supported formats: github.com/user/repo, user/repo, or API URLs
            </p>
          </div>
        )}
    </div>
  );
}
// Removed the specific style block for ghost lines as it's now in AIExaminerDisplay
