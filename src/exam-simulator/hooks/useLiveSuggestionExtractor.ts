import { useState, useCallback, useRef } from "react";
import { getSessionCompletion } from "../utils/getCompletion.js";
import prompts from "../../prompts.json";
import { AI_CONFIG } from "../../config/aiConfig";

export interface Suggestion {
  id: string;
  text: string;
  timestamp: Date;
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export const useLiveSuggestionExtractor = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [persistedSuggestions, setPersistedSuggestions] = useState<
    Suggestion[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const conversationHistory = useRef<Message[]>([]);
  const isSessionInitialized = useRef(false);
  const processedChunks = useRef(new Set<string>());
  const isInitializing = useRef(false);
  const lastExtractionAtRef = useRef<number>(0);

  const initializeSession = useCallback(async () => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    try {
      const systemMessage: Message = {
        role: "system",
        content: prompts.suggestionExtraction.systemPrompt,
      };

      const initialMessage: Message = {
        role: "user",
        content: prompts.suggestionExtraction.initialPrompt,
      };

      conversationHistory.current = [systemMessage, initialMessage];

      // Get initial response to establish session with timeout
      const response = await getSessionCompletion(conversationHistory.current);

      conversationHistory.current.push({
        role: "assistant",
        content: response,
      });

      isSessionInitialized.current = true;
      console.log("✅ Live suggestions session initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing live suggestions session:", error);
      isSessionInitialized.current = false;
      // Don't set isProcessing to false here - let the calling function handle it
    } finally {
      isInitializing.current = false;
    }
  }, []);

  // Levenshtein distance calculation
  const levenshteinDistance = useCallback(
    (str1: string, str2: string): number => {
      const matrix = [];

      for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
      }

      for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }

