import React, { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { LiveAPIProvider } from "../../contexts/LiveAPIContext";
import { AIExaminer } from "../components/ai-examiner/AIExaminer";
import { GithubRepo } from "../components/ai-examiner/AIExaminerGithub";
import { CountdownTimer } from "../components/CountdownTimer";
import ControlTrayCustom from "../components/control-tray-custom/ControlTrayCustom";
import cn from "classnames";
import Layout from "../layout/Layout";
import { supabase } from "../config/supabaseClient";

const host = "generativelanguage.googleapis.com";
const uri = `wss://${host}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") || undefined;

  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null); // State for the API key
  const [isLoadingKey, setIsLoadingKey] = useState(true); // State to track loading
  const [error, setError] = useState<string | null>(null); // State for errors

  useEffect(() => {
    // Define the endpoint URL where your API key is served
    // Replace '/api/get-key' with your actual endpoint
    const apiKeyEndpoint =
      "https://api-key-server-codereview.vercel.app/prompt2";

    const fetchApiKey = async () => {
      setIsLoadingKey(true);
      setError(null);
      try {
        const response = await fetch(apiKeyEndpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch API key: ${response.statusText}`);
        }
        // Gemini API key
        const geminiApiKey = await response.json();

        if (!geminiApiKey || typeof geminiApiKey !== "string") {
          throw new Error("Invalid API key format received from endpoint");
        }
        setGeminiApiKey(geminiApiKey);
      } catch (err) {
        console.error("Error fetching API key:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoadingKey(false);
      }
    };

    fetchApiKey();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Fetch the exam simulator with exam.id using supabase
  const [examSimulator, setExamSimulator] = useState<any>(null);
  const [isLoadingSimulator, setIsLoadingSimulator] = useState(true);

  useEffect(() => {
    const fetchExamSimulator = async () => {
      if (!id) {
        setIsLoadingSimulator(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("exams")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setExamSimulator(data);
      } catch (err) {
        console.error("Error fetching exam simulator:", err);
      } finally {
        setIsLoadingSimulator(false);
      }
    };

    fetchExamSimulator();
  }, [id]);

  // Calc exam duration (in ms) using examSimulator settings, fallback to 8 minutes.
  const examDurationInMinutes = examSimulator?.duration || 8;
  const examDurationInMs = examDurationInMinutes * 60 * 1000;

  // New state to start the countdown only when voice has started.
  const [examStarted, setExamStarted] = useState(false);

  // the intent is because the exam simulator is not yet started. The user has clicked the button and now we need to create the questions
  const [examIntentStarted, setExamIntentStarted] = useState(false);

  // Create a single handler for both exam types
  const handleExamStarted = () => setExamStarted(true);

  const onStartExamClicked = (isButtonOn: boolean) => {
    if (isButtonOn) {
      setExamIntentStarted(true);
    } else {
      setExamIntentStarted(false);
    }
  };

  if (error) {
    return (
      <Layout>
        <div>Error loading configuration: {error}</div>
      </Layout>
    );
  }

  // Ensure apiKey is not null before rendering the provider
  if (!geminiApiKey) {
    return (
      <Layout>
        <div></div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Pass the fetched API key */}
      <LiveAPIProvider url={uri} apiKey={geminiApiKey}>
        <div className="streaming-console max-w-2xl mx-auto flex flex-col">
          <div className="pt-10 pr-10 pl-10 mb-10 flex justify-center flex-col">
            <h1 className="mb-8 font-bold text-2xl text-black text-center">
              Welcome to your {examSimulator.title} exam
            </h1>

            {/* Countdown timer for both exam types */}
            <CountdownTimer
              totalMs={examDurationInMs}
              autoStart={false}
              startTrigger={examStarted}
            />

            {examSimulator.type === "Github Repo" ? (
              <GithubRepo
                examSimulator={examSimulator}
                onExamStarted={handleExamStarted}
                examIntentStarted={examIntentStarted}
              />
            ) : (
              <AIExaminer
                examSimulator={examSimulator}
                onExamStarted={handleExamStarted}
                examIntentStarted={examIntentStarted}
              />
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

          <ControlTrayCustom
            videoRef={videoRef}
            supportsVideo={true}
            onVideoStreamChange={setVideoStream}
            onButtonClicked={onStartExamClicked}
          />
        </div>
      </LiveAPIProvider>
    </Layout>
  );
}
