import { ExamSimulator } from "../../types/ExamSimulator";
import getCompletion from "./getCompletion";
import prompts from "../../prompts.json";

// Function to get level-specific learning objectives
function getLevelSpecificObjectives(level: string): string {
  switch (level) {
    case "junior":
      return `
- Code readability and clarity
- Proper naming conventions
- Basic error handling
- Code structure and organization
- Fundamental programming patterns
- Consistent formatting and styling
- Documentation practices`;
    case "intermediate":
      return `
- Design patterns and their appropriate application
- Performance considerations
- Code reuse and modularity
- Testing approaches and coverage
- Error handling strategies
- API design
- Code maintainability`;
    case "senior":
      return `
- Architecture decisions and system design
- Scalability considerations
- Advanced design patterns
- Performance optimization
- Security best practices
- Code review standards
- Technical debt management`;
    default:
      return `
- Code quality and structure
- Best practices
- Performance considerations
- Readability and maintainability`;
  }
}

export async function getExaminerQuestions(examSimulator: ExamSimulator) {
  // Use the full duration without subtracting time for feedback
  const activeExaminationMin = examSimulator.duration;

  // Get level-specific objectives based on developer_level
  const levelObjectives = getLevelSpecificObjectives(
    examSimulator.learning_goals
  );

  // Get the base prompt from prompts.json and replace newlines
  let prompt = prompts.taskPrompts.examinerQuestions.replace(/\\n/g, "\n");

  // Add the specific review details
  prompt += `

Review focus areas:
\`\`\`
${levelObjectives}
\`\`\`

Code review context:
\`\`\`
${
  examSimulator.description ||
  "Conduct a general code review focusing on the areas listed above."
}
\`\`\`

Review title:
\`\`\`
${examSimulator.title || "Code Review Session"}
\`\`\`

Review duration:
\`\`\`
${activeExaminationMin} minutes
\`\`\`

The developer being reviewed is at the ${
    examSimulator.learning_goals
  } level, so adjust the depth and complexity accordingly.

Please output it in JSON in the following format:
\`\`\`
{
  "task-student": "TASK_FOR_STUDENT_MARKDOWN"
}
\`\`\`

VERY IMPORTANT INSTRUCTIONS:
1. The response should be JSON valid
2. ONLY the TASK_FOR_STUDENT_MARKDOWN should be in markdown
3. Keep the task description BRIEF and CONCISE (maximum 150 words)
4. Focus on clarity over comprehensiveness 
5. Include the title of the review at the top
6. Avoid unnecessary explanations or lengthy text
  `.trim();

  // Get the system prompt from prompts.json
  const systemPrompt = prompts.systemPrompts.examinerQuestions;

  try {
    const result = await getCompletion(prompt, systemPrompt, true);

    return result;
  } catch (error) {
    console.error("Error fetching review content:", error);
    return {
      "task-student": "Error: Failed to connect to AI service.",
    };
  }
}

export default getExaminerQuestions;
