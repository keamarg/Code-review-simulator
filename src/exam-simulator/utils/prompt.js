import prompts from "../../prompts.json";

// Function to get level-specific review guidance from prompts.json
function getLevelSpecificGuidance(level) {
  return prompts.levelGuidance[level] || prompts.levelGuidance.default;
}

function getPrompt(examSimulator, examDurationActiveExam, studentTask) {
  // Use the standardExam template from prompts.json
  // eslint-disable-next-line no-template-curly-in-string
  let prompt = prompts.mainPrompts.standardExam
    .replace("${examDurationActiveExam}", examDurationActiveExam)
    // eslint-disable-next-line no-template-curly-in-string
    .replace(
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
  // eslint-disable-next-line no-template-curly-in-string
  const additionalContext = prompts.instructionComponents.additionalContext
    .replace(
      "${description}",
      examSimulator.description ||
        "This is a general code review focusing on the areas specified above."
    )
    // eslint-disable-next-line no-template-curly-in-string
    .replace("${studentTask}", studentTask);

  prompt += additionalContext.replace(/\\n/g, "\n");

  // Add the guidelines from prompts.json
  let guidelines = prompts.instructionComponents.examGuidelines.replace(
    /\\n/g,
    "\n"
  );
  prompt += guidelines;

  // Add level-specific suffix from prompts.json
  // eslint-disable-next-line no-template-curly-in-string
  const levelSpecificSuffix =
    prompts.instructionComponents.levelSpecificSuffix.replace(
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
  let prompt = prompts.mainPrompts.githubExam
    .replace("${examDurationActiveExam}", examDurationActiveExam)
    .replace(
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

IMPORTANT: Here are the specific review questions generated for this repository. Please address each question one by one during the review, and make sure to reference them explicitly in your feedback:

=== REVIEW QUESTIONS ===
${githubQuestions}
=======================
`;

  // Add github-specific suffix from prompts.json
  const githubSpecificSuffix =
    prompts.instructionComponents.githubSpecificSuffix
      .replace("${githubQuestions}", githubQuestions)
      .replace("${level}", examSimulator.learning_goals || "intermediate");

  prompt += githubSpecificSuffix.replace(/\\n/g, "\n");

  return prompt;
}

const promptExports = {
  standard: getPrompt,
  github: getGithubPrompt,
};

export default promptExports;
