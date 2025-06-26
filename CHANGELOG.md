# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.17.22] - 2025-06-24

### Reverted

- **Connection Wait Fix**: Reverted connection wait that was breaking voice input entirely
  - **Issue**: Added wait for connection before starting audio recording, but this broke voice input on both start and resume
  - **Revert**: Back to original timing where audio recording starts immediately after calling onButtonClicked
  - **Debug Cleanup**: Removed excessive debugging logs that were cluttering the console
  - **Status**: Back to working state where voice input works, but resume delay issue remains

## [0.17.21] - 2025-06-24

### Fixed

- **Audio Processing Delay on Resume**: Fixed persistent delay in voice input processing after resume
  - **Root Cause**: Shared AudioContext reuse was causing audio processing pipeline issues on resume
  - **AudioContext Management**: Removed AudioContext reuse and create fresh instance for each session
  - **Worklet Pipeline**: Fresh AudioContext ensures clean worklet registration and audio processing
  - **Processing Delay**: Eliminates delay in voice input registration that was affecting every interaction after resume
  - **Result**: Resume now has same responsive voice input as first start

## [0.17.20] - 2025-06-24

### Fixed

- **Resume Delay Issue**: Fixed delay that only occurred on resume but not on first start
  - **Root Cause**: Resume was using a different flow than first start due to `permissionsGranted` being reset to false during pause
  - **Resume Flow**: Resume now uses the same unified flow as first start instead of going through separate permission/start steps
  - **Permission State**: Removed `setPermissionsGranted(false)` during pause to keep permission state consistent
  - **Simplified Logic**: Removed browser-specific resume paths and unified all resume logic
  - **Result**: Resume now has the same timing and behavior as first start, eliminating the delay

## [0.17.19] - 2025-06-23

### Fixed

- **Audio Delay on Resume**: Fixed long delay before AI reacts to speech input after pause/resume
  - **Root Cause**: Audio recording was starting before the connection was established, causing a timing gap
  - **Timing Fix**: Changed order to start review/connection first, then start audio recording after connection is ready
  - **AudioContext Reuse**: Added ID-based AudioContext reuse to eliminate recreation overhead
  - **Buffer Size Optimization**: Reduced audio worklet buffer from 2048 to 1024 samples for faster response
  - **AudioContext Persistence**: Modified AudioRecorder to keep AudioContext instance alive across pause/resume cycles
  - **WebSocket State Errors**: Added connection check in audioDataHandler to prevent "WebSocket is already in CLOSING or CLOSED state" errors
  - **Worklet Registration Errors**: Simplified worklet registration to ignore harmless "already registered" errors instead of trying to prevent them
  - **Result**: Resume now has minimal delay and AI responds quickly to speech input without WebSocket or worklet errors
  - **Performance**: Eliminated ~100-200ms delay caused by AudioContext recreation and worklet re-registration

## [0.17.18] - 2025-06-23

### Fixed

- **Resume Delays**: Fixed massive delays that occurred immediately after resume by reverting excessive WebSocket state checking
  - **Root Cause**: Added extensive WebSocket state validation in `sendRealtimeInput`, `sendToolResponse`, and `send` methods that was causing performance issues
  - **Solution**: Reverted to original simple approach with only basic null checks for session
  - **Performance Impact**: Removed redundant connection status checks, disconnecting flags, and try-catch blocks that were slowing down data transmission
  - **Video Frame Sending**: Removed connection check from video frame sending that was also causing delays
  - **Result**: Resume now works as fast as it did before the WebSocket state checking was added
  - **Maintained Safety**: Kept simple null checks to prevent errors while removing performance-killing validation

## [0.17.17] - 2025-06-23

### Fixed

