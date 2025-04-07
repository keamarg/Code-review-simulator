import getCompletion from "./getCompletion";

export async function getExaminerQuestions(learningGoals, durationInMinutes, examTitle = "", task = "") {
  const prompt = `
You are to prepare an exam for an examiner that is running an exam. 

What you should prepare is two things:
1. The task the student should do in the exam. This will be shown to the student
2. The questions the examiner should ask. These will not be shown to the student

When coming up with the task and the questions, take into account the learning goals, task of the exam, title of the exam and duration

Learning goals:
\`\`\`
${learningGoals}
\`\`\`

Here is the task for the exam:
\`\`\`
${task || "No specific task provided. Create appropriate questions about the learning goals."}
\`\`\`

Exam title:
\`\`\`
${examTitle || "Technical Exam"}
\`\`\`

Exam duration:
\`\`\`
${durationInMinutes} minutes
\`\`\`

Please output it in JSON in the following format:
\`\`\`
{
  "questions-examiner": "QUESTION_FOR_THE_EXAMINER",
  "task-student": "TASK_FOR_STUDENT_MARKDOWN"
}
\`\`\`
  `.trim();

  const systemPrompt = "You are an expert educator creating content for an oral technical exam.";

  try {
    // Call getCompletion to fetch and parse JSON
    const result = await getCompletion(prompt, systemPrompt, true);
    return result;
  } catch (error) {
    console.error("Error fetching exam content:", error);
    return {
      "questions-examiner": "Error: " + error.message,
      "task-student": "Error: Failed to connect to AI service."
    };
  }
}

export default getExaminerQuestions;