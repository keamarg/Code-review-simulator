# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.17.0] - 2025-06-02

### Added

- **SVG File Icons for Suggestions**: Replaced text-based file type placeholders (e.g., "[JS]") with SVG icons in the `LiveSuggestionsPanel`.
  - Icons for JS, TS, Python, CSS, HTML, JSON, and a generic file type are included.
  - `SuggestionFileIcon` component dynamically selects the appropriate icon based on `suggestion.filename` extension.

### Changed

- **Live Suggestions Panel UI**:
  - Increased left padding in the header of the `LiveSuggestionsPanel` for better visual balance.
  - Removed the display of filenames next to the timestamp in individual suggestion items, relying on the new SVG icons for file type context.

## [0.15.0] - 2025-06-02

### Fixed

- **Task Content Loading Animation**: Replaced static ghost loader bars with dynamic `LoadingAnimation` component in task content area

  - **Animated Loading**: Task content area now shows animated loading spinner and lightbulb icon while OpenAI generates the task
  - **Better User Feedback**: "Generating code review task..." message provides clear status during task creation
  - **Professional Appearance**: Consistent animated loading experience across the application
  - **Responsive Layout**: Loading area maintains proper sizing and centering with flexbox layout

- **CRITICAL: Timer Setup Bug**: Fixed timer not being initialized due to logic error in connection sequence

  - **Root Cause**: `hasEverConnected` was being set to `true` BEFORE checking if timers needed setup
  - **Timer Fix**: Stored initial connection state before it changes to ensure timers are properly set up
  - **7-Second Farewell**: Timer interruption should now work correctly with proper timer initialization
  - **Debug Logging**: Enhanced logging shows when timers are set up vs skipped for resumed sessions

- **Hide Controls During Task Loading**: Timer, mute, and screen share controls now hidden while task content loads
  - **Clean Loading State**: ControlTrayCustom component hidden until task generation completes
  - **Loading State Propagation**: ExamWorkflow notifies parent components of loading state changes
  - **Professional UX**: Users see loading animation without distracting control elements
  - **Conditional Rendering**: Controls only appear when task is ready and user can actually start

### Enhanced

- **Aggressive Farewell Interruption System**: Completely redesigned 7-second farewell to forcefully interrupt AI speech
  - **Rapid Message Sequence**: Sends "Stop." → "Time is up." → Farewell message in quick succession
  - **No Complex Disconnection**: Simplified approach without risky disconnect/reconnect cycles
  - **Multiple Interruption Attempts**: Three separate messages to overwhelm AI's current speech pattern
  - **Enhanced Debug Logging**: Comprehensive logging to track interruption attempts and message delivery

### Technical Details

- **AIExaminerDisplay Component**: Replaced 12 static ghost loader divs with `LoadingAnimation` component and status message
- **ExamWorkflow Logic Fix**: Fixed `hasEverConnected` state management for proper timer initialization
- **State Propagation**: Added `onLoadingStateChange` callback to communicate loading state to parent components
- **Conditional UI**: ControlTrayCustom component conditionally rendered based on task loading state
- **Timer Debugging**: Enhanced console logging to troubleshoot timer setup and execution issues

### Enhanced

- **More Aggressive Suggestion Extraction**: Improved live suggestion system to capture more code review suggestions

  - **Faster Processing**: Reduced processing interval from 10 seconds to 5 seconds for more frequent suggestion updates
  - **Liberal Extraction**: Updated prompts to be more liberal in extracting any improvement suggestions
  - **Better Pattern Recognition**: Enhanced OpenAI prompts to catch implied suggestions and best practices mentions
  - **Increased Length**: Raised suggestion length limit from 25 to 30 words for more descriptive suggestions
  - **Varied Suggestions**: More permissive duplicate detection allows valuable variations and elaborations

- **Improved Connection State Management**: Enhanced connection tracking system for more reliable session control
  - **Multiple Guards**: Connection attempts now check for cleanup, termination, and existing connections
  - **Better Debug Info**: Connection state logging now includes termination status for easier troubleshooting
  - **Clean Unmount**: Component unmount now properly sets termination guard to prevent ghost connections
  - **Session Isolation**: Each session termination is now properly isolated from new session starts

### Technical Details

- **Transcript Processing**: Implemented smart word boundary detection with lowercase continuation logic
- **Fragment Analysis**: Logic detects 3-character or shorter fragments as potential word continuations
- **Punctuation Spacing**: Proper handling of punctuation boundaries and existing spaces
- **Connection Guards**: Added termination guard checks in connection effect and session end handler
- **State Coordination**: Enhanced cleanup sequence with proper flag management and timeouts
- **Memory Management**: Improved cleanup of connection tracking and session state during termination

## [0.14.9] - 2025-06-02

### Fixed

- **REVERTED COMPLEX CONNECTION MANAGEMENT**: User was absolutely right - went back to simple, working state by removing all the aggressive connection guards and cleanup logic that was breaking everything

  - **Root Cause**: My "fixes" for the dual AI sessions created more problems than they solved
  - **Simple is Better**: Removed all complex connection tracking (`isConnectingRef`, `activeConnectionRef`, `isTerminatingRef`, `isCleaningUpRef`)
  - **Back to Basics**: Restored simple connection logic that just connects when needed and disconnects when done
  - **Removed Transcript Fragmentation Fix**: Simplified transcript handling back to basic concatenation without "smart reconstruction"
  - **Simplified Manual Stop**: Removed complex guard logic and made manual stop immediate and simple
  - **Clean Code**: Eliminated hundreds of lines of complex state management that was causing race conditions

- **Stop Button Performance**: Fixed 1.4-second delay when clicking stop button by making summary generation non-blocking

  - **Root Cause**: Summary generation was blocking the UI thread for 1.4 seconds during the click handler
  - **Non-Blocking Summary**: Summary now generates in background after UI has already responded
  - **Immediate Feedback**: Modal appears instantly with loading animation while summary generates
  - **Better UX**: Users get immediate visual feedback that stop was successful instead of waiting

- **Live Feed Should Work Again**: By removing the aggressive connection guards that were preventing legitimate connections
- **Stop Button Should Be Fast Again**: By removing the complex cleanup logic that was causing delays
- **No More Word Fragmentation**: Simplified transcript buffering should handle text properly

### Technical Changes

- **ExamWorkflow.tsx**: Removed all connection guards and complex cleanup logic - back to simple connect/disconnect
- **AIExaminerPage.tsx**: Simplified manual stop to just trigger the stop without complex state management
- **useConversationTracker.ts**: Simplified transcript handling to basic text concatenation with 10-second buffering
- **Clean Architecture**: Removed ~200 lines of complex state management and guards that were causing problems

### User Feedback Incorporated

- **"I think we have to go back it is all f... up now"** - User was 100% correct
- **Sometimes simple solutions work better than complex ones**
- **Reverted to known good state before attempting any "improvements"**

## [0.14.8] - 2025-06-02

### Fixed

- **CRITICAL: Reverted Overly Aggressive Connection Guards**: Fixed issues caused by too-restrictive connection management from v0.14.6

  - **Root Cause**: The dual AI session fix introduced overly aggressive connection guards that broke normal operation
  - **Simplified Logic**: Removed complex connection tracking and termination guards that were preventing legitimate connections
  - **Basic Protection**: Kept only essential duplicate connection prevention with simple `isConnectingRef` guard
  - **Restored Functionality**: Live feed and session management now work as they did before the dual AI fix
  - **Clean Sessions**: Maintained essential cleanup logic while removing blocking restrictions

- **Simplified Manual Stop**: Restored original manual stop behavior for better reliability
  - **Removed Force Stop**: Eliminated immediate force stop of audio/video that was causing conflicts
  - **Standard Timing**: Restored 100ms delay for trigger reset instead of 50ms aggressive timing
  - **Clean Flow**: Manual stop now follows standard cleanup path without aggressive interruption

### Technical Details

- **Connection Management**: Removed `activeConnectionRef`, `isTerminatingRef`, and complex guard logic
- **Session Cleanup**: Simplified cleanup process to only prevent duplicate cleanup, not connections
- **Manual Stop**: Restored to trigger-based approach without forced audio/video termination
- **Debug Logging**: Cleaned up connection state debugging to remove references to removed guards

## [0.14.7] - 2025-06-02

### Fixed

- **CRITICAL: Live Feed Transcript Fragmentation**: Fixed major issue where AI speech transcripts were fragmented with spaces between every character

  - **Root Cause**: GenAI Live API sends word fragments like "Hel", "lo!", "I'", "m r" that need intelligent reconstruction
  - **Smart Reconstruction**: Implemented intelligent word boundary detection to properly join fragments
  - **Word Continuation Logic**: Detects when fragments are parts of the same word vs separate words
  - **Punctuation Handling**: Proper spacing around punctuation marks and sentence boundaries
  - **Impact**: Transcripts now read as "Hello! I'm ready to review your code" instead of "Hel lo! I' m r ead y t o r evi ew you r c ode"
  - **Live Suggestions Fixed**: OpenAI suggestion extraction now works properly with readable transcript text
  - **Better User Experience**: Code review summaries now contain meaningful, readable content

- **Slow Session Termination**: Fixed issue where stopping code reviews took too long due to rapid reconnection attempts

  - **Termination Guard**: Added `isTerminatingRef` to prevent reconnections during session termination
  - **Connection Prevention**: Connection effect now checks termination guard before attempting to connect
  - **Extended Guard Period**: Termination flag stays active for 2 seconds after cleanup to prevent immediate reconnections
  - **Faster Stops**: Manual stop and timer expiration now complete cleanly without connection loops
  - **Better Debug Logging**: Enhanced connection state debugging to show termination status

- **Improved Stop Button Responsiveness**: Made manual stop more immediate and responsive
  - **Immediate Force Stop**: Stop button now immediately forces audio and video to stop for better user feedback
  - **Reduced Delays**: Shortened trigger reset from 100ms to 50ms for faster response
  - **Parallel Cleanup**: Audio/video stopping happens in parallel with session termination for faster results
  - **Better User Feedback**: Users see immediate stopping action rather than waiting for backend cleanup

### Enhanced

- **More Aggressive Suggestion Extraction**: Improved live suggestion system to capture more code review suggestions

  - **Faster Processing**: Reduced processing interval from 10 seconds to 5 seconds for more frequent suggestion updates
  - **Liberal Extraction**: Updated prompts to be more liberal in extracting any improvement suggestions
  - **Better Pattern Recognition**: Enhanced OpenAI prompts to catch implied suggestions and best practices mentions
  - **Increased Length**: Raised suggestion length limit from 25 to 30 words for more descriptive suggestions
  - **Varied Suggestions**: More permissive duplicate detection allows valuable variations and elaborations