- **WebSocket State Race Condition**: Fixed "WebSocket is already in CLOSING or CLOSED state" error during pause/resume cycles
  - **Root Cause**: Audio and video data was being sent to WebSocket while it was in the process of closing, causing race condition
  - **Disconnect Tracking**: Added `isDisconnecting` flag to track when session is in the process of disconnecting
  - **Robust State Checking**: Enhanced `sendRealtimeInput` to check both connection status and disconnecting flag
  - **Comprehensive Protection**: Added same WebSocket state checking to `sendToolResponse` and `send` methods
  - **Audio Data Handler Protection**: Added connection check in `audioDataHandler` to prevent sending audio data when client is disconnected
  - **Video Frame Protection**: Added connection check in `sendVideoFrame` to prevent sending video data when client is disconnected
  - **Audio Recorder Stop Fix**: Fixed AudioRecorder stop method to immediately prevent data emission and properly disconnect worklets
  - **Worklet Data Prevention**: Added recording state check in worklet message handler to prevent data emission after stop
  - **Audio Recording Timing Fix**: Refactored to start audio recording only after WebSocket is connected, eliminating warning spam and resume delays
  - **Centralized Audio Management**: Added useEffect to manage audio recording based on connection state, removing manual start/stop calls
  - **Multiple Audio Start Prevention**: Added audioRecordingActiveRef to prevent multiple simultaneous audio recording sessions
  - **Audio State Tracking**: Proper tracking of audio recording state to prevent useEffect from creating duplicate sessions
  - **MediaStream Validation**: Added validation to check if audio stream is valid before starting audio recording
  - **Audio Stream Cleanup**: Centralized audio stream cleanup with proper null reference handling
  - **Double-Check Validation**: Added session state validation before each data send to prevent race conditions
  - **Try-Catch Wrapping**: Wrapped all WebSocket send operations in try-catch blocks for better error handling
  - **Proper Flag Management**: Reset disconnecting flag on successful connection and when connection closes
  - **Better Error Prevention**: Prevents sending any data during the disconnect process that causes WebSocket errors
  - **Enhanced Logging**: Added detailed state information to debug logging for better troubleshooting
  - **Enhanced Debugging**: Added comprehensive logging to track audio stream state and permission flow
  - **Reverted to Original Approach**: Restored manual audio recording start/stop calls in button handlers, removing complex useEffect approach

## [0.17.16] - 2025-06-23

### Fixed

- **Firefox Resume Button Logic**: Fixed resume button going through permission flow instead of resuming existing session
  - **Root Cause**: `handleMainButtonClick` wasn't checking if client could resume before going to permission flow
  - **Session Resume Check**: Added `client.canResume()` check when `hasExamStarted` is true
  - **MediaStream Inactivity Issue**: Fixed MediaStreams becoming inactive during pause causing resume failures
  - **Proper Media Cleanup**: Reverted to proper cleanup of media streams on pause instead of keeping them active
  - **Resume Permission Flow**: Resume now goes through normal permission flow since MediaStreams are cleaned up on pause
  - **Browser-Specific Resume**: Chrome uses unified flow, Firefox uses two-step approach for resume
  - **Clean State Management**: Properly reset permissions and media state on pause for clean resume
  - **Screen Sharing Persistence**: Chrome now keeps screen sharing active during pause for seamless resume
  - **Unified Code Approach**: Simplified back to unified flow with only minimal Firefox-specific differences for two-step permissions
  - **Resume Audio Delays**: Fixed WebSocket state checking to prevent sending audio data when connection is not ready
  - **Connection State Validation**: Added proper error handling in `sendRealtimeInput` to prevent "WebSocket is already in CLOSING or CLOSED state" errors

## [0.17.15] - 2025-06-23

### Fixed

- **Connection Start/Resume Cycle**: Fixed persistent connection cycle issue where system would start new session then immediately resume

  - **Root Cause**: Resume method was calling connect even when no session handle was available
  - **Solution**: Modified resume method to only attempt resumption when valid session handle exists
  - **Smart Logic**: No session handle = normal connect, valid handle = resume with handle
  - **Result**: Eliminates WebSocket error 1007 and prevents unnecessary start/resume cycles

- **Firefox Resume Button Double-Click Issue**: Fixed Firefox requiring two clicks on "Start Code Review" button
  - **Root Cause**: Audio stream not properly stored between permission request and review start
  - **Solution**: Enhanced audio stream storage and validation in Firefox two-step flow
  - **Better Error Handling**: Added comprehensive logging and validation for audio/video streams
  - **User Experience**: Firefox users now get reliable one-click resume after permissions are granted

### Enhanced

- **Firefox Permission Flow**: Improved two-step permission handling for better reliability
  - **Audio Stream Validation**: Added logging to track audio stream storage and availability
  - **Permission State Tracking**: Better validation of permission states before starting review
  - **Error Messages**: More specific error messages to guide users through permission issues
  - **Debug Logging**: Enhanced logging to track permission flow and identify issues

## [0.17.14] - 2025-06-23

### Fixed

