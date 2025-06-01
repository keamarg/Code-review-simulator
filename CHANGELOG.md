# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.13.11] - 2025-01-26

### Fixed

- Fixed intermittent fade-in animation on landing page by removing immediate scroll check and adjusting trigger threshold to ensure Recent Code Reviews section consistently requires scrolling to appear
- **Landing Page Pills Not Showing**: Fixed NEW/UPDATED pills not appearing on landing page when Dashboard was visited first
  - **Independent Display**: Both Dashboard and Landing page can now show pills independently without interfering
  - **Smart Cleanup**: Pills are only removed from localStorage after both components have displayed them
  - **Component Tracking**: Added tracking flags to prevent duplicate pill displays on same component
  - **Cross-Component Sync**: Proper coordination between Dashboard and Landing page pill systems

### Enhanced

- **Improved Landing Page Animation Flow**: Enhanced fade-in behavior for better user experience

  - **Research Section Auto-Fade**: Research Project section now automatically fades in 300ms after page load
  - **Scroll-Triggered Reviews**: Recent Code Reviews section still requires scrolling to appear (preserved user preference)
  - **Dual Animation System**: Added `fade-in-auto` class for immediate content and kept `fade-in` for scroll-triggered content
  - **Smooth Transitions**: 0.6s ease transitions for both auto and scroll-triggered animations

- **Landing Page NEW/UPDATED Pills**: Extended pill system to Recent Code Reviews section
  - **Visual Consistency**: NEW (green) and UPDATED (orange) pills now appear on landing page cards
  - **First-Time Display**: Pills show only on first visit to landing page after creating/updating a code review
  - **Auto-Cleanup**: localStorage automatically clears after displaying pills to prevent stale indicators
  - **Accent Ring**: NEW/UPDATED cards get subtle accent ring highlighting like on dashboard
  - **User Feedback**: Immediate visual confirmation when users navigate to landing page after actions

## [0.13.10] - 2025-06-01

### Enhanced

- **Aggressive Front Page Refresh**: Implemented multiple mechanisms to ensure latest projects appear immediately
  - **5-Second Polling**: Reduced refresh interval from 30 seconds to 5 seconds for near real-time updates
  - **Tab Focus Refresh**: Automatically refreshes when user switches back to the browser tab
  - **Window Focus Refresh**: Updates data when window regains focus
  - **Manual Refresh Button**: Added refresh icon next to "Recent Code Reviews" title for instant user control
  - **Cache Busting**: Added timestamp-based cache busting to force fresh database queries
  - **Debug Logging**: Added console logging to track refresh timing and data counts

### Fixed

- **Stale Data Issue**: Resolved front page showing outdated project list
- **Immediate Updates**: New/updated code reviews now appear on front page within 5 seconds or instantly with manual refresh
- **Browser Tab Switching**: Ensures fresh data when user returns to the tab

### UI Improvements

- **Refresh Control**: Subtle refresh button with hover effects integrated into section header
- **Visual Feedback**: Loading states properly reset during manual refresh
- **User Empowerment**: Users can now force immediate refresh if needed

### Technical Details

- **Multiple Event Listeners**: Handles `visibilitychange` and `focus` events for comprehensive refresh triggers
- **Abort Controllers**: Ensures fresh database requests without caching interference
- **Memory Management**: Proper cleanup of all intervals and event listeners on component unmount
- **Performance**: 5-second polling provides immediate updates while maintaining reasonable server load

## [0.13.9] - 2025-06-01

### Fixed

- **Reverted Pill Positioning**: Restored user's preferred pill positioning and three-dots menu spacing

  - **Pill Position**: Back to `top-0.5 right-1` with original `px-3 py-0` padding as preferred by user
  - **Three-dots Menu**: Removed `mt-8` margin to restore original spacing
  - **User Preference**: Maintained user's carefully chosen positioning and styling

