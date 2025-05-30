# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.3] - 2025-01-27

### Fixed

- **Session Resumption Configuration**: Updated `createLiveConfig` to use `LiveConnectConfig` from `@google/genai` instead of custom `LiveConfig` type
- **Critical Session Resumption Fix**: Added missing `sessionResumption: {}` field to enable session resumption feature (this was the root cause of session handles not being received)
- **Resume Timer Issue**: Fixed issue where AI would restart conversation on resume by preventing timer messages from being sent on resumed connections
- **Mute Button Issue**: Fixed mute button not working properly due to multiple audio recorder start calls and improper event listener management
- **Audio Cutout Issues**: Configured Voice Activity Detection (VAD) to be less sensitive to prevent AI voice from cutting in and out during conversations
- **Configuration Usage**: Fixed VAD settings to use centralized `AI_CONFIG` values for `silenceDurationMs` and `prefixPaddingMs` instead of hardcoded values
- **Modality Type Safety**: Fixed `responseModalities` to use `Modality.AUDIO` enum instead of string literal
- **Config Structure**: Removed `model` property from config object as it's passed separately to connect/resume methods
- **Session Resumption Enablement**: Configured proper session resumption to enable conversation continuity after pause/resume
- **ESLint Warnings**: Fixed unused import warnings and template string expression warnings with appropriate disable comments

### Added

- **Complete Prompt Centralization**: Moved ALL AI prompts, system instructions, and timer messages to `src/prompts.json`
  - **Level Guidance**: Centralized junior/intermediate/senior developer focus areas
  - **Timer Messages**: Centralized introduction, half-time, and time-up messages
  - **Instruction Components**: Modular prompt components for screen sharing, context, and guidelines
  - **Template System**: Support for dynamic placeholders like `${level}`, `${remainingMinutes}`, `${description}`
- **Comprehensive Configuration System**: Expanded `aiConfig.ts` to centralize ALL configuration options
  - **VAD Settings**: Centralized voice activity detection sensitivity and timing settings
  - **Timer Configuration**: Centralized introduction delay and warning timing settings
  - **Session Configuration**: Centralized session resumption and response modality settings
  - **Helper Functions**: Added `getVADConfig()` and `getTimerConfig()` for easy access
- **VAD Configuration**: Added comprehensive Voice Activity Detection settings:
  - `startOfSpeechSensitivity: START_SENSITIVITY_HIGH` - Sensitive enough to detect user speech properly
  - `endOfSpeechSensitivity: END_SENSITIVITY_HIGH` - Responsive speech end detection
  - `prefixPaddingMs: 100` - Moderate padding before speech detection starts
  - `silenceDurationMs: 500` - Balanced silence duration required to end speech (reduced from 1000ms after over-correction)
- **Centralized Prompts Documentation**: Created `CENTRALIZED_PROMPTS_DOCUMENTATION.md` with comprehensive guide
- **Comprehensive Configuration Guide**: Created `COMPREHENSIVE_CONFIGURATION_GUIDE.md` with complete configuration reference

### Changed

- **liveConfigUtils.ts**: Migrated from custom `LiveConfig` to official `LiveConnectConfig` type and enabled session resumption
- **ExamWorkflow.tsx**: Updated `createLiveConfig` calls to remove model parameter
- **prompt.js**: Completely refactored to use centralized prompts instead of hardcoded strings
- **useExamTimers.ts**: Updated to use centralized timer messages and timing configuration from `aiConfig.ts`
- **Altair.tsx**: Updated to use centralized timer messages and timing configuration from `aiConfig.ts`
- **Type Imports**: Added `Modality`, `StartSensitivity`, and `EndSensitivity` enum imports from `@google/genai`
- **Configuration Architecture**: All hardcoded values moved to centralized configuration system
- **VAD Settings**: Now fully configurable through `AI_CONFIG.VAD_SETTINGS` with type safety
- **Timer Settings**: All timing values now controlled through `AI_CONFIG.TIMER_SETTINGS`

