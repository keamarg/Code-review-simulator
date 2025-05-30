# Comprehensive Configuration Guide

## Overview

All configuration for the Code Review Simulator is centralized in two main files:

- **`src/config/aiConfig.ts`** - All AI behavior, timing, and technical settings
- **`src/prompts.json`** - All AI prompts, messages, and text content

## AI Configuration (`src/config/aiConfig.ts`)

### Model & Voice Settings

```typescript
// Change the AI model used for code reviews
DEFAULT_MODEL: "models/gemini-2.0-flash-live-001";

// Change the AI voice for audio responses
DEFAULT_VOICE: "Aoede"; // Options: "Puck", "Charon", "Kore", "Fenrir", "Aoede"
```

### Voice Activity Detection (VAD) Settings

```typescript
VAD_SETTINGS: {
  // How sensitive to detecting when user starts speaking
  START_OF_SPEECH_SENSITIVITY: "START_SENSITIVITY_HIGH", // or "START_SENSITIVITY_LOW"

  // How sensitive to detecting when user stops speaking
  END_OF_SPEECH_SENSITIVITY: "END_SENSITIVITY_HIGH", // or "END_SENSITIVITY_LOW"

  // How long silence before AI thinks user stopped speaking (milliseconds)
  SILENCE_DURATION_MS: 1000,

  // Padding before speech detection starts (milliseconds)
  PREFIX_PADDING_MS: 100,
}
```

### Timer Settings

```typescript
TIMER_SETTINGS: {
  // How long to wait before AI introduces itself (milliseconds)
  INTRODUCTION_DELAY_MS: 1000,

  // How long before session end to warn user (milliseconds)
  TIME_WARNING_BEFORE_END_MS: 60000, // 1 minute warning
}
```

### Session Settings

```typescript
// Whether to enable session resumption (pause/resume functionality)
SESSION_RESUMPTION_ENABLED: true;

// Default audio response mode
DEFAULT_RESPONSE_MODALITY: "audio";
```

## Prompts Configuration (`src/prompts.json`)

### Main AI Prompts

- **`mainPrompts.standardExam`** - Core code review session prompt
- **`mainPrompts.githubExam`** - GitHub repository code review prompt

### System Instructions

- **`systemPrompts.examinerQuestions`** - Instructions for generating review questions
- **`systemPrompts.githubRepoQuestions`** - Instructions for repository analysis

### AI Messages

- **`timerMessages.introduction`** - AI introduction message
- **`timerMessages.halfTime`** - Half-time reminder (supports `${remainingMinutes}`)
- **`timerMessages.timeAlmostUp`** - Final time warning

### Developer Level Guidance

- **`levelGuidance.junior`** - Focus areas for junior developers
- **`levelGuidance.intermediate`** - Focus areas for intermediate developers
- **`levelGuidance.senior`** - Focus areas for senior developers

## Environment Variable Overrides

You can override default settings using environment variables:

```bash
# Override AI model
REACT_APP_AI_MODEL="models/gemini-1.5-pro"

# Override AI voice
REACT_APP_AI_VOICE="Puck"
```

## Common Configuration Scenarios

### Making AI Less Sensitive to Background Noise

```typescript
// In aiConfig.ts
VAD_SETTINGS: {
  START_OF_SPEECH_SENSITIVITY: "START_SENSITIVITY_LOW",
  END_OF_SPEECH_SENSITIVITY: "START_SENSITIVITY_LOW",
  SILENCE_DURATION_MS: 1500, // Require longer silence
  PREFIX_PADDING_MS: 200,    // More padding
}
```

### Making AI More Responsive

```typescript
// In aiConfig.ts
VAD_SETTINGS: {
  START_OF_SPEECH_SENSITIVITY: "START_SENSITIVITY_HIGH",
  END_OF_SPEECH_SENSITIVITY: "END_SENSITIVITY_HIGH",
  SILENCE_DURATION_MS: 500,  // Less silence required
  PREFIX_PADDING_MS: 50,     // Less padding
}
```

### Changing Session Timing

```typescript
// In aiConfig.ts
TIMER_SETTINGS: {
  INTRODUCTION_DELAY_MS: 2000,     // Wait 2 seconds before intro
  TIME_WARNING_BEFORE_END_MS: 120000, // Warn 2 minutes before end
}
```

### Customizing AI Behavior

```json
// In prompts.json
{
  "mainPrompts": {
    "standardExam": "Your custom review session instructions..."
  },
  "timerMessages": {
    "introduction": "Hello! I'm your custom AI code reviewer...",
    "halfTime": "We're halfway through! ${remainingMinutes} minutes left..."
  }
}
```

## Override Options

Most settings can be overridden per session using the options parameter:

```typescript
// Override VAD settings for a specific session
const config = createLiveConfig(promptText, {
  silenceDurationMs: 800,
  prefixPaddingMs: 150,
  startOfSpeechSensitivity: "START_SENSITIVITY_LOW",
  voiceName: "Puck",
});
```

## Best Practices

### 1. **Test Changes Gradually**

- Make one change at a time
- Test with different audio environments
- Get feedback from users

### 2. **Audio Environment Considerations**

- **Quiet environments**: Use higher sensitivity settings
- **Noisy environments**: Use lower sensitivity, longer silence duration
- **Multiple speakers**: Increase silence duration and padding

### 3. **Session Length Considerations**

- **Short sessions (5-10 min)**: Reduce introduction delay, earlier time warnings
- **Long sessions (30+ min)**: More introduction time, multiple time checkpoints

### 4. **Developer Level Customization**

- **Junior developers**: More supportive prompts, longer explanations
- **Senior developers**: More direct feedback, challenging questions

## Configuration Validation

The system includes built-in validation:

- VAD sensitivity values are type-checked
- Timing values must be positive integers
- Voice names are validated against available options
- Model names are checked for compatibility

## Troubleshooting

### Common Issues

**AI not detecting speech:**

- Increase `START_OF_SPEECH_SENSITIVITY` to `"START_SENSITIVITY_HIGH"`
- Reduce `PREFIX_PADDING_MS`

**AI cutting off too quickly:**

- Increase `SILENCE_DURATION_MS`
- Increase `END_OF_SPEECH_SENSITIVITY` to `"END_SENSITIVITY_HIGH"`

**Background noise interference:**

- Decrease sensitivity settings to `"START_SENSITIVITY_LOW"`
- Increase `SILENCE_DURATION_MS` and `PREFIX_PADDING_MS`

**Session resumption not working:**

- Ensure `SESSION_RESUMPTION_ENABLED: true`
- Check that session handles are being received in debug logs

**AI restarts conversation on resume:**

- Check that timers are only set up on initial connection, not on resume
- Verify that `isInitialConnection` parameter is correctly passed to timer functions

**Mute button not working:**

- Check browser microphone permissions
- Verify that audio recorder is properly starting and stopping
- Check for JavaScript errors in browser console related to audio worklets

## Session Resumption Behavior

### Initial Connection vs Resume

The system automatically distinguishes between:

- **Initial Connection**: Full timer setup, introduction message, and session initialization
- **Resume Connection**: Continues existing session without re-triggering introduction or timers

### Timer Management on Resume

When resuming a paused session:

- Introduction timers are **not** re-triggered
- Half-time and end-time warnings continue from where they were paused
- AI continues the conversation from the previous context without restarting

This ensures smooth session continuity and prevents the AI from thinking it's starting a new review session.