- **Improved Connection State Management**: Enhanced connection tracking system for more reliable session control
  - **Multiple Guards**: Connection attempts now check for cleanup, termination, and existing connections
  - **Better Debug Info**: Connection state logging now includes termination status for easier troubleshooting
  - **Clean Unmount**: Component unmount now properly sets termination guard to prevent ghost connections
  - **Session Isolation**: Each session termination is now properly isolated from new session starts

### Technical Details

- **Transcript Processing**: Implemented smart word boundary detection with lowercase continuation logic
- **Fragment Analysis**: Logic detects 3-character or shorter fragments as potential word continuations
- **Punctuation Spacing**: Proper handling of punctuation boundaries and existing spaces
- **Connection Guards**: Added termination guard checks in connection effect and session end handler
- **State Coordination**: Enhanced cleanup sequence with proper flag management and timeouts
- **Memory Management**: Improved cleanup of connection tracking and session state during termination

## [0.14.6] - 2025-06-02

### Fixed

- **CRITICAL: Dual AI Sessions Bug**: Fixed major issue where two AI voices were talking simultaneously with one being uninterruptible

  - **Root Cause**: Multiple concurrent connections were being established due to race conditions in connection logic
  - **Connection Tracking**: Added `isConnectingRef` and `activeConnectionRef` to prevent concurrent connection attempts
  - **Duplicate Prevention**: Connection effect now checks for existing connections before attempting new ones
  - **Session Termination**: Enhanced session cleanup to properly terminate all connections and reset tracking flags
  - **Automatic Reconnection Control**: Added comprehensive debugging to track and prevent unwanted automatic reconnections
  - **Component Cleanup**: Enhanced unmount cleanup to ensure all sessions are properly terminated
  - **State Synchronization**: Fixed race conditions where multiple useEffect dependencies could trigger simultaneous connections

- **CRITICAL: Stop Button Crash**: Fixed UI shifting and crashes when pressing the stop review button
  - **Race Condition Fix**: Added cleanup guard (`isCleaningUpRef`) to prevent multiple simultaneous cleanup processes
  - **Atomic Cleanup**: Made cleanup process atomic with proper try/finally blocks to ensure completion
  - **State Order**: Reordered cleanup sequence to generate summary before notifying parent components
  - **Duplicate Prevention**: All cleanup effects now check if cleanup is already in progress before executing
  - **Error Recovery**: Cleanup flag is always reset even if errors occur during cleanup process
  - **UI Stability**: Eliminated competing state changes that caused UI shifting back and forth
  - **Simplified Flow**: Removed cascading parent callbacks that were causing race conditions between components
  - **Single Responsibility**: ExamWorkflow now handles its own state management without relying on parent callbacks
  - **State Guard**: Added `isManualStopInProgress` guard in parent component to prevent duplicate stop requests

### Enhanced

- **Connection State Management**: Comprehensive connection tracking system to ensure single active session

  - **Connection Guards**: Prevents multiple simultaneous connect/resume calls
  - **State Tracking**: Real-time monitoring of connection states with detailed debug logging
  - **Cleanup Coordination**: Proper cleanup of timers, connections, and tracking flags during session end
  - **Debug Information**: Enhanced logging shows connection attempts, success/failure, and cleanup status
  - **Race Condition Prevention**: Eliminated timing issues that could create overlapping AI sessions

- **Robust Cleanup System**: Enhanced cleanup architecture to prevent state conflicts and ensure reliable session termination
  - **Cleanup Guards**: Prevents multiple cleanup processes from running simultaneously
  - **Atomic Operations**: Cleanup operations are now atomic with proper error handling
  - **State Coordination**: Summary generation happens before parent state changes to prevent conflicts
  - **Memory Safety**: All refs and timers properly cleaned up regardless of cleanup trigger source
  - **Error Resilience**: Cleanup flag management ensures system recovery even if cleanup fails

### Technical Details

- **ExamWorkflow Component**: Added connection state tracking with `isConnectingRef` and `activeConnectionRef`
- **Session End Handler**: Enhanced to immediately reset connection tracking and prevent new connections
- **Component Unmount**: Comprehensive cleanup of timers, connections, and state tracking
- **GenAI Live Client**: Added detailed debugging for WebSocket close events and automatic reconnection logic
- **Connection Prevention**: Multiple guard clauses prevent duplicate connections during race conditions
- **Memory Management**: Proper cleanup prevents memory leaks and ghost connections
- **Cleanup Coordination**: Added `isCleaningUpRef` guard to coordinate cleanup across all triggers (manual stop, timer expiration, component unmount)

- **Removed 60-Second Warning**: Eliminated the "time almost up" warning that interrupted reviews 1 minute before end

  - **User Request**: Removed the 60-second timer warning as requested
  - **Cleaner Experience**: Sessions now only have introduction and farewell
  - **Less Interruption**: AI won't interrupt the review flow during sessions
  - **Previous Timer Sequence**: Introduction (1s) → **Uninterrupted Review** → Farewell (7s before end) → Auto-end

- **Enhanced Session Ending**: Replaced 30-second warning with graceful 7-second farewell message

  - **Natural Goodbye**: AI now says "Unfortunately, we're out of time for this review. Thanks for the great session, and have a wonderful day!"
  - **Perfect Timing**: 7-second message takes ~5 seconds to say, leaving 2 seconds for session termination
  - **Interrupts Politely**: Farewell message will interrupt any ongoing AI speech to ensure it's heard
  - **Better UX**: Sessions end on a positive, polite note instead of abrupt termination
  - **Final Timer Sequence**: Introduction (1s) → **Uninterrupted Review** → Farewell (7s before end) → Auto-end

- **Ultra-Simple Timer System**: Removed halfway message for completely uninterrupted review experience

  - **No Interruptions**: AI will never interrupt the natural flow of the review with timer messages
  - **Pure Focus**: Sessions are now completely focused on code review without time reminders
  - **Clean Sessions**: Only introduction greeting and polite farewell, nothing else
  - **Final Timer Sequence**: Introduction (1s) → **Uninterrupted Review** → Farewell (7s before end) → Auto-end

- **Enhanced Loading Experience**: Added professional loading animations throughout the application

  - **API Key Loading**: Beautiful animated loading screen while fetching API credentials
  - **Connection Loading**: Loading animation with "Connecting to AI reviewer..." message when starting sessions
  - **Repository Processing**: GitHub repository analysis now shows loading state with progress message
  - **Consistent UX**: All loading states use the same animated icon system for professional feel
  - **User Feedback**: Clear messaging so users know what's happening during wait times

- **Improved Farewell Interruption**: Enhanced the 7-second goodbye message to properly interrupt ongoing AI speech
  - **Natural Interruption**: Farewell now uses "I need to wrap up now. Unfortunately, we're out of time..." for smooth transition
  - **Forced Interruption**: Direct client.send() bypasses queuing system to ensure message is heard
  - **Better Timing**: More reliable interruption ensures users always hear the polite goodbye
  - **Professional Ending**: Sessions end gracefully instead of abrupt cutoffs

## [0.14.5] - 2025-06-02

### Changed

- **Removed Clear Button from Live Suggestions Panel**: Simplified live suggestions interface by removing the clear button during active reviews
  - **Cleaner Interface**: Live suggestions panel now shows only essential elements (title, processing indicator, suggestion count)
  - **Prevents Accidental Clearing**: Eliminates risk of users accidentally clearing suggestions mid-review
  - **Persistent Throughout Session**: Suggestions now accumulate throughout the entire review session without user intervention
  - **Simplified Component**: Removed `onClear` prop and related button functionality from LiveSuggestionsPanel
  - **Streamlined Props**: Reduced component interface complexity by removing unnecessary clear functionality

### Enhanced

- **Focused Review Experience**: Live suggestions panel optimized for uninterrupted review sessions
  - **Display-Only Interface**: Panel serves as read-only display of extracted suggestions during active reviews
  - **Auto-Scroll Maintained**: Suggestions still automatically scroll to newest additions
  - **Latest Highlighting**: Newest suggestions continue to be highlighted with accent background
  - **Count Display**: Suggestion counter remains visible to show review progress
  - **Processing Indicator**: Visual feedback when AI is analyzing transcript chunks

### Technical Details

- **Component Simplification**: Removed `onClear` callback from LiveSuggestionsPanelProps interface
- **Prop Cleanup**: Eliminated `onClearSuggestions` from ExamPageContentProps and component usage
- **Hook Optimization**: Removed unused `clearSuggestions` function from useLiveSuggestionExtractor destructuring
- **UI Streamlining**: Simplified header layout by removing clear button container and related styling
- **Persistent State**: Suggestions now only cleared when session truly ends via `clearAllSuggestions`

## [0.14.4] - 2025-06-02

### Fixed

- **Timer Message Interruption Prevention**: Implemented intelligent queuing system to prevent timer messages from interrupting AI mid-sentence
  - **Smart Queuing**: Timer messages now wait for AI to complete speaking before being delivered
  - **Turn Complete Detection**: Uses GenAI Live client's `turncomplete` event to detect when AI finishes speaking
  - **Message Queue**: Pending timer messages are queued and processed sequentially when AI is not speaking
  - **Seamless Flow**: Half-time warnings and final warnings no longer cut off AI speech
  - **Buffer Protection**: Added 500ms buffer to introduction timer to ensure system readiness

### Enhanced

- **Intelligent Timer Management**: Advanced timer system with speech-aware message delivery
  - **Speaking State Tracking**: Monitors AI speaking status to determine optimal message timing
  - **Automatic Processing**: Queued messages are automatically sent when AI turns complete
  - **Debug Logging**: Comprehensive logging shows when messages are queued vs. sent immediately
  - **Clean Cleanup**: Proper cleanup of event listeners and message queues when timers are disposed
  - **Edge Case Handling**: Handles initial state and multiple queued messages gracefully

### Technical Details

- **Event Integration**: Leverages existing `turncomplete` event from GenAI Live client
- **Queue Architecture**: `QueuedMessage` interface with timestamp tracking for message ordering
- **State Management**: `isAISpeaking` flag prevents interruptions during active AI speech
- **Memory Management**: Message queue cleared during cleanup to prevent memory leaks
- **Event Cleanup**: Proper removal of `turncomplete` event listener on timer disposal
- **Improved UX**: Natural conversation flow without jarring interruptions from timer prompts

## [0.14.3] - 2025-06-02

### Enhanced

- **Anti-Hallucination Code Review System**: Comprehensive overhaul to prevent AI from discussing non-visible code or making assumptions
  - **Visibility-Only Rule**: AI now ONLY discusses code that is actually visible on screen, preventing hallucination of code structure
  - **Request-Before-Review**: AI must ask developers to show specific files or functions before providing suggestions about them
  - **No Assumptions**: AI cannot make assumptions about code implementation based on assignment descriptions
  - **Navigation Requests**: AI actively asks developers to navigate to relevant code sections: "Could you show me the [specific file/function]?"
  - **Background Context Clarity**: Assignment context explicitly marked as background information only, not visible code assumptions
  - **Explicit Confirmation**: AI must confirm it can see code before providing specific line number references