- **Front Page Data Refresh**: Fixed recent code reviews not updating with latest projects
  - **Auto-refresh**: Added 30-second interval to fetch latest public code reviews
  - **Real-time Updates**: Front page now shows newest code reviews as they're created
  - **Cleanup**: Proper interval cleanup on component unmount to prevent memory leaks

### Changed

- **Reduced Vertical Spacing**: Made front page more compact with tighter spacing
  - **Section Padding**: Reduced from `py-12 md:py-16` to `py-8 md:py-12` across all front page sections
  - **Heading Margins**: Reduced title margins from `mb-4/mb-6` to `mb-3` for tighter layout
  - **Research Section**: Reduced icon margin from `mb-6` to `mb-4`
  - **Paragraph Spacing**: Tightened text spacing for better visual flow

### Technical Details

- **Polling Strategy**: Added 30-second refresh interval for RecentCodeReviews component
- **Memory Management**: Proper cleanup of intervals to prevent memory leaks
- **Consistent Spacing**: Applied uniform spacing reduction across all front page sections
- **User Experience**: Maintains functionality while respecting user's visual preferences

## [0.13.8] - 2025-06-01

### Added

- **Smart Project Ordering**: Projects now display newest first across the entire application

  - **Dashboard Ordering**: Added `.order("created_at", { ascending: false })` to display most recently created/updated projects first
  - **Front Page Consistency**: Confirmed front page already displays latest projects (maintained existing ordering)
  - **Improved Discovery**: Users can immediately see their newest work at the top

- **Enhanced NEW/UPDATED Pill System**: Complete redesign of project status indicators with intelligent color coding
  - **NEW Pills**: Green (`bg-green-500`) for newly created code reviews - positive association with creation
  - **UPDATED Pills**: Orange (`bg-orange-500`) for recently updated code reviews - attention-grabbing for modifications
  - **Smart Logic**: Automatically detects creation vs. update actions and shows appropriate pill
  - **Updated Tracking**: Added `recentlyUpdatedExamId` state management and localStorage persistence
  - **Single Visit Display**: Pills show only on first dashboard visit after action, then automatically clear

### Changed

- **ExamEditor Integration**: Enhanced save workflow to track both creation and update actions

  - **Update Detection**: Stores `recentlyUpdatedExamId` in localStorage when saving existing code reviews
  - **Creation Tracking**: Maintains existing `newlyCreatedExamId` tracking for new code reviews
  - **Seamless UX**: Users immediately see status of their latest actions when returning to dashboard

- **Visual Improvements**: Enhanced pill positioning and appearance
  - **Perfect Positioning**: Moved to `top-2 right-2` for optimal corner placement with proper margins
  - **Three-dots Spacing**: Restored `mt-8` margin to prevent overlap with status pills
  - **Typography**: Enhanced font weight to `font-bold` for better readability
  - **Consistent Padding**: Standardized `px-2 py-1` for uniform pill appearance

### Technical Details

- **State Management**: Added `recentlyUpdatedExamId` state alongside existing `newlyCreatedExamId`
- **Database Optimization**: Leveraged existing `created_at` field for efficient chronological ordering
- **Memory Management**: Automatic localStorage cleanup prevents stale indicators
- **Component Interface**: Extended `ExamSimulatorCardProps` with `isUpdated` prop for clean separation of concerns
- **Performance**: Minimal overhead - single additional database order clause and localStorage operation

## [0.13.7] - 2025-06-01

### Changed

- **Enhanced Form Button Hover Effects**: Significantly improved visual feedback for better user experience
  - **Cancel Button**: Added background color change on hover (`hover:bg-tokyo-bg-lightest`) with subtle border radius
  - **Create/Update Button**: Added scaling effect (`hover:scale-105`) and enhanced shadow (`hover:shadow-lg`)
  - **Delete Button**: Added scaling effect (`hover:scale-105`) and enhanced shadow (`hover:shadow-lg`)
  - **Smooth Animations**: Updated all buttons to use `transition-all duration-200` for smooth, consistent animations
  - **Visual Feedback**: All buttons now provide clear visual indication when hovered, improving usability

