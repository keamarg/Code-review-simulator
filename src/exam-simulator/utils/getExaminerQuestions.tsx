import {ExamSimulator} from "../contexts/ExamSimulatorContext";
import getCompletion from "./getCompletion";

export async function getExaminerQuestions(examSimulator: ExamSimulator) {
  if(!examSimulator.timeForFeedback) examSimulator.timeForFeedback = 1
  const activeExaminationMin = examSimulator.duration - examSimulator.timeForFeedback
  const prompt = `
You are to prepare an exam for an examiner that is running an exam. 

You need to write the task the student should do in the exam. This will be shown to the student

When coming up with the task and the questions, take into account the learning goals, task of the exam, title of the exam and duration. All learning goals do not need to be assessed. Pick some and focus on them. Be realistic about time management!

Learning goals:
\`\`\`
${examSimulator.learningGoals}
\`\`\`

Here is the task for the exam:
\`\`\`
${examSimulator.task || "No specific task provided. Create appropriate questions about the learning goals."}
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

  const systemPrompt = "You are a skilled and seasoned censor with many years of experience";

console.log(prompt);


  try {
    const result = await getCompletion(prompt, systemPrompt, true);
    
    return result;
  } catch (error) {
    console.error("Error fetching exam content:", error);
    return {
      "task-student": "Error: Failed to connect to AI service."
    };
  }
}

export default getExaminerQuestions;