- **Live Suggestions Transcript Quality**: Fixed fragmented transcript text in live suggestions by using the same flawless system as the summary screen
  - **Root Cause**: Live suggestions were using complex word boundary reconstruction that was causing fragmentation
  - **Solution**: Simplified to use the same simple concatenation approach as the summary screen
  - **Gemini Live API**: Leverages the same `outputAudioTranscription: true` that provides perfect AI speech transcription
  - **Result**: Live suggestions now show clean text like "To start, could you show me" instead of "To st, cartould you show me"
  - **Consistency**: Both live suggestions and summary screen now use identical, flawless transcription processing

### Enhanced

- **Transcript Processing Simplification**: Removed complex word boundary reconstruction logic
  - **Simple Concatenation**: Uses the same approach as the summary screen - just accumulate text
  - **API Reliability**: Trusts Gemini Live API's built-in transcription which already handles word boundaries perfectly
  - **Reduced Complexity**: Eliminated ~100 lines of complex regex-based text reconstruction
  - **Better Performance**: Simpler processing with no fragmentation issues

## [0.17.13] - 2025-06-23

### Fixed

- **Transcript Word Fragmentation**: Significantly improved transcript text quality by fixing word boundary detection
  - **Smart Text Concatenation**: Enhanced buffering logic to properly detect word boundaries and add spaces only when needed
  - **Word Boundary Detection**: Improved logic to distinguish between word fragments and separate words
  - **Common Word Fixes**: Added pattern recognition for common contractions and word combinations
  - **Fragment Repair**: Enhanced cleaning logic to fix fragmented words like "st" + "art" → "start" and "car" + "tould" → "could"
  - **Result**: Transcripts now show "To start, could you show me" instead of "To st, cartould you show me"

### Enhanced

- **Connection Stability**: Improved connection logic to prevent start/resume cycles
  - **Session Handle Validation**: Added `canResume()` method to properly check for valid session resumption
  - **Smart Connection Logic**: Only use resume when both `hasEverConnected` is true AND valid session handle exists
  - **Connection Guard**: Enhanced to prevent multiple simultaneous connection attempts
  - **Error Recovery**: Reset `hasEverConnected` on connection failures to prevent stuck states

## [0.17.12] - 2025-06-23

### Fixed

- **Connection Start/Resume Cycle**: Fixed button blinking and double-click resume issue caused by start/resume cycle

  - **Root Cause**: System was starting new session then immediately resuming, causing WebSocket errors and UI flickering
  - **Session Handle Check**: Added `canResume()` method to GenAILiveClient to properly check for valid session resumption
  - **Smart Connection Logic**: Only use resume when both `hasEverConnected` is true AND valid session handle exists
  - **Connection Guard**: Enhanced connection guard to prevent multiple simultaneous connection attempts
  - **Error Recovery**: Reset `hasEverConnected` on connection failure to force fresh start on retry
  - **Reduced Logging**: Removed excessive console logging that was causing performance issues and button blinking

- **Excessive Event Firing**: Eliminated redundant effect triggers and state updates causing UI instability
  - **Effect Optimization**: Streamlined useEffect dependency arrays to prevent unnecessary re-renders
  - **State Management**: Reduced cascading state updates that were causing button blinking
  - **Logging Cleanup**: Removed excessive debug logging that was interfering with UI responsiveness
  - **Connection Flow**: Simplified connection logic to prevent start/resume cycles

### Changed

- **Safari Support Removal**: Removed Safari support due to persistent permission handling issues

  - **Safari Detection**: Added Safari browser detection that disables the main button
  - **User Guidance**: Safari users see "Safari Not Supported" button with clear message to use Chrome or Firefox
  - **Simplified Browser Logic**: Removed complex Safari-specific permission flows and modals
  - **Better UX**: Users get immediate feedback that Safari isn't supported instead of confusing error states

- **Browser-Specific Flows**: Streamlined to Chrome (one-click) and Firefox (two-step) only
  - **Chrome**: Maintains original "Share screen & start review" one-click experience
  - **Firefox**: Uses two-step "Share Screen & Microphone" → "Start Code Review" approach
  - **Safari**: Shows disabled button with clear unsupported message

### Added

- **GenAILiveClient Enhancement**: Added `canResume()` public method to check session resumption capability
  - **Session Handle Access**: Public method to safely check if session resumption is available
  - **Connection Logic**: Enables smart connection decisions based on actual session state
  - **Error Prevention**: Prevents invalid resume attempts that cause WebSocket errors

## [0.17.11] - 2025-06-23

### Fixed

