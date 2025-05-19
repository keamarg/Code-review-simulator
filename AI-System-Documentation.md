# AI System Documentation

This document provides a comprehensive overview of where all system prompts, guidelines, and settings for the AI reside in the codebase.

## Main System Prompt Files

### 1. `src/exam-simulator/utils/prompt.js`

- Contains two main prompt generation functions:
  - `getPrompt` (standard) - For regular exams
  - `getGithubPrompt` - For GitHub repository-based exams
- These include detailed instructions for AI behavior during exams, grading criteria, and guidance for interaction

### 2. `src/exam-simulator/utils/getExaminerQuestions.tsx`

- Contains the prompt used to generate exam questions
- Uses a system prompt: "You are a skilled and seasoned censor with many years of experience"
- Constructs a task for students based on learning goals

### 3. `src/exam-simulator/utils/getGithubRepoFiles.js`

- Contains the prompt for generating questions based on GitHub repository contents
- Uses system prompt: "You are an exam examiner."

## AI Model Configurations

### 1. `src/exam-simulator/components/ai-examiner/AIExaminer.tsx`

- Sets up AI model configuration in the `useEffect` hook
- Configures the model: "models/gemini-2.0-flash-exp"
- Sets response modalities to "audio" with voice "Puck"
- Provides system instruction as the prompt

### 2. `src/exam-simulator/components/ai-examiner/AIExaminerGithub.tsx`

- Similar configuration for GitHub-based exams
- Also uses Gemini 2.0 Flash model with audio output

### 3. `src/hooks/use-live-api.ts`

- Default model configuration
- Sets up the initial Gemini 2.0 Flash model

## API and Authentication

### 1. `src/exam-simulator/utils/getCompletion.js`

- Handles OpenAI API calls
- Uses GPT-4o-mini for generating exam content
- Fetches API key from external server: "https://api-key-server-codereview.vercel.app/api/prompt1"

### 2. `src/exam-simulator/pages/AIExaminerPage.tsx`

- Contains the Gemini API setup
- WebSocket connection to: "generativelanguage.googleapis.com"

## Voice and Response Configuration

### 1. `src/multimodal-live-types.ts`

- Contains the full configuration schema for the AI model
- Defines available voice options: "Puck", "Charon", "Kore", "Fenrir", "Aoede"
- Defines response modality types (text, audio, image)

## Example Prompts

### 1. `example-prompt.txt`

- Contains a full example of an exam prompt
- Includes detailed instructions for the AI examiner
- Shows how learning goals, grading criteria, and examination guidance are structured

## System Architecture Overview

This AI system uses a combination of OpenAI's GPT-4o-mini for generating exam content and Google's Gemini 2.0 Flash model for conducting the actual exams with audio responses. The system prompts are detailed and focus on guiding the AI to behave as a professional examiner who evaluates students' competencies according to specific learning goals.
