import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../config/supabaseClient";
import { useGenAILiveContext } from "../../../contexts/GenAILiveContext";
import { ExamSimulator } from "../../../types/ExamSimulator";
import { getExaminerQuestions } from "../../utils/getExaminerQuestions";
import getRepoQuestions from "../../utils/getGithubRepoFiles.js"; // Assuming .js is correct
import getPrompt from "../../utils/prompt";
import examTimers from "../../hooks/useExamTimers"; // Ensure this is correctly typed
import { createLiveConfig } from "../../utils/liveConfigUtils"; // Import the new utility
import { LoadingAnimation } from "../ui/LoadingAnimation"; // Check path
import { AIExaminerDisplay } from "./AIExaminer"; // Import the refactored display component
import { CountdownTimer } from "../CountdownTimer"; // Import CountdownTimer
import { getCurrentModel, getTimerConfig } from "../../../config/aiConfig"; // Import centralized config
import { useConversationTracker } from "../../hooks/useConversationTracker"; // New hook for tracking conversation
import { CodeReviewSummaryModal } from "../ui/CodeReviewSummaryModal"; // New modal component
import { ReconnectionBanner } from "../ui/ReconnectionBanner"; // New reconnection banner
import ControlTrayCustom from "../control-tray-custom/ControlTrayCustom"; // Correct import for ControlTrayCustom
import prompts from "../../../prompts.json"; // Import prompts for introduction message