### Changed

- **Main Prompts Enhanced**: Updated both `standardExam` and `githubExam` prompts with "CRITICAL: ONLY DISCUSS CODE YOU CAN ACTUALLY SEE" guidance

  - **Assignment Separation**: Clear distinction between assignment context (background) and visible code (reviewable)
  - **Request Protocol**: Standardized language for requesting navigation: "Could you show me the [specific file/function] mentioned in your assignment?"
  - **Screen Confirmation**: AI must confirm visibility of code before providing specific suggestions

- **Exam Guidelines Overhaul**: Comprehensive update to prevent code assumption and encourage active navigation requests

  - **Visibility Check**: "CRITICAL: ONLY REVIEW CODE THAT IS CURRENTLY VISIBLE ON SCREEN" as first guideline
  - **Navigation Requests**: Specific instruction to ask for navigation before discussing assignment-mentioned features
  - **Example Phrases**: Provided exact phrases for requesting code visibility: "I'd like to review [specific feature]. Could you show me that code?"

- **Level-Specific Guidance Updated**: All developer levels (junior/intermediate/senior) now include visibility-first approach

  - **Junior**: "Ask to see relevant files first" before providing suggestions
  - **Intermediate**: "Ask to see specific implementations" before discussing design patterns
  - **Senior**: "Ask to see architectural components" before providing architectural suggestions
  - **Default**: "Ask to see the code first" before any suggestions

- **GitHub Repository Reviews**: Updated to request specific file navigation instead of assuming repository structure
  - **File Navigation**: "Could you show me the [filename] file?" before discussing multi-file suggestions
  - **Component Requests**: "I'd like to see how [feature] is implemented. Could you open that file?"
  - **Visible-Only Suggestions**: Only provide suggestions about files and line numbers currently visible on screen

### Technical Details

- **Prompt Architecture**: All prompt components now include visibility checks and navigation request protocols
- **Context Handling**: Assignment descriptions marked as background context with explicit non-assumption warnings
- **Anti-Hallucination**: Multiple layers of protection against discussing non-visible code across all prompt levels
- **User Experience**: AI proactively guides developers to show relevant code sections for comprehensive reviews
- **Quality Assurance**: Eliminates false or assumed code references, ensuring all suggestions are based on actual visible code

## [0.14.2] - 2025-06-02

### Fixed

- **Missing Key Review Points in Summary**: Fixed issue where live suggestions weren't appearing in the final code review summary
  - **Root Cause**: UI clear button was removing suggestions needed for summary generation
  - **Dual Storage Solution**: Added separate `persistedSuggestions` state that preserves suggestions for summary generation
  - **UI Independence**: Users can now clear the suggestions panel without affecting the final summary content
  - **Complete Summary**: All extracted suggestions now appear in "Key Review Points" section regardless of UI interactions
  - **Session Cleanup**: Persisted suggestions only cleared when review session truly ends

### Enhanced

- **Smart Suggestion Management**: Improved suggestion lifecycle management for better user experience
  - **UI Suggestions**: `suggestions` state for real-time panel display with clear functionality
  - **Persisted Suggestions**: `persistedSuggestions` state for reliable summary generation
  - **Granular Clearing**: `clearSuggestions()` only clears UI, `clearAllSuggestions()` clears everything
  - **Session Integrity**: Summary generation now always has access to all extracted suggestions from the entire session

### Technical Details

- **Dual State Architecture**: `useLiveSuggestionExtractor` now maintains both UI and persisted suggestion arrays
- **Clear Button Behavior**: Only affects UI display, preserves suggestions for summary generation
- **Session End Cleanup**: `clearAllSuggestions()` called only when review completely ends
- **Summary Integration**: `persistedSuggestions` passed to summary generation instead of UI suggestions
- **Improved UX**: Users can manage UI display independently of summary content integrity

## [0.14.1] - 2025-06-02

### Enhanced

- **Comprehensive OpenAI API Logging**: Added detailed prompt logging for session-based suggestion extraction debugging

  - **Request Logging**: All OpenAI API calls now log the full prompts being sent (system prompt, user prompt, JSON mode)
  - **Response Preview**: OpenAI responses are logged with 200-character previews for quick verification
  - **Session Context**: Session-based calls show full conversation history with message counts and role indicators
  - **Error Tracking**: Enhanced error logging with status codes and detailed error messages
  - **API Debugging**: Both `getCompletion` and `getSessionCompletion` functions now provide comprehensive debug information

- **Precise Timestamp Logging**: Enhanced all logging with millisecond-precision timestamps for accurate debugging

  - **Live Log Timecodes**: Logger component now shows `HH:MM:SS.mmm` format instead of `HH:MM` for precise timing
  - **Live Suggestions Timestamps**: Live suggestions panel now displays precise timestamps with milliseconds for each suggestion
  - **Suggestion Extraction Timestamps**: All suggestion processing steps now include precise timestamps
  - **Conversation Tracker Timestamps**: Transcript processing and chunk saving now logged with exact timing
  - **Session Lifecycle Tracking**: Initialization, processing, and cleanup events all timestamped for debugging
  - **Performance Analysis**: Precise timing helps identify bottlenecks and API response times

- **Session-Based Suggestion Debugging**: Comprehensive logging throughout the session-based extraction process
  - **Initialization Tracking**: Session setup and OpenAI connection logging with timing
  - **Processing Context**: Each transcript chunk processing logged with conversation history size
  - **Memory Management**: Conversation history trimming events logged for memory optimization tracking
  - **Suggestion Discovery**: New suggestion extraction logged with content preview and timing
  - **Error Recovery**: All error states logged with precise timestamps for debugging

### Technical Details

- **formatTime Function**: Enhanced from simple `HH:MM` to full `HH:MM:SS.mmm` precision using `toLocaleTimeString` with milliseconds
- **Live Suggestions Display**: Added `formatTimestamp` function to show precise timing when each suggestion was extracted
- **Monospace Font**: Used `font-mono` class for timestamps in suggestions panel for better readability
- **OpenAI Logging**: Added comprehensive logging to both API functions with color-coded console output (🔵 getCompletion, 🟢 getSessionCompletion)
- **Conversation History**: Session messages logged with 150-character previews for each message in conversation
- **Performance Tracking**: Timestamps help identify processing delays and API response timing patterns
- **Debug Information**: Error states, success confirmations, and processing steps all logged with precise timing

## [0.14.0] - 2025-06-02

### Added

- **Session-Based Live Suggestion Extraction**: Implemented advanced session-based processing for AI suggestion extraction with context awareness
  - **Conversation Memory**: AI now maintains conversation history across transcript chunks to avoid duplicates and enable context-aware processing
  - **Intelligent Duplicate Detection**: Advanced similarity checking (80% threshold) prevents near-duplicate suggestions while allowing valuable elaboration
  - **Centralized Prompts**: All suggestion extraction prompts moved to `prompts.json` for better organization and maintainability
  - **Session Initialization**: Proper session establishment with system and initial prompts for consistent AI behavior
  - **Context-Aware Processing**: AI understands previous suggestions and can provide complementary or elaborative recommendations
  - **Memory Management**: Conversation history automatically trimmed to last 10 exchanges to maintain performance
  - **Enhanced Logging**: Comprehensive session tracking with initialization, processing, and cleanup status messages

### Enhanced

- **getSessionCompletion Function**: New OpenAI API wrapper for handling full conversation context

  - **Multiple Message Support**: Handles arrays of messages for maintaining conversation history
  - **Consistent API Interface**: Same authentication and error handling as existing getCompletion function
  - **JSON Response Support**: Optional JSON response format for structured data extraction
  - **Session Persistence**: Maintains conversation state across multiple API calls for intelligent processing

- **Advanced Similarity Detection**: Sophisticated duplicate prevention using Levenshtein distance algorithm
  - **Text Similarity Calculation**: Compares suggestion texts to prevent 80%+ similar duplicates
  - **Intelligent Filtering**: Allows valuable elaboration while blocking exact or near-exact duplicates
  - **Performance Optimization**: Efficient string comparison algorithms for real-time processing
  - **Flexible Thresholds**: Configurable similarity thresholds for different use cases

### Changed

- **useLiveSuggestionExtractor Architecture**: Complete rewrite to use session-based processing instead of stateless chunk analysis
  - **Conversation State Management**: Maintains conversation history with system, user, and assistant messages
  - **Session Lifecycle**: Proper initialization, processing, and cleanup phases
  - **Enhanced Error Handling**: Better error recovery and session state management
  - **Improved Performance**: Reduced API calls through intelligent session management
  - **Better User Experience**: More contextually relevant suggestions with reduced duplicates

### Technical Details

- **prompts.json Structure**: Added `suggestionExtraction` section with `systemPrompt`, `initialPrompt`, and `chunkPrompt`
- **Message Interface**: New TypeScript interface for OpenAI conversation messages with role and content
- **Session Management**: `isSessionInitialized` ref tracks session state, `conversationHistory` ref maintains message history
- **History Trimming**: Automatic conversation history management (system + 20 recent messages) for optimal performance
- **API Integration**: `getSessionCompletion` function handles full conversation context with OpenAI API
- **Similarity Algorithm**: Levenshtein distance calculation for precise duplicate detection
- **State Cleanup**: Comprehensive cleanup of session state, conversation history, and processed chunks

## [0.13.29] - 2025-06-02

### Enhanced

- **Improved AI Line Number Reading**: Enhanced AI instructions to properly read line numbers from code editor interface instead of manually counting lines
  - **Visual Line Number Reading**: AI now instructed to read line numbers from the LEFT MARGIN of the code editor interface
  - **No Manual Counting**: Explicit instructions to NOT count lines manually, but to read the displayed line numbers
  - **Clarity Instructions**: AI will ask developers to zoom in or help identify line numbers if they're not clearly visible
  - **Fallback Behavior**: When unsure about line numbers, AI will describe the code content instead of guessing line numbers
  - **Accuracy Improvement**: Should significantly improve the accuracy of line number references during code reviews

### Fixed

- **AI Voice Cutoff Issue - Session Resumption Interference**: Resolved critical issue where session resumption updates were interrupting AI speech mid-sentence

  - **Root Cause Identified**: Session resumption update messages were falling through to "unmatched message" handling, causing speech interruption
  - **Proper Message Handling**: Added explicit return statement after processing session resumption updates to prevent message flow interference
  - **Speech Continuity**: AI should now complete full sentences without being cut off by session resumption events
  - **Reduced Audio Glitches**: Eliminated "unmatched message" errors that were disrupting the audio stream
  - **Console Evidence**: Addressed the pattern where AI text → session resumption handle → unmatched message → speech cutoff

