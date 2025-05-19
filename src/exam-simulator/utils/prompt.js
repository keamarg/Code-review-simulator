import prompts from "../../prompts.json";

function getPrompt(examSimulator, examDurationActiveExam, studentTask) {
  // Set the grading criteria based on the examSimulator settings
  if (examSimulator.gradeCriteria === "7-skala") {
    examSimulator.gradeCriteria = prompts.gradingScale["7-skala"];
  } else if (examSimulator.gradeCriteria === "bestået-ikke-bestået") {
    examSimulator.gradeCriteria = prompts.gradingScale["bestået-ikke-bestået"];
  } else if (examSimulator.gradeCriteria === "no-grade") {
    examSimulator.gradeCriteria = prompts.gradingScale["no-grade"];
  }

  // Use the standardExam template from prompts.json
  let prompt = prompts.mainPrompts.standardExam
    .replace("${examDurationActiveExam}", examDurationActiveExam)
    .replace(
      '${examSimulator?.title || "exam"}',
      examSimulator?.title || "exam"
    );

  // Replace escaped newlines with actual newlines
  prompt = prompt.replace(/\\n/g, "\n");

  // Add the dynamic content
  prompt += `
    
    The competencies you are examining are:
    ${examSimulator.learningGoals}
    
    Here is how you should grade the exam:
    Remember: You can only evaluate on what the student did during the exam.
    ${examSimulator.gradeCriteria}
    
    Here is how you should give feedback:
    ${examSimulator.feedback}
    
    Here is the task the student should do in the exam. This task will be shown to the student
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
    And remember most importantly! You are an examiner running an exam. Your goal is to evaluate the students competencies throughly. Dont take the students word for something! Make sure the syntax is correct and that the student understands the code!

    Spend time on making sure the syntax is correct!!
    `;

  return prompt;
}

function getGithubPrompt(
  examSimulator,
  examDurationActiveExam,
  githubQuestions
) {
  // Set the grading criteria based on the examSimulator settings
  if (examSimulator.gradeCriteria === "7-skala") {
    examSimulator.gradeCriteria = prompts.gradingScale["7-skala"];
  } else if (examSimulator.gradeCriteria === "bestået-ikke-bestået") {
    examSimulator.gradeCriteria = prompts.gradingScale["bestået-ikke-bestået"];
  } else if (examSimulator.gradeCriteria === "no-grade") {
    examSimulator.gradeCriteria = prompts.gradingScale["no-grade"];
  }

  // Use the githubExam template from prompts.json
  let prompt = prompts.mainPrompts.githubExam
    .replace("${examDurationActiveExam}", examDurationActiveExam)
    .replace(
      '${examSimulator?.title || "exam"}',
      examSimulator?.title || "exam"
    );

  // Replace escaped newlines with actual newlines
  prompt = prompt.replace(/\\n/g, "\n");

  // Add the dynamic content
  prompt += `

The competencies you are examining are:
${examSimulator.learningGoals}

Here is how you should grade the exam:
${examSimulator.gradeCriteria}

Here is how you should give feedback:
${examSimulator.feedback}

Here is the task for the exam:
${examSimulator.task}

Prepared Questions:
${githubQuestions}

Important notes about conducting the exam:
You dont have time to evaluate all learning goals so pick some of them and ask about that.
- Ask about the student's thinking, encourage them to think aloud.
- Examine if the student understands the code he/she is writing.
- Please never explain what code is doing. You are running an exam so you need to focus on evaluating the students' competencies.
- Dont say what the student have done. Just say things like: "that looks good"
- If the student is doing well ask harder questions. If the student is struggling ask easier questions.
- If the student is stuck, give hints to help the student move forward.`;

  return prompt;
}

export default {
  standard: getPrompt,
  github: getGithubPrompt,
};
