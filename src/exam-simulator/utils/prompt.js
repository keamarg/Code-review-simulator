import prompts from "../../prompts.json";

// Function to get level-specific review guidance
function getLevelSpecificGuidance(level) {
  switch (level) {
    case "junior":
      return `Focus on fundamental aspects like:
- Code readability and clarity
- Proper variable and function naming
- Basic error handling approaches
- Consistent code style and formatting
- Simple design patterns and their implementation
- Documentation and commenting practices
- The code should be understandable and follow basic programming principles`;

    case "intermediate":
      return `Focus on intermediate-level aspects like:
- Appropriate use of design patterns
- Performance considerations and optimizations
- Code reusability and modularity
- Testing strategies and coverage
- More advanced error handling approaches
- API design principles
- The code should demonstrate good practices and maintainable approaches`;

    case "senior":
      return `Focus on advanced aspects like:
- Overall architecture and system design
- Scalability considerations
- Advanced design patterns and their implementation
- Performance optimization techniques
- Security best practices
- Technical debt management
- The code should demonstrate sophisticated approaches and architectural thinking`;

    default:
      return `Focus on general code quality aspects like:
- Code structure and organization
- Performance considerations
- Best practices implementation
- Readability and maintainability`;
  }
}

function getPrompt(examSimulator, examDurationActiveExam, studentTask) {
  // Use the standardExam template from prompts.json
  let prompt = prompts.mainPrompts.standardExam
    .replace("${examDurationActiveExam}", examDurationActiveExam)
    .replace(
      '${examSimulator?.title || "code review"}',
      examSimulator?.title || "code review"
    );

  // Replace escaped newlines with actual newlines
  prompt = prompt.replace(/\\n/g, "\n");

  // Get developer level guidance
  const levelGuidance = getLevelSpecificGuidance(
    examSimulator.learning_goals || "intermediate"
  );

  // Add the dynamic content
  prompt += `
    
    The code review should focus on the following areas:
    ${levelGuidance}
    
    Additional context about the code being reviewed:
    ${
      examSimulator.description ||
      "This is a general code review focusing on the areas specified above."
    }
    
    Here is the task that will be shown to the developer being reviewed:
    """
    ${studentTask}
    """
`;

  // Add the guidelines
  let guidelines = prompts.instructionComponents.examGuidelines.replace(
    /\\n/g,
    "\n"
  );
  prompt += guidelines;

  prompt += `
    Remember that you're reviewing code for a ${
      examSimulator.learning_goals || "intermediate"
    } level developer, so adjust your feedback and questioning style accordingly.
    
    For a junior developer: Be more supportive, educational, and focus on fundamentals.
    For an intermediate developer: Balance support with higher expectations, focus on design patterns and best practices.
    For a senior developer: Be direct and thorough, challenge architectural decisions, and discuss advanced concepts.
    `;

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

  // Get developer level guidance
  const levelGuidance = getLevelSpecificGuidance(
    examSimulator.learning_goals || "intermediate"
  );

  // Add the dynamic content
  prompt += `

The code review should focus on the following areas:
${levelGuidance}

Additional context about the code being reviewed:
${
  examSimulator.description ||
  "This is a general code review focusing on the areas specified above."
}

Prepared Questions:
${githubQuestions}

Important notes about conducting the code review:
- Remember you're reviewing code for a ${
    examSimulator.learning_goals || "intermediate"
  } level developer
- Ask about the developer's reasoning and design choices
- Focus on constructive feedback that helps improve the code
- Acknowledge good approaches before suggesting improvements
- Dive into relevant details but maintain a big-picture view
- If the developer is stuck, offer guidance appropriate to their level
- Remember that this is a collaborative review, not an interrogation`;

  return prompt;
}

export default {
  standard: getPrompt,
  github: getGithubPrompt,
};