### Fixed

- **Button Interaction Clarity**: Previously subtle hover effects now provide clear visual feedback to users
- **User Experience**: Enhanced interactive elements to meet modern web standards for button responsiveness

## [0.13.6] - 2025-06-01

### Changed

- **Perfect NEW Indicator Positioning**: Final positioning improvements for the NEW badge

  - **Top Right Corner**: Positioned at `top-2 right-2` for perfect corner placement with proper margins
  - **No Overlap**: Three-dot menu moved down (`mt-8`) to avoid any visual conflicts
  - **Better Spacing**: Title padding increased to `pr-20` for clean text flow

- **Complete Tokyo Theme Integration**: Updated ExamEditor to match design system
  - **Primary Button**: Changed from blue to `bg-tokyo-accent hover:bg-tokyo-accent-darker`
  - **Delete Button**: Updated to proper red styling `bg-red-500 hover:bg-red-600` with white text
  - **Cancel Link**: Changed to `text-tokyo-fg hover:text-tokyo-fg-bright`
  - **Form Focus States**: All inputs now use `focus:ring-tokyo-accent` instead of blue
  - **Checkbox Styling**: Updated to `text-tokyo-accent focus:ring-tokyo-accent`
  - **Toast Notification**: Changed to `bg-tokyo-bg-lightest text-tokyo-fg-bright` with `text-tokyo-green` icon

### Fixed

- **Consistent Theme**: All form elements now follow the Tokyo color scheme
- **Visual Hierarchy**: Proper contrast and focus states throughout the form
- **Button Consistency**: Delete and create buttons now have proper styling with shadows

## [0.13.5] - 2025-06-01

### Fixed

- **NEW Indicator Color Scheme**: Changed color from bright green to orange (`bg-orange-500`) to better fit the Tokyo theme
- **Menu Overlap Issue**: Repositioned NEW indicator to avoid overlapping with three-dot menu button
  - **Position**: Moved from `right-3` to `right-14` to provide adequate spacing
  - **Title Padding**: Increased from `pr-12` to `pr-16` to accommodate new positioning
  - **Clean Layout**: Ensures all elements have proper spacing without visual conflicts

### Changed

- **Better Visual Hierarchy**: Orange color provides good visibility while maintaining theme consistency

## [0.13.4] - 2025-06-01

### Changed

- **Enhanced NEW Indicator Design**: Final improvements to the newly created code review indicator
  - **Prominent Color**: Changed to bright green (`bg-green-500`) for better visibility and positive association
  - **Top Right Position**: Moved to top right corner of card (`absolute top-3 right-3`) while staying inside borders
  - **Simplified Persistence**: Removed 10-second timer - indicator now shows only on first dashboard visit after creation
  - **Better Title Spacing**: Added right padding (`pr-12`) to title link to prevent overlap with NEW indicator

### Fixed

- **No Timer Complexity**: Simplified behavior - NEW indicator appears once and clears on navigation
- **Visual Clarity**: Better contrast and positioning for immediate recognition of newly created reviews

## [0.13.3] - 2025-06-01

### Changed

- **Faster Navigation**: Reduced dashboard navigation delay from 1.5 seconds to 0.8 seconds for snappier user experience
- **Improved NEW Indicator**: Redesigned the "NEW" badge for better visual integration
  - **Pill Design**: Changed from overlapping badge to inline pill next to title
  - **No Animation**: Removed distracting pulse animation for cleaner appearance
  - **Better Positioning**: Moved inside card header to avoid border overlap
  - **Consistent Styling**: Maintains Tokyo theme colors with subtle shadow

### Fixed

- **Visual Overlap**: NEW indicator no longer overlaps with card borders
- **Animation Distraction**: Removed unnecessary pulse animation that drew too much attention

## [0.13.2] - 2025-06-01

### Added

