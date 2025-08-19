import { CodeReviewTemplate } from "../../types/CodeReviewTemplate";
import getCompletion from "./getCompletion";
import prompts from "../../prompts.json";
import { appLogger } from "../../lib/utils";

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

export async function getReviewTask(reviewTemplate: CodeReviewTemplate) {
  appLogger.generic.info("getReviewTask: start", reviewTemplate?.type, reviewTemplate?.title);
  const reviewDurationMinutes = reviewTemplate.duration;

  const levelObjectives = getLevelSpecificObjectives(reviewTemplate.learning_goals);

  let prompt = (prompts as any).taskPrompts.reviewTask.replace(/\n/g, "\n");
  prompt += "\nReturn ONLY the JSON object.";

  prompt += `

Review focus areas:
\`\`\`
${levelObjectives}
\`\`\`

Code review context:
\`\`\`
${reviewTemplate.description || "Conduct a general code review focusing on the areas listed above."}
\`\`\`

Review title:
\`\`\`
${reviewTemplate.title || "Code Review Session"}
\`\`\`

Review duration:
\`\`\`
${reviewDurationMinutes} minutes
\`\`\`

The developer being reviewed is at the ${reviewTemplate.learning_goals} level, so adjust the depth and complexity accordingly.

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

  const systemPrompt = (prompts as any).systemPrompts.reviewTask;

  try {
    appLogger.generic.info("getReviewTask: requesting JSON completion");
    const jsonResult = await getCompletion(prompt, systemPrompt, true);
    if (
      jsonResult &&
      typeof jsonResult === "object" &&
      typeof jsonResult["task-student"] === "string" &&
      jsonResult["task-student"].trim().length > 0
    ) {
      appLogger.generic.info(
        "getReviewTask: received JSON task",
        jsonResult["task-student"].length,
      );
      return jsonResult;
    }
  } catch {}

  try {
    appLogger.generic.info("getReviewTask: requesting TEXT completion");
    const text = await getCompletion(prompt, systemPrompt, false);
    if (typeof text === "string" && text.trim().length > 0) {
      appLogger.generic.info("getReviewTask: received TEXT task", text.trim().length);
      return { "task-student": text.trim() };
    }
  } catch (error) {
    appLogger.error.general(error instanceof Error ? error.message : String(error));
  }

  const synthesized = `# ${reviewTemplate.title || "Code Review Session"}

Please share the main file(s) you want reviewed. I will give concise, actionable suggestions and reference exact line numbers I can see.

Focus areas (${reviewTemplate.learning_goals || "intermediate"}):
${getLevelSpecificObjectives(reviewTemplate.learning_goals || "intermediate")}`.trim();

  appLogger.generic.info("getReviewTask: returning fallback task");
  return { "task-student": synthesized };
}

export default getReviewTask;
