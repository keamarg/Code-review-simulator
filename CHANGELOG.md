# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2025-05-23

### Changed

- Updated the user interface text content based on UI-Text-Content-CodeReview.md
- Modified Layout.tsx to update header and footer text
- Updated LandingPage.tsx with code review specific content
- Changed Dashboard.tsx to use code review terminology
- Modified ExamEditor.tsx to reflect code review editing functionality
- Updated LoadingAnimation.tsx to show code review loading message

## [0.6.0] - 2025-05-22

### Added

- Created UI-Text-Content-CodeReview.md with updated text content for the Code Review Simulator
- Converted exam-related terminology to code review terminology while preserving Danish language
- Updated role references from student/teacher to developer/reviewer

## [0.5.0] - 2025-05-21

### Added

- Created UI-Text-Content.md document cataloging all user-facing text content
- Documented text from all major components with source file references
- Organized content by component type for easier reference during transformation

## [0.4.0] - 2025-05-20

### Changed

- Refactored prompt handling to use the centralized prompts.json file
- Updated prompt.js, getExaminerQuestions.tsx, and getGithubRepoFiles.js to draw prompts from the JSON file
- Improved maintainability by separating prompts from code logic
- Moved prompts.json to the src folder to ensure proper importing

## [0.3.0] - 2025-05-20

### Added

- Created prompts.json file containing all system prompts, user prompts, and AI configurations used in the project
- Documented model configurations, grading scales, and instruction components in a structured JSON format

## [0.2.0] - 2025-05-19

### Added

- Created Code-Review-Transformation-Plan.md outlining the process to convert the application from an exam simulator to a code review simulator
- Added comprehensive plan for updating prompts, UI, terminology, and removing commercial elements
- Detailed dark theme implementation strategy

## [0.1.1] - 2025-05-19

### Changed

- Updated all API key server URLs in the codebase to use `api-key-server-codereview.vercel.app` for OpenAI and Gemini API key endpoints instead of the previous `api-key-server-sigma.vercel.app`.

## [0.1.0] - 2025-05-18

### Added

- Initial project setup and features.

## [1.0.0] - 2025-05-13

### Added

- AI-System-Documentation.md file documenting all AI system prompts, guidelines, and settings in the codebase
- Comprehensive documentation of AI components including:
  - Main system prompt files
  - AI model configurations
  - API and authentication settings
  - Voice and response configurations
  - Example prompts
  - System architecture overview