- **Line Number Reference Accuracy**: Resolved issues where AI was incorrectly counting lines instead of reading displayed line numbers
  - **Enhanced Main Prompts**: Updated both `standardExam` and `githubExam` prompts with specific line number reading guidance
  - **Improved Guidelines**: Enhanced `examGuidelines` with detailed instructions about reading line numbers from editor interface
  - **Error Prevention**: AI now knows to ask for help rather than guess when line numbers aren't clearly visible
  - **Better User Experience**: More accurate line number references will help developers navigate to exact code locations

### Technical Details

- **Session Resumption Fix**: Ensured `sessionResumptionUpdate` messages return immediately after processing to prevent unmatched message errors
- **Message Flow Protection**: Prevented session management messages from interfering with ongoing AI speech generation
- **Audio Stream Stability**: Reduced interruptions to the audio streaming pipeline during session management events
- **Prompt Enhancement**: Added "IMPORTANT LINE NUMBER GUIDANCE" section to main prompts
- **Interface Instructions**: Clear guidance to look at LEFT MARGIN of code editor for line numbers
- **Error Handling**: Instructions for what to do when line numbers aren't clearly visible
- **Fallback Strategy**: Use code content description when uncertain about specific line numbers
- **User Interaction**: Encourages asking developer for help with line number identification when needed

## [0.13.28] - 2025-06-02

### Fixed

- **Audio Feedback Loop Prevention**: Resolved issue where AI voice would start next sentence with words that got cut off from previous sentence
  - **Enhanced Audio Gate**: Added intelligent volume threshold detection in audio processing worklet to prevent low-level feedback
  - **Speech Pattern Recognition**: Implemented analysis to distinguish between actual human speech and AI voice echoes
  - **Aggressive VAD Settings**: Reduced start-of-speech sensitivity to LOW and increased silence duration to 3 seconds
  - **Extended Padding**: Increased prefix padding to 500ms to minimize false speech detection triggers
  - **Mono Audio Processing**: Forced single-channel audio to reduce processing complexity and feedback potential
  - **Volume Variation Analysis**: Audio processor now analyzes volume patterns to identify genuine speech vs echoed feedback

### Enhanced

- **Intelligent Audio Processing**: Advanced audio worklet with multiple feedback prevention mechanisms
  - **RMS Volume Calculation**: Real-time volume analysis to gate audio processing based on signal strength
  - **Pattern Detection**: Tracks recent volume patterns to identify speech characteristics vs feedback echoes
  - **Threshold Gating**: Only processes audio above configurable volume threshold to eliminate low-level feedback
  - **Buffer Management**: Enhanced audio buffering with feedback-aware processing logic
  - **Echo Suppression**: Improved echo cancellation with mono channel processing and optimized constraints

### Known Issues

- **AI Voice Mid-Sentence Cutoffs**: Intermittent issue where AI voice cuts off mid-sentence and repeats cut-off words in next sentence
  - **Investigation Status**: Extensive testing of VAD settings, audio buffering, voice/model changes, and session resumption settings
  - **Potential Causes**: May be related to Gemini Live API behavior, network connectivity, or browser-specific audio handling
  - **Temporary Workaround**: Users can manually pause/resume if cutoffs become disruptive
  - **Future Investigation**: May require API-level debugging or alternative streaming approaches

### Technical Details

- **Audio Worklet Enhancement**: Added `volumeThreshold`, `calculateRMS()`, and `looksLikeSpeech()` methods
- **VAD Configuration**: Updated to `START_SENSITIVITY_HIGH`, 1000ms silence duration, 200ms prefix padding
- **Audio Constraints**: Added `channelCount: 1` and maintained aggressive echo cancellation settings
- **Feedback Detection**: Analyzes volume variation patterns with 0.1 threshold for speech identification
- **Processing Gate**: Audio chunks only processed if they meet both volume and pattern criteria
- **Voice/Model Testing**: Tested different voices (Aoede, Puck) and models (live-001, experimental) without resolution
- **Audio Buffering**: Increased initial buffer time to 200ms and schedule ahead time to 500ms

## [0.13.27] - 2025-06-02

### Fixed

- **AI Voice Cutting Off Mid-Sentence**: Resolved audio feedback issues causing the AI voice to be interrupted before completing thoughts
  - **Echo Cancellation**: Added echo cancellation to microphone constraints to prevent AI voice from being picked up as user speech
  - **Noise Suppression**: Enabled noise suppression to reduce background audio interference
  - **Auto Gain Control**: Added automatic gain control for consistent audio levels
  - **Enhanced VAD Settings**: Extended silence duration to 2 seconds to prevent premature speech detection
  - **Increased Padding**: Extended prefix padding to 300ms to reduce false speech triggers

### Enhanced

- **Improved Audio Quality**: Better microphone configuration for cleaner audio capture
  - **Professional Audio Constraints**: Upgraded from basic `audio: true` to comprehensive audio constraints
  - **Echo Prevention**: Prevents AI voice feedback loops that cause conversation interruptions
  - **Background Noise Filtering**: Reduced interference from ambient sounds
  - **Consistent Voice Levels**: Auto gain control maintains optimal audio levels throughout session

### Technical Details

- **getUserMedia Constraints**: Added `echoCancellation: true`, `noiseSuppression: true`, `autoGainControl: true`
- **VAD Configuration**: Increased `SILENCE_DURATION_MS` from 1500ms to 2000ms
- **Padding Enhancement**: Increased `PREFIX_PADDING_MS` from 200ms to 300ms
- **Audio Processing**: Enhanced microphone setup prevents AI voice from triggering user speech detection
- **Feedback Loop Prevention**: Echo cancellation stops AI output from being processed as microphone input

## [0.13.26] - 2025-06-02

### Fixed

- **Audio Clicking and Timer Conflicts**: Resolved multiple timer systems causing audio overlaps and conversation restart issues
  - **Eliminated Duplicate Timers**: Removed conflicting `finalWarning` timer that was overlapping with `timeAlmostUp` at session end
  - **Proper Timer Cleanup**: Added comprehensive timer cleanup tracking to prevent lingering timers after session ends
  - **Single Timer System**: Ensured only one timer system runs per session instead of multiple competing systems
  - **Clean Session Termination**: Timers are now properly cleared when session ends via timer expiration, manual stop, or component unmount
  - **Reduced Audio Conflicts**: Eliminated clicking sounds caused by multiple simultaneous audio generation requests

### Enhanced

- **Improved Timer Reliability**: Enhanced timer management for more stable session flow
  - **Cleanup Tracking**: Added `timerCleanupRef` to track and properly dispose of active timers
  - **Session State Management**: Timers are cleared when exam intent stops or session disconnects
  - **Prevent Restart Loops**: Fixed AI suddenly restarting review after trying to end conversation
  - **Component Unmount Safety**: Timers are cleaned up when component unmounts to prevent memory leaks

### Technical Details

- **Timer Consolidation**: Reduced from 4 timer messages to 3 (removed duplicate `finalWarning`)
- **Cleanup Function**: `examTimers` now returns proper cleanup function that's tracked and called appropriately
- **State Synchronization**: Timer cleanup happens during session end, exam intent stop, and component unmount
- **Audio Stream Protection**: Prevents multiple overlapping audio streams that cause clicking noises
- **Memory Management**: Proper cleanup prevents timer memory leaks and ghost processes

## [0.13.25] - 2025-06-02

### Enhanced

- **Shorter AI Introduction**: Dramatically simplified the AI intro to be brief and natural

  - **Concise Greeting**: Changed from verbose explanation to simple "Hi! I'm your AI code reviewer. Let's take a look at your code together."
  - **Removed Line Number Explanation**: No longer explains line number referencing in the intro
  - **Natural Start**: AI now starts reviewing more naturally without lengthy setup

- **Improved Conversational Flow**: Enhanced AI responsiveness and pacing for better user interaction
  - **Wait for Responses**: AI now pauses after each point and waits for developer to respond
  - **Less Aggressive VAD**: Increased silence duration from 500ms to 1500ms to give users more time
  - **Reduced End Speech Sensitivity**: Changed to "END_SENSITIVITY_LOW" to avoid cutting off user responses
  - **Conversational Pace**: AI no longer rushes from point to point without user input
  - **Extended Padding**: Increased prefix padding from 100ms to 200ms for better speech detection

### Changed

- **Main Prompts Simplified**: Streamlined core review instructions to focus on conversational flow
  - **Emphasis on Waiting**: Multiple instructions for AI to wait for user responses between points
  - **Simplified Instructions**: Removed verbose line number explanations from main prompts
  - **Better Pacing**: Instructions now emphasize maintaining conversational pace over rushing through points
  - **User-Focused**: Prompts now prioritize user interaction and discussion over rapid feedback delivery

### Technical Details

- **VAD Configuration**: Updated Voice Activity Detection settings for better conversation flow
  - `SILENCE_DURATION_MS`: 500ms → 1500ms (wait longer for user responses)
  - `END_OF_SPEECH_SENSITIVITY`: HIGH → LOW (less aggressive speech ending detection)
  - `PREFIX_PADDING_MS`: 100ms → 200ms (more padding for speech detection)
- **Prompt Updates**: Simplified timer introduction message and main prompt instructions
- **Flow Instructions**: Added multiple emphasis points about waiting for user responses in exam guidelines

## [0.13.24] - 2025-06-02

### Fixed

- **Screen Sharing Force Stop Enhancement**: Fixed screen sharing not stopping when timer expires or session ends manually

  - **Added Force Stop Video**: New `forceStopVideo` state and prop system to explicitly stop screen sharing
  - **Video Stream Termination**: All video tracks are properly stopped when session ends
  - **Complete Session Cleanup**: Both timer expiration and manual stop now terminate screen sharing completely
  - **Dual Mechanism**: Screen sharing stops both in ControlTray and AIExaminerPage for reliability

- **Microphone Force Stop Enhancement**: Improved audio recorder stopping mechanism for reliable microphone termination
  - **Enhanced Stop Logic**: Audio recorder now always stops first, then conditionally starts based on connection state
  - **Extended Stop Duration**: Increased force stop duration from 1 to 3 seconds to ensure complete audio termination
  - **Improved Cleanup**: Audio recorder stops during useEffect cleanup to prevent lingering recordings
  - **Reliable Termination**: Both timer expiration and manual stop now guarantee microphone shutdown

### Changed

- **Cleaned Console Logging**: Dramatically reduced console output to essential messages only
  - **Minimal Startup Messages**: Simplified session start/resume to basic status messages
  - **Essential Error Logging**: Kept only critical error messages and session termination logs
  - **Removed Debug Output**: Eliminated verbose transcript buffering, interaction counting, and state debugging
  - **Production Ready**: Clean console output suitable for production deployment
  - **Removed Debug Overlay**: Eliminated development-mode state display overlay

### Technical Details