### Technical Notes

- Session resumption must be explicitly enabled in the initial connection config by setting `sessionResumption: {}`
- Once enabled, the server will send `sessionResumptionUpdate` messages with handles for reconnection
- Resume connections use `sessionResumption: { handle: previousHandle }` to continue conversation
- VAD settings significantly reduce audio interruptions caused by background noise or brief sounds
- **All AI behavior is now controlled from `src/prompts.json`** - no more scattered hardcoded prompts
- Template variables support dynamic content: `${examDurationActiveExam}`, `${level}`, `${remainingMinutes}`, etc.

## [0.12.2] - 2025-01-27

### Fixed

- **WebSocket Connection Errors**: Completely migrated from legacy `useLiveAPIContext` to new `useGenAILiveContext`
- **"WebSocket is not connected" Error**: Resolved error when pressing stop button by removing legacy MultimodalLiveClient references
- **Timer and Voice Issues**: Fixed problems where timer wouldn't start and voice wouldn't receive instructions due to legacy client usage
- **Mixed Client Usage**: Eliminated all mixed usage of old and new GenAI Live clients
- **Connection Management**: Improved connection handling with proper disconnect on pause/stop
- **Context Provider Error**: Fixed "useGenAILiveContext must be used within a GenAILiveProvider" by restructuring component hierarchy
- **Voice Continuation on Pause**: Fixed issue where AI voice continued speaking after pressing pause button
- **Task Information Disappearing**: Fixed task information being cleared when pausing, now remains visible during pause
- **Automatic Reconnection**: Prevented unwanted automatic reconnection when user manually disconnects/pauses
- **Conversation Continuity**: Fixed issue where resume started a new conversation instead of continuing the existing one
- **Button Text Inconsistency**: Button now shows "Resume" instead of "Start code review" when resuming a paused session

### Added

- **Manual Disconnect Tracking**: Added flag to distinguish between manual and automatic disconnections
- **Immediate Audio Stop**: AudioStreamer now stops immediately on disconnect to cut off voice
- **Proper Pause/Resume**: Task information and config remain available for seamless resume
- **Session Resumption for Manual Resume**: Added `resume()` method that uses session resumption handles to continue conversations
- **Dynamic Button Text**: Button text changes based on session state (Start/Resume/Pause)
- **Connection State Tracking**: Added tracking for first-time vs. resume connections

### Changed

- **Complete Client Migration**: Updated all components to use new GenAI Live Client:
  - `ControlTrayCustom.tsx`: Migrated from legacy to new context
  - `ExamWorkflow.tsx`: Updated to use new client API with proper config management and pause handling
  - `AIExaminerPage.tsx`: Replaced LiveAPIProvider with GenAILiveProvider and restructured component hierarchy
- **Code Cleanup**: Removed unused imports and variables throughout codebase
- **Simplified Architecture**: Consolidated screen share notification logic directly in main component
- **Component Restructure**: Created ExamPageContent component to properly wrap GenAI Live Context usage
- **Audio Management**: Enhanced disconnect behavior to immediately stop audio streamer and prevent buffered audio playback
- **Pause Logic**: Improved pause functionality to preserve exam state while stopping voice and timer

### Removed

- All references to legacy `useLiveAPIContext` and `LiveAPIProvider`
- Deprecated WebSocket implementation and MultimodalLiveClient usage
- Unused PageContent component and interface
- Legacy URI constants and unused imports

## [0.12.1] - 2025-01-27

### Fixed

- **Timer Pause Functionality**: CountdownTimer now properly pauses when the exam is paused
- **Voice Pause Behavior**: Audio recorder and live client now disconnect immediately when pause is pressed
- **Permission Denied Error**: Fixed `NotAllowedError: Permission denied` when restarting after pause by improving media stream error handling
- **Button State Management**: Enhanced pause/start button logic to properly manage connection state
- **Error Handling**: Added proper error handling for media stream operations to prevent unhandled promise rejections

