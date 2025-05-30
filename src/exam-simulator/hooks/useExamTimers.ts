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
  if (!client) return;

  if (!isInitialConnection) {
    return () => {};
  }

  const timerConfig = getTimerConfig();

  const introTimer = setTimeout(() => {
    client.send([{ text: prompts.timerMessages.introduction }]);
  }, timerConfig.introductionDelay);

  const examDurationInMinutes = examDurationInMs / (60 * 1000);
  const halfExamDelay = examDurationInMs / 2;
  const halfExamRemainingMinutes = examDurationInMinutes / 2;

  const halfExamTimer = setTimeout(() => {
    // eslint-disable-next-line no-template-curly-in-string
    const halfTimeMessage = prompts.timerMessages.halfTime.replace(
      "${remainingMinutes}",
      halfExamRemainingMinutes.toString()
    );

    client.send([
      {
        text: halfTimeMessage,
      },
    ]);
  }, halfExamDelay);

  const gradingTimer = setTimeout(() => {
    client.send([
      {
        text: prompts.timerMessages.timeAlmostUp,
      },
    ]);
  }, examDurationInMs - timerConfig.timeWarningBeforeEnd);

  return () => {
    clearTimeout(introTimer);
    clearTimeout(halfExamTimer);
    clearTimeout(gradingTimer);
  };
}