const EXAM_DURATION_IN_MINUTES = 10; // default duration

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
}: ExamWorkflowProps) {
  const { client, connected, connect, stopAudio } = useGenAILiveContext();
  const [examSimulator, setExamSimulator] = useState<ExamSimulator | null>(
    null
  );
  const [isLoadingExamData, setIsLoadingExamData] = useState(false);
  const [examError, setExamError] = useState("");
  const [repoUrl, setRepoUrl] = useState(""); // State to manage GitHub repository URL
  const [githubQuestions, setGithubQuestions] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [studentTask, setStudentTask] = useState("");
  const [examStarted, setExamStarted] = useState(false);
  const [liveConfig, setLiveConfig] = useState<any>(null);
  const timerCleanupRef = useRef<(() => void) | null>(null);
  const isConnectingRef = useRef(false);
  const activeConnectionRef = useRef(false);
  const hasUsedQuickStartRef = useRef(false); // Track if we've already used quick start data
  const isReconnectingRef = useRef(false); // Track reconnecting state for timeout
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track reconnection timeout

  // New state for summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<string>("");

  // New state for network status banner
  const [showReconnectionBanner, setShowReconnectionBanner] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showReconnectButton, setShowReconnectButton] = useState(false);

  // Track deliberate pause to avoid showing network banner
  const [isDeliberatelyPaused, setIsDeliberatelyPaused] = useState(false);

  // Add a trigger to force connection useEffect to re-run
  const [connectionTrigger, setConnectionTrigger] = useState(0);

  // Track previous pause state for resume detection
  const previousPauseStateRef = useRef(isDeliberatelyPaused);

  // Use conversation tracker hook
  const { getConversationSummary, clearConversation, getTranscripts } =
    useConversationTracker(client, onTranscriptChunk);

  // Debug current network and banner state
  useEffect(() => {
    console.log("🔍 ExamWorkflow Debug State:", {
      examStarted,
      showReconnectionBanner,
      showReconnectButton,
      isReconnecting,
      isDeliberatelyPaused,
      navigatorOnline: navigator.onLine,
      clientConnected: connected,
      clientExists: !!client,
    });
  }, [
    examStarted,
    showReconnectionBanner,
    showReconnectButton,
    isReconnecting,
    isDeliberatelyPaused,
    connected,
    client,
  ]);

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
          console.log(
            "✅ AI responded - cleared reconnection timeout and reset flags"
          );
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
        console.log(
          "🔄 Resume detected - sending 'let's continue' prompt to AI"
        );
        client.send([
          {
            text: "Let's continue with the code review.",
          },
        ]);
      }

      // Update the ref for next time
      previousPauseStateRef.current = isDeliberatelyPaused;
    }
  }, [client, connected, isDeliberatelyPaused]);

  // Only use exam duration if it's explicitly set (> 0), otherwise unlimited session
  const examDurationInMinutes = examSimulator?.duration || 0;
  const examDurationActiveExamMs = examDurationInMinutes * 60 * 1000;

  // State to track if timers are already active to prevent duplicates
  const timersActiveRef = useRef(false);

  // Network connectivity monitoring - automatic reconnection with spinner
  useEffect(() => {
    if (!client) return;

    // Simple offline detection - automatically start reconnection process
    const handleOffline = () => {
      console.log("📡 Browser offline event fired");
      // Only show banner if not deliberately paused and exam is started
      if (examStarted && !isDeliberatelyPaused) {
        console.log("🔴 Network offline - showing banner and cutting AI audio");

        // Cut the AI audio immediately in the browser
        stopAudio();

        setShowReconnectionBanner(true);
        setIsReconnecting(false); // Reset reconnecting flag for fresh offline state
        setShowReconnectButton(false); // No manual button

        // Clear any existing reconnection timeout from previous attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
          console.log("🧹 Cleared previous reconnection timeout");
        }
      }
    };

    const handleOnline = () => {
      console.log("📡 Browser online event fired");
      // Automatically start reconnection when network comes back
      if (examStarted && showReconnectionBanner && !isDeliberatelyPaused) {
        console.log("🟢 Network restored - starting automatic reconnection");
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
  ]);

  // Automatic reconnect handler - starts immediately when network is restored
  const handleAutomaticReconnect = async () => {
    console.log(
      "🔄 Automatic reconnect started - triggering normal connection flow"
    );
    setIsReconnecting(true);
    setShowReconnectButton(false); // No manual button needed

    try {
      // Instead of using client.reconnectWithResumption(), trigger the normal connection flow
      // by temporarily resetting the connection guards to allow the normal useEffect to run
      console.log(
        "🔄 Resetting connection guards to trigger normal connection flow"
      );

      // Reset connection guards to allow normal connection
      isConnectingRef.current = false;
      activeConnectionRef.current = false;

      // Force the connection useEffect to re-run by changing the trigger
      setConnectionTrigger((prev) => prev + 1);

      // The normal connection useEffect will now run and establish the connection
      // This is the same flow that works when the user speaks

      // Set up a timeout to check if connection was successful
      reconnectTimeoutRef.current = setTimeout(() => {
        if (connected) {
          console.log(
            "✅ Connection established - sending reconnection prompt to AI"
          );

          // Send introduction message to make AI speak
          if (client) {
            console.log("📤 Sending reconnection acknowledgment prompt to AI");
            client.send([
              {
                text: "I notice we had a brief connection interruption, but I'm back now. Let's continue with your code review where we left off.",
              },
            ]);

            // Banner will be hidden when AI responds to this prompt (handled by transcript effect)
            // Don't hide banner here - wait for AI response
          }
        } else {
          console.log("⚠️ Normal connection flow didn't complete - retrying");
          setIsReconnecting(false);
          // Retry after 5 seconds
          setTimeout(() => {
            if (showReconnectionBanner && !isDeliberatelyPaused) {
              console.log("🔄 Retrying automatic reconnection...");
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
          console.log("🔄 Retrying automatic reconnection after error...");
          handleAutomaticReconnect();
        }
      }, 5000);
    }
  };

  // Unified handler for both timer expiration and manual stop
  const handleSessionEnd = useCallback(
    async (reason: "timer" | "manual") => {
      // Clean up timers first to prevent side effects
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
        timerCleanupRef.current = null;
      }
      timersActiveRef.current = false;

      // Clean up reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Reset connection guards
      isConnectingRef.current = false;
      activeConnectionRef.current = false;

      // Terminate the session if connected
      if (client) {
        client.terminateSession();
      }

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
      setShowReconnectButton(false); // Reset button flag

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
      client,
      getConversationSummary,
      examSimulator,
      liveSuggestions,
      onLoadingStateChange,
      onTimerExpired,
      onManualStop,
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
      // Clean up timers
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
        timerCleanupRef.current = null;
      }

      // Clean up reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Reset connection guards and session tracking
      isConnectingRef.current = false;
      activeConnectionRef.current = false;
      setShowReconnectionBanner(false);
      setIsReconnecting(false); // Reset reconnecting flag
      setShowReconnectButton(false); // Reset button flag

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
        const { data, error } = await supabase
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

  // Initialize repo URL from quick start exam data if available
  useEffect(() => {
    if (quickStartExam?.repoUrl && quickStartExam.type === "Github Repo") {
      setRepoUrl(quickStartExam.repoUrl);
    }
  }, [quickStartExam]);

  // Prepare exam content (questions, prompt)
  const prepareExamContent = useCallback(async () => {
    if (!examSimulator) return;

    setIsLoadingPrompt(true);
    setExamError(""); // Clear any previous errors
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
          examSimulator.learning_goals
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
      console.error("Failed to prepare exam content:", error);
      setExamError(
        error instanceof Error
          ? `Error: ${error.message}`
          : "Failed to load exam questions/prompt"
      );
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [examSimulator, repoUrl, examDurationInMinutes]);

  // Effect to trigger prompt preparation when examSimulator is loaded
  // and for standard exams, or when repoUrl is set for GitHub exams.
  useEffect(() => {
    if (examSimulator && !prompt && !isLoadingPrompt) {
      if (examSimulator.type === "Github Repo") {
        // For quick start GitHub repos, prepare immediately when repoUrl is available
        // For normal GitHub repos, wait for examIntentStarted
        const isQuickStart = examSimulator.duration === 0;
        if (isQuickStart && repoUrl) {
          prepareExamContent();
        }
        // For normal GitHub repos, prompt preparation will be triggered by the examIntentStarted effect.
      } else {
        // Standard exam - prepare content immediately
        prepareExamContent();
      }
    }
  }, [examSimulator, repoUrl]);

  // Effect for when exam intent starts (user clicks start button)
  useEffect(() => {
    if (examIntentStarted && examSimulator) {
      if (examSimulator.type === "Github Repo") {
        const isQuickStart = examSimulator.duration === 0;

        if (isQuickStart) {
          // For quick start, the content should already be prepared
          if (prompt) {
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
          // Normal GitHub repo flow
          if (repoUrl && !prompt) {
            prepareExamContent(); // This will set the prompt
          } else if (prompt) {
            const newConfig = createLiveConfig(prompt);
            setLiveConfig(newConfig);
          } else if (!repoUrl) {
            setExamError(
              "Please enter a GitHub repository URL before starting."
            );
          }
        }
      } else {
        // Standard Exam
        if (prompt) {
          const newConfig = createLiveConfig(prompt);
          setLiveConfig(newConfig);
        }
      }
    } else if (!examIntentStarted && connected) {
      // Clean up when exam intent stops (but not during network issues)
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
        timersActiveRef.current = false;
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
    examSimulator,
    repoUrl,
    prompt,
    connected,
    client,
    isLoadingPrompt,
  ]);

  // Effect to connect and start timers when config is set and intent is active
  useEffect(() => {
    if (
      examIntentStarted &&
      liveConfig?.systemInstruction?.parts?.[0]?.text &&
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

          // Only set up timers if they're not already active (prevents double setup)
          if (!timersActiveRef.current) {
            timersActiveRef.current = true;

            // Clean up any existing timers first
            if (timerCleanupRef.current) {
              timerCleanupRef.current();
            }

            // Set up timers
            if (examDurationActiveExamMs > 0) {
              timerCleanupRef.current = examTimers({
                client,
                examDurationInMs: examDurationActiveExamMs,
                isInitialConnection: true,
              });
            } else {
              const timerConfig = getTimerConfig();
              const introTimer = setTimeout(() => {
                if (client) {
                  console.log(
                    "📤 Sending introduction message for fresh session"
                  );
                  client.send([{ text: prompts.timerMessages.introduction }]);
                } else {
                  console.error(
                    "❌ No client available for introduction message"
                  );
                }
              }, timerConfig.introductionDelay + 500);

              timerCleanupRef.current = () => {
                clearTimeout(introTimer);
                timersActiveRef.current = false;
              };
            }
          }

          isConnectingRef.current = false;
        })
        .catch((error) => {
          console.error("Failed to connect:", error);
          setExamError("Failed to connect to the exam server.");
          isConnectingRef.current = false;
          activeConnectionRef.current = false;
        });
    } else if (!examIntentStarted && connected) {
      // Clean up when exam intent stops (but not during network issues)
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
        timersActiveRef.current = false;
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
    liveConfig?.systemInstruction?.parts?.[0]?.text,
    connected,
    connect,
    examDurationActiveExamMs,
    client,
    isReconnecting,
    showReconnectionBanner,
    connectionTrigger, // Add the trigger to the dependency array
    isDeliberatelyPaused, // Add this to the dependency array
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
      console.log("🔄 Deliberate pause detected");
      setIsDeliberatelyPaused(true);
      setShowReconnectionBanner(false); // Hide any network banner
    } else if (!connected && isButtonOn && isDeliberatelyPaused) {
      // Button is being turned on while not connected and we were paused - this is a resume
      console.log("🔄 Deliberate resume detected");
      setIsDeliberatelyPaused(false);
    } else if (!connected && isButtonOn && !isDeliberatelyPaused) {
      // Button is being turned on while not connected and we weren't paused - this is a fresh start
      console.log("🔄 Fresh start detected");
      setIsDeliberatelyPaused(false);
    }

    // Call the original handler
    if (onButtonClicked) {
      onButtonClicked(isButtonOn);
    }
  };

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
    return <div className="text-red-500">Error: {examError}</div>;
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
          pauseTrigger={!examIntentStarted} // Pause when exam intent is not started
          onTimeUp={handleTimeUp} // New callback for timer expiration
        />
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
      {!isLoadingPrompt && (
        <ControlTrayCustom
          onEndReview={handleManualStopInternal}
          videoRef={videoRef}
          supportsVideo={supportsVideo}
          onVideoStreamChange={onVideoStreamChange}
          onButtonClicked={handleButtonClicked}
          forceStopAudio={forceStopAudio}
          forceStopVideo={forceStopVideo}
          onButtonReady={onButtonReady}
          onScreenShareCancelled={onScreenShareCancelled}
        />
      )}
    </div>
  );
}
// Removed the specific style block for ghost lines as it's now in AIExaminerDisplay
