# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.9] - 2025-05-29

### Fixed

- Addressed AI behavior issues by thoroughly revising prompts
- Fixed problem where AI would try to end reviews prematurely before the full time was used
- Removed all references to grading and evaluation from prompts and templates
- Changed AI instruction to focus more on direct feedback rather than asking excessive questions
- Added explicit instructions to use the full allocated time for each review
- Enhanced instruction components to emphasize specific, actionable feedback over theoretical questions
- Replaced outdated grading scales with explicit instructions not to use grades

## [0.11.8] - 2025-05-28

### Fixed

- Fixed duration calculation issue where 1 minute was incorrectly subtracted from the total duration
- Updated AIExaminer and AIExaminerGithub components to use the correct full duration

### Changed

- Improved prompts to generate more concise responses from AI models
- Limited task descriptions to approximately 150 words for better readability
- Added explicit brevity instructions to system prompts
- Enhanced repo questions prompt to generate more focused questions
- Updated prompt templates to encourage direct, clear communication style

## [0.11.7] - 2025-05-28

### Fixed

- Resolved 400 Bad Request error when creating code reviews
- Updated data model to use existing database column names for backward compatibility
- Reverted ExamSimulator type to use 'learning_goals' instead of 'developer_level'
- Maintained developer level selection UI while adapting to existing database schema

## [0.11.6] - 2025-05-28

### Fixed

- Fixed error when creating new code reviews by setting "intermediate" as the default developer level
- Made developer level a required field in the code review form
- Removed empty option from the developer level dropdown

## [0.11.5] - 2025-05-28

### Fixed

- Fixed TypeScript error where 'learning_goals' property was referenced but no longer exists
- Updated AIExaminerGithub.tsx to use developer_level instead of learning_goals
- Updated getGithubRepoFiles.js to generate level-specific guidance based on developer_level
- Improved GitHub repository UI with Tokyo Night theme styling
- Changed text from "exam" to "code review" in the GitHub repository component

## [0.11.4] - 2025-05-28

### Changed

- Updated the prompt system to use developer_level (junior, intermediate, senior) instead of learning_goals
- Replaced grade criteria with level-specific code review guidance
- Modified getExaminerQuestions.tsx to generate level-appropriate review focus areas
- Updated prompt.js to provide tailored review guidance based on developer level
- Added appropriate fallback content when description is not available

## [0.11.3] - 2025-05-28

### Changed

- Improved code review creation process to focus on developer experience levels
- Updated ExamSimulator data model to replace exam-specific fields with developer_level
- Modified ExamEditor.tsx to show "Junior", "Intermediate", and "Senior" developer options
- Removed learning goals, feedback, and typical questions fields from the code review form
- Added explanatory text about how developer level influences review feedback
- Streamlined the form to focus solely on code review aspects

## [0.11.2] - 2025-05-28

### Changed

- Completed the translation of all remaining Danish text to English throughout the application
- Updated ExamEditor.tsx with English text for all form fields, labels, placeholders, and buttons
- Updated Dashboard.tsx with English text for headings, search functionality, and empty state messages
- Fixed time format display in the duration formatter to use "h" instead of "t" for hours
- Simplified the hero section on the landing page to use a centered title in English
- Removed example boxes and promotional content from the landing page

## [0.11.1] - 2025-05-27

### Changed

- Updated the API server URLs from `api-key-server-sigma.vercel.app` to `api-key-server-codereview.vercel.app`
- Changed repository name in `package.json` homepage from `https://behu-kea.github.io/exam-simulator` to `https://keamarg.github.io/Code-review-simulator`

### Added

- Created this CHANGELOG.md file to track changes
- Added AI-System-Documentation.md to document how the AI models are used in the system
- Added 404.html for improved routing on GitHub Pages

### Fixed

- Addressed CORS issues for the OpenAI and Gemini API keys

## [0.11.0] - 2025-05-27

### Changed

- Removed commercial elements from the application
- Updated footer with research disclaimer and removed marketing text
- Replaced testimonial section with research project information
- Changed CTA sections to focus on research contribution rather than commercial signup
- Updated Login and Signup pages to focus on research participation
- Changed form fields in Signup page to be more relevant for research (organization, role, experience)
- Added explicit research consent notice to the signup form
- Converted all remaining Danish text to English across the application

## [0.10.2] - 2025-05-26

### Changed

- Updated code review page to match the Tokyo Night theme
- Fixed welcome text that was previously black on dark background
- Updated countdown timer with Tokyo Night colors
- Redesigned control tray with proper dark theme styling
- Fixed mic button and share screen elements to use theme colors
- Improved readability of all text elements on the review page

## [0.10.1] - 2025-05-26

### Changed

- Updated Login and Signup pages to match the Tokyo Night theme
- Applied dark theme styling to form inputs, buttons, and background elements
- Fixed contrast issues with text and form fields
- Improved visual consistency across all authentication pages

## [0.10.0] - 2025-05-26

### Changed

- Implemented Tokyo Night theme across the application
- Updated color scheme with deep blues, purples, and carefully selected accent colors
- Improved contrast for text elements and UI components
- Added JetBrains Mono font mapping to the Tokyo Night theme
- Modernized all buttons, cards, and interactive elements with the new color palette
- Ensured consistent styling across all pages and components
- Enhanced overall aesthetic appeal with one of the most highly acclaimed dark themes

## [0.9.0] - 2025-05-25

### Changed

- Enhanced dark theme implementation across the application
- Added JetBrains Mono as the primary font for better code readability
- Updated blue color palette to be more compatible with dark backgrounds
- Changed "Dine code reviews" heading and other text elements to ensure proper contrast
- Updated all card components, forms, and input elements to use dark theme styling
- Changed navigation labels to English: "Create Review", "Dashboard", "Sign In", etc.
- Updated footer text to be more research-focused

## [0.8.0] - 2025-05-24

### Changed

- Implemented dark theme UI across the application
- Updated App.scss with dark theme color variables and classes
- Modified Layout.tsx to use dark-themed styles for header, footer, and navigation
- Updated AIExaminer component to use dark theme styling
- Changed App.tsx root element to use dark background
- Updated document title to "Code Review Simulator" in index.html

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
