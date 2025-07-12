/* eslint-disable no-template-curly-in-string */
import prompts from "../../prompts.json";

// Function to get level-specific review guidance from prompts.json
function getLevelSpecificGuidance(level) {
  return prompts.levelGuidance[level] || prompts.levelGuidance.default;
}

function getPrompt(examSimulator, examDurationActiveExam, studentTask) {
  // Use the standardExam template from prompts.json
  let prompt = prompts.mainPrompts.standardExam;
  prompt = prompt.replace("${examDurationActiveExam}", examDurationActiveExam);
  prompt = prompt.replace(
    '${examSimulator?.title || "code review"}',
    examSimulator?.title || "code review"
  );

  // Replace escaped newlines with actual newlines
  prompt = prompt.replace(/\\n/g, "\n");

  // Add screen sharing instruction from prompts.json
  /*prompt += prompts.instructionComponents.screenSharingInstruction.replace(
    /\\n/g,
    "\n"
  );
  */

  // Get developer level guidance from prompts.json
  const levelGuidance = getLevelSpecificGuidance(
    examSimulator.learning_goals || "intermediate"
  );

  // Add the review focus areas
  prompt += `
    
    The code review should focus on the following areas:
    ${levelGuidance.replace(/\\n/g, "\n")}
    `;

  // Add additional context from prompts.json
  let additionalContext = prompts.instructionComponents.additionalContext;
  additionalContext = additionalContext.replace(
    "${description}",
    examSimulator.description ||
      "This is a general code review focusing on the areas specified above."
  );
  additionalContext = additionalContext.replace("${studentTask}", studentTask);

  prompt += additionalContext.replace(/\\n/g, "\n");

  // Add the guidelines from prompts.json
  let guidelines = prompts.instructionComponents.examGuidelines.replace(
    /\\n/g,
    "\n"
  );
  prompt += guidelines;

  // Add level-specific suffix from prompts.json
  let levelSpecificSuffix = prompts.instructionComponents.levelSpecificSuffix;
  levelSpecificSuffix = levelSpecificSuffix.replace(
    "${level}",
    examSimulator.learning_goals || "intermediate"
  );

  prompt += levelSpecificSuffix.replace(/\\n/g, "\n");

  return prompt;
}

function getGithubPrompt(
  examSimulator,
  examDurationActiveExam,
  githubQuestions
) {
  // Use the githubExam template from prompts.json
  let prompt = prompts.mainPrompts.githubExam;
  prompt = prompt.replace("${examDurationActiveExam}", examDurationActiveExam);
  prompt = prompt.replace(
    '${examSimulator?.title || "code review"}',
    examSimulator?.title || "code review"
  );

  // Replace escaped newlines with actual newlines
  prompt = prompt.replace(/\\n/g, "\n");

  // Get developer level guidance from prompts.json
  const levelGuidance = getLevelSpecificGuidance(
    examSimulator.learning_goals || "intermediate"
  );

  // Add the review focus areas
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

  // Add github-specific suffix from prompts.json
  let githubSpecificSuffix = prompts.instructionComponents.githubSpecificSuffix;
  githubSpecificSuffix = githubSpecificSuffix.replace(
    "${githubQuestions}",
    githubQuestions
  );
  githubSpecificSuffix = githubSpecificSuffix.replace(
    "${level}",
    examSimulator.learning_goals || "intermediate"
  );

  prompt += githubSpecificSuffix.replace(/\\n/g, "\n");

  return prompt;
}

function getGeneralPrompt(examSimulator, studentTask) {
  // Use the generalReview template from prompts.json
  let prompt = prompts.mainPrompts.generalReview;
  prompt = prompt.replace(
    '${examSimulator?.title || "general code review"}',
    examSimulator?.title || "general code review"
  );

  // Replace escaped newlines with actual newlines
  prompt = prompt.replace(/\\n/g, "\n");

  // Get developer level guidance from prompts.json
  const levelGuidance = getLevelSpecificGuidance(
    examSimulator.learning_goals || "intermediate"
  );

  // Add the review focus areas
  prompt += `
    
    The code review should focus on the following areas:
    ${levelGuidance.replace(/\\n/g, "\n")}
    `;

  // Add additional context from prompts.json (modified for general review)
  let additionalContext = prompts.instructionComponents.additionalContext;
  additionalContext = additionalContext.replace(
    "${description}",
    examSimulator.description ||
      "This is a general code review focusing on code quality improvements and best practices."
  );
  additionalContext = additionalContext.replace(
    "${studentTask}",
    studentTask ||
      "Please show me the code you'd like me to review, and I'll provide specific suggestions for improvement."
  );

  prompt += additionalContext.replace(/\\n/g, "\n");

  // Add the guidelines from prompts.json
  let guidelines = prompts.instructionComponents.examGuidelines.replace(
    /\\n/g,
    "\n"
  );
  prompt += guidelines;

  // Add level-specific suffix from prompts.json
  let levelSpecificSuffix = prompts.instructionComponents.levelSpecificSuffix;
  levelSpecificSuffix = levelSpecificSuffix.replace(
    "${level}",
    examSimulator.learning_goals || "intermediate"
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