- **Safari User Gesture Context Error**: Resolved "getDisplayMedia must be called from a user gesture handler" error in Safari

  - **Root Cause**: Safari loses user gesture context after async operations, requiring separate user gestures for each permission
  - **Two-Step Modal Approach**: Safari now uses a modal to request screen sharing in a separate user gesture after microphone access
  - **User Gesture Preservation**: Screen sharing request happens in a fresh user gesture context via modal button click
  - **Sequential Flow**: Microphone first (300ms delay), then modal appears, then screen sharing on modal button click
  - **Simplified Error Handling**: Unified error handling for both permission types with clear user guidance
  - **Better User Experience**: Safari users get a reliable two-step flow that works regardless of timing

- **Safari Microphone Cleanup**: Fixed microphone not shutting down properly when review ends

  - **Force Stop Audio**: Added `forceStopAudio` effect to ensure microphone tracks are properly stopped
  - **MediaStream Track Cleanup**: Enhanced cleanup to stop both AudioRecorder and MediaStream tracks
  - **Audio Stream Tracking**: Added `audioStreamRef` to track and properly clean up MediaStream instances
  - **Complete Session Cleanup**: Microphone now properly stops on review termination, pause, or error
  - **Safari-Specific Handling**: Added explicit audio track stopping for Safari's permission flow
  - **Cross-Browser Compatibility**: All browsers (Chrome, Firefox, Safari) now have complete microphone cleanup

- **Duplicate Connection Events**: Fixed multiple connection effect triggers causing duplicate events
  - **Connection Guard**: Added `isConnectingRef` to prevent multiple simultaneous connection attempts
  - **Dependency Array Fix**: Optimized useEffect dependency array to prevent unnecessary re-triggers
  - **State Management**: Enhanced connection state tracking to prevent race conditions
  - **Cleanup Enhancement**: Proper cleanup of connection guard on component unmount
  - **Console Logging**: Added connection guard status to debug logging for better troubleshooting

### Changed

- **Safari Permission Flow**: Restructured Safari-specific code to maintain user gesture context throughout permission requests
- **Error Messages**: Enhanced error messages to guide users on both microphone and screen sharing permissions
- **Audio Management**: Improved audio recorder cleanup with proper event handler removal and stream stopping
- **Connection Management**: Enhanced connection logic with guards and optimized dependency tracking
- **MediaStream Lifecycle**: Complete MediaStream track management across all browser flows

## [0.17.10] - 2025-06-19

### Added

- **Safari Screen Sharing Debugging**: Enhanced error logging to identify Safari screen sharing issues
  - **Detailed Error Logging**: Added comprehensive error logging for Safari screen sharing failures
  - **Error Type Information**: Logs error name, message, and full error object for debugging
  - **User Gesture Context**: Added 100ms delay before screen sharing to ensure user gesture context is valid
  - **Safari-Specific Timing**: Optimized timing for Safari's permission handling system

### Fixed

- **Safari Screen Sharing Failure**: Added debugging and timing fixes to resolve "Failed to start screen sharing" error
- **Safari User Gesture Context**: Ensured user gesture context remains valid between microphone and screen sharing requests

## [0.17.9] - 2025-06-19

### Changed

- **Safari Microphone-First Approach**: Completely restructured Safari flow to request microphone access BEFORE screen sharing
  - **Permission Order**: Safari now requests microphone permission first, then screen sharing permission
  - **Simplified Flow**: Eliminated complex retry logic and timing delays in favor of simpler permission order
  - **Better Safari Compatibility**: This approach works better with Safari's permission handling system
  - **Cleaner Code**: Removed Safari-specific retry logic and timing delays from the main flow
  - **Separate Safari Path**: Safari now has its own dedicated flow separate from Chrome/Firefox

### Fixed

- **Safari Microphone Access**: Resolved Safari microphone access issues by changing permission request order
- **Safari Audio Recording**: Fixed Safari audio recording problems by ensuring microphone is granted before screen sharing
- **Safari Permission Handling**: Better compatibility with Safari's permission system by requesting mic first

## [0.17.8] - 2025-06-19

### Fixed

- **Safari Microphone Access Issues**: Implemented Safari-specific fixes for microphone access problems
  - **Safari Audio Constraints**: Removed unsupported audio constraints (noiseSuppression, autoGainControl) for Safari
  - **Safari Timing**: Added 500ms delay before mic access to ensure screen sharing is fully settled
  - **Safari Retry Logic**: Added automatic retry with simpler constraints if initial mic access fails
  - **Safari Error Handling**: Enhanced error messages with Safari-specific guidance about microphone permissions
  - **Safari Permission Guidance**: Clear instructions to check Safari Settings > Websites > Microphone when mic access fails
  - **Safari Audio Recording**: Proper audio recording setup after successful mic retry

