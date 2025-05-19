# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.11.1] - 2025-05-27

### Changed

- Created a new custom SVG logo with code angle brackets and a backslash
- Added colorful AI sparkle elements in theme colors to represent AI assistance
- Replaced old imported PNG logo with an inline SVG for better scaling and theme consistency
- Updated favicon to use the new logo design
- Updated meta descriptions in index.html to better reflect the application purpose

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