- **Enhanced Create Code Review Workflow**: Improved user experience after creating code reviews
  - **Auto-navigation to Dashboard**: After successfully creating a code review, users are automatically taken to the dashboard
  - **"NEW" Indicator**: Newly created code reviews display a prominent "NEW" badge in the dashboard
  - **Visual Highlighting**: New reviews get a subtle accent ring to draw attention
  - **Smart Persistence**: The "NEW" indicator automatically disappears after 10 seconds
  - **Error-Safe Navigation**: Navigation only occurs when all required fields are properly filled and save is successful

### Changed

- **ExamEditor Save Flow**: Modified to navigate to dashboard after successful creation/update
- **Dashboard Card Component**: Enhanced to accept `isNew` prop for displaying new indicators
- **Toast Timing**: Adjusted navigation delay to allow users to see the success message (1.5 seconds)

### Technical Details

- Uses localStorage to persist newly created exam IDs across page navigation
- Automatic cleanup prevents stale "NEW" indicators from persisting
- Backward compatible - existing functionality unchanged
- Follows existing Tokyo theme styling for consistency

## [0.13.1] - 2025-06-01

### Added

- **Recent Code Reviews on Landing Page**: Added new section displaying the last three created public code reviews
  - **RecentCodeReviews Component**: New component that fetches and displays recent public reviews with loading states
  - **Interactive Cards**: Each review card shows title, description, duration, type, and developer level
  - **Try Review Action**: Direct links to start any displayed code review session
  - **Responsive Design**: Mobile-friendly grid layout that adapts to different screen sizes
  - **Loading Animation**: Skeleton loading animation while fetching reviews
  - **Empty State**: Graceful handling when no public reviews are available
  - **View All Link**: Link to dashboard for users who want to see all available reviews

### Changed

- **Landing Page Enhancement**: Improved user experience by showcasing actual content
- **ExamSimulator Type**: Added optional `created_at` field to support ordering by creation date
- **CSS Utilities**: Added `line-clamp-2` and `line-clamp-3` classes for proper text truncation

### Technical Details

- Fetches only public reviews using `is_public = true` filter for security
- Orders by `created_at DESC` to show most recent reviews first
- Limits results to 3 items for optimal page performance
- Uses same styling system as Dashboard cards for consistency

## [0.13.0] - 2025-05-30

### Removed

- **Complete Grading System Removal**: Eliminated all grading functionality to focus on constructive code review feedback
- **Dual Prompt System**: Removed `src/prompts_exam.json` and consolidated on `src/prompts.json`
- **Grade Criteria**: Removed `gradeCriteria` fields from all exam configurations
- **Grading Scale Definitions**: Removed Danish 7-point grading scale and pass/fail options
- **Legacy Grading Documentation**: Removed `docs/legacy/example-prompt.txt` with grading instructions

### Changed

- **Timer Naming**: Renamed `gradingTimer` to `finalWarningTimer` for clarity
- **AI Behavior**: All AI interactions now focus on constructive feedback instead of scoring
- **Documentation**: Updated README.md and documentation to emphasize code review rather than evaluation
- **Prompt System**: Unified on single prompt system optimized for code review sessions

### Fixed

- **Terminology Consistency**: Removed conflicting exam vs code review messaging
- **Architecture Simplification**: Eliminated unused grading logic and dual prompt complexity

## [0.12.6] - 2025-05-30

### Fixed

- **Dashboard Popup Menu Visibility**: Fixed transparent background issue on three-dots menu popup that made text unreadable
  - Changed background from `bg-tokyo-bg-lighter` to `bg-tokyo-bg-lightest` for better contrast
  - Added `backdrop-blur-sm` for enhanced visual separation
  - Increased shadow depth from `shadow-lg` to `shadow-xl` for better definition
  - Increased z-index from `z-10` to `z-20` for proper layering
- **Dashboard Popup Menu Click Outside**: Fixed menu not closing when clicking outside
  - Replaced simple click listener with robust `useRef` and `contains()` method for proper boundary detection
  - Changed from `click` to `mousedown` event for more reliable detection
  - Added 10ms delay to prevent immediate menu closing on open
  - Proper cleanup of event listeners and timeouts

