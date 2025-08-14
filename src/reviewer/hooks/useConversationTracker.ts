import { useEffect, useRef, useCallback } from "react";
import { GenAILiveClient } from "../../lib/genai-live-client";

interface ConversationEntry {
  timestamp: Date;
  type:
    | "ai_transcript"
    | "user_transcript"
    | "session_start"
    | "session_end"
    | "user_interaction";
  content?: string;
  metadata?: {
    audio_size?: number;
    interaction_count?: number;
  };
}

export function useConversationTracker(
  client: GenAILiveClient | null,
  onTranscriptChunk?: (chunk: string) => void,
  onUserTranscriptChunk?: (chunk: string) => void
) {
  const entriesRef = useRef<ConversationEntry[]>([]);
  const sessionStartTime = useRef<Date | null>(null);
  const userInteractionCount = useRef<number>(0);

  // Transcript buffering refs
  const transcriptBufferRef = useRef<string>("");
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // User transcript buffering refs
  const userTranscriptBufferRef = useRef<string>("");

  const flushTranscriptBuffer = useCallback(() => {
    if (transcriptBufferRef.current.trim()) {
      const transcriptEntry: ConversationEntry = {
        type: "ai_transcript",
        content: transcriptBufferRef.current.trim(),
        timestamp: new Date(),
      };

      entriesRef.current.push(transcriptEntry);

      // Send to parent callback if provided
      if (onTranscriptChunk) {
        onTranscriptChunk(transcriptBufferRef.current.trim());
      }

      transcriptBufferRef.current = "";
    }
  }, [onTranscriptChunk]);

  const flushUserTranscriptBuffer = useCallback(() => {
    if (userTranscriptBufferRef.current.trim()) {
      // Simple concatenation - Gemini Live API should provide clean transcription
      // Just trim any leading/trailing whitespace
      const cleanedTranscript = userTranscriptBufferRef.current.trim();

      const userTranscriptEntry: ConversationEntry = {
        type: "user_transcript",
        content: cleanedTranscript,
        timestamp: new Date(),
      };

      entriesRef.current.push(userTranscriptEntry);

      // Send to parent callback if provided
      if (onUserTranscriptChunk) {
        onUserTranscriptChunk(cleanedTranscript);
      }

      userTranscriptBufferRef.current = "";
    }
  }, [onUserTranscriptChunk]);

  useEffect(() => {
    if (!client) return;

    // Track session start
    const handleSetupComplete = () => {
      sessionStartTime.current = new Date();
      entriesRef.current.push({
        timestamp: new Date(),
        type: "session_start",
      });
    };

    // Handle AI transcript reception with simple buffering (like summary screen)
    const handleTranscript = (text: string) => {
      if (!text || typeof text !== "string") return;

      // Flush user transcript buffer when AI starts speaking
      // This creates natural conversation boundaries: user speaks → AI responds
      if (userTranscriptBufferRef.current.trim()) {
        flushUserTranscriptBuffer();
      }

      // Simple concatenation - Gemini Live API already provides perfect transcription
      // No need to reconstruct word boundaries since the API handles this flawlessly
      transcriptBufferRef.current += text;

      // Clear existing timeout
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }

      // Set new timeout to flush buffer after 10 seconds
      bufferTimeoutRef.current = setTimeout(() => {
        flushTranscriptBuffer();
      }, 10000);
    };

    // Handle user transcript reception with conversation-boundary buffering
    const handleUserTranscript = (text: string) => {
      if (!text || typeof text !== "string") return;

      // Simple concatenation - Gemini Live API should provide clean transcription
      // Will be flushed when AI starts speaking (natural conversation boundary)
      userTranscriptBufferRef.current += text;
    };

    // Track user interactions (audio input indicates user is speaking)
    const handleLog = (log: any) => {
      if (log.type === "client.realtimeInput" && log.message === "audio") {
        userInteractionCount.current++;
        // Only log every 50th interaction to avoid spam
        if (userInteractionCount.current % 50 === 0) {
          entriesRef.current.push({
            timestamp: new Date(),
            type: "user_interaction",
            metadata: {
              interaction_count: userInteractionCount.current,
            },
          });
        }
      }
    };

    // Track audio for size analysis
    const handleAudio = (audioData: ArrayBuffer) => {
      // We still track audio size for analysis but focus on transcripts for content
    };

    client.on("setupcomplete", handleSetupComplete);
    client.on("transcript", handleTranscript);
    client.on("userTranscript", handleUserTranscript);
    client.on("log", handleLog);
    client.on("audio", handleAudio);

    return () => {
      // Cleanup - flush any remaining buffer content
      if (transcriptBufferRef.current.trim()) {
        flushTranscriptBuffer();
      }
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }

      // Cleanup user transcript buffer
      if (userTranscriptBufferRef.current.trim()) {
        flushUserTranscriptBuffer();
      }

      client.off("setupcomplete", handleSetupComplete);
      client.off("transcript", handleTranscript);
      client.off("userTranscript", handleUserTranscript);
      client.off("log", handleLog);
      client.off("audio", handleAudio);
    };
  }, [
    client,
    onTranscriptChunk,
    onUserTranscriptChunk,
    flushTranscriptBuffer,
    flushUserTranscriptBuffer,
  ]);

  const generateSummaryWithOpenAI = async (
    examDetails?: {
      title?: string;
      description?: string;
      duration?: number;
    },
    liveSuggestions?: Array<{ text: string; timestamp: Date }>
  ): Promise<string> => {
    // Flush any remaining buffer content before generating summary
    if (transcriptBufferRef.current.trim()) {
      flushTranscriptBuffer();
    }

    // Flush any remaining user transcript buffer
    if (userTranscriptBufferRef.current.trim()) {
      flushUserTranscriptBuffer();
    }

    // Add session end event
    entriesRef.current.push({
      timestamp: new Date(),
      type: "session_end",
    });

    const sessionDuration = sessionStartTime.current
      ? Math.round(
          (new Date().getTime() - sessionStartTime.current.getTime()) / 1000
        )
      : 0;

    const aiTranscriptEntries = entriesRef.current.filter(
      (e) => e.type === "ai_transcript"
    );

    const userTranscriptEntries = entriesRef.current.filter(
      (e) => e.type === "user_transcript"
    );

    // Clean up and join AI transcripts with simple concatenation (like summary screen)
    const cleanAiTranscripts = aiTranscriptEntries
      .map((e) => e.content)
      .filter((text): text is string => Boolean(text))
      .map((text) => text.trim())
      .filter((text) => text.length > 0); // Remove empty strings after cleaning

    const allAiTranscripts = cleanAiTranscripts.join(" ");

    // Clean up and join user transcripts
    const cleanUserTranscripts = userTranscriptEntries
      .map((e) => e.content)
      .filter((text): text is string => Boolean(text))
      .map((text) => text.trim())
      .filter((text) => text.length > 0);

    const allUserTranscripts = cleanUserTranscripts.join(" ");

    if (aiTranscriptEntries.length === 0 || !allAiTranscripts.trim()) {
      return "No AI speech transcripts were captured during this session. This might indicate a technical issue with transcript generation or a very brief session.";
    }

    // Generate structured analysis of the transcripts
    const summary = generateTranscriptBasedSummary(
      allAiTranscripts,
      aiTranscriptEntries,
      sessionDuration,
      examDetails,
      userInteractionCount.current,
      liveSuggestions,
      allUserTranscripts,
      entriesRef.current
    );
    return summary;
  };

  const clearConversation = () => {
    entriesRef.current = [];
    sessionStartTime.current = null;
    userInteractionCount.current = 0;

    // Clear transcript buffer as well
    transcriptBufferRef.current = "";
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
      bufferTimeoutRef.current = null;
    }

    // Clear user transcript buffer as well
    userTranscriptBufferRef.current = "";
  };

  // Return method to get captured transcripts
  const getTranscripts = () => {
    return entriesRef.current.filter((e) => e.type === "ai_transcript");
  };

  // Legacy method name for backward compatibility
  const getConversationSummary = (
    examDetails?: {
      title?: string;
      description?: string;
      duration?: number;
    },
    liveSuggestions?: Array<{ text: string; timestamp: Date }>
  ) => {
    return generateSummaryWithOpenAI(examDetails, liveSuggestions);
  };

  // Add debug method
  const getDebugInfo = () => ({
    entryCount: entriesRef.current.length,
    transcriptCount: entriesRef.current.filter(
      (e) => e.type === "ai_transcript"
    ).length,
    userInteractions: userInteractionCount.current,
    sessionDuration: sessionStartTime.current
      ? Math.round(
          (new Date().getTime() - sessionStartTime.current.getTime()) / 1000
        )
      : 0,
    currentBuffer: {
      length: transcriptBufferRef.current.length,
      content:
        transcriptBufferRef.current.substring(0, 100) +
        (transcriptBufferRef.current.length > 100 ? "..." : ""),
      hasTimeout: !!bufferTimeoutRef.current,
    },
    userBuffer: {
      length: userTranscriptBufferRef.current.length,
      content:
        userTranscriptBufferRef.current.substring(0, 100) +
        (userTranscriptBufferRef.current.length > 100 ? "..." : ""),
      pendingFlush: userTranscriptBufferRef.current.trim().length > 0,
    },
    entries: entriesRef.current.map((e) => ({
      timestamp: e.timestamp,
      type: e.type,
      contentPreview: e.content?.substring(0, 50) + "..." || null,
      metadata: e.metadata,
    })),
  });

  return {
    getConversationSummary,
    generateSummaryWithOpenAI,
    clearConversation,
    getTranscripts,
    entryCount: entriesRef.current.length,
    transcriptCount: entriesRef.current.filter(
      (e) => e.type === "ai_transcript"
    ).length,
    getDebugInfo,
  };
}

