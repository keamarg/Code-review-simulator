/* eslint-disable no-template-curly-in-string */
import prompts from "../../prompts.json";

function getLevelSpecificGuidance(level: string): string {
  return (prompts as any).levelGuidance[level] || (prompts as any).levelGuidance.default;
}

function getPrompt(
  examSimulator: any,
  examDurationActiveExam: number,
  studentTask: string,
): string {
  let prompt: string = (prompts as any).mainPrompts.standardExam;
  prompt = prompt.replace("${examDurationActiveExam}", String(examDurationActiveExam));
  prompt = prompt.replace(
    '${examSimulator?.title || "code review"}',
    examSimulator?.title || "code review",
  );
  prompt = prompt.replace(/\\n/g, "\n");
  const levelGuidance = getLevelSpecificGuidance(examSimulator.learning_goals || "intermediate");
  prompt += `
    
    The code review should focus on the following areas:
    ${levelGuidance.replace(/\\n/g, "\n")}
    `;
  let additionalContext: string = (prompts as any).instructionComponents.additionalContext;
  additionalContext = additionalContext.replace(
    "${description}",
    examSimulator.description ||
      "This is a general code review focusing on the areas specified above.",
  );
  additionalContext = additionalContext.replace("${studentTask}", studentTask);
  prompt += additionalContext.replace(/\\n/g, "\n");
  let guidelines: string = (prompts as any).instructionComponents.examGuidelines.replace(
    /\\n/g,
    "\n",
  );
  prompt += guidelines;
  let levelSpecificSuffix: string = (prompts as any).instructionComponents.levelSpecificSuffix;
  levelSpecificSuffix = levelSpecificSuffix.replace(
    "${level}",
    examSimulator.learning_goals || "intermediate",
  );
  prompt += levelSpecificSuffix.replace(/\\n/g, "\n");
  return prompt;
}

function getGithubPrompt(
  examSimulator: any,
  examDurationActiveExam: number,
  githubQuestions: string,
): string {
  let prompt: string = (prompts as any).mainPrompts.githubExam;
  prompt = prompt.replace("${examDurationActiveExam}", String(examDurationActiveExam));
  prompt = prompt.replace(
    '${examSimulator?.title || "code review"}',
    examSimulator?.title || "code review",
  );
  prompt = prompt.replace(/\\n/g, "\n");
  const levelGuidance = getLevelSpecificGuidance(examSimulator.learning_goals || "intermediate");
  prompt += `

The code review should focus on the following areas:
${levelGuidance.replace(/\\n/g, "\n")}

Additional context about the code being reviewed:
${
  examSimulator.description ||
  "This is a general code review focusing on the areas specified above."
}

BACKGROUND CONTEXT - REPOSITORY ANALYSIS:
I have analyzed the GitHub repository and identified these potential areas of focus:

${githubQuestions}

CRITICAL INSTRUCTION: 
The above repository analysis is for BACKGROUND CONTEXT ONLY. Your primary job is to review the code that the developer shows you on their screen. 

- DO NOT start discussing the repository analysis points immediately
- DO NOT assume any specific files or code sections are visible
- ALWAYS ask the developer to show you the specific code they want reviewed first
- Only reference the background analysis when it's relevant to code currently visible on screen
- Focus on providing specific line-by-line suggestions for the code you can actually see

START BY: Greeting the developer, confirming you can see their screen, and asking them to show you the main file(s) they want reviewed from this repository.
`;
  let githubSpecificSuffix: string = (prompts as any).instructionComponents.githubSpecificSuffix;
  githubSpecificSuffix = githubSpecificSuffix.replace("${githubQuestions}", githubQuestions);
  githubSpecificSuffix = githubSpecificSuffix.replace(
    "${level}",
    examSimulator.learning_goals || "intermediate",
  );
  prompt += githubSpecificSuffix.replace(/\\n/g, "\n");
  return prompt;
}

function getGeneralPrompt(examSimulator: any, studentTask: string): string {
  let prompt: string = (prompts as any).mainPrompts.generalReview;
  prompt = prompt.replace(
    '${examSimulator?.title || "general code review"}',
    examSimulator?.title || "general code review",
  );
  prompt = prompt.replace(/\\n/g, "\n");
  const levelGuidance = getLevelSpecificGuidance(examSimulator.learning_goals || "intermediate");
  prompt += `
    
    The code review should focus on the following areas:
    ${levelGuidance.replace(/\\n/g, "\n")}
    `;
  let additionalContext: string = (prompts as any).instructionComponents.additionalContext;
  additionalContext = additionalContext.replace(
    "${description}",
    examSimulator.description ||
      "This is a general code review focusing on code quality improvements and best practices.",
  );
  additionalContext = additionalContext.replace(
    "${studentTask}",
    studentTask ||
      "Please show me the code you'd like me to review, and I'll provide specific suggestions for improvement.",
  );
  prompt += additionalContext.replace(/\\n/g, "\n");
  let guidelines: string = (prompts as any).instructionComponents.examGuidelines.replace(
    /\\n/g,
    "\n",
  );
  prompt += guidelines;
  let levelSpecificSuffix: string = (prompts as any).instructionComponents.levelSpecificSuffix;
  levelSpecificSuffix = levelSpecificSuffix.replace(
    "${level}",
    examSimulator.learning_goals || "intermediate",
  );
  prompt += levelSpecificSuffix.replace(/\\n/g, "\n");
  return prompt;
}

const promptExports = {
  standard: getPrompt,
  github: getGithubPrompt,
  general: getGeneralPrompt,
};

export default promptExports;