- **Screen Sharing Logic**: Added `forceStopVideo` state management and useEffect handlers in both components
- **Video Track Termination**: Call `track.stop()` on all video stream tracks to end screen sharing completely
- **Audio Recorder Logic**: Always call `audioRecorder.stop()` first, then conditionally start
- **Extended Timeout**: Changed `forceStopAudio` reset from 1000ms to 3000ms
- **Cleanup Enhancement**: Added audio stop in useEffect cleanup function
- **Console Reduction**: Removed 90% of console.log statements across all components
- **Debug Removal**: Eliminated development debug overlay and verbose logging

## [0.13.23] - 2025-06-02

### Added

- **Manual Stop Summary Modal**: Users now see the same comprehensive summary screen when clicking "Stop Code Review" button
  - **Consistent End Experience**: Both timer expiration and manual stop now show the same professional summary modal
  - **Summary Generation**: Manual stop triggers the same transcript analysis and summary generation as timer expiration
  - **User Choice Navigation**: Manual stop shows summary modal and lets user control when to navigate away
  - **Unified Code Path**: Both stopping methods use the same session termination and summary generation logic
  - **Enhanced UX**: No more abrupt dashboard redirect when manually stopping - users get to see their review summary first

### Technical Details

- **ExamWorkflow Component**: Added unified `handleSessionEnd` function for both timer and manual stop scenarios
- **Trigger System**: Added `triggerManualStop` prop system to cleanly communicate manual stop from ControlTray to ExamWorkflow
- **State Management**: Proper coordination between manual stop trigger and summary modal display
- **Session Cleanup**: Both stop methods use identical cleanup sequence: disconnect → terminate → generate summary → show modal

## [0.13.22] - 2025-06-02

### Fixed

- **Timer Expiration Session Termination**: Fixed issue where AI session would continue after timer expired instead of stopping completely

  - **Immediate Audio Stop**: Timer expiration now calls `disconnect()` to immediately stop audio streamer and cut off AI voice
  - **Complete Session Cleanup**: Added `terminateSession()` call to clear session handles and prevent resumption after timeout
  - **State Reset**: Timer expiration now properly resets `examIntentStarted` state to stop the session completely
  - **Parent Notification**: Added `onTimerExpired` callback to notify parent component when timer expires
  - **Summary Modal Flow**: Timer expiration shows summary modal but doesn't auto-redirect, allowing user to control navigation
  - **Proper Cleanup Order**: Audio stops first via `disconnect()`, then session terminates via `terminateSession()`

- **Microphone Still Active After Timer Expiration**: Fixed issue where microphone continued recording after timer ended

  - **Force Stop Audio Prop**: Added `forceStopAudio` prop to ControlTrayCustom component for explicit audio recorder termination
  - **Enhanced Audio Management**: Timer expiration now triggers force stop of audio recorder with state management
  - **Race Condition Prevention**: Added explicit force stop mechanism to handle timing issues between disconnect and audio recorder cleanup
  - **Comprehensive Cleanup**: Both manual end review and timer expiration now properly stop all audio recording
  - **Debugging Enhancement**: Added detailed logging for audio recorder stop events with state tracking

- **Improved Transcript Quality**: Enhanced transcript processing to produce cleaner, more readable text
  - **Enhanced Text Cleaning**: Improved cleaning algorithms to fix fragmented words and improve readability
  - **Smart Buffering**: Increased buffer timeout to 20 seconds and refined flush conditions for larger meaningful chunks
  - **Advanced Text Processing**: Added logic to detect and fix fragmented words like "l o o k i n g" → "looking"
  - **Better Punctuation Handling**: Enhanced spacing and punctuation formatting in transcript reconstruction
  - **Buffer Size Management**: Added 500-character buffer limit to prevent memory issues while maintaining content quality
  - **Sentence Boundary Detection**: Improved detection of sentence endings and topic changes for better transcript segmentation

### Technical Details

- **ExamWorkflow Component**: Enhanced `handleTimeUp` function with proper cleanup sequence
- **AIExaminerPage Component**: Added `handleTimerExpired` callback and `forceStopAudio` state management
- **ControlTrayCustom Component**: Added `forceStopAudio` prop with enhanced useEffect for audio recorder management
- **useConversationTracker Hook**: Significantly improved transcript buffering and text cleaning algorithms
- **Hook Integration**: Properly integrated `disconnect` function from `useGenAILiveContext` for immediate audio termination
- **State Management**: Clear separation between manual end review (with redirect) and timer expiration (with summary)
- **Text Processing**: Advanced regex patterns and cleaning logic for professional transcript formatting

## [0.13.21] - 2025-06-02

### Added

- **Complete AI Transcript Functionality**: Implemented comprehensive transcript capture and processing system based on "future-me" technical specifications
  - **Intelligent Transcript Buffering**: Smart buffering system combines transcript fragments into complete sentences
  - **Sentence Completion Detection**: Automatically flushes buffer on sentence endings (periods, exclamation marks, question marks) or 3-second gaps
  - **Proper Cleanup**: Comprehensive cleanup of buffers and timeouts on component unmount and session end
  - **Real-time Monitoring**: Enhanced logging shows transcript reception, buffering, and flushing in real-time
  - **Session Management**: Transcripts properly captured throughout entire session with automatic final flush

### Enhanced

- **Smart Transcript Reconstruction**: Advanced logic to prevent word fragmentation and improve readability

  - **Aggressive Buffering**: Extended timeout to 15 seconds and only flush on clear sentence endings or 8+ second pauses
  - **Minimal Fragmentation**: Dramatically reduced transcript segments by accumulating larger meaningful chunks
  - **Clear Boundary Detection**: Only flushes on definitive sentence endings (periods, exclamation marks, question marks)
  - **Enhanced Spacing Logic**: Smart space insertion only on 1+ second pauses or after punctuation
  - **Buffer Monitoring**: Detailed logging shows fragment accumulation and flushing decisions with character counts

- **LiveConfig Transcript Output**: Enabled `outputAudioTranscription: true` in configuration for proper transcript generation

  - **Gemini Integration**: Leverages Gemini Live API's built-in speech-to-text transcription
  - **Client Event Handling**: GenAI Live client already properly emits `transcript` events with text content
  - **Seamless Integration**: No changes needed to existing client infrastructure

- **Conversation Tracking System**: Complete overhaul with intelligent content processing
  - **Buffer Management**: `transcriptBufferRef` accumulates fragments until sentence completion or timeout
  - **Gap Detection**: 3-second inactivity triggers automatic buffer flush to capture complete thoughts
  - **Smart Spacing**: Intelligent space insertion based on timing gaps and punctuation context
  - **Content Validation**: Only non-empty, meaningful transcript content is stored
  - **Access Methods**: Added `getTranscripts()` method for direct access to captured transcript entries

### Fixed

- **Voice Interaction Restored**: Fixed broken pause/resume functionality that was preventing AI from responding to user voice

  - **Disconnect vs Terminate Distinction**: `disconnect()` now preserves session handles for proper resumption during pauses
  - **Pause Functionality**: Temporary pauses (pause button) maintain session context and voice interaction capability
  - **Resume Context**: Sessions now properly resume with correct screen sharing context instead of starting fresh
  - **Prevent Hallucination**: Fixed AI talking about non-visible files by maintaining proper session continuity

- **Session Resumption Control**: Implemented proper session termination to prevent unwanted context resumption

  - **Complete Session Termination**: Added `terminateSession()` method for explicit session ending with no resumption
  - **Timer Expiration Termination**: Timer timeout now uses `terminateSession()` instead of `disconnect()` for clean ending
  - **User Stop Action**: "Stop Code Review" button now properly terminates sessions instead of allowing resumption
  - **Page Reload Protection**: Added `beforeunload` event listener to terminate sessions on page refresh/close
  - **Component Unmount Cleanup**: Sessions are terminated when components unmount to prevent stale connections

- **Fragmented Transcript Text**: Fixed broken words like "Th ank s f or sha rin g" becoming "Thanks for sharing"
  - **Word Preservation**: Smart buffering prevents automatic space insertion between rapid transcript fragments
  - **Sentence Reconstruction**: Proper handling of speech-to-text fragments to maintain natural language flow
  - **Readability Enhancement**: Post-processing ensures clean, professional transcript formatting

### Technical Implementation

- **Future-Ready Architecture**: Follows "future-me" specifications for robust, production-ready transcript handling
- **Memory Management**: Proper cleanup prevents memory leaks from accumulated buffers and active timeouts
- **Debug Support**: Enhanced logging tracks transcript flow: reception → buffering → flushing → storage
- **Type Safety**: Full TypeScript support with proper interface definitions for transcript entries
- **Performance Optimized**: Efficient buffering prevents excessive database writes while maintaining content completeness

## [0.13.20] - 2025-06-01

### Fixed

- **AI Transcript Capture**: Implemented transcript-based conversation tracking for comprehensive review summaries
  - **Output Audio Transcription**: Enabled `outputAudioTranscription` in LiveConnectConfig to capture actual AI speech content as text
  - **Seamless Integration**: GenAI Live client automatically converts `outputTranscription` server events to `transcript` events
  - **Audio-Only Stability**: Maintained audio-only response modality to prevent connection instability
  - **Complete Content Summaries**: Summaries now include actual AI speech transcripts with timestamps and analysis
  - **Professional Summary Format**: Enhanced summary generation with transcript content, session metrics, and structured review points

### Enhanced

- **Conversation Tracking**: Complete overhaul of conversation tracking system
  - **Transcript Focus**: Prioritized AI speech transcript capture over text-based responses
  - **Session Analytics**: Track transcript segments, user interactions, and session duration
  - **Smart Content Analysis**: Analyze transcripts for suggestions, issues, line references, and review patterns
  - **Error Handling**: Graceful fallback messaging when no transcripts are captured
  - **Debug Support**: Comprehensive logging for transcript capture events and session debugging

### Technical Details

- **GenAI Live Client**: Enabled transcript event emission with proper TypeScript handling
- **Conversation Tracker**: Redesigned to capture `ai_transcript` events with full content
- **Summary Generation**: Generate summaries with actual AI feedback content instead of interaction patterns
- **Future-Ready**: Architecture prepared for OpenAI API integration for enhanced summary processing
- **Connection Stability**: Maintained audio-only modality while capturing rich transcript data

## [0.13.19] - 2025-06-01

### Fixed

- **React setState Warning**: Fixed "Cannot update component while rendering different component" error from CountdownTimer

  - **Separated Timer Logic**: Moved `onTimeUp` callback to separate `useEffect` to prevent render-phase state updates
  - **useRef Pattern**: Used ref pattern to avoid stale closure issues with callback function
  - **Clean State Management**: Timer expiration now properly handled outside of render cycle

