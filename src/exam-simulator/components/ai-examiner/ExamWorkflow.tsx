import React, { useState, useEffect, useCallback } from "react";
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
import { getCurrentModel } from "../../../config/aiConfig"; // Import centralized config

const EXAM_DURATION_IN_MINUTES = 8; // default duration

interface ExamWorkflowProps {
  examId: string;
  examIntentStarted: boolean; // Controlled by AIExaminerPage via ControlTrayCustom
  // onExamStarted is now internal to ExamWorkflow as CountdownTimer is moved here
}

export function ExamWorkflow({ examId, examIntentStarted }: ExamWorkflowProps) {
  const [examSimulator, setExamSimulator] = useState<ExamSimulator | null>(
    null
  );
  const [examStarted, setExamStarted] = useState(false); // For CountdownTimer
  const [isLoadingExamData, setIsLoadingExamData] = useState<boolean>(true);
  const [examError, setExamError] = useState<string | null>(null);

  const [studentTask, setStudentTask] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState<string>(""); // For GitHub type exams
  const [prompt, setPrompt] = useState<string>("");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState<boolean>(false);
  const [liveConfig, setLiveConfig] = useState<any>(null); // Local config state
  const [hasEverConnected, setHasEverConnected] = useState<boolean>(false); // Track if we've connected before

  const { client, connected, connect, resume } = useGenAILiveContext();

  const examDurationInMinutes =
    examSimulator?.duration ?? EXAM_DURATION_IN_MINUTES;
  const examDurationActiveExamMs = examDurationInMinutes * 60 * 1000;

  // Fetch exam data from Supabase
  useEffect(() => {
    if (!examId) {
      setExamError("No Exam ID provided.");
      setIsLoadingExamData(false);
      return;
    }
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
  }, [examId]);

  // Prepare exam content (questions, prompt)
  const prepareExamContent = useCallback(async () => {
    if (!examSimulator) return;

    setIsLoadingPrompt(true);
    setExamError(""); // Clear any previous errors
    try {
      let finalPrompt = "";
      if (examSimulator.type === "Github Repo") {
        if (!repoUrl) {
          // Maybe set an error state here to inform user to enter URL
          setIsLoadingPrompt(false);
          setExamError(
            "GitHub repository URL is required to start this exam type."
          );
          console.log("Repo URL is required for GitHub exam type.");
          return;
        }

        console.log("🔍 Starting GitHub repo processing for:", repoUrl);

        const githubQuestions = await getRepoQuestions(
          repoUrl,
          examSimulator.learning_goals
        );

        console.log("✅ GitHub questions generated:", githubQuestions);

        finalPrompt = getPrompt.github(
          examSimulator,
          examDurationInMinutes,
          githubQuestions
        );

        console.log("✅ Final prompt created for GitHub repo");

        // For GitHub, student task might be different or not applicable before starting
        setStudentTask(
          "Review the provided GitHub repository based on the learning goals."
        );
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
        // For GitHub, we wait for examIntentStarted and repoUrl to be set before preparing.
        // Prompt preparation will be triggered by the examIntentStarted effect.
      } else {
        prepareExamContent();
      }
    }
  }, [examSimulator, prepareExamContent]);

  // Effect for when exam intent starts (user clicks start button)
  useEffect(() => {
    if (examIntentStarted && examSimulator) {
      console.log("🚀 Exam intent started!", {
        examType: examSimulator.type,
        repoUrl,
        hasPrompt: !!prompt,
      });

      if (examSimulator.type === "Github Repo") {
        if (repoUrl && !prompt) {
          // Only prepare if repoUrl is set and prompt not yet ready
          console.log("📦 Preparing GitHub repo content...");
          prepareExamContent(); // This will set the prompt
        } else if (prompt) {
          // If prompt is ready, proceed to setConfig
          console.log("⚙️ Creating live config with existing prompt...");
          const newConfig = createLiveConfig(prompt);
          setLiveConfig(newConfig);
        } else if (!repoUrl) {
          console.warn("⚠️ No repository URL provided");
          setExamError("Please enter a GitHub repository URL before starting.");
        }
      } else {
        // Standard Exam
        if (prompt) {
          // Ensure prompt is ready
          const newConfig = createLiveConfig(prompt);
          setLiveConfig(newConfig);
        }
      }
    } else if (!examIntentStarted && connected) {
      // If exam intent is stopped (pause pressed) and client is connected, disconnect.
      client.disconnect();
      setExamStarted(false); // Stop countdown timer display and reset exam started state
      // Note: We keep prompt, studentTask, and liveConfig so that task information remains visible
      // and the exam can be resumed without re-preparing content
    }
  }, [
    examIntentStarted,
    examSimulator,
    repoUrl,
    prompt,
    setLiveConfig,
    prepareExamContent,
    connected,
    client,
  ]);

  // Effect to connect and start timers when config is set and intent is active
  useEffect(() => {
    // Only connect if exam intent is started, config has a system instruction, and not already connected.
    if (
      examIntentStarted &&
      liveConfig?.systemInstruction?.parts?.[0]?.text &&
      !connected
    ) {
      const connectionMethod = hasEverConnected ? resume : connect;
      const connectionType = hasEverConnected ? "Resuming" : "Connecting";

      console.log(`🔍 ExamWorkflow ${connectionType}:`, {
        hasEverConnected,
        connectionMethod: hasEverConnected ? "resume" : "connect",
        liveConfig: !!liveConfig,
      });

      console.log(`${connectionType} to GenAI Live...`);

      connectionMethod(getCurrentModel(), liveConfig)
        .then(() => {
          setExamStarted(true); // Start countdown now that connection is established
          setHasEverConnected(true); // Mark that we've connected at least once

          // Only set up timers on initial connection, not on resume
          if (!hasEverConnected) {
            examTimers({
              client,
              examDurationInMs: examDurationActiveExamMs,
              isInitialConnection: true,
            });
          }
        })
        .catch((error) => {
          console.error(`Failed to ${connectionType.toLowerCase()}:`, error);
          setExamError(
            `Failed to ${connectionType.toLowerCase()} to the exam server.`
          );
        });
    }
  }, [
    liveConfig,
    connect,
    resume,
    client,
    examDurationActiveExamMs,
    connected,
    examIntentStarted,
    hasEverConnected,
  ]);

  if (isLoadingExamData) {
    return <LoadingAnimation isLoading={true} />;
  }

  if (examError) {
    return <div className="text-red-500">Error: {examError}</div>;
  }

  if (!examSimulator) {
    return <div>Exam not found or finished loading.</div>;
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-tokyo-fg-bright text-center">
        {examSimulator.title}
      </h1>
      <CountdownTimer
        totalMs={examDurationActiveExamMs}
        autoStart={false} // Will be controlled by examStarted state
        startTrigger={examStarted}
        pauseTrigger={!examIntentStarted} // Pause when exam intent is not started
      />
      {examSimulator.type === "Github Repo" && (
        <div className="my-6">
          {" "}
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
          {examIntentStarted && isLoadingPrompt && repoUrl && (
            <div className="mt-4">
              <LoadingAnimation isLoading={true} />
              <p className="text-center text-tokyo-fg-dim mt-2">
                Processing GitHub repository... This may take a moment.
              </p>
            </div>
          )}
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

      {/* General loading indicator for when examIntentStarted but prompt isn't ready yet (mostly for standard) */}
      {/* For GitHub, specific loading is shown near the input field */}
      {examIntentStarted &&
        isLoadingPrompt &&
        examSimulator.type !== "Github Repo" && (
          <LoadingAnimation isLoading={true} />
        )}
      {/* Ghost loader styles are now encapsulated within AIExaminerDisplay.
          The style block below can be removed if it only contained those.
          Keeping it if it contains other styles for ExamWorkflow.
          For now, assuming it was for ghost lines and removing. */}
    </div>
  );
}
// Removed the specific style block for ghost lines as it's now in AIExaminerDisplay
