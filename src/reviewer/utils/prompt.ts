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
  // Only add priority prompt for custom reviews, not quick start reviews
  let prompt = "";
  const hasDescription = reviewTemplate.description && reviewTemplate.description.trim();
  const isQuickStart =
    reviewTemplate.user_id === "quickstart" || reviewTemplate.id?.startsWith("quickstart-");

  // Add review description/focus at the beginning if it exists AND it's a custom review
  if (hasDescription && !isQuickStart) {
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
  // Handle duration in opening line - use "an open-ended" when duration is 0, "a X minute" when > 0
  const durationText =
    reviewDurationMinutes > 0 ? `a ${reviewDurationMinutes} minute` : "an open-ended";
  standardPrompt = standardPrompt.replace(/\$\{durationText\}/g, durationText);
  standardPrompt = standardPrompt.replace(
    /\$\{reviewTemplate\?\.title \|\| "code review"\}/g,
    reviewTemplate?.title || "code review",
  );

  // Conditionally add duration instruction
  const durationInstruction =
    reviewDurationMinutes > 0
      ? `\\n7. Do NOT end the review early - use the full ${reviewDurationMinutes} minutes to provide comprehensive suggestions.`
      : "";
  standardPrompt = standardPrompt.replace(/\$\{durationInstruction\}/g, durationInstruction);

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

  // Only include description section if it wasn't already shown in review focus
  const descriptionSection = hasDescription
    ? ""
    : `Additional context about the code being reviewed:\n${reviewTemplate.description || fallbackContextStandard}\n\n`;
  additionalContext = additionalContext.replace("${descriptionSection}", descriptionSection);

  // Handle empty studentTask
  const effectiveStudentTask =
    studentTask && studentTask.trim() && studentTask.trim() !== '"""'
      ? studentTask
      : (prompts as any).instructionComponents.defaultStudentTask;
  additionalContext = additionalContext.replace("${studentTask}", effectiveStudentTask);
  prompt += additionalContext.replace(/\n/g, "\n");

  // Keep a single guideline block; avoid redundancy elsewhere in prompt builders
  let levelSpecificSuffix: string = (prompts as any).instructionComponents.levelSpecificSuffix;
  const level = reviewTemplate.learning_goals || "intermediate";
  levelSpecificSuffix = levelSpecificSuffix.replace("${level}", level);

  // Only include guidance for the actual level being used
  const levelGuidanceText =
    (prompts as any).instructionComponents.levelGuidanceText?.[level] ||
    (prompts as any).instructionComponents.levelGuidanceText?.default ||
    "Provide balanced suggestions with specific line references.";
  levelSpecificSuffix = levelSpecificSuffix.replace("${levelGuidanceText}", levelGuidanceText);

  prompt += levelSpecificSuffix.replace(/\n/g, "\n");
  return prompt;
}

function getGithubPrompt(
  reviewTemplate: any,
  reviewDurationMinutes: number,
  githubQuestions: string,
): string {
  // PRIORITY: Start with review description/focus - this takes precedence
  // Only add priority prompt for custom reviews, not quick start reviews
  let prompt = "";
  const hasDescription = reviewTemplate.description && reviewTemplate.description.trim();
  const isQuickStart =
    reviewTemplate.user_id === "quickstart" || reviewTemplate.id?.startsWith("quickstart-");

  // Add review description/focus at the beginning if it exists AND it's a custom review
  if (hasDescription && !isQuickStart) {
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
  // Handle duration in opening line - use "an open-ended" when duration is 0, "a X minute" when > 0
  const durationText =
    reviewDurationMinutes > 0 ? `a ${reviewDurationMinutes} minute` : "an open-ended";
  standardPrompt = standardPrompt.replace(/\$\{durationText\}/g, durationText);
  standardPrompt = standardPrompt.replace(
    /\$\{reviewTemplate\?\.title \|\| "code review"\}/g,
    reviewTemplate?.title || "code review",
  );

  // Conditionally add duration instruction
  const durationInstruction =
    reviewDurationMinutes > 0
      ? `\\n7. Do NOT end the review early - use the full ${reviewDurationMinutes} minutes to provide comprehensive suggestions.`
      : "";
  standardPrompt = standardPrompt.replace(/\$\{durationInstruction\}/g, durationInstruction);

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

  prompt += `

${focusAreasIntro}
${levelGuidance.replace(/\n/g, "\n")}

${additionalContextLabel}
${hasDescription ? fallbackContextStandard : reviewTemplate.description || fallbackContextStandard}

${githubBackgroundContextHeader}
${githubBackgroundContextIntro}

${githubQuestions}

${githubBackgroundContextCritical}
`;
  let githubSpecificSuffix: string = (prompts as any).instructionComponents.githubSpecificSuffix;
  githubSpecificSuffix = githubSpecificSuffix.replace("${githubQuestions}", githubQuestions);
  const level = reviewTemplate.learning_goals || "intermediate";
  githubSpecificSuffix = githubSpecificSuffix.replace("${level}", level);

  // Level guidance is already included in the focus areas section above, so we don't need to repeat it here
  prompt += githubSpecificSuffix.replace(/\n/g, "\n");
  return prompt;
}

function getGeneralPrompt(reviewTemplate: any, studentTask: string): string {
  // PRIORITY: Start with review description/focus - this takes precedence
  // Only add priority prompt for custom reviews, not quick start reviews
  let prompt = "";
  const hasDescription = reviewTemplate.description && reviewTemplate.description.trim();
  const isQuickStart =
    reviewTemplate.user_id === "quickstart" || reviewTemplate.id?.startsWith("quickstart-");

  // Add review description/focus at the beginning if it exists AND it's a custom review
  if (hasDescription && !isQuickStart) {
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

  // Only include description section if it wasn't already shown in review focus
  const descriptionSection = hasDescription
    ? ""
    : `Additional context about the code being reviewed:\n${reviewTemplate.description || fallbackContextGeneral}\n\n`;
  additionalContext = additionalContext.replace("${descriptionSection}", descriptionSection);

  // Handle empty studentTask
  const effectiveStudentTask =
    studentTask && studentTask.trim() && studentTask.trim() !== '"""'
      ? studentTask
      : defaultStudentTask;
  additionalContext = additionalContext.replace("${studentTask}", effectiveStudentTask);
  prompt += additionalContext.replace(/\n/g, "\n");

  // Keep a single guideline block; avoid redundancy elsewhere
  let levelSpecificSuffix: string = (prompts as any).instructionComponents.levelSpecificSuffix;
  const level = reviewTemplate.learning_goals || "intermediate";
  levelSpecificSuffix = levelSpecificSuffix.replace("${level}", level);

  // Only include guidance for the actual level being used
  const levelGuidanceText =
    (prompts as any).instructionComponents.levelGuidanceText?.[level] ||
    (prompts as any).instructionComponents.levelGuidanceText?.default ||
    "Provide balanced suggestions with specific line references.";
  levelSpecificSuffix = levelSpecificSuffix.replace("${levelGuidanceText}", levelGuidanceText);

  prompt += levelSpecificSuffix.replace(/\n/g, "\n");
  return prompt;
}

const promptExports = {
  standard: getPrompt,
  github: getGithubPrompt,
  general: getGeneralPrompt,
};

export default promptExports;
