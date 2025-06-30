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
  const [examSimulator, setExamSimulator] = useState<ExamSimulator | null>(
    null
  );
  const [examStarted, setExamStarted] = useState(false);
  const [isLoadingExamData, setIsLoadingExamData] = useState<boolean>(true);
  const [examError, setExamError] = useState<string | null>(null);

  const [studentTask, setStudentTask] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState<string>(""); // For GitHub type exams
  const [prompt, setPrompt] = useState<string>("");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState<boolean>(false);
  const [liveConfig, setLiveConfig] = useState<any>(null); // Local config state

  // New state for summary modal
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<string>("");
  const [githubQuestions, setGithubQuestions] = useState<string>("");

  // Connection guard to prevent duplicate connections
  const [isConnectingRef] = useState(() => ({ current: false }));

  const { client, connected, connect, disconnect } = useGenAILiveContext();

  // Use conversation tracker hook
  const { getConversationSummary, clearConversation, getDebugInfo } =
    useConversationTracker(client, onTranscriptChunk);

  const examDurationInMinutes =
    examSimulator?.duration ?? EXAM_DURATION_IN_MINUTES;
  const examDurationActiveExamMs = examDurationInMinutes * 60 * 1000;

  const [stopReason, setStopReason] = useState<"timer" | "manual" | null>(null);

  // Track timer cleanup function
  const timerCleanupRef = useRef<(() => void) | null>(null);

  // Unified handler for both timer expiration and manual stop
  const handleSessionEnd = useCallback(
    (reason: "timer" | "manual") => {
      console.log(`🛑 Session ending: ${reason}`);
      setStopReason(reason);

      // Clean up any active timers first
      if (timerCleanupRef.current) {
        console.log("🧹 Timer cleanup complete");
        timerCleanupRef.current();
        timerCleanupRef.current = null;
      }

      // Stop audio and disconnect immediately to stop voice
      if (connected && client) {
        console.log("🔌 Disconnecting client and terminating session");
        disconnect(); // Do not await
        client.terminateSession();
      }

      // Reset exam state immediately for fast UI response
      setExamStarted(false);

      // Notify parent component immediately for both timer and manual stop
      if (reason === "timer" && onTimerExpired) {
        onTimerExpired();
      } else if (reason === "manual" && onManualStop) {
        onManualStop();
      }

      // Show modal with loading state first, then generate summary asynchronously
      setShowSummaryModal(true);
      setReviewSummary("Generating review summary...");

      // Generate summary in background without blocking UI
      setTimeout(async () => {
        try {
          const examDetails = examSimulator
            ? {
                title: examSimulator.title,
                description: examSimulator.description,
                duration: examSimulator.duration ?? examDurationInMinutes,
              }
            : undefined;

          const summary = await getConversationSummary(
            examDetails,
            liveSuggestions
          );
          setReviewSummary(summary);
        } catch (error) {
          console.error("Error generating summary:", error);
          setReviewSummary(
            "Error generating review summary. Please try again."
          );
        }
      }, 100); // Small delay to ensure UI updates first
    },
    [
      connected,
      client,
      disconnect,
      onTimerExpired,
      onManualStop,
      getConversationSummary,
      examSimulator,
      examDurationInMinutes,
      liveSuggestions,
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
      console.log("🧹 ExamWorkflow component unmounting - cleaning up");

      // Clean up timers
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
        timerCleanupRef.current = null;
      }

      // Reset connection guard
      isConnectingRef.current = false;

      // Terminate any active session
      if (client) {
        console.log("🛑 Terminating session on component unmount");
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
    if (quickStartExam) {
      console.log("🚀 Using quick start exam data:", quickStartExam);
      setExamSimulator(quickStartExam as ExamSimulator);
      setIsLoadingExamData(false);
      return;
    }

    // Otherwise, fetch from Supabase as normal
    const fetchExamSimulator = async () => {
      setIsLoadingExamData(true);
      setExamError(null);
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
      console.log(
        "🚀 Setting repo URL from quick start data:",
        quickStartExam.repoUrl
      );
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
          console.log("Repo URL is required for GitHub exam type.");
          return;
        }

        console.log("🔍 Starting GitHub repo processing for:", repoUrl);

        const githubQuestionsResult = await getRepoQuestions(
          repoUrl,
          examSimulator.learning_goals
        );
        setGithubQuestions(githubQuestionsResult);

        console.log("✅ GitHub questions generated:", githubQuestionsResult);

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
        console.log("🚀 Preparing quick start general review");
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
      console.log("✅ Prompt preparation completed successfully");
    } catch (error) {
      console.error("❌ Failed to prepare exam content:", error);
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
    if (examSimulator) {
      if (examSimulator.type === "Github Repo") {
        // For quick start GitHub repos, prepare immediately when repoUrl is available
        // For normal GitHub repos, wait for examIntentStarted
        const isQuickStart = examSimulator.duration === 0;
        if (isQuickStart && repoUrl && !prompt && !isLoadingPrompt) {
          console.log(
            "🚀 Quick start GitHub repo - preparing content immediately"
          );
          prepareExamContent();
        }
        // For normal GitHub repos, prompt preparation will be triggered by the examIntentStarted effect.
      } else {
        prepareExamContent();
      }
    }
  }, [examSimulator, prepareExamContent, repoUrl, prompt, isLoadingPrompt]);

  // Effect for when exam intent starts (user clicks start button)
  useEffect(() => {
    if (examIntentStarted && examSimulator) {
      if (examSimulator.type === "Github Repo") {
        const isQuickStart = examSimulator.duration === 0;

        if (isQuickStart) {
          // For quick start, the content should already be prepared
          if (prompt) {
            console.log(
              "🚀 Quick start GitHub repo - using pre-prepared content"
            );
            const newConfig = createLiveConfig(prompt);
            setLiveConfig(newConfig);
          } else if (!repoUrl) {
            setExamError(
              "Please enter a GitHub repository URL before starting."
            );
          } else if (!isLoadingPrompt) {
            // Fallback: if somehow content wasn't prepared, prepare it now
            console.log(
              "⚠️ Quick start GitHub repo - preparing content as fallback"
            );
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
      // Clean up timers when exam intent stops
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
      }
      client.disconnect();
      setExamStarted(false);
    }
  }, [
    examIntentStarted,
    examSimulator,
    repoUrl,
    prompt,
    connected,
    client,
    prepareExamContent,
    isLoadingPrompt,
  ]);

  // Effect to connect and start timers when config is set and intent is active
  useEffect(() => {
    if (
      examIntentStarted &&
      liveConfig?.systemInstruction?.parts?.[0]?.text &&
      !connected &&
      !isConnectingRef.current
    ) {
      isConnectingRef.current = true;

      console.log(`🔗 Starting new session...`);

      connect(getCurrentModel(), liveConfig)
        .then(() => {
          console.log(
            "✅ Connection successful - live feed should now be active"
          );
          setExamStarted(true);

          // Clean up any existing timers first
          if (timerCleanupRef.current) {
            timerCleanupRef.current();
          }

          // Set up timers - for quick start, at least set up introduction timer
          if (examDurationActiveExamMs > 0) {
            console.log("⏰ Setting up full timers for timed session");
            // Set up new timers and store cleanup function
            timerCleanupRef.current = examTimers({
              client,
              examDurationInMs: examDurationActiveExamMs,
              isInitialConnection: true,
            });
          } else {
            console.log(
              "🚀 Quick start session - setting up introduction timer only"
            );
            // For quick start sessions, we still want the AI to introduce itself
            const timerConfig = getTimerConfig();
            const introTimer = setTimeout(() => {
              if (client) {
                console.log("🎙️ Sending introduction message for quick start");
                client.send([{ text: prompts.timerMessages.introduction }]);
              }
            }, timerConfig.introductionDelay + 500);

            // Return cleanup function for the intro timer
            timerCleanupRef.current = () => {
              clearTimeout(introTimer);
              console.log("🧹 Quick start intro timer cleanup complete");
            };
          }

          isConnectingRef.current = false;
        })
        .catch((error) => {
          console.error(`❌ Failed to start session:`, error);
          setExamError("Failed to connect to the exam server.");
          isConnectingRef.current = false;
        });
    } else if (!examIntentStarted && connected) {
      // Clean up when exam intent stops
      if (timerCleanupRef.current) {
        timerCleanupRef.current();
      }
      client.disconnect();
      setExamStarted(false);
      isConnectingRef.current = false;
    }
  }, [
    examIntentStarted,
    liveConfig?.systemInstruction?.parts?.[0]?.text,
    connected,
    connect,
    client,
    examDurationActiveExamMs,
  ]);

  // Notify parent of loading state changes
  useEffect(() => {
    if (onLoadingStateChange) {
      onLoadingStateChange(isLoadingPrompt);
    }
  }, [isLoadingPrompt, onLoadingStateChange]);

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

      {/* ControlTrayCustom is rendered here, with direct handler */}
      {!isLoadingPrompt && (
        <ControlTrayCustom
          onEndReview={handleManualStopInternal}
          videoRef={videoRef}
          supportsVideo={supportsVideo}
          onVideoStreamChange={onVideoStreamChange}
          onButtonClicked={onButtonClicked}
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
