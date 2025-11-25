/* eslint-disable no-template-curly-in-string */
import prompts from "../../prompts.json";

function getLevelSpecificGuidance(level: string): string {
  return (prompts as any).levelGuidance[level] || (prompts as any).levelGuidance.default;
}

function getPrompt(
  reviewTemplate: any,
  reviewDurationMinutes: number,
  studentTask: string,
): string {
  // PRIORITY: Start with review description/focus - this takes precedence
  let prompt = "";
  
  // Add review description/focus at the beginning if it exists
  if (reviewTemplate.description && reviewTemplate.description.trim()) {
    prompt += `REVIEW FOCUS (HIGHEST PRIORITY - This should guide all your suggestions):\n${reviewTemplate.description.trim()}\n\n`;
    prompt += `This review focus takes precedence over the standard instructions below. All your suggestions should align with this focus.\n\n`;
    prompt += "=".repeat(50) + "\n\n";
  }
  
  // Use review-named key
  let standardPrompt: string = (prompts as any).mainPrompts.standardReview;
  standardPrompt = standardPrompt.replace(/\$\{reviewDurationMinutes\}/g, String(reviewDurationMinutes));
  standardPrompt = standardPrompt.replace(
    /\$\{reviewTemplate\?\.title \|\| "code review"\}/g,
    reviewTemplate?.title || "code review",
  );
  prompt += standardPrompt;
  
  // No-op normalization retained
  const levelGuidance = getLevelSpecificGuidance(reviewTemplate.learning_goals || "intermediate");
  prompt += `
    
    The code review should focus on the following areas:
    ${levelGuidance.replace(/\n/g, "\n")}
    `;
  let additionalContext: string = (prompts as any).instructionComponents.additionalContext;
  additionalContext = additionalContext.replace(
    "${description}",
    reviewTemplate.description ||
      "This is a general code review focusing on the areas specified above.",
  );
  additionalContext = additionalContext.replace("${studentTask}", studentTask);
  prompt += additionalContext.replace(/\n/g, "\n");
  // Keep a single guideline block; avoid redundancy elsewhere in prompt builders
  let levelSpecificSuffix: string = (prompts as any).instructionComponents.levelSpecificSuffix;
  levelSpecificSuffix = levelSpecificSuffix.replace(
    "${level}",
    reviewTemplate.learning_goals || "intermediate",
  );
  prompt += levelSpecificSuffix.replace(/\n/g, "\n");
  return prompt;
}

function getGithubPrompt(
  reviewTemplate: any,
  reviewDurationMinutes: number,
  githubQuestions: string,
): string {
  // PRIORITY: Start with review description/focus - this takes precedence
  let prompt = "";
  
  // Add review description/focus at the beginning if it exists
  if (reviewTemplate.description && reviewTemplate.description.trim()) {
    prompt += `REVIEW FOCUS (HIGHEST PRIORITY - This should guide all your suggestions):\n${reviewTemplate.description.trim()}\n\n`;
    prompt += `This review focus takes precedence over the standard instructions below. All your suggestions should align with this focus.\n\n`;
    prompt += "=".repeat(50) + "\n\n";
  }
  
  let standardPrompt: string = (prompts as any).mainPrompts.githubReview;
  standardPrompt = standardPrompt.replace(/\$\{reviewDurationMinutes\}/g, String(reviewDurationMinutes));
  standardPrompt = standardPrompt.replace(
    /\$\{reviewTemplate\?\.title \|\| "code review"\}/g,
    reviewTemplate?.title || "code review",
  );
  prompt += standardPrompt;
  
  // No-op normalization retained
  const levelGuidance = getLevelSpecificGuidance(reviewTemplate.learning_goals || "intermediate");
  prompt += `

The code review should focus on the following areas:
${levelGuidance.replace(/\n/g, "\n")}

Additional context about the code being reviewed:
${
  reviewTemplate.description ||
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
    reviewTemplate.learning_goals || "intermediate",
  );
  // Include level-specific guidance inline for GitHub prompt
  const reviewerLevelGuidance = getLevelSpecificGuidance(
    reviewTemplate.learning_goals || "intermediate",
  );
  prompt += `\n\nReviewer level guidance:\n${reviewerLevelGuidance.replace(/\n/g, "\n")}`;
  prompt += githubSpecificSuffix.replace(/\n/g, "\n");
  return prompt;
}

function getGeneralPrompt(reviewTemplate: any, studentTask: string): string {
  // PRIORITY: Start with review description/focus - this takes precedence
  let prompt = "";
  
  // Add review description/focus at the beginning if it exists
  if (reviewTemplate.description && reviewTemplate.description.trim()) {
    prompt += `REVIEW FOCUS (HIGHEST PRIORITY - This should guide all your suggestions):\n${reviewTemplate.description.trim()}\n\n`;
    prompt += `This review focus takes precedence over the standard instructions below. All your suggestions should align with this focus.\n\n`;
    prompt += "=".repeat(50) + "\n\n";
  }
  
  let standardPrompt: string = (prompts as any).mainPrompts.generalReview;
  standardPrompt = standardPrompt.replace(
    '${reviewTemplate?.title || "general code review"}',
    reviewTemplate?.title || "general code review",
  );
  standardPrompt = standardPrompt.replace(/\n/g, "\n");
  prompt += standardPrompt;
  
  const levelGuidanceGeneral = getLevelSpecificGuidance(
    reviewTemplate.learning_goals || "intermediate",
  );
  prompt += `
    
    The code review should focus on the following areas (attuned to the selected developer level):
    ${levelGuidanceGeneral.replace(/\n/g, "\n")}
    `;
  let additionalContext: string = (prompts as any).instructionComponents.additionalContext;
  additionalContext = additionalContext.replace(
    "${description}",
    reviewTemplate.description ||
      "This is a general code review focusing on code quality improvements and best practices.",
  );
  additionalContext = additionalContext.replace(
    "${studentTask}",
    studentTask ||
      "Please show me the code you'd like me to review, and I'll provide specific suggestions for improvement.",
  );
  prompt += additionalContext.replace(/\n/g, "\n");
  // Keep a single guideline block; avoid redundancy elsewhere
  let levelSpecificSuffix: string = (prompts as any).instructionComponents.levelSpecificSuffix;
  levelSpecificSuffix = levelSpecificSuffix.replace(
    "${level}",
    reviewTemplate.learning_goals || "intermediate",
  );
  prompt += levelSpecificSuffix.replace(/\n/g, "\n");
  return prompt;
}

const promptExports = {
  standard: getPrompt,
  github: getGithubPrompt,
  general: getGeneralPrompt,
};

export default promptExports;
