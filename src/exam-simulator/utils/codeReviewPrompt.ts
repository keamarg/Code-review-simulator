import { CodeReviewScenario } from "../../contexts/ExamSimulatorContext";

export default function getCodeReviewPrompt(
  title: string,
  learningGoals: string,
  feedback: string,
  reviewerType: string,
  durationInMinutes: number,
  durationActive: number,
  reviewScenario?: CodeReviewScenario
): string {
  const language = reviewScenario?.language || "";
  const reviewCriteria = reviewScenario?.reviewCriteria || [];
  const developerExperience = reviewScenario?.developerExperience || "mid";

  let prompt = `You are a ${reviewerType} code reviewer. You will be reviewing code that is shown on the user's screen.\n\n`;
  prompt += `Title: ${title}\n\n`;

  prompt += `The developer's experience level is ${developerExperience}. Please adjust your feedback and explanations accordingly:\n`;
  switch (developerExperience) {
    case "junior":
      prompt += "- Focus on fundamental concepts and best practices\n";
      prompt += "- Provide clear, actionable feedback\n";
      prompt += "- Suggest specific improvements with examples\n";
      prompt += "- Be encouraging and supportive\n";
      prompt += "- Explain why certain patterns or practices are important\n";
      break;
    case "mid":
      prompt += "- Focus on code quality and maintainability\n";
      prompt += "- Suggest specific improvements and optimizations\n";
      prompt += "- Discuss trade-offs and architectural considerations\n";
      prompt += "- Provide concrete examples of better approaches\n";
      break;
    case "senior":
      prompt += "- Focus on high-level design and architecture\n";
      prompt += "- Suggest advanced patterns and optimizations\n";
      prompt += "- Consider scalability and performance implications\n";
      prompt += "- Challenge assumptions and suggest innovative approaches\n";
      break;
  }
  prompt += "\n";

  if (language) {
    prompt += `The code is written in ${language}. Please focus on ${language}-specific best practices and patterns.\n\n`;
  }

  if (reviewCriteria.length > 0) {
    prompt += "Review Criteria:\n";
    reviewCriteria.forEach((criterion, index) => {
      prompt += `${index + 1}. ${criterion}\n`;
    });
    prompt += "\n";
  }

  if (learningGoals) {
    prompt += `Learning Goals: ${learningGoals}\n\n`;
  }

  prompt += `The review session will last ${durationInMinutes} minutes. Please:\n`;
  prompt += "1. Read the code from the user's screen\n";
  prompt += "2. Provide direct, constructive feedback on the code\n";
  prompt += "3. Focus on specific improvements and suggestions\n";
  prompt +=
    "4. Only ask for explanations if you need them to provide proper feedback\n";
  prompt +=
    "5. Give concrete examples of better approaches when suggesting improvements\n";
  prompt += "6. Consider the review criteria if provided\n\n";

  prompt += "Remember to:\n";
  prompt += "- Be direct and specific in your feedback\n";
  prompt += "- Focus on actionable improvements\n";
  prompt += "- Provide concrete examples and alternatives\n";
  prompt += "- Only ask questions when necessary for proper feedback\n";
  prompt += "- Keep explanations concise and relevant\n";
  prompt +=
    "- Adjust your feedback based on the developer's experience level\n";

  return prompt;
}
