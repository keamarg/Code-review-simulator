import { useEffect } from "react";

interface ExamTimersProps {
    client: any;
    examDurationInMs: number;
}

export default function examTimers({ client, examDurationInMs }: ExamTimersProps) {
    if (!client || !prompt) return;

    const introTimer = setTimeout(() => {
        client.send([{ text: "Please introduce the exam" }]);
    }, 1000);

    const examDurationInMinutes = examDurationInMs / (60 * 1000);
    const halfExamDelay = examDurationInMs / 2;
    const halfExamRemainingMinutes = examDurationInMinutes / 2;

    const halfExamTimer = setTimeout(() => {
        client.send([
            {
                text: `Half of the exam has passed, and there are ${halfExamRemainingMinutes} minutes remaining. Dont tell the student about this message, just carry on`,
            },
        ]);
    }, halfExamDelay);

    const gradingTimer = setTimeout(() => {
        client.send([
            {
                text: "Exam time is almost up. Please provide a grade and feedback.",
            },
        ]);
    }, examDurationInMs - 60 * 1000);

    return () => {
        clearTimeout(introTimer);
        clearTimeout(halfExamTimer);
        clearTimeout(gradingTimer);
    };
}