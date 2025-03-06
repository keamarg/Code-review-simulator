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

  const payload = {
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert educator creating content for an oral technical exam." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" }
  };

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch exam content: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Parse the JSON response
    try {
      const parsedContent = JSON.parse(content);
      return parsedContent;
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      return {
        "questions-examiner": "Error: Failed to generate structured questions.",
        "task-student": "Error: Failed to generate task."
      };
    }
  } catch (error) {
    console.error("Error fetching exam content:", error);
    return {
      "questions-examiner": "Error: " + error.message,
      "task-student": "Error: Failed to connect to AI service."
    };
  }
}

export default getExaminerQuestions;