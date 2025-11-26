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
    const reviewFocusHeader: string = (prompts as any).instructionComponents.reviewFocusHeader;
    const reviewFocusPrecedence: string = (prompts as any).instructionComponents
      .reviewFocusPrecedence;
    const reviewFocusSeparator: string = (prompts as any).instructionComponents
      .reviewFocusSeparator;
    prompt += `${reviewFocusHeader}\n${reviewTemplate.description.trim()}\n\n`;
    prompt += `${reviewFocusPrecedence}\n\n`;
    prompt += `${reviewFocusSeparator}\n\n`;
  }

  // Use review-named key
  let standardPrompt: string = (prompts as any).mainPrompts.standardReview;
  standardPrompt = standardPrompt.replace(
    /\$\{reviewDurationMinutes\}/g,
    String(reviewDurationMinutes),
  );
  standardPrompt = standardPrompt.replace(
    /\$\{reviewTemplate\?\.title \|\| "code review"\}/g,
    reviewTemplate?.title || "code review",
  );
  prompt += standardPrompt;

  // No-op normalization retained
  const levelGuidance = getLevelSpecificGuidance(reviewTemplate.learning_goals || "intermediate");
  const focusAreasIntro: string = (prompts as any).instructionComponents.focusAreasIntro;
  prompt += `
    
    ${focusAreasIntro}
    ${levelGuidance.replace(/\n/g, "\n")}
    `;
  let additionalContext: string = (prompts as any).instructionComponents.additionalContext;
  const fallbackContextStandard: string = (prompts as any).instructionComponents
    .fallbackContextStandard;
  additionalContext = additionalContext.replace(
    "${description}",
    reviewTemplate.description || fallbackContextStandard,
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
    const reviewFocusHeader: string = (prompts as any).instructionComponents.reviewFocusHeader;
    const reviewFocusPrecedence: string = (prompts as any).instructionComponents
      .reviewFocusPrecedence;
    const reviewFocusSeparator: string = (prompts as any).instructionComponents
      .reviewFocusSeparator;
    prompt += `${reviewFocusHeader}\n${reviewTemplate.description.trim()}\n\n`;
    prompt += `${reviewFocusPrecedence}\n\n`;
    prompt += `${reviewFocusSeparator}\n\n`;
  }

  let standardPrompt: string = (prompts as any).mainPrompts.githubReview;
  standardPrompt = standardPrompt.replace(
    /\$\{reviewDurationMinutes\}/g,
    String(reviewDurationMinutes),
  );
  standardPrompt = standardPrompt.replace(
    /\$\{reviewTemplate\?\.title \|\| "code review"\}/g,
    reviewTemplate?.title || "code review",
  );
  prompt += standardPrompt;

  // No-op normalization retained
  const levelGuidance = getLevelSpecificGuidance(reviewTemplate.learning_goals || "intermediate");
  const focusAreasIntro: string = (prompts as any).instructionComponents.focusAreasIntro;
  const additionalContextLabel: string = (prompts as any).instructionComponents
    .additionalContextLabel;
  const fallbackContextStandard: string = (prompts as any).instructionComponents
    .fallbackContextStandard;
  const githubBackgroundContextHeader: string = (prompts as any).instructionComponents
    .githubBackgroundContextHeader;
  const githubBackgroundContextIntro: string = (prompts as any).instructionComponents
    .githubBackgroundContextIntro;
  const githubBackgroundContextCritical: string = (prompts as any).instructionComponents
    .githubBackgroundContextCritical;
  const levelGuidanceHeader: string = (prompts as any).instructionComponents.levelGuidanceHeader;

  prompt += `

${focusAreasIntro}
${levelGuidance.replace(/\n/g, "\n")}

${additionalContextLabel}
${reviewTemplate.description || fallbackContextStandard}

${githubBackgroundContextHeader}
${githubBackgroundContextIntro}

${githubQuestions}

${githubBackgroundContextCritical}
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
  prompt += `\n\n${levelGuidanceHeader}\n${reviewerLevelGuidance.replace(/\n/g, "\n")}`;
  prompt += githubSpecificSuffix.replace(/\n/g, "\n");
  return prompt;
}

function getGeneralPrompt(reviewTemplate: any, studentTask: string): string {
  // PRIORITY: Start with review description/focus - this takes precedence
  let prompt = "";

  // Add review description/focus at the beginning if it exists
  if (reviewTemplate.description && reviewTemplate.description.trim()) {
    const reviewFocusHeader: string = (prompts as any).instructionComponents.reviewFocusHeader;
    const reviewFocusPrecedence: string = (prompts as any).instructionComponents
      .reviewFocusPrecedence;
    const reviewFocusSeparator: string = (prompts as any).instructionComponents
      .reviewFocusSeparator;
    prompt += `${reviewFocusHeader}\n${reviewTemplate.description.trim()}\n\n`;
    prompt += `${reviewFocusPrecedence}\n\n`;
    prompt += `${reviewFocusSeparator}\n\n`;
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
  const focusAreasIntroWithLevel: string = (prompts as any).instructionComponents
    .focusAreasIntroWithLevel;
  prompt += `
    
    ${focusAreasIntroWithLevel}
    ${levelGuidanceGeneral.replace(/\n/g, "\n")}
    `;
  let additionalContext: string = (prompts as any).instructionComponents.additionalContext;
  const fallbackContextGeneral: string = (prompts as any).instructionComponents
    .fallbackContextGeneral;
  const defaultStudentTask: string = (prompts as any).instructionComponents.defaultStudentTask;
  additionalContext = additionalContext.replace(
    "${description}",
    reviewTemplate.description || fallbackContextGeneral,
  );
  additionalContext = additionalContext.replace(
    "${studentTask}",
    studentTask || defaultStudentTask,
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
