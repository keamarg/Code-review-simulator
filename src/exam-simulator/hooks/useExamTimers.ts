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
  if (!client) return () => {};

  if (!isInitialConnection) {
    return () => {};
  }

  const timerConfig = getTimerConfig();
  const timerIds: NodeJS.Timeout[] = [];
  const messageQueue: QueuedMessage[] = [];
  let isAISpeaking = false;
  let turnCompleteListener: () => void;

  // Function to safely send a message, waiting for AI to finish if needed
  const sendMessageSafely = (text: string) => {
    const queuedMessage: QueuedMessage = {
      text,
      timestamp: Date.now(),
    };

    // If AI is speaking, queue the message
    if (isAISpeaking) {
      console.log(
        "🔇 AI is speaking, queuing timer message:",
        text.substring(0, 50) + "..."
      );
      messageQueue.push(queuedMessage);
      return;
    }

    // Send immediately if AI is not speaking
    console.log(
      "🔊 Sending timer message immediately:",
      text.substring(0, 50) + "..."
    );
    client.send([{ text }]);
    isAISpeaking = true; // Assume AI will start speaking
  };

  // Function to process queued messages when AI finishes speaking
  const processQueue = () => {
    if (messageQueue.length > 0) {
      const nextMessage = messageQueue.shift();
      if (nextMessage) {
        console.log(
          "🔊 Processing queued timer message:",
          nextMessage.text.substring(0, 50) + "..."
        );
        client.send([{ text: nextMessage.text }]);
        isAISpeaking = true; // AI will start speaking again
      }
    } else {
      isAISpeaking = false; // No more messages, AI is done
    }
  };

  // Listen for turn complete events to know when AI finishes speaking
  turnCompleteListener = () => {
    console.log("✅ AI turn complete, checking message queue...");
    processQueue();
  };

  client.on("turncomplete", turnCompleteListener);

  // Introduction timer - add small buffer to ensure system is ready
  const introTimer = setTimeout(() => {
    if (client) {
      // For the first message, assume AI is not speaking yet
      isAISpeaking = false;
      sendMessageSafely(prompts.timerMessages.introduction);
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
        if (client && client.send) {
          client.send([{ text: prompts.timerMessages.farewell }]);
        }
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

  // Return cleanup function that clears all timers and removes event listener
  return () => {
    timerIds.forEach((timerId) => clearTimeout(timerId));
    if (client && turnCompleteListener) {
      client.off("turncomplete", turnCompleteListener);
    }
    // Clear any remaining queued messages
    messageQueue.length = 0;
    console.log("🧹 Timer cleanup complete");
  };
}