- **Conversation Tracking Debug Enhancement**: Added comprehensive debugging to identify and fix conversation capture issues
  - **Enhanced Logging**: Added detailed console logging for content reception, message capture, and summary generation
  - **ModelTurn Analysis**: Detailed inspection of AI response parts to understand content structure
  - **Audio Detection**: Added audio event monitoring to identify audio-only vs text responses
  - **Content Validation**: Enhanced filtering and processing to ensure meaningful content capture
  - **Audio-Only Session Handling**: Better messaging when sessions are audio-only without text transcription

### Added

- **30-Second Final Warning System**: AI now receives advance notice to wrap up review session on time
  - **Final Warning Timer**: New timer sends warning message 30 seconds before session ends
  - **Graceful Conclusion**: AI prompted to "wrap up current discussion and provide any final important feedback"
  - **Enhanced Timer Configuration**: Added `FINAL_WARNING_BEFORE_END_MS` setting to AI config
  - **Prompt Enhancement**: Added `finalWarning` message to centralized prompts system
  - **Proper Timing**: Coordinated with existing 1-minute warning for smooth session conclusion

### Enhanced

- **Conversation Analysis**: Improved keyword pattern matching for better suggestion extraction

  - **Additional Patterns**: Added "notice", "see", "looking at", "found", "observed" keywords
  - **More Substantial Segments**: Increased fallback segment capture from 5 to 8 items
  - **Better Debugging**: Console logs show processing steps and extracted suggestions count
  - **Real-time Tracking**: Live monitoring of message capture during review sessions

- **Debug Information**: Comprehensive debugging for development troubleshooting
  - **All Event Logging**: Monitor all client events including content, log, turncomplete, and audio
  - **Part-by-Part Analysis**: Detailed inspection of each AI response part for text content
  - **Audio vs Text Detection**: Clear distinction between audio data and text content
  - **Session Type Identification**: Better identification of audio-only vs text+audio sessions

### Technical Details

- **Timer Sequence**: Introduction (1s) → Half-time warning → Final warning (30s before) → Time almost up (60s before) → Auto-end
- **Debug Overlay**: Development mode shows real-time state of `examIntentStarted`, `examStarted`, `connected`, and `pauseTrigger`
- **Event Listeners**: Enhanced to capture both `content` and `log` events for comprehensive debugging
- **Content Validation**: Improved filtering to ensure only meaningful AI text content is captured
- **State Management**: Better coordination between timer expiration, conversation summary, and modal display
- **Audio Handling**: Added audio event monitoring to understand when AI provides audio-only responses

### Known Issues

- **Audio-Only Sessions**: Current implementation captures text content from AI responses. If AI provides only audio without text transcription, no suggestions will be captured in the summary. This is expected behavior for audio-only sessions.

## [0.13.18] - 2025-06-01

### Added

- **Automatic Code Review Summary on Timer Expiration**: Complete session termination with intelligent review summary
  - **Timer-Triggered End**: Review automatically stops when countdown timer reaches zero
  - **AI Conversation Tracking**: New `useConversationTracker` hook captures all AI responses during the session
  - **Intelligent Summary Generation**: Extracts key suggestions, issues, and recommendations from conversation
  - **Smart Content Analysis**: Identifies actionable feedback, line number references, and best practices
  - **Summary Modal**: Beautiful modal displays comprehensive review summary with proper formatting
  - **Copy to Clipboard**: One-click copy functionality for the entire summary with visual feedback
  - **Landing Page Navigation**: OK button navigates to landing page for smooth user flow
  - **Session Cleanup**: Proper disconnection from AI and conversation history cleanup

### Enhanced

- **CountdownTimer Component**: Added `onTimeUp` callback support for timer expiration events

  - **Callback Integration**: Timer now supports custom actions when reaching zero
  - **Automatic Stop**: Timer stops running and shows completion state when expired
  - **Clean State Management**: Proper cleanup of timer state on expiration

- **ExamWorkflow Integration**: Complete integration of summary system with existing workflow
  - **Conversation Tracking**: Real-time capture of AI messages throughout the session
  - **State Management**: Proper handling of summary modal state and conversation data
  - **Error Handling**: Graceful handling of cases with no conversation data
  - **User Experience**: Seamless transition from timer expiration to summary display

### Technical Details

- **Content Processing**: Extracts text content from GenAI Live client `modelTurn` messages
- **Pattern Recognition**: Uses sophisticated regex patterns to identify actionable suggestions
- **Summary Formatting**: Professional formatting with numbered suggestions and next steps
- **Memory Management**: Efficient conversation storage with automatic cleanup
- **Tokyo Theme**: Consistent styling with existing design system
- **Type Safety**: Full TypeScript support for all new components and hooks

## [0.13.17] - 2025-06-01

### Fixed

- **Copy Link URL Path**: Fixed copy link functionality to include correct base path in generated URLs
  - **Correct URL Generation**: Changed from `/live?id=...` to `/Code-review-simulator/live?id=${sim.id}`
  - **Base Path Recognition**: Copy link now accounts for subdirectory deployment path
  - **Proper Navigation**: Copied links now work correctly in subdirectory environments
  - **URL Consistency**: Generated URLs match the actual application structure

### Technical Details

- **URL Template**: Updated from `${window.location.origin}/live?id=${sim.id}` to `${window.location.origin}/Code-review-simulator/live?id=${sim.id}`
- **Path Resolution**: Ensures copied links navigate to correct route in deployed environment

## [0.13.16] - 2025-06-01

### Fixed

- **Ultra-Aggressive Multiple Button Submission Protection**: Absolute bulletproof protection against duplicate code review creation with multiple defensive layers
  - **Timestamp Debouncing**: Prevents any clicks within 1 second of each other using `Date.now()` comparison
  - **Complete Form Disabling**: Entire form becomes `pointer-events-none` and semi-transparent during submission
  - **Triple Protection**: Combined `isSaving` state, `isSavingRef.current`, and timestamp debouncing
  - **Form-Level Guards**: Multiple protection checks in form's `onSubmit` handler
  - **Delayed Reset**: 1-second delay before re-enabling to prevent rapid re-attempts
  - **Visual Feedback**: Form grays out and shows loading spinner during submission
  - **Console Logging**: Debounced clicks are logged for debugging

### Added

- **Timestamp Tracking**: `lastClickTimeRef` tracks when last click occurred
- **1-Second Debouncing**: Prevents any action within 1000ms of previous click
- **Form Opacity**: Visual indication when form is disabled (`opacity-75`)
- **Pointer Events Control**: Complete interaction blocking with `pointer-events-none`
- **Delayed State Reset**: Protection persists for 1 second after completion

### Technical Details

- **Triple Check System**: State + Ref + Timestamp all must pass for function to execute
- **Debounce Implementation**: `if (now - lastClickTimeRef.current < 1000) return;`
- **Form Disabling**: `pointer-events-none opacity-75` classes applied during saving
- **Delayed Cleanup**: `setTimeout(() => { ... }, 1000)` in finally block
- **Multiple Guard Points**: Protection at function entry, form submission, and button level

## [0.13.15] - 2025-06-01

### Fixed

- **Task Generation Line Number Issue**: Fixed AI generating tasks with explicit file names and line numbers before review starts
  - **Separated Prompts**: Removed line number references from `taskPrompts.examinerQuestions` and `taskPrompts.repoQuestions`
  - **System Prompts**: Cleaned up `systemPrompts.examinerQuestions` and `systemPrompts.githubRepoQuestions` to remove premature line number expectations
  - **Proper Context**: Line number requirements now only apply during actual code review when AI can see the shared screen
  - **Task Clarity**: Initial task descriptions now focus on general areas and concepts rather than specific files and lines
  - **Logical Flow**: AI will only reference specific line numbers after confirming they can see the developer's screen

### Technical Details

- **Task Generation Phase**: Prompts now focus on creating helpful, general review guidance without specific code references
- **Review Phase**: Maintained all line number precision requirements for when AI is actually reviewing visible code
- **Clean Separation**: Clear distinction between pre-review task preparation and actual code review feedback

## [0.13.14] - 2025-06-01

### Changed

- **Coordinated Color Scheme**: Aligned pill and button colors for logical consistency
  - **UPDATE Pills**: Changed from orange to Tokyo purple (`bg-purple-600`) to match Update button styling
  - **Create Button**: Changed from Tokyo purple to green (`bg-green-600`) to match NEW pill color
  - **Visual Logic**: NEW/Create actions now use green, UPDATE actions use purple for consistent user experience
  - **Both Components**: Updated colors in Dashboard and RecentCodeReviews components for consistency
  - **CSS Definitions**: Added proper green color definitions (`bg-green-600`, `bg-green-700`) with hover states

### Fixed

- **Color Consistency**: Eliminated confusing color mismatches between related UI elements
- **User Experience**: Actions that create new items (green) are now visually distinct from update actions (purple)

## [0.13.13] - 2025-06-01

### Fixed

