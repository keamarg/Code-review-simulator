import { useState, useCallback, useRef } from "react";
import { getSessionCompletion } from "../utils/getCompletion.js";
import prompts from "../../prompts.json";

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

  const initializeSession = useCallback(async () => {
    if (isSessionInitialized.current) return;

    console.log("🚀 Initializing suggestion extraction session");

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

      // Get initial response to establish session
      const response = await getSessionCompletion(conversationHistory.current);

      conversationHistory.current.push({
        role: "assistant",
        content: response,
      });

      isSessionInitialized.current = true;
      console.log("✅ Session initialized successfully");
    } catch (error) {
      console.error("❌ Error initializing session:", error);
    }
  }, []);

  const extractSuggestions = useCallback(
    async (transcriptChunk: string) => {
      console.log(
        `📝 Live suggestion extractor received chunk: "${transcriptChunk.substring(
          0,
          100
        )}..." (${transcriptChunk.length} chars)`
      );

      // Skip if empty or already processed
      if (
        !transcriptChunk.trim() ||
        processedChunks.current.has(transcriptChunk)
      ) {
        console.log("⏭️ Skipping chunk (empty or already processed)");
        return;
      }

      // Initialize session if needed
      if (!isSessionInitialized.current) {
        console.log("🔧 Initializing OpenAI session for suggestion extraction");
        await initializeSession();
      }

      // Mark as processed
      processedChunks.current.add(transcriptChunk);
      setIsProcessing(true);
      console.log("🤖 Processing transcript chunk for suggestions...");

      try {
        // Create chunk prompt using template
        const chunkPrompt = prompts.suggestionExtraction.chunkPrompt.replace(
          "${transcriptChunk}",
          transcriptChunk
        );

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
          // Parse bullet points
          const bulletPoints = response
            .split("\n")
            .filter((line: string) => line.trim().startsWith("•"))
            .map((line: string) => line.replace("•", "").trim())
            .filter((text: string) => text.length > 0);

          if (bulletPoints.length > 0) {
            const newSuggestions: Suggestion[] = bulletPoints.map(
              (text: string) => ({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
                // Only log the latest suggestion extracted
                const latestSuggestion = uniqueNew[uniqueNew.length - 1];
                console.log("📝 Latest suggestion:", latestSuggestion.text);
                console.log(
                  "🤖 OpenAI response:",
                  response.substring(0, 150) +
                    (response.length > 150 ? "..." : "")
                );

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
        console.error("❌ Error extracting suggestions:", error);
      } finally {
        setIsProcessing(false);
      }
    },
    [initializeSession]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    processedChunks.current.clear();
    conversationHistory.current = [];
    isSessionInitialized.current = false;
    console.log(
      "🧹 UI suggestions cleared (persisted suggestions retained for summary)"
    );
  }, []);

  const clearAllSuggestions = useCallback(() => {
    setSuggestions([]);
    setPersistedSuggestions([]);
    processedChunks.current.clear();
    conversationHistory.current = [];
    isSessionInitialized.current = false;
    console.log("🧹 All suggestions cleared");
  }, []);

  // Simple similarity calculation for duplicate detection
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
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
  };

  return {
    suggestions,
    persistedSuggestions,
    extractSuggestions,
    clearSuggestions,
    clearAllSuggestions,
    isProcessing,
  };
};
