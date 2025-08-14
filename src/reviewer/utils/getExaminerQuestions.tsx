import { ExamSimulator } from "../../types/ExamSimulator";
import getCompletion from "./getCompletion";
import prompts from "../../prompts.json";
import { appLogger } from "../../lib/utils";

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
  appLogger.generic.info("getExaminerQuestions: start", examSimulator?.type, examSimulator?.title);
  // Use the full duration without subtracting time for feedback
  const activeExaminationMin = examSimulator.duration;

  // Get level-specific objectives based on developer_level
  const levelObjectives = getLevelSpecificObjectives(examSimulator.learning_goals);

  // Get the base prompt from prompts.json and replace newlines
  let prompt = prompts.taskPrompts.examinerQuestions.replace(/\\n/g, "\n");
  // Add explicit instruction to return ONLY the JSON block
  prompt += "\nReturn ONLY the JSON object.";

  // Add the specific review details
  prompt += `

Review focus areas:
\`\`\`
${levelObjectives}
\`\`\`

Code review context:
\`\`\`
${examSimulator.description || "Conduct a general code review focusing on the areas listed above."}
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
3. Keep the task description BRIEF and CONCISE (maximum 100 words)
4. Focus on clarity over comprehensiveness 
5. Include the title of the review at the top
6. Avoid unnecessary explanations or lengthy text
  `.trim();

  // Get the system prompt from prompts.json
  const systemPrompt = prompts.systemPrompts.examinerQuestions;

  // Try JSON first; on failure, fall back to plain text
  try {
    appLogger.generic.info("getExaminerQuestions: requesting JSON completion");
    const jsonResult = await getCompletion(prompt, systemPrompt, true);
    if (
      jsonResult &&
      typeof jsonResult === "object" &&
      typeof jsonResult["task-student"] === "string" &&
      jsonResult["task-student"].trim().length > 0
    ) {
      appLogger.generic.info(
        "getExaminerQuestions: received JSON task",
        jsonResult["task-student"].length,
      );
      return jsonResult;
    }
  } catch (e) {
    // swallow and try plaintext
  }

  try {
    appLogger.generic.info("getExaminerQuestions: requesting TEXT completion");
    const text = await getCompletion(prompt, systemPrompt, false);
    if (typeof text === "string" && text.trim().length > 0) {
      appLogger.generic.info("getExaminerQuestions: received TEXT task", text.trim().length);
      return { "task-student": text.trim() };
    }
  } catch (error) {
    appLogger.error.general(error instanceof Error ? error.message : String(error));
  }

  // Ensure we always return a task to break loops in caller (synthesized minimal task)
  const synthesized = `# ${
    examSimulator.title || "Code Review Session"
  }\n\nPlease share the main file(s) you want reviewed. I will give concise, actionable suggestions and reference exact line numbers I can see.\n\nFocus areas (${
    examSimulator.learning_goals || "intermediate"
  }):\n${getLevelSpecificObjectives(examSimulator.learning_goals || "intermediate")}`.trim();
  const fallback = {
    "task-student": synthesized,
  };
  appLogger.generic.info("getExaminerQuestions: returning fallback task");
  return fallback;
}

export default getExaminerQuestions;
