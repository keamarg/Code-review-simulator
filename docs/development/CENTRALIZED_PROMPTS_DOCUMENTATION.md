# Centralized Prompts Documentation

## Overview

All AI prompts, system instructions, and timer messages have been centralized in `src/prompts.json` to improve maintainability and consistency across the application.

## Centralized Prompts Structure

### Main Prompts (`mainPrompts`)

- **`standardExam`**: Main prompt template for standard code review sessions
- **`githubExam`**: Main prompt template for GitHub repository code reviews

### System Prompts (`systemPrompts`)

- **`examinerQuestions`**: System prompt for generating review questions
- **`githubRepoQuestions`**: System prompt for GitHub repository analysis

### Task Prompts (`taskPrompts`)

- **`examinerQuestions`**: Prompt for preparing review tasks
- **`repoQuestions`**: Prompt for generating repository-specific questions

### Instruction Components (`instructionComponents`)

- **`examFlow`**: Step-by-step review process instructions
- **`examGuidelines`**: Important guidelines for conducting reviews
- **`screenSharingInstruction`**: Instructions for screen sharing acknowledgment
- **`additionalContext`**: Template for adding context and task information
- **`levelSpecificSuffix`**: Level-specific guidance for different developer levels
- **`githubSpecificSuffix`**: GitHub-specific review instructions

### Level Guidance (`levelGuidance`)

- **`junior`**: Focus areas for junior developer reviews
- **`intermediate`**: Focus areas for intermediate developer reviews
- **`senior`**: Focus areas for senior developer reviews
- **`default`**: General focus areas for unspecified levels

### Timer Messages (`timerMessages`)

- **`introduction`**: Message to start the review introduction
- **`halfTime`**: Half-time reminder message (supports `${remainingMinutes}` placeholder)
- **`timeAlmostUp`**: Final warning message when time is running out

## Files Using Centralized Prompts

### Core Prompt Generation

- **`src/exam-simulator/utils/prompt.js`**: ✅ **Fully Centralized**
  - Uses `mainPrompts.standardExam` and `mainPrompts.githubExam`
  - Uses `levelGuidance` for developer-level specific instructions
  - Uses `instructionComponents` for modular prompt building

### Timer Messages

- **`src/exam-simulator/hooks/useExamTimers.ts`**: ✅ **Fully Centralized**

  - Uses `timerMessages.introduction`
  - Uses `timerMessages.halfTime` with dynamic minutes replacement
  - Uses `timerMessages.timeAlmostUp`

- **`src/components/altair/Altair.tsx`**: ✅ **Fully Centralized**
  - Uses `timerMessages.introduction`
  - Uses `timerMessages.halfTime` with dynamic minutes replacement
  - Uses `timerMessages.timeAlmostUp`

### Question Generation

- **`src/exam-simulator/utils/getExaminerQuestions.tsx`**: ✅ **Already Centralized**

  - Uses `systemPrompts.examinerQuestions`

- **`src/exam-simulator/utils/getGithubRepoFiles.js`**: ✅ **Already Centralized**
  - Uses `systemPrompts.githubRepoQuestions`

## Benefits of Centralization

### 1. **Single Source of Truth**

- All AI behavior instructions are in one location
- No more hunting through multiple files to understand AI behavior
- Consistent messaging across all components

### 2. **Easy Maintenance**

- Update prompts without touching code logic
- A/B test different prompt variations easily
- Quick adjustments to AI behavior for different scenarios

### 3. **Template System**

- Support for placeholders like `${examDurationActiveExam}`, `${level}`, `${remainingMinutes}`
- Modular components that can be mixed and matched
- Consistent formatting with automatic newline handling

### 4. **Version Control**

- Clear history of prompt changes in Git
- Easy to rollback problematic prompt modifications
- Better collaboration on prompt optimization

## Usage Examples

### Adding New Prompts

```json
{
  "newSection": {
    "newPromptType": "Your prompt template with ${placeholder} support"
  }
}
```

### Using Prompts in Code

```javascript
import prompts from "../../prompts.json";

// Simple usage
const message = prompts.timerMessages.introduction;

// With placeholder replacement
const halfTimeMessage = prompts.timerMessages.halfTime.replace(
  "${remainingMinutes}",
  remainingMinutes.toString()
);

// Building complex prompts
let prompt = prompts.mainPrompts.standardExam
  .replace("${examDurationActiveExam}", duration)
  .replace("${title}", title);

prompt += prompts.instructionComponents.screenSharingInstruction;
```

### Template Variables Available

- `${examDurationActiveExam}`: Duration of active exam portion
- `${examSimulator?.title}`: Title of the code review session
- `${level}`: Developer level (junior, intermediate, senior)
- `${remainingMinutes}`: Minutes remaining in session
- `${description}`: Additional context about the code
- `${studentTask}`: Task shown to the developer
- `${githubQuestions}`: GitHub-specific questions

## Migration Complete

✅ **All hardcoded prompts have been successfully centralized!**

The following areas no longer contain hardcoded AI instructions:

- Main prompt generation logic
- Timer message systems
- System instruction templates
- Level-specific guidance
- Review flow instructions

All future AI behavior modifications should be made in `src/prompts.json` rather than in individual code files.

## Configuration Integration

### AI Configuration (`src/config/aiConfig.ts`)

The centralized prompts system works seamlessly with the AI configuration system:

- **Voice Activity Detection**: Uses `AI_CONFIG.DEFAULT_SILENCE_DURATION_MS` and `AI_CONFIG.DEFAULT_PREFIX_PADDING_MS`
- **Voice Selection**: Uses `AI_CONFIG.DEFAULT_VOICE` for speech synthesis
- **Model Selection**: Uses `AI_CONFIG.DEFAULT_MODEL` for the AI model

### Configurable VAD Settings

The `createLiveConfig` function accepts options to override default timing values:

```javascript
const config = createLiveConfig(promptText, {
  silenceDurationMs: 800, // Override default silence duration
  prefixPaddingMs: 150, // Override default prefix padding
  voiceName: "Puck", // Override default voice
});
```

### Current Default Values

- **Silence Duration**: `1000ms` (from AI_CONFIG.DEFAULT_SILENCE_DURATION_MS)
- **Prefix Padding**: `100ms` (from AI_CONFIG.DEFAULT_PREFIX_PADDING_MS)
- **Voice**: `"Aoede"` (from AI_CONFIG.DEFAULT_VOICE)
- **Model**: `"models/gemini-2.0-flash-live-001"` (from AI_CONFIG.DEFAULT_MODEL)

These values provide a good balance between responsiveness and stability for most use cases.
