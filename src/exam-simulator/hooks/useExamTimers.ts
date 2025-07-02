import prompts from "../../prompts.json";
import { getTimerConfig } from "../../config/aiConfig";

interface ExamTimersProps {
  client: any;
  examDurationInMs: number;
  isInitialConnection?: boolean;
}

// Queue for pending timer messages
interface QueuedMessage {
  text: string;
  timestamp: number;
}

export default function examTimers({
  client,
  examDurationInMs,
  isInitialConnection = true,
}: ExamTimersProps) {
  if (!client) {
    throw new Error("Client is required");
  }

  if (!isInitialConnection) {
    return () => {};
  }

  const timerConfig = getTimerConfig();
  const timerIds: NodeJS.Timeout[] = [];
  const messageQueue: QueuedMessage[] = [];
  let isAISpeaking = false;
  let turnCompleteListener: () => void;
  let isCleaned = false;
  let questionQueue: string[] = [];
  let currentTimeout: NodeJS.Timeout | null = null;

  const cleanup = () => {
    if (isCleaned) return;
    isCleaned = true;

    if (currentTimeout) {
      clearTimeout(currentTimeout);
      currentTimeout = null;
    }
  };

  const sendMessage = (message: string) => {
    if (isCleaned) return;

    try {
      client.send([{ text: message }]);
    } catch (error) {
      console.error("Error sending timer message:", error);
    }
  };

  const processMessageQueue = () => {
    if (isCleaned || messageQueue.length === 0) return;

    const { text } = messageQueue.shift()!;

    currentTimeout = setTimeout(() => {
      sendMessage(text);
      processMessageQueue(); // Process next message
    }, 0);
  };

  // Timer expired - queue farewell message
  const timerExpiredTimeout = setTimeout(() => {
    try {
      sendMessage(prompts.timerMessages.farewell);
    } catch (error) {
      // Just log the error, don't duplicate send
      console.error("Error sending farewell message:", error);
    }
  }, examDurationInMs);

  // Listen for AI turn complete events to process queue
  const handleAITurnComplete = () => {
    processMessageQueue();
  };

  client.on("turn_complete", handleAITurnComplete);

  // Introduction timer - add small buffer to ensure system is ready
  const introTimer = setTimeout(() => {
    if (client) {
      // For the first message, assume AI is not speaking yet
      isAISpeaking = false;
      sendMessage(prompts.timerMessages.introduction);
    }
  }, timerConfig.introductionDelay + 500); // Add 500ms buffer
  timerIds.push(introTimer);

  // Farewell message 7 seconds before end - interrupts AI to say goodbye
  const farewellTimer = setTimeout(() => {
    if (client) {
      console.log("⏰ Sending farewell message - forcefully interrupting AI");
      try {
        client.send([{ text: prompts.timerMessages.farewell }]);
      } catch (error) {
        console.error("Error during farewell interruption:", error);
        // Don't send duplicate farewell message - just log the error
        console.warn(
          "⚠️ Farewell message failed to send due to connection issues"
        );
      }
    }
  }, examDurationInMs - timerConfig.finalWarningBeforeEnd);
  timerIds.push(farewellTimer);

  // Removed 60-second warning timer as requested by user
  // const timeAlmostUpTimer = setTimeout(() => {
  //   if (client) {
  //     sendMessageSafely(prompts.timerMessages.timeAlmostUp);
  //   }
  // }, examDurationInMs - timerConfig.timeWarningBeforeEnd);
  // timerIds.push(timeAlmostUpTimer);

  // Enhanced cleanup function
  return () => {
    cleanup();
    client.off("turn_complete", handleAITurnComplete);
    clearTimeout(timerExpiredTimeout);
  };
}