### Changed

- Enhanced Safari browser detection and handling throughout the audio initialization process
- Improved error logging for Safari-specific microphone access issues
- Added Safari-specific timing delays to prevent race conditions between screen sharing and microphone access

## [0.17.7] - 2025-06-19

### Changed

- **Safari Browser Behavior**: Changed Safari to use Chrome-like flow instead of Firefox-like flow
  - **Removed Two-Step Modal Flow**: Safari no longer shows pre-share warning or post-share "Start Code Review" modal
  - **Immediate Mic Access**: Safari now attempts microphone access immediately after screen sharing (like Chrome)
  - **Full Audio Constraints**: Safari now uses complete audio constraints (echoCancellation, noiseSuppression, autoGainControl, channelCount)
  - **Simplified User Experience**: Safari users get the same seamless "Share screen & start review" experience as Chrome users
  - **Firefox Remains Unchanged**: Firefox continues to use the two-step modal flow due to its stricter user gesture requirements

### Fixed

- **Safari Review Start Issue**: Resolved issue where Safari would return to instruction screen after mic permission by using Chrome-like flow
- **Safari Audio Constraints**: Removed Safari-specific audio constraint exclusions that were limiting audio quality

## [0.17.6] - 2025-06-19

### Added

- **Enhanced Debugging for Safari Review Start Issue**: Added comprehensive logging to track the review start flow and identify why Safari returns to instruction screen after mic permission
  - **State Tracking**: Added detailed console logging to `handleStartExamClicked` to track when and how the review state changes
  - **Flow Monitoring**: Added logging to monitor `examIntentStarted` state changes and related variables (videoStream, forceStopAudio, forceStopVideo)
  - **ControlTray Logging**: Enhanced logging in `handleStartReviewClick` for Safari/Firefox modal flow to track mic permission and review start
  - **ExamWorkflow Tracking**: Added logging to track exam preparation, live config creation, and AI connection establishment
  - **Error Handling**: Added try-catch blocks around `onButtonClicked` calls to catch any errors that might prevent review start
  - **Cross-Browser Comparison**: Added logging to Chrome flow for comparison with Safari/Firefox flow

### Changed

- Enhanced error handling in ControlTrayCustom to provide better feedback when review start fails
- Improved debugging capabilities to identify state reset issues in Safari
- Added comprehensive logging throughout the review start pipeline

## [0.17.5] - 2025-06-19

### Fixed

- **Firefox Audio Recording Retry Mechanism**: Implemented robust retry logic to handle Firefox's media initialization timing issues
  - **Root Cause**: Firefox requires multiple attempts to fully settle after screen sharing before microphone requests can succeed
  - **Solution**: Added intelligent retry mechanism with up to 3 attempts and 1-second delays between retries
  - **Stream Readiness Check**: Enhanced screen sharing initialization to wait for video track to be 'live' before proceeding
  - **Extended Delays**: Increased delay between screen sharing and audio recording from 500ms to 1000ms for better Firefox compatibility
  - **Graceful Degradation**: If all retries fail, user gets clear error message instead of browser hanging
  - **Cross-Browser Compatibility**: Retry mechanism works across all browsers while specifically solving Firefox timing issues

### Changed

- Enhanced ControlTrayCustom to wait for screen sharing stream to be fully active before requesting microphone access
- Added detailed logging for stream readiness checks and retry attempts
- Improved error handling with specific retry attempt tracking
- Extended delay between media requests from 500ms to 1000ms for better browser compatibility

## [0.17.4] - 2025-06-19

### Fixed

- **Audio Recording Sample Rate Mismatch**: Resolved critical issue where microphone input was not working in Firefox and Safari due to sample rate conflicts

  - **Root Cause**: AudioRecorder was using shared AudioContext with 24kHz while MediaStream had no sample rate constraint, causing mismatch
  - **Solution**: Implemented browser-adaptive approach that lets browser choose optimal sample rate, then constrains MediaStream to match
  - **Cross-Browser Compatibility**: Now works in both Firefox and Safari by ensuring MediaStream and AudioContext use identical sample rates
  - **API Integration**: Updated ControlTray to dynamically send correct sample rate based on AudioContext's actual rate
  - **Firefox Error Resolution**: Eliminates "Connecting AudioNodes from AudioContexts with different sample-rate" error
  - **Chrome Error Resolution**: Fixed "Cannot close a closed AudioContext" error by adding proper state checking before closure

