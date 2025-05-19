import { ExamSimulator } from "../contexts/ExamSimulatorContext";
import getCompletion from "./getCompletion";
import prompts from "../../prompts.json";

export async function getExaminerQuestions(examSimulator: ExamSimulator) {
  const time_for_feedback = 1;
  const activeExaminationMin = examSimulator.duration - time_for_feedback;

  // Get the base prompt from prompts.json and replace newlines
  let prompt = prompts.taskPrompts.examinerQuestions.replace(/\\n/g, "\n");

  // Add the specific exam details
  prompt += `

Learning goals:
\`\`\`
${examSimulator.learning_goals}
\`\`\`

Here is the description for the exam:
\`\`\`
${
  examSimulator.description ||
  "No specific task provided. Create appropriate questions about the learning goals."
}
\`\`\`

Exam title:
\`\`\`
${examSimulator.title || "Technical Exam"}
\`\`\`

Exam duration:
\`\`\`
${activeExaminationMin} minutes
\`\`\`

Please output it in JSON in the following format:
\`\`\`
{
  "task-student": "TASK_FOR_STUDENT_MARKDOWN"
}
\`\`\`
Very important! The response should be JSON valid! ONLY the TASK_FOR_STUDENT_MARKDOWN should be in markdown!

Also the task should include the title of the exam in the top.
  `.trim();

  // Get the system prompt from prompts.json
  const systemPrompt = prompts.systemPrompts.examinerQuestions;

  try {
    const result = await getCompletion(prompt, systemPrompt, true);

    return result;
  } catch (error) {
    console.error("Error fetching exam content:", error);
    return {
      "task-student": "Error: Failed to connect to AI service.",
    };
  }
}

export default getExaminerQuestions;