      return matrix[str2.length][str1.length];
    },
    []
  );

  // Simple similarity calculation for duplicate detection
  const calculateSimilarity = useCallback(
    (str1: string, str2: string): number => {
      const longer = str1.length > str2.length ? str1 : str2;
      const shorter = str1.length > str2.length ? str2 : str1;

      if (longer.length === 0) return 1.0;

      const editDistance = levenshteinDistance(longer, shorter);
      return (longer.length - editDistance) / longer.length;
    },
    [levenshteinDistance]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const extractSuggestions = useCallback(
    async (transcriptChunk: string) => {
      // Skip if live suggestion extraction is disabled
      if (!AI_CONFIG.FEATURES.LIVE_SUGGESTION_EXTRACTION) {
        return; // Feature disabled - no API calls
      }

      // Skip if empty or already processed
      if (
        !transcriptChunk.trim() ||
        processedChunks.current.has(transcriptChunk)
      ) {
        return;
      }

      // Check network connectivity before making API calls
      if (!navigator.onLine) {
        return; // Skip during network outage
      }

      // Skip very long chunks that might cause timeouts
      if (transcriptChunk.length > 2000) {
        console.log("🟡 Skipping very long transcript chunk for suggestions");
        return;
      }

      // Basic rate limit to avoid overly frequent completions
      const now = Date.now();
      if (now - lastExtractionAtRef.current < 8000) {
        return;
      }

      // Skip if a previous extraction is still in progress
      if (isProcessing) {
        return;
      }

      // Initialize session if needed
      if (!isSessionInitialized.current) {
        console.log("🔄 Initializing live suggestions session...");
        await initializeSession();
        // After initialization, process this chunk normally
        // Don't return early - let it continue to process
      }

      // Mark as processed
      processedChunks.current.add(transcriptChunk);
      setIsProcessing(true);
      lastExtractionAtRef.current = now;

      // Add a processing timeout to prevent infinite hanging
      const processingTimeout = setTimeout(() => {
        console.log("🟡 Live suggestions processing timeout - resetting state");
        setIsProcessing(false);
      }, 35000); // 35 seconds timeout (5 seconds more than API timeout)

      try {
        // Create chunk prompt using template
        const chunkPrompt = prompts.suggestionExtraction.chunkPrompt
          // eslint-disable-next-line no-template-curly-in-string
          .replace("${transcriptChunk}", transcriptChunk);

        // Add user message to conversation
        conversationHistory.current.push({
          role: "user",
          content: chunkPrompt,
        });

        const response = await getSessionCompletion(
          conversationHistory.current
        );

        // Add assistant response to conversation history
        conversationHistory.current.push({
          role: "assistant",
          content: response,
        });

        // Keep conversation history manageable (last 10 exchanges)
        if (conversationHistory.current.length > 21) {
          // system + 10 exchanges
          const systemMessage = conversationHistory.current[0];
          const recentHistory = conversationHistory.current.slice(-20);
          conversationHistory.current = [systemMessage, ...recentHistory];
        }

        if (response && response.trim() !== "NO_SUGGESTIONS") {
          // Parse bullet points (prefer •, fallback to -, *, or numbered)
          const lines = response.split("\n").map((l: string) => l.trim());
          let bulletPoints = lines
            .filter((line: string) => line.startsWith("•"))
            .map((line: string) => line.replace(/^•\s?/, "").trim())
            .filter((text: string) => text.length > 0);

          if (bulletPoints.length === 0) {
            bulletPoints = lines
              .filter(
                (line: string) =>
                  line.startsWith("-") ||
                  line.startsWith("*") ||
                  /^\d+[).]/.test(line)
              )
              .map((line: string) =>
                line.replace(/^([•*-]|\d+[).])\s*/, "").trim()
              )
              .filter((text: string) => text.length > 0);
          }

          if (bulletPoints.length > 0) {
            const newSuggestions: Suggestion[] = bulletPoints.map(
              (text: string) => ({
                id: Date.now() + "-" + Math.random().toString(36).substr(2, 9),
                text,
                timestamp: new Date(),
              })
            );

            // Add to suggestions list with intelligent duplicate handling
            setSuggestions((prev) => {
              const existingTexts = new Set(
                prev.map((s) => s.text.toLowerCase())
              );

              // More sophisticated duplicate detection
              const uniqueNew = newSuggestions.filter((newSugg) => {
                const newText = newSugg.text.toLowerCase();

                // Check for exact duplicates
                if (existingTexts.has(newText)) return false;

                // Check for very similar suggestions (avoid minor variations)
                const isTooSimilar = Array.from(existingTexts).some(
                  (existingText) => {
                    const similarity = calculateSimilarity(
                      newText,
                      existingText
                    );
                    return similarity > 0.8; // 80% similarity threshold
                  }
                );

                return !isTooSimilar;
              });

              if (uniqueNew.length > 0) {
                // Update both UI suggestions and persisted suggestions
                setSuggestions((prev) => [...prev, ...uniqueNew]);
                setPersistedSuggestions((prev) => [...prev, ...uniqueNew]);

                return [...prev, ...uniqueNew];
              }
              return prev;
            });
          }
        }
      } catch (error) {
        // Enhanced error handling for network issues and timeouts
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          // Network issues are expected during disconnections - no logging needed
        } else if (error instanceof Error && error.name === "AbortError") {
          // Request cancellation is normal - no logging needed
        } else if (
          error instanceof Error &&
          error.message.includes("timeout")
        ) {
          console.log("🟡 Live suggestions API timeout - continuing normally");
        } else {
          console.error("Error extracting suggestions:", error);
        }

        // Don't let live suggestion errors interfere with the main session
        // The error is logged but we continue normally
      } finally {
        clearTimeout(processingTimeout);
        setIsProcessing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initializeSession, calculateSimilarity]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    processedChunks.current.clear();
    conversationHistory.current = [];
    isSessionInitialized.current = false;
  }, []);

  const clearAllSuggestions = useCallback(() => {
    setSuggestions([]);
    setPersistedSuggestions([]);
    processedChunks.current.clear();
    conversationHistory.current = [];
    isSessionInitialized.current = false;
  }, []);

  return {
    suggestions,
    persistedSuggestions,
    extractSuggestions,
    clearSuggestions,
    clearAllSuggestions,
    isProcessing,
  };
};