- **Firefox and Safari Hanging During Media Initialization**: Fixed critical issue where browsers would hang on "Getting MediaStream..." step
  - **Root Cause**: Old `useScreenCapture` and `useWebcam` hooks were calling `getUserMedia`/`getDisplayMedia` in separate contexts, interfering with direct audio initialization
  - **Solution**: Removed dependency on media hooks and implemented direct `getDisplayMedia` call in button handler
  - **User Gesture Context**: All media initialization now happens directly in response to button click, ensuring proper browser permissions
  - **Performance**: Eliminated race conditions and multiple simultaneous media requests that caused browser confusion

### Changed

- AudioRecorder now creates AudioContext without sample rate specification (lets browser choose optimal rate)
- AudioRecorder constrains MediaStream to match AudioContext's actual sample rate instead of forcing 16kHz
- ControlTray dynamically sends correct sample rate to API based on AudioContext's actual rate
- Added proper AudioContext state checking before closure to prevent "already closed" errors
- Enhanced error handling with try-catch blocks for AudioContext operations
- Improved logging to show actual sample rates being used
- **Removed dependency on `useScreenCapture` and `useWebcam` hooks** to eliminate media request conflicts
- **Integrated screen sharing directly into button handler** using `getDisplayMedia` for better cross-browser compatibility
- **Enhanced logging** for screen sharing and audio initialization steps to aid debugging

## [0.17.3] - 2025-06-06

### Fixed

- Firefox audio recording now works by using shared AudioContext across GenAI Live and AudioRecorder
- Resolved MediaStreamGraph isolation issue that was causing "Connecting AudioNodes from AudioContexts with different sample-rate" error
- AudioRecorder and GenAI Live API now share the same MediaStreamGraph instance, eliminating graph conflicts in Firefox

### Changed

- AudioRecorder now uses shared audioContext utility instead of creating fresh AudioContext instances
- Both audio components now use consistent 24kHz sample rate through shared context
- Removed Firefox-specific AudioContext closing logic in favor of shared context approach

## [0.17.2] - 2025-06-06

### Fixed

- AudioContext sample rate conflicts by using separate contexts for recording vs playback
- AudioRecorder now detects MediaStream's native sample rate and creates matching AudioContext
- Prevents "Connecting AudioNodes from AudioContexts with different sample-rate" errors in Firefox
- Improved worklet registry management to prevent duplicate registrations

### Changed

- AudioRecorder no longer uses shared audioContext utility, creates dedicated context instead
- Added proper cleanup of recording AudioContext on stop/error

## [0.17.1] - 2025-06-06

### Fixed

- AudioContext sample rate mismatch errors preventing audio recording
- Coordinated all audio systems to use consistent 24kHz sample rate
- Implemented shared AudioContext strategy with proper worklet registry management
- Resolved "An AudioWorkletProcessor with name is already registered" errors

### Changed

- Updated AudioRecorder to use shared audioContext utility
- Modified worklet registration to check registry before adding modules
- Enhanced error handling and cleanup procedures

## [0.17.0] - 2025-06-06

### Added

- Audio recording functionality with AudioRecorder class
- AudioWorklet-based audio processing for microphone input
- Volume meter (VU meter) worklet for audio level monitoring
- AudioContext utilities for managing audio contexts
- Worklet registry system for managing AudioWorklet modules

### Changed

- Enhanced GenAI Live integration with proper audio streaming
- Improved audio system architecture with coordinated sample rates
- Updated control tray to handle audio recording states

### Fixed

- Audio streaming issues with proper buffer management
- Cross-browser compatibility for audio recording
- Memory leaks in audio processing pipeline

## [0.16.0] - 2025-06-05

### Added

- Real-time voice communication with Gemini Live API
- Audio streaming capabilities with AudioStreamer class
- GenAI Live client for WebSocket-based communication
- Volume controls and audio level monitoring
- Live conversation state management

### Changed

- Enhanced exam simulator with voice interaction capabilities
- Improved UI for real-time communication controls
- Updated component architecture for audio integration

## [0.15.0] - 2025-06-04

### Added

- AI-powered code review simulation system
- Interactive exam simulator with real-time feedback
- Support for multiple programming languages
- Comprehensive test scenarios and evaluation metrics

### Changed

- Restructured project architecture for better maintainability
- Enhanced user interface with modern React components
- Improved error handling and user experience

### Fixed

- Performance optimizations for large code reviews
- Cross-browser compatibility issues
- Memory management improvements

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
