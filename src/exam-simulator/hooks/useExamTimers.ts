import prompts from "../../prompts.json";
import { getTimerConfig } from "../../config/aiConfig";

interface ExamTimersProps {
  client: any;
  examDurationInMs: number;
  isInitialConnection?: boolean;
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

  // Introduction timer
  const introTimer = setTimeout(() => {
    if (client) {
      client.send([{ text: prompts.timerMessages.introduction }]);
    }
  }, timerConfig.introductionDelay);
  timerIds.push(introTimer);

  const examDurationInMinutes = examDurationInMs / (60 * 1000);
  const halfExamDelay = examDurationInMs / 2;
  const halfExamRemainingMinutes = examDurationInMinutes / 2;

  // Half-time reminder
  const halfExamTimer = setTimeout(() => {
    if (client) {
      const halfTimeMessage = prompts.timerMessages.halfTime.replace(
        "${remainingMinutes}",
        halfExamRemainingMinutes.toString()
      );
      client.send([{ text: halfTimeMessage }]);
    }
  }, halfExamDelay);
  timerIds.push(halfExamTimer);

  // Single final warning at 1 minute before end (removed duplicate 30-second warning)
  const timeAlmostUpTimer = setTimeout(() => {
    if (client) {
      client.send([{ text: prompts.timerMessages.timeAlmostUp }]);
    }
  }, examDurationInMs - timerConfig.timeWarningBeforeEnd);
  timerIds.push(timeAlmostUpTimer);

  // Return cleanup function that clears all timers
  return () => {
    timerIds.forEach((timerId) => clearTimeout(timerId));
  };
}
