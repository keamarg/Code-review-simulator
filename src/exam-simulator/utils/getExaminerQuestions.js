import getCompletion from "./getCompletion";

export async function getExaminerQuestions(examSimulator) {
  const prompt = `
You are to prepare an exam for an examiner that is running an exam. 

What you should prepare is two things:
1. The task the student should do in the exam. This will be shown to the student

When coming up with the task and the questions, take into account the learning goals, task of the exam, title of the exam and duration

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
${examSimulator.duration} minutes
\`\`\`

Please output it in JSON in the following format:
\`\`\`
{
  "task-student": "TASK_FOR_STUDENT_MARKDOWN"
}
\`\`\`
Very important! The response should be JSON valid! ONLY the TASK_FOR_STUDENT_MARKDOWN should be in markdown!
  `.trim();

  const systemPrompt = "You are an expert educator creating content for an oral technical exam.";

  try {
    const result = await getCompletion(prompt, systemPrompt, true);
    console.log("result: " + result );
    
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