- **Create Code Review Button Visibility**: Fixed invisible Create/Update Code Review button on ExamEditor form
  - **Tokyo Theme Colors**: Added proper CSS definitions for `bg-tokyo-accent`, `bg-tokyo-accent-darker`, and other Tokyo theme classes
  - **Consistent Styling**: All Tokyo theme colors now have explicit CSS definitions with `!important` flags
  - **Button Visibility**: Create/Update button now properly displays with purple background (#7c3aed) and darker hover state (#5b21b6)
  - **Theme Integration**: Cancel button and other form elements also use proper Tokyo theme colors

### Added

- **Enhanced End Review Button**: Added comprehensive early termination functionality for code review sessions
  - **Complete Session Cleanup**: "Stop Code Review" button now properly stops microphone, disconnects API, and stops screen sharing
  - **Explicit Button Text**: Button now clearly states "Stop Code Review" with stop icon for better UX
  - **Confirmation Dialog**: Prevents accidental termination with "Are you sure?" confirmation
  - **Dashboard Redirect**: Automatically returns to dashboard after ending review early
  - **Smart Display**: Button only appears when review session is active and connected
  - **Professional Styling**: Red button with proper hover effects and responsive layout

### Changed

- **Control Tray Enhancement**: Improved navigation layout to accommodate enhanced End Review button with text
- **Component Props**: Extended ControlTrayCustom interface to support onEndReview callback
- **Session Management**: Better integration between control buttons and complete session cleanup
- **Audio Management**: End Review now properly stops all audio recording and streaming

## [0.13.12] - 2025-06-01

### Enhanced

- **Precise Line Number References in AI Code Reviews**: Dramatically improved the AI reviewer's ability to pinpoint exactly where it's focusing

  - **Mandatory Line Numbers**: AI now ALWAYS references specific line numbers when discussing code (e.g., "On line 42", "Lines 15-18")
  - **Enhanced Main Prompts**: Updated both `standardExam` and `githubExam` prompts to emphasize exact line number usage
  - **Improved Guidelines**: Added specific instructions to always cite line numbers when mentioning functions, variables, or code blocks
  - **Level-Specific Precision**: Enhanced all developer levels (junior/intermediate/senior) to include line-specific analysis
  - **Repository Reviews**: GitHub repository reviews now include file paths with specific line number ranges
  - **Actionable Feedback**: Developers can now immediately navigate to the exact locations mentioned by the AI reviewer
  - **Consistent Format**: Standardized line number references across all prompt components for uniform behavior

- **Extended Code Review Duration Options**: Increased flexibility for code review session lengths
  - **Maximum Duration**: Increased from 8 minutes to 20 minutes maximum for comprehensive reviews
  - **New Default**: Changed default duration from 8 to 10 minutes for better-paced sessions
  - **Improved Range**: Duration slider now supports 0-20 minute range for varied review needs
  - **Consistent Defaults**: Updated all components to use 10-minute default consistently

### Changed

- **System Prompts**: Updated examiner personas to emphasize line number precision and location accuracy
- **Task Preparation**: Enhanced task creation prompts to mention specific files and code sections when possible
- **Timer Messages**: Updated to remind AI to continue providing line-specific feedback throughout the session
- **Screen Sharing Flow**: Modified to mention that line numbers will be referenced once code is visible

### Technical Details

- **All Prompt Components Updated**: Modified `mainPrompts`, `systemPrompts`, `taskPrompts`, `instructionComponents`, `levelGuidance`, and `timerMessages`
- **Format Examples**: Added specific formatting examples like "In UserService.js on line 23" and "Lines 45-50 in the main component"
- **Cross-Reference Support**: Enhanced GitHub reviews to reference implementation lines across multiple files
- **Accessibility**: Line number references make reviews more accessible for developers using screen readers or line-jumping tools

### Fixed

- **Duration Slider Visibility**: Fixed invisible range slider on ExamEditor form

  - **Custom Styling**: Added proper CSS styling to replace removed default browser appearance
  - **Tokyo Theme Colors**: Used Tokyo theme colors (#7c3aed accent, #2a2e3a background) for consistent design
  - **Interactive Elements**: Added hover effects and smooth transitions for better user experience
  - **Cross-Browser Support**: Included styling for both WebKit and Mozilla browsers
  - **Visual Feedback**: Slider thumb now properly visible with purple accent color and hover animations

- **Form Element Visibility Issues**: Fixed invisible form elements on ExamEditor form
  - **Duration Slider**: Added proper CSS styling to replace removed default browser appearance with Tokyo theme colors (#7c3aed accent, #2a2e3a background)
  - **Cancel Button**: Added background color (`bg-neutral-20`) and border to make button visible and clickable
  - **Custom Checkbox**: Replaced default browser checkbox with custom Tokyo-themed styling with purple accent
  - **Interactive Elements**: Added hover effects and smooth transitions for better user experience
  - **Cross-Browser Support**: Included styling for both WebKit and Mozilla browsers
  - **Visual Feedback**: All form elements now properly visible with consistent Tokyo theme styling and animations

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
  - **Delete Button**: Updated to proper red styling `

## [0.13.31] - 2025-06-02

### Changed

- **Optimized Transcript Buffering - 10-Second Intervals**: Significantly simplified and optimized transcript collection system
  - **Fixed 10-Second Timer**: Replaced complex buffering logic with simple 10-second intervals for more predictable behavior
  - **Simplified Logic**: Removed complex timing calculations, pause detection, and sentence boundary analysis
  - **Better Performance**: Eliminated unnecessary `lastTranscriptTimeRef` tracking and reduced computational overhead
  - **More Predictable**: Transcripts are now consistently collected every 10 seconds regardless of content patterns
  - **Cleaner Code**: Reduced complexity from ~40 lines of buffering logic to ~15 lines for easier maintenance

## [0.13.32] - 2025-06-02

### Changed

- **Optimized Transcript Logging - Reduced Console Noise**: Significantly reduced transcript logging frequency for cleaner console output
  - **Moved Logging Location**: Removed logging from GenAI Live client that was triggering on every transcript fragment
  - **Save-Only Logging**: Added logging to `flushTranscriptBuffer()` function - only logs when chunks are actually saved
  - **10-Second Intervals**: Logging now occurs every 10 seconds when buffered content is saved, not on every fragment
  - **Preview Format**: Logs show first 100 characters of saved content with "..." indicator for longer content
  - **Cleaner Console**: Dramatically reduced console noise while maintaining visibility into transcript processing
  - **Better Performance**: Reduced logging overhead by ~90% since fragments arrive much more frequently than saves

## [0.13.33] - 2025-06-02

### Fixed

- **Transcript Word Fragmentation**: Resolved issue where AI speech was being saved with spaces between every character

  - **Smart Spacing Logic**: Replaced simple spacing with intelligent character-by-character analysis
  - **Letter Continuation**: Prevents spaces when connecting letters that are part of the same word (e.g., "H" + "e" = "He", not "H e")
  - **Proper Word Boundaries**: Still adds spaces appropriately between different words and around punctuation
  - **Result**: Transcript chunks now save as "Hello! Thanks for having me" instead of "Hel lo! Tha nks fo r hav ing me"
  - **Pattern Recognition**: Uses regex to detect letter-to-letter connections vs word boundaries

- **Summary Modal Text Overflow**: Fixed generated text overflowing container on smaller screen sizes
  - **Button Theme Styling**: Updated button colors to properly match Tokyo theme (Copy: neutral colors, OK: accent colors)
  - **Footer Button Visibility**: Restructured modal with flexbox layout to ensure footer buttons always remain visible
  - **Flexible Content Area**: Content section now uses `flex-1` to take available space while preserving header and footer
  - **Container Structure Fix**: Added `min-w-0` and `overflow-hidden` to main modal container to prevent entire div overflow
  - **Reduced Padding**: Decreased content padding from `p-6` to `p-4` and inner container from `p-4` to `p-3`
  - **Source Fix**: Shortened decorative lines in summary generation from 27-30 characters to 15 characters
  - **Element Change**: Replaced stubborn `<pre>` element with `<div>` for better text wrapping behavior
  - **Preserved Formatting**: Used `whitespace-pre-line` to maintain line breaks and formatting
  - **Comprehensive Overflow Fix**: Added `min-w-0`, `overflow-hidden`, and inline CSS styles for absolute containment
  - **Width Constraints**: Applied `w-full` and `max-w-full` to both container and text element
  - **Forced Breaking**: Used `break-all` class and inline `wordBreak: 'break-all'` style for aggressive text breaking
  - **Container Boundaries**: Both the modal container and content now stay within boundaries at all screen sizes
  - **Root Cause Resolution**: Fixed both the content generation and modal structure to prevent any overflow

## [0.13.34] - 2025-06-02

### Fixed

- **Transcript Word Spacing**: Fixed overly aggressive smart spacing logic that was preventing spaces between separate words

  - **Root Cause**: Previous "smart spacing logic" was too aggressive and blocked spaces between words like "I'm" and "ready"
  - **Simplified Logic**: Replaced complex letter-detection logic with simple rule: add space unless either end already has one
  - **Proper Word Separation**: Transcripts now correctly show "Hi there! I'm ready to review your code with you" instead of "Hi there! I'mreadyto reviewyour codewithyou"
  - **Better User Experience**: AI speech transcripts are now readable and properly formatted
  - **Maintained Protection**: Still prevents double spaces while allowing proper word boundaries

- **Summary Modal OK Button Error**: Fixed "Cannot read properties of null (reading 'style')" error when pressing OK on summary screen

  - **Root Cause**: DOM manipulation in copy button was trying to access elements that might not exist
  - **React State Solution**: Replaced DOM manipulation with React state management for copy button feedback
  - **Eliminated DOM Access**: Removed `document.getElementById()` calls that were causing null reference errors
  - **Safer Implementation**: Copy button feedback now uses `useState` and `setCopyButtonText` instead of direct DOM manipulation

- **Summary Modal Button Styling**: Enhanced button styling to properly match Tokyo Night theme with hover effects
  - **Proper CSS Variables**: Replaced undefined Tailwind classes with actual CSS variables (`var(--tokyo-accent)`, `var(--Neutral-20)`)
  - **Enhanced Hover Effects**: Added smooth scaling (`scale(1.02)`) and box shadow effects on button hover
  - **Tokyo Theme Integration**: Both Copy and OK buttons now use proper Tokyo Night color palette
  - **Interactive Feedback**: Buttons provide clear visual feedback with 200ms smooth transitions
  - **Consistent Styling**: All UI elements now properly integrate with the established design system

## [0.13.35] - 2025-06-02

### Fixed

- **Duplicate Timer Setup**: Removed duplicate timer configuration that was causing double introduction messages and timer prompts
  - **Root Cause**: Both `Altair.tsx` and `useExamTimers.ts` were setting up timers independently
  - **Solution**: Removed timer setup from `Altair.tsx` since `useExamTimers.ts` handles this properly
  - **Impact**: Eliminates double "Hi! I'm your AI code reviewer" messages and conflicting timer prompts
  - **Cleaner User Experience**: Single, properly timed introduction and review flow

### Changed

- **Suggestion-Focused Prompts**: Updated all prompts to emphasize providing concrete suggestions rather than asking questions
  - **Main Prompts**: Changed from "discuss your feedback" to "discuss your suggestions" throughout
  - **System Instructions**: Updated from question-focused to suggestion-focused language
  - **Review Flow**: Emphasizes "actionable code improvements with exact suggestions" instead of general advice
  - **Level Guidance**: All levels now focus on providing specific improvement suggestions with line numbers
  - **Timer Messages**: Updated introduction to mention "specific suggestions for improvement"
  - **Better Code Reviews**: AI will now provide more concrete, actionable suggestions instead of theoretical discussions

### Technical Details

- **Files Modified**:
  - `src/components/altair/Altair.tsx`: Removed duplicate timer setup (40+ lines removed)
  - `src/prompts.json`: Updated all prompt sections to be suggestion-focused
- **Prompt Changes**: Replaced question-oriented language with suggestion-oriented language across all prompt categories
- **Timer Consolidation**: Single source of truth for timer management in `useExamTimers.ts`
- **Improved AI Behavior**: More focused on providing specific, line-referenced code improvements

## [0.13.36] - 2025-06-02

### Added

- **Live Suggestion Extraction System**: Real-time AI-powered suggestion tracking during code reviews
  - **OpenAI Integration**: Uses existing OpenAI API to intelligently extract concrete suggestions from natural conversation
  - **Smart Detection**: Automatically identifies actionable code improvements from transcript chunks without forcing trigger words
  - **Live Panel Display**: Floating suggestions panel in top-right corner with Tokyo Night theme styling
  - **10-Second Processing**: Leverages existing transcript buffering to process suggestions every 10 seconds
  - **Duplicate Prevention**: Advanced filtering prevents duplicate suggestions from appearing multiple times
  - **Line Number Integration**: Captures specific line references when AI mentions them in suggestions
  - **Real-Time Updates**: Suggestions appear live as the AI reviewer speaks, building up throughout the session
  - **Clean UI**: Non-intrusive panel with suggestion counter, processing indicator, and clear button
  - **Professional Formatting**: Suggestions display with timestamps and proper bullet-point formatting

### Fixed

- **OpenAI API Parameter Mismatch**: Fixed 400 Bad Request error in suggestion extraction system
  - **Root Cause**: `getCompletion` function expects 3 parameters (prompt, systemPrompt, doesReturnJSON) but was only receiving 1
  - **Parameter Fix**: Updated suggestion extractor to provide proper system prompt and JSON flag parameters
  - **API Compatibility**: Now correctly calls `getCompletion(extractionPrompt, systemPrompt, false)`
  - **Error Resolution**: Eliminates "Failed to fetch completion: 400" errors during live suggestion processing

### Enhanced

- **Live Suggestion Integration in Summary**: Code review summaries now use actual extracted suggestions instead of keyword analysis
  - **Key Review Points**: Summary now displays the actual live suggestions extracted during the review
  - **Removed Unnecessary Metrics**: Eliminated confusing metrics like "transcript segments", "user interactions", "suggestion keywords", and "issue keywords"
  - **Cleaner Session Activity**: Simplified to show only relevant information (transcript length and line number references)
  - **Real Actionable Content**: Key Review Points section now shows the concrete suggestions from the OpenAI extraction system
  - **Fallback Support**: Maintains fallback to excerpt analysis if no live suggestions are available
  - **Better User Value**: Summary now contains the actual suggestions users saw during the review instead of statistical analysis

### Technical Implementation

- **New Hook**: `useLiveSuggestionExtractor` - handles OpenAI API calls and suggestion state management
- **New Component**: `LiveSuggestionsPanel` - displays live suggestions with Tokyo Night theme
- **Enhanced Tracker**: `useConversationTracker` now accepts optional callback for transcript chunk processing
- **Integration Points**:
  - `AIExaminerPage.tsx`: Main integration point with suggestion display
  - `ExamWorkflow.tsx`: Updated to support transcript chunk callbacks
- **OpenAI Prompt Engineering**: Sophisticated extraction prompt with quality criteria and format specifications
- **State Management**: Efficient suggestion deduplication and processing state tracking

### User Experience

- **Natural Conversation**: AI speaks completely naturally without forced trigger words or artificial phrasing
- **Contextual Awareness**: Only shows panel during active code reviews (`examIntentStarted = true`)
- **Actionable Insights**: Focuses on concrete, implementable suggestions rather than general observations
- **Visual Feedback**: Processing indicator shows when suggestions are being extracted
- **Easy Management**: Clear button allows users to reset the suggestion list if needed

## [0.14.6] - 2025-06-02

### Fixed

- **CRITICAL: Dual AI Sessions Bug**: Fixed major issue where two AI voices were talking simultaneously with one being uninterruptible

  - **Root Cause**: Multiple concurrent connections were being established due to race conditions in connection logic
  - **Connection Tracking**: Added `isConnectingRef` and `activeConnectionRef` to prevent concurrent connection attempts
  - **Duplicate Prevention**: Connection effect now checks for existing connections before attempting new ones
  - **Session Termination**: Enhanced session cleanup to properly terminate all connections and reset tracking flags
  - **Automatic Reconnection Control**: Added comprehensive debugging to track and prevent unwanted automatic reconnections
  - **Component Cleanup**: Enhanced unmount cleanup to ensure all sessions are properly terminated
  - **State Synchronization**: Fixed race conditions where multiple useEffect dependencies could trigger simultaneous connections

- **CRITICAL: Stop Button Crash**: Fixed UI shifting and crashes when pressing the stop review button
  - **Race Condition Fix**: Added cleanup guard (`isCleaningUpRef`) to prevent multiple simultaneous cleanup processes
  - **Atomic Cleanup**: Made cleanup process atomic with proper try/finally blocks to ensure completion
  - **State Order**: Reordered cleanup sequence to generate summary before notifying parent components
  - **Duplicate Prevention**: All cleanup effects now check if cleanup is already in progress before executing
  - **Error Recovery**: Cleanup flag is always reset even if errors occur during cleanup process
  - **UI Stability**: Eliminated competing state changes that caused UI shifting back and forth
  - **Simplified Flow**: Removed cascading parent callbacks that were causing race conditions between components
  - **Single Responsibility**: ExamWorkflow now handles its own state management without relying on parent callbacks
  - **State Guard**: Added `isManualStopInProgress` guard in parent component to prevent duplicate stop requests

### Enhanced

- **Connection State Management**: Comprehensive connection tracking system to ensure single active session

  - **Connection Guards**: Prevents multiple simultaneous connect/resume calls
  - **State Tracking**: Real-time monitoring of connection states with detailed debug logging
  - **Cleanup Coordination**: Proper cleanup of timers, connections, and tracking flags during session end
  - **Debug Information**: Enhanced logging shows connection attempts, success/failure, and cleanup status
  - **Race Condition Prevention**: Eliminated timing issues that could create overlapping AI sessions

## [0.16.0] - 2025-06-02

### Added

- **Live Suggestions Popup Window**: Implemented a new pop-up window for displaying live AI-generated code review suggestions during an active review session.
  - **Dedicated View**: Suggestions now appear in a separate window, allowing users to position them freely for better visibility alongside their code/screen share.
  - **Dynamic Sizing**: Popup window defaults to two-thirds of the screen height and a responsive width.
  - **Window Management**: Includes robust handling for window opening, closing, and lifecycle management via a reusable `PopupWindow.tsx` component.
  - **Style Porting**: Stylesheets from the main application are copied to the popup to maintain visual consistency (with graceful error handling for external fonts like Google Fonts).

### Changed

- **Live Suggestions Panel UI/UX Overhaul**: Significantly redesigned the `LiveSuggestionsPanel.tsx` component for enhanced readability and user experience within the new popup.
  - **Modern Aesthetics**: Updated styling with a focus on clarity, using theme variables (`--tokyo-` prefixed) for colors, backgrounds, and borders.
  - **Newest First**: Suggestions are displayed with the latest one at the top, with auto-scroll to the newest suggestion.
  - **Visual Hierarchy for Latest Suggestion**: The most recent suggestion is prominently highlighted with a distinct gradient background (`--tokyo-accent` to `--tokyo-accent-hover`) and a stronger box shadow.
  - **Fading Older Suggestions**: Older suggestions gradually decrease in opacity to emphasize newer ones, while becoming fully opaque on hover for easy reading.
  - **Improved Spacing**: Increased vertical spacing between suggestion items and enhanced internal padding for better readability and a less cluttered look.
  - **Refined Timestamp & Badge**: Timestamp formatting improved; "Latest" badge styled for better contrast and visual appeal.
  - **Removed Visual Clutter**: Unnecessary icons/bullets and item borders removed for a cleaner interface.

### Fixed

- **Popup Window Title**: Resolved issue where the popup window title would sometimes incorrectly display "about:blank" by ensuring the document title is set at multiple stages of the popup creation lifecycle.
- **Popup Stability**: Addressed an issue where the popup window might close prematurely when new suggestions were added by memoizing the `onClose` handler in the parent component (`AIExaminerPage.tsx`) using `useCallback`.

## [0.16.1] - 2025-06-02

### Fixed

- Resolved critical styling issues in the live suggestions popup window:
  - Ensured consistent application of margins and padding for suggestion items by using `setAttribute('style', ...)` instead of relying solely on React's `style` prop for portaled components, fixing spacing and scrolling problems.
  - Re-enabled stylesheet copying from the main application to the popup, allowing CSS variables and global styles to function correctly within the popup.
  - Verified that theme-consistent styling (backgrounds, text colors, shadows, hover effects) applies correctly to all suggestion items and panel elements within the popup.
- Removed diagnostic code (manual test divs and temporary style overrides) from `PopupWindow.tsx` and `LiveSuggestionsPanel.tsx`.

### Changed

- Refactored `LiveSuggestionsPanel.tsx` to use a helper component `SuggestionItem` and a `toStyleString` utility for more robust style application via `setAttribute`.
- Adjusted padding within the live suggestions panel for better layout.

## [0.16.2] - 2025-06-02

### Fixed

- **Popup Scrolling and Padding**: Resolved final issues with scrolling and top padding within the live suggestions popup window.
  - Ensured the main popup container (`#popup-root` in `PopupWindow.tsx`) does not interfere with the inner panel's scrolling.
  - Confirmed that `padding-top` on the scrollable suggestions list in `LiveSuggestionsPanel.tsx` is consistently applied, restoring the space above the first suggestion.
  - Verified that applying critical layout styles (like item margins and container padding) via `setAttribute` or direct `style` prop (where reliable) ensures correct rendering and functionality in the portaled popup context.
- Removed all diagnostic borders and console logs used during the troubleshooting process for popup styling and scrolling.

## [0.16.3] - 2025-06-02

### Fixed

- **Popup Scrolling Re-enabled**: Resolved an issue where scrolling in the live suggestions popup window became non-functional after diagnostic code removal. Ensured that all necessary flexbox and overflow styles on parent and child containers are correctly maintained for reliable scrolling.
- Cleaned up all diagnostic borders and console logs from `PopupWindow.tsx` and `LiveSuggestionsPanel.tsx` after confirming stable scrolling and layout.

## [0.16.4] - 2025-06-02

### Fixed

- **Robust Popup Scrolling**: Permanently fixed the live suggestions popup window scrolling by forcefully applying essential CSS properties (`padding-top`, `overflow-y: auto`, `flex-grow`) to the scrollable container using `setAttribute`. This ensures reliable scrolling behavior, bypassing inconsistencies with React's `style` prop or Tailwind classes in the new window context.
- Removed temporary diagnostic borders and logging after confirming the fix.

## [0.17.1] - 2025-06-02

### Changed

- **Latest Suggestion Styling**: Updated the style of the latest suggestion item in the `LiveSuggestionsPanel` to use a solid `var(--tokyo-accent)` background color instead of a linear gradient, aligning with the theme's accent color for updates.

### Fixed

- **Icon Display**: Ensured only generic file icons are displayed in the `LiveSuggestionsPanel` by removing unused specific icon components and simplifying the icon selection logic. This resolves an issue where varied icons were not appearing due to missing `filename` data in suggestions.
- Removed the `filename` property from the `Suggestion` interface as it was not being utilized.

## [0.17.2] - 2025-06-02

### Changed

- **"Latest" Badge Styling**: Updated the "Latest" text badge in the `LiveSuggestionsPanel` to appear as an orange pill (`#F97316` background) with white text. This aligns its appearance with other similar status pills in the application (e.g., the original "UPDATED" pills).
- **Latest Suggestion Item Background**: Reverted the background of the entire latest suggestion item to its previous purple gradient style, as the solid purple background was a misunderstanding.
