import { useEffect, useRef } from "react";
import { GenAILiveClient } from "../../lib/genai-live-client";

interface ConversationEntry {
  timestamp: Date;
  type: "ai_transcript" | "session_start" | "session_end" | "user_interaction";
  content?: string;
  metadata?: {
    audio_size?: number;
    interaction_count?: number;
  };
}

export function useConversationTracker(client: GenAILiveClient | null) {
  const entriesRef = useRef<ConversationEntry[]>([]);
  const sessionStartTime = useRef<Date | null>(null);
  const userInteractionCount = useRef<number>(0);

  // Transcript buffering refs
  const transcriptBufferRef = useRef<string>("");
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const flushTranscriptBuffer = () => {
    if (transcriptBufferRef.current.trim()) {
      const content = transcriptBufferRef.current.trim();
      entriesRef.current.push({
        timestamp: new Date(),
        type: "ai_transcript",
        content: content,
      });
      console.log(
        "📝 Transcript chunk saved:",
        content.substring(0, 100) + (content.length > 100 ? "..." : "")
      );
      transcriptBufferRef.current = "";
    }
  };

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

    // Optimized 10-second transcript buffering for efficient processing
    const handleTranscript = (transcriptText: string) => {
      // Clean the incoming transcript text
      const cleanedText = transcriptText
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .trim();

      if (!cleanedText) {
        return; // Skip empty or whitespace-only fragments
      }

      // Simple spacing logic - add space unless already present
      if (transcriptBufferRef.current) {
        const bufferEndsWithSpace = transcriptBufferRef.current.endsWith(" ");
        const textStartsWithSpace = cleanedText.startsWith(" ");

        // Only add space if neither end already has one
        const shouldAddSpace = !bufferEndsWithSpace && !textStartsWithSpace;

        if (shouldAddSpace) {
          transcriptBufferRef.current += " ";
        }
      }
      transcriptBufferRef.current += cleanedText;

      // Simple 10-second timer - restart timer on each new chunk
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }

      bufferTimeoutRef.current = setTimeout(() => {
        flushTranscriptBuffer();
      }, 10000); // Fixed 10-second interval
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

      client.off("setupcomplete", handleSetupComplete);
      client.off("transcript", handleTranscript);
      client.off("log", handleLog);
      client.off("audio", handleAudio);
    };
  }, [client]);

  const generateSummaryWithOpenAI = async (examDetails?: {
    title?: string;
    description?: string;
    duration?: number;
  }): Promise<string> => {
    // Flush any remaining buffer content before generating summary
    if (transcriptBufferRef.current.trim()) {
      flushTranscriptBuffer();
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

    const transcriptEntries = entriesRef.current.filter(
      (e) => e.type === "ai_transcript"
    );

    // Clean up and join transcripts with enhanced cleaning
    const cleanTranscripts = transcriptEntries
      .map((e) => e.content)
      .filter((text): text is string => Boolean(text))
      .map((text) => {
        // Enhanced cleaning for fragmented text
        return text
          .replace(/\s+/g, " ") // Replace multiple spaces with single space
          .replace(/\s+([.!?,:;])/g, "$1") // Remove space before punctuation
          .replace(/([.!?])\s*([a-z])/g, "$1 $2") // Ensure space after sentence endings
          .replace(/([a-z])\s+([A-Z])/g, "$1. $2") // Add periods between sentences if missing
          .replace(/\s*,\s*/g, ", ") // Fix comma spacing
          .replace(/\s*;\s*/g, "; ") // Fix semicolon spacing
          .replace(/\s*:\s*/g, ": ") // Fix colon spacing
          .replace(/\.\s*\./g, ".") // Remove duplicate periods
          .replace(
            /([a-z])\s+([a-z])\s+([a-z])\s+([a-z])/g,
            (match, ...groups) => {
              // Try to fix fragmented words like "l o o k i n g" -> "looking"
              const chars = groups.slice(0, 4);
              if (chars.every((char) => char.length === 1)) {
                return chars.join("");
              }
              return match;
            }
          )
          .trim();
      })
      .filter((text) => text.length > 0); // Remove empty strings after cleaning

    const allTranscripts = cleanTranscripts.join(" ");

    if (transcriptEntries.length === 0 || !allTranscripts.trim()) {
      return "No AI speech transcripts were captured during this session. This might indicate a technical issue with transcript generation or a very brief session.";
    }

    // Generate structured analysis of the transcripts
    const summary = generateTranscriptBasedSummary(
      allTranscripts,
      transcriptEntries,
      sessionDuration,
      examDetails,
      userInteractionCount.current
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
  };

  // Return method to get captured transcripts
  const getTranscripts = () => {
    return entriesRef.current.filter((e) => e.type === "ai_transcript");
  };

  // Legacy method name for backward compatibility
  const getConversationSummary = (examDetails?: {
    title?: string;
    description?: string;
    duration?: number;
  }) => {
    return generateSummaryWithOpenAI(examDetails);
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
  userInteractions?: number
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
  summary += `• AI provided ${transcriptEntries.length} transcript segments\n`;
  summary += `• User interactions: ${userInteractions || 0}\n`;
  summary += `• Total transcript length: ${allTranscripts.length} characters\n`;

  // Basic transcript analysis
  const lineNumberRefs = (
    allTranscripts.match(/line\s+\d+|lines\s+\d+/gi) || []
  ).length;
  const suggestionWords = (
    allTranscripts.match(
      /\b(suggest|recommend|should|could|improve|fix|change|update)\b/gi
    ) || []
  ).length;
  const issueWords = (
    allTranscripts.match(/\b(issue|problem|error|bug|concern|mistake)\b/gi) ||
    []
  ).length;

  summary += `• Line number references: ${lineNumberRefs}\n`;
  summary += `• Suggestion keywords: ${suggestionWords}\n`;
  summary += `• Issue keywords: ${issueWords}\n\n`;

  // Key excerpts from transcript
  summary += "Key Review Points:\n";
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

  summary += "\n";
  summary += "Full AI Review Transcript:\n";
  summary += "-".repeat(15) + "\n";
  summary += allTranscripts;
  summary += "\n" + "-".repeat(15) + "\n\n";

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