function generateTranscriptBasedSummary(
  allTranscripts: string,
  transcriptEntries: ConversationEntry[],
  sessionDuration: number,
  examDetails?: { title?: string; description?: string; duration?: number },
  userInteractions?: number,
  liveSuggestions?: Array<{ text: string; timestamp: Date }>,
  allUserTranscripts?: string,
  allEntries?: ConversationEntry[]
): string {
  const sessionMinutes = Math.round(sessionDuration / 60);
  const plannedMinutes = examDetails?.duration || 0;

  let summary = "Code Review Session Summary\n";
  summary += "=" + "=".repeat(15) + "\n\n";

  summary += `Session: ${examDetails?.title || "Code Review"}\n`;
  if (examDetails?.description) {
    summary += `Focus: ${examDetails.description}\n`;
  }
  summary += `Duration: ${sessionMinutes} minutes ${
    sessionDuration % 60
  } seconds`;
  if (plannedMinutes > 0) {
    summary += ` (planned: ${plannedMinutes} minutes)`;
  }
  summary += "\n\n";

  summary += "Session Activity:\n";
  summary += `• Total transcript length: ${allTranscripts.length} characters\n`;

  // Basic transcript analysis
  const lineNumberRefs = (
    allTranscripts.match(/line\s+\d+|lines\s+\d+/gi) || []
  ).length;

  summary += `• Line number references: ${lineNumberRefs}\n\n`;

  // Key Review Points from Live Suggestions
  summary += "Key Review Points:\n";

  if (liveSuggestions && liveSuggestions.length > 0) {
    liveSuggestions.forEach((suggestion, i) => {
      summary += `${i + 1}. ${suggestion.text}\n`;
    });
  } else {
    // Fallback to extracted excerpts if no live suggestions
    const sentences = allTranscripts
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 20);
    const keyExcerpts = sentences
      .filter((s) =>
        /\b(line|suggest|recommend|should|issue|problem|improve)\b/i.test(s)
      )
      .slice(0, 5)
      .map((s) => s.trim().replace(/^\s*[,\s]+/, ""));

    if (keyExcerpts.length > 0) {
      keyExcerpts.forEach((excerpt, i) => {
        summary += `${i + 1}. ${excerpt}.\n`;
      });
    } else {
      summary += "• Review content available in full transcript\n";
    }
  }

  summary += "\n";

  // Create chronological conversation if we have both AI and user transcripts
  if (allUserTranscripts && allUserTranscripts.trim() && allEntries) {
    summary += "Full Conversation Transcript:\n";
    summary += "-".repeat(15) + "\n";

    // Get all entries sorted by timestamp
    const conversationEntries = allEntries
      .filter(
        (e: ConversationEntry) =>
          e.type === "ai_transcript" || e.type === "user_transcript"
      )
      .sort(
        (a: ConversationEntry, b: ConversationEntry) =>
          a.timestamp.getTime() - b.timestamp.getTime()
      );

    // Build conversation
    conversationEntries.forEach((entry: ConversationEntry) => {
      if (entry.type === "user_transcript" && entry.content) {
        summary += `User: ${entry.content}\n\n`;
      } else if (entry.type === "ai_transcript" && entry.content) {
        summary += `AI: ${entry.content}\n\n`;
      }
    });

    summary += "-".repeat(15) + "\n\n";
  } else {
    // Fallback to just AI transcript if no user transcripts
    summary += "Full AI Review Transcript:\n";
    summary += "-".repeat(15) + "\n";
    summary += allTranscripts;
    summary += "\n" + "-".repeat(15) + "\n\n";
  }

  summary += "Next Steps:\n";
  summary +=
    "• Review the specific feedback and line number references above\n";
  summary += "• Implement suggested improvements mentioned in the transcript\n";
  summary += "• Address any issues or concerns identified during the review\n";

  if (lineNumberRefs === 0) {
    summary +=
      "• Future reviews might benefit from more specific line number references\n";
  }

  summary += "\n";
  summary += `Generated on: ${new Date().toLocaleString()}\n`;
  summary += "Session completed via Code Review Simulator";

  return summary;
}