### Changed

- **Improved Menu Interaction**: Enhanced user experience with more reliable popup menu behavior
- **Better Visual Design**: Popup menu now has clear visual separation from background content

## [0.12.5] - 2025-04-29

### Fixed

- **GitHub Repository Integration**: Fixed 404 errors when pasting GitHub repository URLs
- **Intelligent Project Detection**: Replaced hardcoded Android project path with smart repository structure detection
- **Multi-Language Support**: Added support for JavaScript, Python, Java, C#, Go, PHP, Ruby, and many other languages
- **Better Error Handling**: Added proper error messages when repositories don't contain code files
- **File Filtering**: Only processes actual code files and skips build/dependency directories

### Added

- **Automatic Project Structure Detection**: Detects common source directories across different project types
- **File Type Recognition**: Recognizes code files by extension across 25+ programming languages
- **Smart Directory Filtering**: Skips non-code directories like node_modules, build, target, etc.
- **File Size Limits**: Prevents overwhelming the AI with extremely large files (5KB limit per file)
- **Repository Validation**: Better validation of GitHub URLs including .git suffix handling

### Changed

- **Repository Processing**: Now works with any GitHub repository structure, not just Android projects
- **Performance Improvements**: Added file count limits and depth restrictions to prevent timeouts
- **Code Quality**: Fixed regex escape character warnings

## [0.12.4] - 2025-05-19

### Added

- Created organized documentation structure in `docs/` folder
- Separated documentation into `docs/development/`, `docs/supabase/`, and `docs/legacy/`

### Changed

- Moved all development documentation from root to `docs/development/`
- Moved all Supabase-related files to `docs/supabase/`
- Moved legacy/outdated files to `docs/legacy/`

### Fixed

- Removed ESLint warnings for unused constants in liveConfigUtils.ts
- Cleaned up project structure by removing backup files

### Removed

- All `.bak`, `.backup`, `.old`, `.working`, `.fix`, `.clean`, and `.final` files
- Duplicate CHANGELOG.md.addfix file
- Scattered documentation files from root directory

## [0.12.3] - 2025-05-30

### Fixed

- **Session Resumption Configuration**: Updated `createLiveConfig` to use `LiveConnectConfig` from `@google/genai` instead of custom `LiveConfig` type
- **Critical Session Resumption Fix**: Added missing `sessionResumption: {}` field to enable session resumption feature (this was the root cause of session handles not being received)
- **Resume Timer Issue**: Fixed issue where AI would restart conversation on resume by preventing timer messages from being sent on resumed connections
- **Mute Button Issue**: Fixed mute button not working properly due to multiple audio recorder start calls and improper event listener management
- **Screen Sharing Request Issue**: Fixed AI asking user to share screen by disabling automatic screen sharing notification in AIExaminerPage.tsx
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
- **Integrated Screen Sharing**: Combined "Start code review" button with automatic screen sharing
  - **Automatic Screen Share**: Screen sharing popup appears when starting a code review
  - **Prerequisite Validation**: AI only begins after screen sharing is successfully established
  - **Streamlined UX**: Single button replaces separate start and screen share controls
  - **Visual Feedback**: Screen sharing status indicator shows when active
  - **Error Handling**: Clear error messages if screen sharing fails or is denied
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

## [0.12.2] - 2025-05-30

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

## [0.12.1] - 2025-05-30

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

## [0.12.0] - 2025-05-29

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

## [0.11.11] - 2025-05-19

### Fixed

- **Landing Page Pills Not Showing**: Fixed NEW/UPDATED pills not appearing on landing page when Dashboard was visited first
  - **Independent Display**: Both Dashboard and Landing page can now show pills independently without interfering
  - **Smart Cleanup**: Pills are only removed from localStorage after both components have displayed them
  - **Component Tracking**: Added tracking flags to prevent duplicate pill displays on same component
  - **Cross-Component Sync**: Proper coordination between Dashboard and Landing page pill systems