### Added

- **Pause Indicator**: Visual "PAUSED" indicator on countdown timer when exam is paused
- **Enhanced Error Logging**: Better error messages and logging for media stream operations
- **Graceful Error Recovery**: Improved error handling that doesn't break the UI when permissions are denied

### Changed

- CountdownTimer component now accepts `pauseTrigger` prop for proper pause/resume functionality
- Enhanced ControlTrayCustom button handling with async error management
- Improved media stream button click handlers with proper error boundaries

## [0.12.0] - 2025-01-27

### Added

- **Major Upgrade**: New GenAI Live Client implementation based on official `@google/genai` package
- **Session Resumption**: Automatic session resumption with handles for connection continuity
- **Automatic Reconnection**: Smart reconnection on WebSocket close (code 1011) with retry limits
- **Enhanced Connection Management**: Status tracking ("connected" | "disconnected" | "connecting")
- **Improved Event System**: Comprehensive event handling and logging
- **Better Error Handling**: Detailed logging and graceful error recovery
- New files:
  - `src/lib/genai-live-client.ts` - Improved client implementation
  - `src/hooks/use-genai-live.ts` - New hook for improved client
  - `src/contexts/GenAILiveContext.tsx` - New context provider
  - `src/types/index.ts` - Supporting types
  - `GENAI_LIVE_CLIENT_UPGRADE.md` - Comprehensive upgrade documentation

### Changed

- Updated to use `@google/genai` package instead of custom WebSocket implementation
- Improved model support for `models/gemini-2.0-flash-live-001`
- Enhanced logging system for better debugging
- More robust connection handling with 500ms reconnection delay

### Fixed

- Connection stability issues with automatic session resumption
- Better WebSocket error handling and recovery
- Improved memory management with proper cleanup

### Compatibility

- ✅ **Backward Compatible** - All existing code continues to work unchanged
- ✅ **Additive Changes** - New implementation available alongside existing implementation
- ✅ **Optional Migration** - Can gradually migrate to new client for enhanced features

## [0.11.11] - 2025-01-27

### Added

- Centralized AI model configuration system in `src/config/aiConfig.ts`
- Environment variable support for AI model selection (`REACT_APP_AI_MODEL`)
- Environment variable support for AI voice selection (`REACT_APP_AI_VOICE`)
- Comprehensive AI model configuration documentation (`AI_MODEL_CONFIGURATION.md`)

### Changed

- Centralized all hardcoded `models/gemini-2.0-flash-exp` references to use configurable system
- Updated `liveConfigUtils.ts` to use centralized configuration
- Updated `ExamWorkflow.tsx` to use centralized configuration
- Updated `use-live-api.ts` to use centralized configuration
- Updated `Altair.tsx` to use centralized configuration
- Made AI model and voice settings easily configurable without code changes

### Fixed

- Eliminated multiple hardcoded model references throughout the codebase
- Improved maintainability by centralizing AI configuration

## [0.11.10] - 2025-01-27

### Fixed

- Fixed ESLint import order error in ExamWorkflow.tsx by moving CountdownTimer import to top
- Resolved TypeScript errors related to missing 'model' property in ExamSimulator type
- Fixed LoadingAnimation component usage by removing unsupported 'message' prop
- Corrected responseModalities type from array to single string value in liveConfigUtils.ts
- Removed unsupported realtimeInputConfig and sessionResumption properties from LiveConfig
- Added missing babel plugin @babel/plugin-proposal-private-property-in-object to resolve build warnings
- Application now builds successfully with only minor linting warnings remaining

### Added

- Comprehensive Supabase schema documentation with SQL import script
- Row Level Security (RLS) policies for secure data access
- Instructions for migrating to different Supabase accounts

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
