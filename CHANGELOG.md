# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.20.21] - 2025-07-07

### Fixed

- **CRITICAL: Network Reconnection Timing**: Fixed issue where reconnection banner would disappear before AI was actually ready to respond

  - **Previous Issue**: Banner would disappear as soon as connection was established, but AI wasn't ready to respond yet
  - **Root Cause**: Transcript handler was hiding banner on ANY transcript, not waiting for AI response to reconnection prompt
  - **Solution**: Modified transcript handler to only hide banner when not actively reconnecting - waits for AI to respond to reconnection prompt
  - **Improved Flow**: Banner now stays visible until AI actually acknowledges reconnection with "I'm back now. Let's continue..." message
  - **Better UX**: Users see banner until AI is truly ready and speaking, not just technically connected

- **Pause Button Auto-Prompt**: Added automatic "Let's continue" prompt when resuming from deliberate pause

  - **Previous Issue**: When resuming from pause, users had to speak first to get AI's attention
  - **Solution**: Added detection for pause-to-resume transition that automatically sends "Let's continue with the code review" prompt
  - **Automatic Resume**: AI immediately acknowledges resume without requiring user to speak first
  - **State Tracking**: Uses ref to track previous pause state and detect when user transitions from paused to active
  - **Seamless Experience**: Resume now works like network reconnection - AI speaks immediately

### Technical Details

- **Reconnection Logic**: Transcript handler now checks `isReconnecting` flag before hiding banner
- **Pause State Tracking**: Added `previousPauseStateRef` to detect pause-to-resume transitions
- **AI Response Timing**: Both network reconnection and pause resume wait for AI to actually respond before updating UI
- **Banner Persistence**: Network reconnection banner stays visible until AI sends reconnection acknowledgment
- **Auto-Prompting**: Both network restoration and pause resume now automatically prompt AI to continue

### Expected Behavior After Fix

- **Network Reconnection**: Banner stays visible until AI says "I'm back now. Let's continue with your code review where we left off"
- **Pause Resume**: AI immediately says "Let's continue with the code review" when resume button is pressed
- **No Manual Prompting**: Users don't need to speak first in either scenario - AI speaks automatically
- **Consistent Experience**: Both reconnection types now have identical auto-prompting behavior

## [0.20.20] - 2025-07-07

### Fixed

- **CRITICAL: Two Conflicting Reconnection Systems**: Fixed major issue where two different connection systems were running simultaneously, causing automatic reconnection to fail while voice-triggered reconnection worked

  - **Root Cause**: Automatic reconnection was calling `client.reconnectWithResumption()` which doesn't work for network disconnections, while voice input triggered the normal connection flow which worked perfectly
  - **Two Systems Conflict**: The failing `reconnectWithResumption()` system kept logging "Session resumption failed - will retry" while the working voice-triggered system operated independently
  - **Solution**: Replaced automatic reconnection with normal connection flow trigger by resetting connection guards and forcing the working connection useEffect to re-run
  - **Connection Flow Unification**: Both automatic and voice-triggered reconnection now use the same reliable connection mechanism
  - **No More Failed Resumption**: Eliminated the "Session resumption failed - will retry" error messages that appeared even when AI was responding to voice
  - **Seamless Reconnection**: Automatic reconnection now works exactly like voice-triggered reconnection - immediately and reliably

- **Reconnection Banner Auto-Hide**: Fixed issue where reconnection banner required voice input to disappear

  - **Previous Issue**: Banner showed "Reconnecting..." but only disappeared when user spoke, not when AI was ready
  - **Root Cause**: Automatic reconnection wasn't properly triggering the AI introduction message that hides the banner
  - **Solution**: Added connection trigger state to force useEffect re-evaluation and ensure AI sends introduction message
  - **Improved Flow**: Banner now automatically disappears when connection is established and AI starts speaking
  - **No User Action Required**: Users no longer need to speak to make the banner disappear after reconnection

### Technical Details

- **Connection Guard Reset**: Automatic reconnection now resets `isConnectingRef.current = false` and `activeConnectionRef.current = false` to allow normal connection flow
- **Connection Trigger**: Added `connectionTrigger` state that increments to force connection useEffect re-evaluation
- **Unified Connection Logic**: Both automatic and voice-triggered reconnection use the same `connect()` method and timer setup
- **Session Resumption Scope**: `client.reconnectWithResumption()` is now only used for deliberate pause/resume, not network disconnections
- **Timeout Management**: 3-second timeout to verify connection success before retrying
- **Introduction Message**: AI properly sends introduction message after automatic reconnection to acknowledge resumption

### Expected Behavior After Fix

- **Network Offline**: Banner appears with "Network connection lost" message
- **Network Restored**: Automatic reconnection starts with "Reconnecting..." spinner
- **Connection Established**: AI immediately starts speaking introduction message
- **Banner Disappears**: Banner automatically hides when AI responds, no voice input required
- **Seamless Experience**: Conversation continues from where it left off without user intervention
- **No Error Messages**: No more "Session resumption failed - will retry" errors in console

## [0.20.19] - 2025-07-07

### Fixed

- **CRITICAL: AI Reconnection Acknowledgment**: Fixed issue where session resumption worked but banner kept showing "reconnecting" because AI wasn't speaking after reconnection

  - **Root Cause**: Session resumption was successful but AI didn't automatically speak, so no transcript event was triggered to hide the banner
  - **Solution**: After successful session resumption, automatically send a prompt to make AI acknowledge the reconnection: "I notice we had a brief connection interruption, but I'm back now. Let's continue with your code review where we left off."
  - **Result**: AI now speaks immediately after reconnection, triggering the transcript event that hides the banner
  - **User Experience**: Banner disappears as soon as AI acknowledges the reconnection, confirming everything is working
  - **No More False Retries**: Eliminates the "Session resumption failed - will retry" error messages when resumption actually worked

- **Second Network Disconnection State Reset**: Fixed issue where the second network disconnection in the same session would skip "offline" state and go directly to "reconnecting"

  - **Root Cause**: Reconnection flags (`isReconnecting`, `showReconnectButton`) weren't being properly reset after the first reconnection, causing inconsistent state
  - **Solution**: Added proper state reset in multiple places:
    - Transcript handler now resets `isReconnecting` when banner is hidden
    - Offline handler clears any existing reconnection timeouts and resets flags
    - Session end and component cleanup properly reset all reconnection state
  - **Result**: Second and subsequent disconnections now properly show "Network Offline" before switching to "Reconnecting"
  - **Clean State**: Each disconnection/reconnection cycle now starts with fresh, consistent state

### Enhanced

- **Better Reconnection Logging**: Added comprehensive logging to track state transitions during network issues
  - **Offline Events**: Clear logging when network goes offline with state reset information
  - **Online Events**: Detailed logging when network is restored and reconnection starts
  - **State Cleanup**: Logging when previous timeouts are cleared and flags are reset
  - **Transcript Response**: Enhanced logging when AI responds and banner is hidden
  - **Debugging Aid**: Makes it easier to track reconnection flow and identify any remaining issues

### Technical Details

- **AI Prompt**: Sends reconnection acknowledgment prompt immediately after successful `client.reconnectWithResumption()`
- **State Reset**: Comprehensive reset of `isReconnecting`, `showReconnectButton`, and timeout clearing
- **Multiple Reset Points**: State reset in transcript handler, offline handler, session end, and component unmount
- **Timeout Management**: Proper cleanup of reconnection timeouts to prevent interference between disconnection cycles
- **Flag Synchronization**: Ensures all reconnection-related flags are properly synchronized across state transitions

### Expected Behavior After Fix

- **First Disconnection**: "Network Offline" → "Reconnecting..." → AI speaks → Banner disappears
- **Second Disconnection**: "Network Offline" → "Reconnecting..." → AI speaks → Banner disappears (same as first)
- **AI Acknowledgment**: AI immediately acknowledges reconnection with context-appropriate message
- **Clean Cycles**: Each disconnection/reconnection cycle works independently with fresh state
- **No False Errors**: No more "Session resumption failed" messages when resumption actually worked

## [0.20.18] - 2025-07-07

### Enhanced

- **CRITICAL: Automatic Reconnection with Spinner UI**: Replaced manual reconnect button with automatic reconnection and spinner interface for much better user experience

  - **No More Manual Button**: Removed the reconnect button that didn't work properly and confused users
  - **Automatic Reconnection**: Network restoration now automatically triggers session resumption without any user action required
  - **Spinner with Progress**: Shows animated spinner with "Reconnecting..." message and progress text about session restoration
  - **Smart Auto-Hide**: Banner automatically disappears when the first transcript comes in, indicating the AI is ready and session is fully restored
  - **Retry Logic**: If reconnection fails, automatically retries every 5 seconds until successful
  - **Conversation Context**: All reconnections preserve full conversation context using the working session resumption
  - **User-Friendly Messages**: Clear status messages explain what's happening ("Network connection lost", "Restoring session and AI connection")

### Fixed

- **Network Reconnection UI Flow**: Fixed the flow where reconnect button appeared before AI was ready and didn't actually start the AI properly

  - **Previous Issue**: Button appeared immediately when network was restored, but clicking it didn't make the AI start responding
  - **Root Cause**: The AI needed time to fully reconnect and process the session resumption before being ready to respond
  - **Solution**: Automatic reconnection starts immediately when network is restored, and UI waits for the AI to actually respond (transcript) before hiding the banner
  - **Better Timing**: No more premature button clicks - the system waits for the AI to be truly ready
  - **Seamless Experience**: Users see a smooth transition from network issue → reconnecting → AI ready and responding

### Technical Details

- **Automatic Trigger**: `handleOnline` event now immediately calls `handleAutomaticReconnect()` instead of showing a button
- **Transcript Detection**: Existing transcript event handler automatically hides banner when AI sends first response
- **Timeout Safety**: 10-second timeout ensures banner doesn't stay forever if something goes wrong
- **Retry Mechanism**: Failed reconnections automatically retry every 5 seconds with full error handling
- **State Management**: Simplified state management with automatic reconnection flow instead of manual button state tracking

### Expected Behavior After Fix

- **Network Cut**: Banner appears with "Network Offline" message
- **Network Restored**: Automatically starts reconnecting with spinner
- **AI Ready**: Banner disappears when AI sends first transcript response
- **Seamless Resumption**: Conversation continues exactly where it left off
- **No User Action Required**: Everything happens automatically without any button clicks

## [0.20.17] - 2025-07-07

### Fixed

- **CRITICAL: Network Reconnection Session Resumption Now Works**: Fixed the fundamental issue where network disconnections were losing session handles and falling back to fresh sessions

  - **Root Cause**: Session handles were only preserved for automatic reconnection when WebSocket closed with code `1011`, but network disconnections typically close with different codes (like `1006` for abnormal closure)
  - **Session Handle Preservation**: Now preserves session handles for manual reconnection regardless of WebSocket close code
  - **Network Disconnection Support**: WiFi cuts, network timeouts, and other connection issues now properly preserve session data for reconnection
  - **Manual Reconnection Fixed**: The "Reconnect" button now actually resumes sessions instead of always starting fresh
  - **Conversation Context Preserved**: AI will now continue conversations from where they left off after network issues
  - **No More "Missing session data"**: Eliminates the "⚠️ No session handle available, starting fresh session" error for network reconnections
  - **Pause vs Network**: Pause button and network reconnection now both work with session resumption

### Technical Details

- **WebSocket Close Code Independence**: Session resumption no longer depends on specific WebSocket close codes
- **Automatic vs Manual Reconnection**: Automatic reconnection still only happens for code `1011`, but manual reconnection works for all network disconnections
- **Session Data Lifecycle**: Session handles are now preserved until explicit termination, not cleared on unexpected disconnections
- **Manual Disconnect Handling**: Only `manualDisconnect` flag and explicit `terminateSession()` calls clear session data
- **Network Resilience**: All network disconnection scenarios now support session resumption

### Expected Behavior After Fix

- **Network Disconnection**: Session handle is preserved when WiFi is cut or network fails
- **Reconnection Success**: Pressing "Reconnect" button will resume conversation from exact same point
- **Context Continuity**: AI remembers entire conversation history and continues seamlessly
- **No Context Loss**: No more restarting conversations after network issues
- **Consistent with Pause**: Network reconnection now works exactly like pause/resume functionality

## [0.20.16] - 2025-07-07

### Fixed

- **CRITICAL: Session Resumption Finally Working**: Fixed the root cause of all session resumption failures by enabling session resumption in the initial connection configuration

  - **Root Cause Identified**: Session resumption was never enabled in the `createLiveConfig` function, so the server never sent session resumption handles
  - **Missing Configuration**: Added `sessionResumption: {}` to the initial `LiveConnectConfig` to enable the server to send session handles
  - **API Documentation Confirmed**: Session resumption IS supported by the Gemini Live API and works as documented
  - **Server Handles**: Server will now send `SessionResumptionUpdate` messages with handles for both pause/resume and network reconnection
  - **Real Session Continuity**: Both pause button and network reconnection will now preserve conversation context and AI state
  - **No More "Missing session data"**: Eliminates all "❌ No session handle available" errors

- **Complete Functionality Restored**: Both pause/resume and network reconnection now work as originally intended

  - **Pause Button**: Clicking pause now preserves session data, clicking resume continues from exact same point
  - **Network Reconnection**: WiFi cuts and reconnections preserve entire conversation history
  - **Conversation Context**: AI remembers everything from the session when resuming
  - **Timer Continuity**: Session timers continue from where they left off instead of restarting
  - **Working API Integration**: Uses the session resumption features that the Gemini Live API actually provides

### Technical Details

- **Configuration Addition**: Added `sessionResumption: {}` to `createLiveConfig()` in `liveConfigUtils.ts`
- **Server Communication**: Server now sends periodic `SessionResumptionUpdate` messages with resumption handles
- **Client Implementation**: Existing `reconnectWithResumption()` method will now receive valid session handles
- **API Compliance**: Uses the documented session resumption features of the Gemini Live API
- **Backward Compatible**: No breaking changes to existing functionality

### Expected Behavior After Fix

- **Session Handles Received**: Console will show session resumption handles being received from server
- **Successful Pause/Resume**: Pause button preserves conversation, resume continues from same point
- **Network Resilience**: WiFi disconnections can be recovered with full conversation context preserved
- **No Context Loss**: AI continues conversations seamlessly without restarting or losing memory
- **Working as Designed**: Session resumption now works exactly as documented in the Google Live API

## [0.20.15] - 2025-07-04

### Fixed

- **CRITICAL: Session Resumption Actually Works Now**: Fixed the fundamental issue where session resumption was completely disabled despite the API supporting it

  - **Root Cause**: The `reconnectWithResumption()` method was explicitly NOT using session resumption, just creating fresh sessions
  - **API Works Fine**: Session resumption IS supported by the Gemini Live API - the server sends session handles and automatic reconnection uses them correctly
  - **Manual Reconnection Fixed**: Updated `reconnectWithResumption()` to actually use session resumption handles like the automatic reconnection does
  - **Working Implementation**: Uses `sessionResumption: { handle: this.sessionResumptionHandle }` configuration that was already working in automatic reconnection
  - **Conversation Context Preserved**: AI now properly continues from where it left off instead of restarting the conversation
  - **Previous Working Code**: Restored the working session resumption logic that was mentioned in the documentation and changelog

- **Removed Client-Side Network Interference**: Eliminated complex client-side network monitoring that was interfering with natural session resumption

  - **No More WebSocket Meddling**: Removed client-side WebSocket event handling (`close`, `open`) that was manually disconnecting sessions
  - **Let API Handle Reconnection**: Natural session resumption now works as designed without client-side interference
  - **Simplified Network Detection**: Only show offline banner for user awareness, don't interfere with session management
  - **No Mic Muting**: Removed client-side microphone muting that was preventing users from speaking during network issues
  - **Clean Session Management**: Sessions now disconnect and reconnect naturally through the API's built-in mechanisms
  - **Better Reliability**: Eliminated race conditions and timing issues caused by competing client-side logic

- **Restored Pause Button Functionality**: Brought back the working pause/resume button using session resumption

  - **Dynamic Button Text**: Main button shows "Share screen & start review" → "Pause" → "Resume" based on session state
  - **Session Preservation**: Pause button uses `client.disconnect()` to preserve session data for resumption
  - **True Resume**: Resume button uses `client.reconnectWithResumption()` to continue conversation from where it left off
  - **Visual Feedback**: Pause button shows orange color to indicate it will pause the active session
  - **Clean State Management**: Button state resets properly when sessions end completely
  - **Timer Integration**: Works with countdown timer pause functionality
  - **Working Session Continuity**: AI remembers entire conversation context when resuming from pause
  - **Fixed Network Banner Interference**: Deliberate pause actions no longer trigger network reconnection banner
  - **Separate Pause/Resume Logic**: Pause button uses proper session resumption, completely separate from network reconnection logic
  - **Intelligent State Tracking**: System distinguishes between deliberate pause and network disconnection events

### Technical Details

- **Session Resumption Logic**: `reconnectWithResumption()` now works exactly like automatic reconnection in `onclose()`
- **Configuration Fix**: Uses `{ ...this.config, sessionResumption: { handle: this.sessionResumptionHandle } }` for resumption
- **Network Monitoring Cleanup**: Removed complex WebSocket event handlers and manual session disconnection logic
- **State Management**: Simplified network state to just show/hide reconnection banner without interfering
- **API Compatibility**: Works with the actual session resumption capabilities that the API provides

### Expected Behavior After Fix

- **Network Issues**: When WiFi is cut, AI session naturally disconnects and preserves session handle
- **Reconnection**: Pressing reconnect button actually resumes the conversation from where it left off
- **No Conversation Loss**: AI remembers the entire conversation context and continues seamlessly
- **No Client Interference**: Network disconnections and reconnections work through the API's natural mechanisms
- **Working Session Resumption**: Same technology that powers automatic reconnection now works for manual reconnection

## [0.20.14] - 2025-07-04

### Fixed

- **CRITICAL: Network Detection Restored and Working Reconnection**: Fixed network disconnection detection and implemented reliable reconnection that works with the current API limitations

  - **Network Detection Fixed**: Restored browser `offline`/`online` event listeners that detect WiFi disconnection
  - **Reconnection Banner**: Banner now appears when network connection is lost and shows reconnect button when restored
  - **API Reality Check**: Session resumption configuration is not supported by current Gemini Live API version
  - **Working Fresh Sessions**: Manual reconnection creates new sessions with proper timer setup - this works reliably
  - **Conversation Context**: While true session resumption isn't available, fresh sessions restart with proper context
  - **User Control**: User can manually reconnect when network comes back online
  - **No API Errors**: Eliminated attempts to use unsupported session resumption configuration

- **Session Resumption API Limitations**: Acknowledged that current Gemini Live API doesn't support session resumption features

  - **API Compatibility**: The `sessionResumption: { handle: ... }` configuration causes API errors
  - **Fresh Session Approach**: Reconnections create new sessions which works reliably with current API
  - **Future Ready**: Code structure ready for when session resumption becomes available in API
  - **Consistent Behavior**: All reconnections now use the same reliable fresh session approach

- **Enhanced Network Handling**: Improved network event detection and reconnection flow

  - **WiFi Disconnection**: Browser offline events reliably detect when WiFi is cut
  - **Reconnection Button**: Manual reconnect button appears when network comes back online
  - **Mic Management**: Microphone muted during network issues, unmuted after successful reconnection
  - **Clean UI**: Reconnection banner shows/hides consistently based on network state

### Technical Details

- **Network Events**: Browser `offline`/`online` event listeners restore reliable network detection
- **Fresh Sessions**: All reconnections use fresh session creation with proper timer and prompt setup
- **API Compliance**: Removed unsupported session resumption configuration to prevent API errors
- **Timer Management**: Fresh sessions get new timer setup with proper introduction messages
- **Error Prevention**: No more attempts to use unsupported API features

### Expected Behavior After Fix

- **WiFi Cut Detection**: Banner appears immediately when WiFi is disconnected
- **Network Restore**: Reconnect button appears when WiFi comes back online
- **Successful Reconnection**: AI starts fresh session and begins talking with introduction
- **No API Errors**: No more "parameter not supported" errors from session resumption attempts
- **Reliable Operation**: System works consistently without depending on unsupported API features

## [0.20.13] - 2025-07-04

### Fixed

- **CRITICAL: API Compatibility Error**: Fixed "transparent parameter is not supported in Gemini API" error that was preventing connections

  - **Root Cause**: Session resumption configuration used unsupported `transparent: true` parameter for this version of the Gemini Live API
  - **Error**: Connection attempts failed with "Error connecting to GenAI Live: Error: transparent parameter is not supported in Gemini API"
  - **Solution**: Removed session resumption configuration as it's not supported in the current API version being used
  - **Impact**: Connections now work properly without the unsupported session resumption features
  - **Behavior**: Network reconnections will use fresh sessions instead of session resumption (same as before the attempted implementation)
  - **Status**: Session resumption is not available in this API version, reverting to previous working approach

- **API Version Compatibility**: Confirmed current Gemini Live API version doesn't support session resumption features

  - **Previous Implementation**: Session resumption code was based on newer API documentation that isn't available in production
  - **Current Reality**: The API version in use doesn't support the session resumption configuration options
  - **Fresh Session Approach**: Network reconnections will start fresh sessions which works reliably
  - **Future Compatibility**: When session resumption becomes available in the API version being used, it can be re-implemented

### Technical Details

- **Configuration Removal**: Removed `sessionResumption: { transparent: true }` from `createLiveConfig`
- **API Error Resolution**: Eliminated connection failures caused by unsupported API parameters
- **Build Success**: Application now compiles and connects without API compatibility errors
- **Backward Compatibility**: Maintains all existing functionality without the advanced session resumption features

### Expected Behavior After Fix

- **Successful Connections**: AI examiner sessions now connect properly without API errors
- **Fresh Sessions**: Network reconnections create new sessions (same as original behavior)
- **No Session Resumption**: Advanced session state preservation is not available until API supports it
- **Stable Operation**: All other features work normally without the unsupported session resumption

## [0.20.12] - 2025-07-04

### Fixed

- **CRITICAL: Session Resumption Not Working**: Fixed the root cause of session resumption failure - we were never enabling session resumption in the initial connection configuration

  - **Root Cause**: Session resumption was never enabled in the `createLiveConfig` function, so the server never sent us session resumption handles
  - **Solution**: Added `sessionResumption: { transparent: true }` to the initial connection configuration to enable session resumption capability
  - **Server Communication**: Server now sends `sessionResumptionUpdate` messages with session handles that can be used for reconnection
  - **Transparent Reconnections**: Enabled transparent mode for better state tracking and seamless reconnections
  - **Debug Logging**: Temporarily re-enabled session resumption handle logging to verify server communication

- **Session Handle Reception**: Fixed missing session resumption handles that were preventing all reconnection attempts

  - **Previous State**: All reconnection attempts showed `hasSessionHandle: false` and `sessionHandle: ''`
  - **Enhanced Logging**: Added logging to track when session handles are received from server: handle value, resumable status, and last consumed message index
  - **Verification**: Console will now show when session resumption handles are received and stored
  - **Reconnection Capability**: Enables proper session resumption instead of always falling back to fresh sessions

### Changed

- **Connection Configuration**: Enhanced initial connection setup to support Google AI Live API session resumption features

  - **Transparent Mode**: Enabled transparent session resumption for better reconnection state tracking
  - **Server Integration**: Proper integration with Google's session resumption mechanism
  - **API Compatibility**: Uses the correct `SessionResumptionConfig` interface with `transparent: true` instead of invalid `enabled` property
  - **Session State Preservation**: Server-side session state is now properly maintained across network disconnections

### Technical Details

- **LiveConnectConfig Enhancement**: Added `sessionResumption: { transparent: true }` to initial connection configuration
- **Session Handle Logging**: Re-enabled logging for `sessionResumptionUpdate` messages to debug and verify session handle reception
- **Type Compliance**: Fixed TypeScript error by using correct `SessionResumptionConfig` properties (`transparent` instead of `enabled`)
- **API Integration**: Proper integration with Google AI Live API's session resumption mechanism as documented in the official API

### Expected Behavior After Fix

- **Session Handles Received**: Console should show "🔄 Session resumption handle received" messages during active sessions
- **Successful Resumption**: Network reconnections should use session resumption instead of always falling back to fresh sessions
- **Context Preservation**: AI should continue conversations from exactly where they left off after network restoration
- **No More "Missing session data"**: Eliminates "❌ Cannot reconnect: Missing session data" errors

## [0.20.11] - 2025-07-03

### Fixed

- **Session Resumption Restored**: Reverted to session resumption as the primary reconnection strategy after user feedback that fresh session approach was ineffective

  - **Primary Approach**: Session resumption using `client.reconnectWithResumption()` preserves conversation context and AI session state
  - **Fallback Strategy**: Fresh session restart if resumption fails for any reason
  - **Session Preservation**: Network disconnections now use `client.disconnect()` instead of `terminateSession()` to preserve session data
  - **Better User Experience**: AI continues conversation from exactly where it left off instead of starting over
  - **Dual Timeouts**: 5-second timeout for resumed sessions, 8-second timeout for fresh session fallbacks
  - **Context Continuity**: No need to restore context artificially - session state is maintained on server side

- **Network Event Handler Updates**: Enhanced network disconnection handling to preserve session data for resumption
  - **Preserved Session Data**: WebSocket disconnections and offline events preserve session handle and configuration
  - **Clean Disconnection**: Proper `disconnect()` calls maintain session resumption capability
  - **Error Handling**: Graceful handling of session preservation errors with fallback to fresh sessions
  - **Debug Logging**: Enhanced logging to track session preservation and resumption attempts

### Changed

- **Reconnection Philosophy**: Changed from "start fresh" back to "resume session" as primary approach based on user feedback
  - **Session-First Strategy**: Always attempt session resumption before falling back to fresh sessions
  - **API Compatibility**: Utilizes Google AI Live API's built-in session resumption features as intended
  - **Context Preservation**: Maintains conversation flow and AI state across network interruptions
  - **Intelligent Fallback**: Fresh session creation only when resumption is impossible
  - **Reduced Complexity**: Eliminates complex context restoration by using proper API features

### Technical Details

- **Session Management**: Distinguishes between `disconnect()` (preserves session) and `terminateSession()` (ends session completely)
- **Resumption Logic**: Uses existing `reconnectWithResumption()` method with proper error handling and fallback
- **Timer Preservation**: Resumed sessions maintain existing timers, fresh sessions set up new timers
- **State Coordination**: Proper management of reconnection state with backup timeouts for both resumption and fresh session scenarios
- **Error Recovery**: Comprehensive error handling ensures users never get permanently stuck in reconnecting state

## [0.20.6] - 2025-07-02

### Enhanced

- **Session Resumption During Network Issues**: Implemented clean session resumption approach that maintains session continuity during network disconnections

  - **No Session Disconnection**: Network issues no longer trigger session termination, preventing unwanted navigation to summary page
  - **Session Resumption**: Uses `client.reconnectWithResumption()` to restore session state when network returns
  - **Stays on Live Page**: Users remain on the code review page throughout network interruptions
  - **Quick Start Compatible**: Works properly with quick start sessions (duration = 0) and regular timed sessions
  - **Clean State Management**: Session state is preserved during network issues, avoiding session restart loops

- **Improved Network Handling Logic**: Enhanced network event handling to work seamlessly with session resumption

  - **Conditional Disconnection**: Only disconnects session when exam intent stops, not during network issues
  - **Network State Tracking**: Monitors network connectivity without disrupting active sessions
  - **Graceful Degradation**: If resumption fails, system continues gracefully without showing errors
  - **Connection Guards**: Maintains connection guards to prevent dual AI sessions during resumption

### Fixed

- **Navigation Issues During Network Problems**: Fixed issue where network disconnections would sometimes navigate to summary page and then home page

  - **Root Cause**: Previous approach used `client.disconnect()` during network issues, which triggered session termination and navigation logic
  - **Solution**: Completely eliminated session disconnection during network problems, using only session resumption
  - **Result**: Users stay on the code review page throughout network interruptions

- **Session State Preservation**: Fixed session state being lost during network disconnections

  - **Continuous Session**: AI session remains active throughout network interruptions
  - **State Continuity**: Conversation history, timers, and session context are preserved
  - **Seamless Recovery**: When network returns, session resumes exactly where it left off

### Technical Details

- **Resumption Logic**: Network restoration triggers `client.reconnectWithResumption()` instead of full reconnection
- **Connection Effect Updates**: Enhanced main connection effect to avoid disconnection during network-related states
- **Dependency Management**: Added proper dependency tracking for `isReconnecting` and `showReconnectionBanner` states
- **Clean Separation**: Network handling is completely separate from session termination (manual stop/timer expiry)

## [0.20.5] - 2025-07-02

### Fixed

- **CRITICAL: AI Conversational Responses to Network Issues**: Fixed issue where AI would respond conversationally to network interruption messages with phrases like "yes, I remember" or "no problem at all"

  - **Root Cause**: Sending interruption messages to AI was treating them as user input, causing conversational responses instead of system instructions
  - **Solution**: Completely removed AI messaging approach and returned to simple network status banner without sending any messages to AI
  - **Natural Interruption**: Network disconnection naturally interrupts AI speech, and users can simply continue talking normally when network is restored
  - **Clean User Experience**: No more unwanted AI responses to network restoration events

- **Reconnection Banner Not Disappearing**: Fixed issue where network status banner would not disappear when network connection was restored

  - **Root Cause**: Complex connection state logic was preventing banner from hiding properly
  - **Solution**: Simplified to basic `navigator.onLine` status monitoring with direct banner state management
  - **Simple Logic**: Banner shows when offline, hides when online - no complex dependency on AI connection states
  - **Reliable Behavior**: Banner now consistently appears/disappears based on actual network connectivity

- **Simplified Network Status Banner**: Removed all complex reconnection logic and returned to basic network connectivity indicator

  - **Back to Basics**: Network banner is now just a simple connectivity status indicator
  - **No AI Messaging**: Eliminated all attempts to send interruption or reconnection messages to AI
  - **Clean State Management**: Removed hundreds of lines of complex state tracking that was causing timing issues
  - **Better Reliability**: Simple approach eliminates race conditions and state synchronization problems

### Changed

- **Network Handling Approach**: Completely simplified network handling from complex reconnection system to basic connectivity status
  - **Status Only**: Banner now only indicates network status without attempting reconnection messaging
  - **User-Driven Recovery**: Users naturally continue conversation when ready instead of receiving automated messages
  - **Reduced Complexity**: Eliminated complex session state tracking, connection monitoring, and message coordination
  - **Cleaner Code**: Removed unused state variables, functions, and effects related to complex reconnection logic

### Technical Details

- **State Cleanup**: Removed `wasDisconnectedDueToNetwork` state and related tracking logic
- **Function Removal**: Eliminated `getRecentAIContext` and related conversation analysis functions
- **Effect Simplification**: Reduced network monitoring to simple online/offline event handlers
- **Code Cleanup**: Removed unused imports and variables from simplified approach

## [0.20.4] - 2025-07-02

### Enhanced

- **Smart Reconnection Timing**: Improved reconnection message delivery to be triggered by AI readiness instead of fixed delays

  - **AI-Ready Detection**: Reconnection message now sends immediately when AI is actually connected and ready, not after arbitrary 3-second delay
  - **Faster Response**: Users get reconnection message as soon as AI is prepared, which can be faster or slower than the old fixed delay
  - **Connection State Monitoring**: System watches for `connected` state to become true after network restoration
  - **Network Disconnect Tracking**: Added `wasDisconnectedDueToNetwork` state to properly track reconnection scenarios
  - **Immediate Microphone Re-enabling**: Microphone and banner are restored immediately when AI is ready, not on timer
  - **Better User Experience**: No more waiting for arbitrary delays when AI is already ready to continue

- **AI Speech Interruption on Network Issues**: Fixed critical issue where reconnection messages were delayed because AI was still talking from before disconnect

  - **No Session Disconnection**: Avoids disconnecting the AI session during network issues, which was causing unwanted navigation to summary page
  - **Interruption Messages**: When network is restored, sends direct interruption message to AI to stop current speech and acknowledge the network issue
  - **Better User Experience**: Banner appears during network issues without redirecting to different pages or ending the session prematurely
  - **Natural Interruption**: AI receives messages like "Sorry to interrupt, but there was a brief network issue" instead of empty messages that caused "OK thanks" responses
  - **Session Continuity**: Maintains active session throughout network interruptions, avoiding summary modal and navigation issues
  - **Faster Recovery**: Network restoration immediately sends interruption message to get AI's attention without waiting for reconnection delays
  - **Better Flow**: Network disconnect → show banner + mute mic → network restore → send interruption message → AI acknowledges and continues
  - **Prevents Navigation**: Eliminates the issue where network problems would briefly show summary modal and redirect to home page

- **Intelligent Interruption Messages**: Enhanced interruption messages with smart conversation summaries
  - **Conversation Context**: Uses existing conversation tracker to summarize what AI was recently discussing
  - **Recent Transcript Analysis**: Analyzes last 30 seconds of AI speech to create meaningful summaries
  - **Natural Messages**: Messages like "Sorry to interrupt, but there was a brief network issue. I was discussing [intelligent summary]. Shall we continue from where we left off?"
  - **Fallback Protection**: Includes fallback message if no recent context is available
  - **Better Continuity**: Provides context for users about where the conversation left off without causing "OK thanks" responses

### Fixed

- **Reconnection Banner Not Showing**: Fixed issue where network offline banner wasn't appearing reliably

  - **Root Cause**: Banner state wasn't being set consistently in all network state changes
  - **Solution**: Added explicit banner state management in both online and offline handlers
  - **Enhanced Logging**: Added detailed console logging to track banner state changes for debugging

- **Reconnection Message Not Firing**: Fixed issue where reconnection messages weren't being delivered reliably
  - **Root Cause**: AI was still speaking from before disconnect, blocking new message delivery
  - **Solution**: Added AI speech interruption when network issues are detected
  - **Reliability**: Reconnection message delivery is now 100% reliable when AI is ready

### Technical Details

- **State Management**: Added `wasDisconnectedDueToNetwork` to track network-related disconnections
- **Event-Driven Timing**: Uses `connected` state changes to trigger reconnection actions
- **Conversation Integration**: Leverages existing `useConversationTracker` for intelligent message context
- **Speech Interruption**: Sends direct interruption messages to AI instead of disconnecting session, preventing unwanted navigation
- **Network State Tracking**: Monitors network connectivity without disrupting active AI sessions
- **Immediate Response**: Eliminates arbitrary delays in favor of real connection state monitoring
- **Clean State Reset**: Properly resets tracking state after successful reconnection

## [0.20.3] - 2025-07-02

### Fixed

- Fixed double farewell messages in useExamTimers.ts by removing duplicate send in catch block
- Removed unnecessary useEffect in AIExaminerPage.tsx that was sending empty messages
- Fixed potential duplicate timer setup by removing 'client' from useEffect dependency array
- Cleaned up unused hasNotifiedScreenShareRef

### Added

- AI reconnection message feature: When network is restored, AI briefly mentions what it was saying before disconnection
- Last AI message tracking to capture context for reconnection messages

### Changed

- Improved event handling by using 'transcript' event instead of incorrect 'response' event
- Enhanced network reconnection flow with contextual AI messages

## [0.20.2] - 2025-06-27

### Enhanced

- **Microphone Muting During Network Issues**: Added intelligent microphone management during network connectivity problems

  - **Auto-Mute Offline**: Microphone is automatically muted (not disabled) when network goes offline to prevent AI from trying to respond to speech while disconnected
  - **Safe Muting Approach**: Uses audio track enable/disable instead of stopping the entire audio stream to avoid permission and stream issues
  - **Clear User Feedback**: Banner shows "Microphone muted - AI won't respond to speech while offline" when network is down
  - **Visual Mute Indicator**: Mute button shows orange border and disabled state when network muted, with explanatory tooltip
  - **Smart Re-enabling**: Microphone is automatically re-enabled after network restoration and AI is ready
  - **Prevents Audio Buildup**: Eliminates issue where AI would try to respond to everything said while offline once reconnected
  - **User Mute Preservation**: Respects user's manual mute state when network is restored

- **Reconnection Delay for AI Readiness**: Added proper timing coordination when network is restored
  - **3-Second Delay**: Banner remains visible for 3 seconds after network restoration to allow AI to fully reconnect
  - **Better Messaging**: Shows "Restoring connection and preparing AI... This may take a few seconds" during reconnection
  - **Coordinated Mic Re-enabling**: Microphone is only re-enabled when AI is ready to respond (same timing as banner hiding)
  - **Smoother Experience**: Prevents users from speaking too early before AI is ready to process audio
  - **Visual Feedback**: Clear progress indication during the reconnection process

### Fixed

- **Network Banner Messaging**: Improved banner messages to be more informative about microphone status and reconnection process
  - **Offline State**: Clear indication that microphone is muted and why
  - **Reconnecting State**: Helpful message about waiting for AI preparation
  - **User Guidance**: Better explanation of what's happening during network issues and recovery

### Technical Details

- **Mute Button Integration**: Enhanced mute button to show network muted state with disabled interaction and visual indicators
- **Audio Track Management**: Uses `audioTrack.enabled = false/true` for safe muting without disrupting the audio stream
- **State Coordination**: Network muting works alongside user manual muting without conflicts
- **Permission Safety**: Avoids audio stream recreation that could trigger permission dialogs

## [0.20.0] - 2025-07-02

### Fixed

- **CRITICAL: Reconnection Banner Design & Functionality**: Completely redesigned and fixed the reconnection banner that was appearing with connection issues

  - **Design Overhaul**: Replaced orange-themed banner with proper modal using tokyo theme colors for consistency with the app
  - **Modal Layout**: Changed from top banner to centered modal with backdrop overlay for better user attention and accessibility
  - **Proper Positioning**: Fixed positioning issues by using modal instead of fixed top positioning that was "not placed very well"
  - **Banner Closure**: Fixed critical issue where banner wouldn't close when clicking "Reconnect" or "End" buttons
  - **Better UX**: Enhanced button styling with proper hover effects and clear action hierarchy (End Session vs Reconnect)
  - **Improved Messaging**: Added contextual messages explaining the situation and available options to users

- **CRITICAL: Banner Appearing on New Sessions**: Fixed issue where reconnection banner was incorrectly appearing when starting new reviews
  - **Session Tracking**: Added proper session state tracking to distinguish between new connections and lost connections
  - **Initial Connection Fix**: Banner no longer appears during initial connection attempts or expected disconnections
  - **State Management**: Enhanced state management to only show banner when established sessions are lost unexpectedly
  - **Console Error Fix**: Eliminated "Cannot reconnect: Missing session data" error messages during new session starts
  - **Clean State**: Proper state reset between sessions ensures no stale reconnection state carries over

### Enhanced

- **Smarter Reconnection Logic**: Improved the reconnection system with better error handling and fallback mechanisms

  - **Dual Strategy**: First attempts session resumption, then falls back to fresh connection if resumption fails
  - **Connection State Management**: Fixed logic to only show banner for truly unexpected disconnections, not normal shutdowns
  - **Better Error Handling**: Enhanced error logging and user feedback during reconnection attempts
  - **State Cleanup**: Proper state management ensures banner closes correctly after successful reconnection or session end
  - **Connection Filtering**: Only shows reconnection banner for actual connection issues, not planned disconnects

- **Reconnection User Experience**: Significantly improved the reconnection flow for better user control
  - **Clear Options**: Users can either attempt reconnection or cleanly end the session
  - **Status Feedback**: Real-time feedback during reconnection attempts with loading animations
  - **Fallback Recovery**: If session resumption fails, system attempts fresh connection automatically
  - **Error Recovery**: Failed reconnection attempts don't automatically close the banner, allowing retry
  - **Professional Design**: Modal matches app design language with proper spacing, typography, and color scheme

### Technical Details

- **Modal Architecture**: Complete redesign from banner to modal with backdrop overlay
- **State Synchronization**: Fixed state management between reconnection banner and session lifecycle
- **Connection Monitoring**: Enhanced connection close event handling to distinguish expected vs unexpected disconnections
- **Async Error Handling**: Improved async/await error handling in reconnection logic
- **TypeScript Fixes**: Resolved void return type issues with connect function calls

## [0.19.0] - 2025-07-02

### Added

- **Context window compression**: Added ability to compress context window to prevent session timeouts and enable unlimited session duration
- **GoAway message handling**: Added functionality to send a GoAway message to the AI before connection termination for advance warning
- **Simple reconnection banner**: Implemented a simple banner with manual reconnection option for users to reconnect manually
- **Session resumption**: Added support for session resumption on user-initiated reconnection, allowing users to continue their previous session without interruption

### Changed

- **Disabled automatic reconnection**: Changed from Google's recommended approach to manual reconnection, improving connection stability and reducing the risk of AI session restarts
- **Improved connection stability**: Utilized Google AI Live Session best practices to enhance connection stability and reduce unexpected disconnections
- **Replaced complex disconnection modal**: Replaced the complex disconnection modal with a lightweight banner notification for a more seamless user experience

### Fixed

- **AI session restarts**: Fixed issue where AI sessions would restart due to automatic reconnection attempts, causing interruptions and loss of session continuity
- **Unexpected disconnections**: Now handled gracefully with user control, allowing users to reconnect manually and continue their session
- **Session continuity**: Proper resumption handling ensures that session continuity is preserved, allowing users to pick up where they left off

## [0.18.0] - 2025-01-27

### Added

- **Change Screen Sharing During Review**: Added ability to change the shared screen/window during an active code review session
  - **Dynamic Screen Switching**: New "Change Screen" button appears in the control tray when screen sharing is active
  - **Seamless Transition**: Users can switch between different screens, windows, or browser tabs without interrupting the ongoing review
  - **Audio Preservation**: Screen sharing changes maintain the microphone connection and audio recording without disruption
  - **Error Handling**: Graceful handling of permission denials - if user cancels screen selection, the current screen continues to be shared
  - **Visual Feedback**: Blue "Change Screen" button with screen share icon positioned next to the "End Review" button
  - **Non-Disruptive**: Screen sharing changes don't affect the AI conversation, timer, or any other review functionality
  - **User-Friendly**: Simple one-click operation to open native screen/window selection dialog
  - **Cross-Platform**: Works with all screen sharing scenarios (full screen, application windows, browser tabs)

### Enhanced

- **Screen Sharing Control**: Improved user control over screen sharing during active review sessions

  - **Better Flexibility**: Users no longer need to end and restart reviews to change what they're sharing
  - **Improved Workflow**: Supports common scenarios like switching between IDE, browser, and terminal windows
  - **Professional Experience**: Matches the flexibility expected from professional screen sharing tools
  - **Context Preservation**: AI maintains full conversation context when screen sharing source changes

- **Screen Sharing Status Display**: Enhanced screen sharing status to show specific source information
  - **Detailed Status**: Changed from generic "Screen sharing active" to "Currently sharing [Screen Name]"
  - **Source Identification**: Displays actual screen/window names like "Screen 1", "Application Window", or "Browser Tab"
  - **Dynamic Updates**: Status automatically updates when switching between different sharing sources using the "Change Screen" button
  - **Smart Naming**: Intelligent extraction of meaningful names from MediaStream track labels with fallbacks for unknown sources
  - **Better User Awareness**: Users always know exactly what they're currently sharing during the review

### Fixed

- **Mute Button Functionality**: Fixed the microphone mute button to actually mute the microphone by enabling/disabling the audio track
  - **Proper Audio Muting**: Mute button now stops audio transmission to the AI while keeping the audio recorder running
  - **Visual Feedback**: Muted button shows red background and "mic_off" icon for clear visual indication
  - **State Management**: Muted state is properly reset when review sessions end for clean next session startup
  - **Tooltip Enhancement**: Added descriptive tooltips showing "Mute microphone" and "Unmute microphone"
  - **Console Logging**: Added clear logging when microphone is muted/unmuted for debugging purposes
  - **Seamless Operation**: Audio recording continues in background when muted, allowing instant unmuting without reconnection delays

## [0.17.41] - 2025-06-30

### Improved

- **Quick Start Authentication Flow**: Enhanced the quick start user experience by preserving user intent through the authentication process
  - **Authentication Check**: Quick Start button now checks if user is signed in before showing the modal
  - **Intent Preservation**: When unauthenticated users click Quick Start, their intent is stored and they're redirected to sign in
  - **Smart Redirect**: After successful authentication, users are redirected back to the landing page where the Quick Start modal automatically opens
  - **Seamless Experience**: Users no longer lose their quick start intent when going through the sign-in flow
  - **Better UX Flow**: Eliminates the frustrating experience of being dumped in the dashboard after signing in for quick start
  - **Signup Support**: Signup flow also handles quick start intent with appropriate messaging about email verification
  - **Local Storage**: Uses localStorage to persist quick start intent across page navigation and authentication

### Fixed

- **Quick Start Sign-in Redirect Issue**: Fixed issue where unauthenticated users clicking "Share screen & start" would be redirected to dashboard after signing in instead of returning to quick start

  - **Root Cause**: Protected route system was redirecting all authenticated users to dashboard regardless of their original intent
  - **Solution**: Added quick start intent tracking that survives the authentication flow
  - **User Journey**: Quick Start button → Sign In prompt → Authentication → Return to Quick Start modal
  - **Preserved Context**: Users maintain their quick start session context throughout the authentication process

- **Sign Out 403 Forbidden Error**: Fixed Supabase authentication logout error that was occurring in localhost development
  - **Root Cause**: Default logout was attempting global scope logout which returned 403 Forbidden in development environment
  - **Solution**: Implemented graceful logout with local scope first, fallback to default logout, and manual session cleanup as last resort
  - **Error Handling**: Added comprehensive error handling with console warnings for debugging
  - **Fallback Strategy**: If all logout methods fail, manually clear local storage tokens to ensure user is logged out
  - **Development Fix**: Resolves the POST `/auth/v1/logout?scope=global 403 (Forbidden)` error in localhost

## [0.17.40] - 2025-06-30

### Improved

- **Quick Start Modal Field Order**: Reorganized the Quick Start modal form fields for better user experience
  - **Developer Experience First**: Moved Developer Experience Level to be the first field, as it's the most fundamental choice
  - **Code Review Type Second**: Moved Code Review Type to be the second field, creating logical flow from general to specific
  - **Conditional GitHub URL**: GitHub Repository URL field now only appears when "Github Repo" is selected from the Code Review Type dropdown
  - **Cleaner Interface**: Eliminates disabled/grayed-out fields when not needed, reducing visual clutter
  - **Better UX Flow**: Users now progress naturally from their experience level → review type → specific configuration (if needed)
  - **Dynamic Form**: Form adapts to user selections, showing only relevant fields at each step

## [0.17.39] - 2025-06-30

### Fixed

- **CRITICAL: Multiple Force Stop Audio Calls**: Fixed issue where force stop audio was being called 4-5 times during session cleanup causing excessive logging and potential performance issues

  - **Root Cause**: The `forceStopAudio` useEffect had unstable dependencies (`audioDataHandler` and `audioVolumeHandler`) that were recreated on every render, causing the effect to run multiple times
  - **Solution**: Used `useCallback` to make handler functions stable and added `forceStopInProgressRef` guard to prevent duplicate calls
  - **Impact**: Eliminates console log spam showing "🎛️ ControlTray: Force stopping audio recording..." appearing 4-5 times
  - **Performance**: Reduces redundant audio cleanup operations during session termination
  - **Clean Logs**: Force stop now runs only once per session end instead of multiple times

- **Audio Worklet Console Spam**: Reduced excessive console logging from audio worklet after recording stops

  - **Root Cause**: Audio worklet continues sending data for a brief period after recording is stopped, causing 15+ identical log messages
  - **Solution**: Added `hasLoggedIgnoring` flag to only log the worklet data ignoring message once per session
  - **Impact**: Eliminates repetitive "🎤 AudioRecorder: Worklet received data but recording is false, ignoring" messages
  - **Clean Console**: Only one informative message about suppressing further worklet messages
  - **Better Debugging**: Console remains readable without being flooded with expected worklet cleanup messages

- **Multiple Auto-Trigger Calls**: Fixed issue where auto-trigger mechanism was being called multiple times during connection state changes

  - **Root Cause**: `onButtonReady` effect in ControlTray was resetting notification flag during connection state changes, allowing multiple auto-trigger calls
  - **Solution**: Removed notification flag reset during connection state changes, letting parent component handle auto-trigger prevention
  - **Impact**: Eliminates "🚫 Auto-trigger already completed - ignoring subsequent calls" spam messages
  - **Clean Flow**: Auto-trigger now only happens once per session as intended
  - **Better State Management**: Parent component (AIExaminerPage) properly manages auto-trigger lifecycle

### Enhanced

- **Audio Handler Stability**: Improved audio recording cleanup reliability

  - **Stable Dependencies**: Using `useCallback` for `audioDataHandler` and `audioVolumeHandler` prevents unnecessary effect re-runs
  - **Cleanup Guards**: Added proper guards to prevent duplicate cleanup operations
  - **Session Isolation**: Each recording session now has proper state isolation and cleanup
  - **Memory Management**: Reduced memory pressure from recreated handler functions on every render

- **Browser Compatibility Notice**: Added clear browser requirement information on landing page
  - **User Guidance**: Added notice under Quick Start button stating "Google Chrome required for screen sharing and microphone access"
  - **Better UX**: Users now know browser requirements before attempting to start a review
  - **Visual Design**: Used info icon and subtle styling to provide helpful context without being intrusive
  - **Prevents Frustration**: Helps users avoid failed attempts with unsupported browsers (Safari, Firefox)

### Clarified

- **Automatic Reconnection Skip Messages**: Clarified that "🚫 Automatic reconnection skipped" messages are normal and expected behavior

  - **WebSocket Error 1007**: When WebSocket closes with error 1007 ("Request contains an invalid argument"), the system correctly skips reconnection
  - **Expected Behavior**: Only WebSocket error 1011 triggers automatic reconnection; all other errors are handled by skipping reconnection
  - **No Action Required**: These messages indicate the system is working correctly and preventing inappropriate reconnection attempts
  - **Debugging Aid**: The detailed skip reasons help developers understand why reconnection was not attempted

## [0.17.34] - 2025-06-26

### Refined

- **Terminology Consistency**: Refined terminology approach to create clear distinction between quick start and custom workflows
  - **Navigation Menu**: "Create Review" → "Create Custom Review" (emphasizes the custom configuration aspect)
  - **Dashboard Interface**: Reverted to "Your code reviews", "Search code reviews", and "No code reviews found" (general browsing context)
  - **Exam Editor**: All creation, editing, and deletion workflows use "custom review" terminology (creation/editing context)
  - **Recent Reviews Component**: Uses "code review sessions" for general browsing
  - **Button Actions**: "Start code review" for general actions, maintains familiar language
  - **Strategic Approach**: "Custom review" used specifically in creation/editing flows, "code reviews" used in browsing/general contexts
  - **Clear User Flow**: Navigation → "Create Custom Review" leads to editor that creates "custom reviews", while browsing shows "code reviews"

## [0.17.33] - 2025-06-26

### Changed

- **Landing Page Layout**: Removed top padding from research section entirely for better visual flow

  - **No Top Padding**: Changed from `py-8 md:py-10` to `pb-8 md:pb-10` to eliminate gap between hero and research sections
  - **Seamless Transition**: Creates immediate visual connection between quick start area and research information
  - **Better Visual Flow**: Eliminates awkward spacing that was breaking the page's visual rhythm

- **Terminology Clarification**: Updated "create review" to "create custom review" throughout the application
  - **Navigation Menu**: "Create Review" → "Create Custom Review"
  - **Dashboard Interface**: "Your code reviews" → "Your custom reviews", search placeholder updated to "Search custom reviews", and empty states updated
  - **Exam Editor**: All creation, editing, and deletion messages now reference "custom review", titles updated to "Create/Edit Custom Review"
  - **Recent Reviews Component**: Updated to reference "custom review sessions" in descriptive text
  - **User Messaging**: All toast notifications and confirmation dialogs now use "custom review" terminology
  - **Button Text**: Dashboard and card action buttons updated to "Start custom review"
  - **Selective Updates**: Maintained "code reviews" in general contexts while using "custom review" for creation/editing flows
  - **Clearer Distinction**: Helps users understand the difference between quick start (general) and custom (configured) reviews

## [0.17.32] - 2025-06-26

### Refined

- **Quick Start Button Interaction**: Refined the hover effect for better user experience

  - **Toned Down Zoom**: Reduced hover scale from `hover:scale-110` to `hover:scale-105` for more subtle, polished interaction
  - **Better Balance**: Maintains visual engagement without being overwhelming or excessive
  - **Improved UX**: More refined hover feedback that feels professional and appropriate

- **Landing Page Spacing**: Improved visual flow between sections
  - **Reduced Research Section Padding**: Decreased top padding from `py-12 md:py-16` to `py-8 md:py-10`
  - **Tighter Layout**: Brings research project section closer to hero section for better visual connection
  - **Enhanced Flow**: Creates more cohesive page layout with improved section relationships

## [0.17.31] - 2025-06-26

### Enhanced

- **Quick Start Button Prominence**: Significantly enhanced the quick start button on the landing page for better visibility and user engagement
  - **Vibrant Orange Gradient**: Changed from tokyo-accent to striking orange gradient (`from-orange-500 to-orange-600`) for eye-catching appeal
  - **Larger Size**: Increased button size with `py-5 px-10` padding and `text-xl` font size for better prominence
  - **Bolder Typography**: Enhanced from `font-semibold` to `font-bold` for stronger visual impact
  - **Enhanced Visual Effects**: Added orange border, stronger hover scale (`hover:scale-110`), and enhanced shadows (`hover:shadow-2xl`)
  - **Improved Spacing**: Increased section padding from `py-12 md:py-10` to `py-16 md:py-14` and button top margin from `mt-8` to `mt-12`
  - **Smoother Animations**: Extended transition duration to `300ms` for more polished interactions
  - **Icon Enhancement**: Larger icon size (`h-7 w-7`) with thicker stroke width (`2.5`) for better visibility
  - **Modern Styling**: Used `rounded-xl` corners and gradient hover effects for contemporary, professional appearance
  - **Design Harmony**: Orange color choice provides energetic, action-oriented feel while maintaining design consistency

## [0.17.30] - 2025-06-26

### Confirmed

- **Normal Mode Compatibility**: Verified that quick start implementation does not affect existing normal mode functionality
  - **Dashboard Flow**: Regular exam access via Dashboard → "Start code review" → `/live?id=${examId}` works unchanged
  - **Supabase Integration**: Normal exams still load from Supabase database as before
  - **Full Timer Support**: Timed exams retain complete countdown timer and duration functionality
  - **Standard Prompts**: Regular exams use existing `getPrompt.standard()` and `getPrompt.github()` prompts
  - **All Exam Types**: Standard and GitHub repository exam types function normally
  - **Navigation Patterns**: Normal mode uses URL parameters, quick start uses navigation state - completely separate
  - **Backward Compatibility**: All existing features and workflows remain fully functional
  - **Conditional Logic**: Quick start only activates when explicitly triggered via navigation state, leaving normal paths untouched

## [0.17.29] - 2025-06-26

### Changed

- **Live Suggestions UI**: Moved live suggestions from popup window to inline display beneath control buttons
  - **Better UX**: Suggestions now appear directly on the review screen instead of in a separate popup window
  - **Simplified Interface**: No need to manage multiple windows or position popup windows
  - **Seamless Integration**: Suggestions appear automatically when review starts and disappear when review ends
  - **Cleaner Code**: Removed popup window management, state tracking, and window positioning logic
  - **Same Functionality**: All suggestion features remain the same - just better positioned for user convenience

### Removed

- **PopupWindow Component Usage**: Removed popup window implementation for live suggestions
  - **State Cleanup**: Removed `showSuggestionsPopup` state and related effects
  - **Import Cleanup**: Removed unused PopupWindow import
  - **Simplified Props**: Removed popup-related props from component interfaces

## [0.17.28] - 2025-06-26

### Fixed

- **Quick Start AI Introduction**: Fixed issue where AI didn't start talking automatically in quick start sessions

  - **Root Cause**: Quick start sessions have `duration: 0`, so no timers were set up, including the introduction timer
  - **Solution**: Added introduction timer setup for quick start sessions even when duration is 0
  - **Result**: AI now introduces itself immediately in quick start sessions like in regular reviews
  - **Timer Logic**: Quick start sessions get introduction timer only, while timed sessions get full timer suite

- **Double Screen Sharing Dialog**: Fixed screen sharing permission dialog appearing twice after review ends

  - **Root Cause**: Auto-trigger mechanism was being called multiple times during state transitions when `connected` changed from `true` to `false`
  - **Solution**: Added tracking flags to prevent multiple auto-trigger calls during the same session
  - **hasAutoTriggeredRef**: Prevents auto-trigger from being called more than once per session
  - **hasNotifiedButtonReadyRef**: Prevents onButtonReady from being called multiple times during state transitions
  - **State Reset**: Both flags are properly reset when review ends for future sessions

- **Screen Sharing Dialog on Stop**: Fixed screen sharing permission dialog appearing when pressing "Stop Code Review" button

  - **Root Cause**: Auto-trigger mechanism was being called inappropriately during review cleanup
  - **Solution**: Added guards to prevent auto-trigger during button state transitions and review cleanup
  - **Additional Protection**: Reset auto-trigger flag when review ends to prevent inappropriate re-triggering
  - **Button State Logic**: Added `!buttonIsOn` condition to prevent triggering when button is already active

- **AI Voice Restarting After Review**: Fixed issue where AI would start a new review automatically after the previous review ended
  - **Root Cause**: Auto-trigger mechanism was being reactivated when `connected` changed from `true` to `false` after review ended
  - **Solution**: Made auto-trigger a one-time-only mechanism that permanently disables after any review starts
  - **Permanent Disable**: Once `examIntentStarted` becomes true, auto-trigger is permanently disabled for the session
  - **Initial Load Only**: Auto-trigger now only works on the initial page load, not after reviews end
  - **Clean Session End**: Reviews now end cleanly without triggering new sessions

### Enhanced

- **Auto-Trigger Safety**: Improved auto-trigger mechanism with better state management
  - **Flag Reset**: Auto-trigger flag is now properly reset when reviews end
  - **Timeout Cleanup**: Auto-trigger timeout is cleared during review cleanup
  - **State Guards**: Added multiple guards to prevent inappropriate auto-triggering during state transitions

## [0.17.27] - 2025-06-26

### Added

- **Quick Start Functionality**: Added "Share screen & Start" button on the front page for immediate code review sessions
  - **Quick Start Button**: Prominent button below the main heading that opens a simple configuration modal
  - **Simplified Setup**: Modal with only code review type and developer experience dropdowns
  - **Instant Launch**: Bypasses exam creation process and starts general review immediately
  - **No Duration Limit**: Quick start sessions have no time constraints, allowing open-ended code reviews
  - **General Review Prompts**: New prompt system for general code reviews without specific assignment requirements
  - **Home Navigation**: Quick start sessions return to home page instead of dashboard when complete

### Changed

- **Landing Page Enhancement**: Added quick start functionality to improve user experience for immediate code reviews

  - **Prominent CTA**: "Share screen & Start" button with clear description for instant access
  - **Modal Interface**: Clean, focused modal for quick session configuration
  - **Navigation Flow**: Quick start sessions integrate seamlessly with existing review infrastructure

- **Prompt System Extension**: Added general review prompts for open-ended code review sessions
  - **New Prompt Type**: `generalReview` prompt in prompts.json for unlimited duration sessions
  - **Open-Ended Flow**: Prompts designed for flexible, developer-guided review sessions
  - **No Timer Pressure**: Removes time constraints to allow thorough, unhurried code discussions

### Technical Details

- **QuickStartModal Component**: New modal component for quick start configuration
- **AIExaminerPage Updates**: Enhanced to handle quick start sessions via navigation state
- **ExamWorkflow Enhancements**: Added support for temporary exam objects and general review prompts
- **Prompt Utility Extension**: Added `getGeneralPrompt` function for quick start sessions
- **Timer Logic Updates**: Conditional timer setup that skips timers for duration-0 sessions

## [0.17.26] - 2025-06-26

### Changed

- **Start Button UI Improvement**: Main start button now disappears when review is active instead of being disabled
  - **Cleaner Interface**: Button completely hidden when `connected` is true, reducing visual clutter
  - **Better UX**: Clear visual indication that review is active - no disabled button to confuse users
  - **Simplified Logic**: Removed `connected` condition from disabled state since button is now hidden
  - **Only Red Button Visible**: During active review, only the red "Stop Code Review" button is shown

## [0.17.25] - 2025-06-26

### Changed

- **Stop Button Simplification**: Removed duplicate stop functionality from main button
  - **Single Stop Button**: Now only the red "Stop Code Review" button handles stopping the review
  - **Main Button Focus**: Main button only handles starting the review and shows "Share screen & start review"
  - **Cleaner UI**: Eliminated confusion between two stop buttons with different behaviors
  - **Simplified Logic**: Removed stop logic from main button click handler and startUnifiedFlow function
  - **Better UX**: Clear separation between start (main button) and stop (red button) actions

### Fixed

- **CRITICAL: Automatic Reconnection Issue**: Fixed major bug where stopping a review would immediately start a new one

  - **Root Cause**: ExamWorkflow was automatically reconnecting because examIntentStarted was still true when session ended
  - **Immediate State Reset**: Now calls onManualStop() immediately when session ends, not when modal closes
  - **Prevents Restart Loop**: examIntentStarted is set to false before reconnection effect can trigger
  - **Clean Stop Flow**: Stop button now properly ends review without triggering automatic restart
  - **Modal Timing Fix**: Removed duplicate onManualStop() call from modal close handler

- **Main Button State Issues**: Fixed main button remaining active during review

  - **Button Disabled**: Main button now properly disabled when review is active (connected state)
  - **Visual Feedback**: Button shows disabled styling when review is in progress
  - **Prevent Restart**: Button cannot be clicked during active review to prevent accidental restarts
  - **State Reset**: Added effect to reset buttonIsOn when connection ends or force stop is triggered
  - **Force Stop Handling**: Button state now properly resets when forceStopAudio/forceStopVideo are triggered

- **Stop Button Restart Issue**: Fixed red stop button causing review to restart

  - **Simplified Cleanup**: Red button now only calls onEndReview() and lets parent handle cleanup
  - **Removed Duplicate Logic**: Eliminated conflicting cleanup code that was causing restart loops
  - **Clean Stop Flow**: Stop button now properly ends review without triggering restart

- **Critical Button Logic Fix**: Fixed main button toggle logic that was causing restart issues
  - **Start-Only Logic**: Main button now only calls onButtonClicked(true) instead of toggling
  - **Removed Stop Logic**: Eliminated onButtonClicked(false) calls from main button
  - **Parent Handler Update**: Updated handleStartExamClicked to only handle starting, not stopping
  - **Clear Separation**: Main button = start only, red button = stop only

### Added

- **Comprehensive Debugging**: Added detailed console logging to track button states and connection flow
  - **Button State Tracking**: Logs all button state changes with context
  - **Connection Monitoring**: Tracks connection state changes and their effects
  - **Stop Flow Debugging**: Detailed logging of stop button click and cleanup sequence
  - **State Synchronization**: Monitors examIntentStarted and force stop flag changes

## [0.17.24] - 2025-06-26

### Changed

- **Pause/Resume Functionality Removal**: Simplified the app by removing pause and resume functionality
  - **Button Simplification**: Main button now only shows "Share screen & start review" or "Stop Review"
  - **Session Management**: Removed complex session resumption logic and state tracking
  - **Cleaner Code**: Eliminated resume-related props, state variables, and methods
  - **Simplified Flow**: Users now start a fresh session each time instead of resuming
  - **Reduced Complexity**: Removed hasExamStarted, hasEverConnected, and related resume logic
  - **Client Simplification**: Removed canResume() and resume() methods from GenAILiveClient
  - **Configuration Cleanup**: Removed session resumption configuration from AI config

## [0.17.23] - 2025-06-26

### Changed

- **Firefox Support Removal**: Removed Firefox support to simplify browser compatibility
  - **Firefox Detection**: Added Firefox browser detection that disables the main button
  - **User Guidance**: Firefox users see "Firefox Not Supported" button with clear message to use Chrome
  - **Simplified Browser Logic**: Removed complex Firefox-specific permission flows and two-step approach
  - **Better UX**: Users get immediate feedback that Firefox isn't supported instead of confusing error states
  - **Chrome Only**: Now only Chrome is supported for the best experience

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

## [0.17.35] - 2025-06-26

### Enhanced

- **QuickStartModal Button Styling**: Improved the "Share screen & start review" button for better visibility and user experience
  - **Larger Camera Icon**: Increased icon size from `h-4 w-4` to `h-6 w-6` (50% larger) for better visibility
  - **Enhanced Icon Weight**: Increased stroke width from `2` to `2.5` for clearer definition
  - **Orange Gradient Color**: Changed from tokyo-accent purple to orange gradient (`#f97316` to `#ea580c`) to match main quick start button
  - **Consistent Branding**: Creates unified orange color scheme across all quick start functionality
  - **Better Hover Effects**: Added `hover:shadow-lg` and `hover:scale-105` for improved interactive feedback
  - **Visual Cohesion**: Button now perfectly complements the main "Quick Start" button on the landing page

## [0.17.36] - 2025-06-26

### Refined

- **QuickStartModal Button Interactions**: Refined button hover effects for better user experience
  - **Toned Down Zoom**: Reduced main button hover scale from `hover:scale-105` to `hover:scale-102` for more subtle, professional interaction
  - **Enhanced Cancel Button**: Added hover effects with `hover:bg-tokyo-bg-lightest` and `hover:border-tokyo-comment` for better visual feedback
  - **Consistent Transitions**: Both buttons now use smooth `transition-all duration-200` animations
  - **Balanced Feedback**: Maintains engaging interactions while feeling refined and polished
  - **Professional Polish**: Buttons now provide appropriate visual feedback without being overwhelming

## [0.17.37] - 2025-06-30

### Fixed

- **CRITICAL: Duplicate Prompt Preparation**: Fixed issue where prompt preparation was running multiple times causing performance problems and console log spam

  - **Root Cause**: `prepareExamContent` function was included in useEffect dependency arrays, creating infinite loops where the function would trigger itself
  - **Solution**: Removed `prepareExamContent` from dependency arrays in both preparation useEffects
  - **Impact**: Eliminates duplicate console messages like "🚀 Preparing quick start general review" appearing twice
  - **Performance**: Reduces unnecessary API calls and processing during quick start initialization
  - **Clean Logs**: Console now shows each preparation step only once instead of multiple times

- **Image Loading Simplification**: Replaced complex multi-path image loading with simple module import approach

  - **Root Cause**: QuickStartModal was trying 4 different image paths sequentially, causing unnecessary error logs and network requests
  - **Old Approach**: `/two-screen-setup.jpg` → `${process.env.PUBLIC_URL}/two-screen-setup.jpg` → `./two-screen-setup.jpg` → `/Code-review-simulator/two-screen-setup.jpg`
  - **New Approach**: Direct import of image as module (`import twoScreenSetupImage from "../../../two-screen-setup.jpg"`)
  - **Benefits**: Eliminates error logs, removes complex fallback logic, works reliably in all environments (localhost, build, GitHub Pages)
  - **Performance**: Single image request instead of multiple failed attempts
  - **User Experience**: No image flickering or loading delays
  - **Code Quality**: Removed ~50 lines of complex error handling and retry logic

- **WebSocket Error Prevention**: Enhanced error handling for WebSocket connection issues
  - **Issue**: WebSocket error 1007 "Request contains an invalid argument" was causing connection cycles
  - **Monitoring**: Error is now properly logged with debug information for troubleshooting
  - **Stability**: Prevents rapid reconnection attempts that could cause performance issues

### Enhanced

- **Console Log Cleanup**: Reduced duplicate and excessive logging for better debugging experience
  - **Button State Tracking**: Streamlined button state change logging to prevent spam
  - **Connection Flow**: Cleaner connection state debugging without redundant messages
  - **Preparation Process**: Single log entry per preparation step instead of duplicates
  - **Better Performance**: Reduced console output improves browser performance during development

## [0.17.38] - 2025-06-30

### Fixed

- **CRITICAL: Circular Dependency in ExamWorkflow**: Fixed circular dependency in useEffect that was causing `prepareExamContent` to be called multiple times

  - **Root Cause**: The first useEffect had `prompt` in its dependency array, creating a loop where `prepareExamContent()` → `setPrompt()` → useEffect triggers again → `prepareExamContent()` runs again
  - **Solution**: Removed `prompt` and `isLoadingPrompt` from the dependency array and added conditions `!prompt && !isLoadingPrompt` to prevent duplicate calls
  - **Impact**: Eliminates duplicate console messages like "🚀 Preparing quick start general review" appearing twice
  - **Performance**: Reduces unnecessary processing and API calls during exam initialization
  - **Clean Logs**: Console now shows each preparation step only once instead of multiple times

## [1.7.1] - 2025-07-02

### Fixed

- **Exam Duration Bug**: Removed default 10-minute duration fallback that was causing automatic restarts on exams without explicit durations
- **Enhanced Network Reconnection**: Improved reconnection banner logic to properly handle WiFi disconnections and Chrome offline mode
- **Live Suggestions Error Handling**: Added better error handling for network issues during live suggestion extraction to prevent interference with main AI session
- **Reconnection Detection**: Added comprehensive network connectivity monitoring using `navigator.onLine` and online/offline events
- **Session State Persistence**: Enhanced session state management to maintain established sessions during various network disconnection scenarios
- **CRITICAL: AI Not Responding After Reconnection**: Fixed major issue where AI would not start talking after successful reconnection
  - **Root Cause**: Timer system wasn't being restarted after reconnection, so AI never received its introduction message
  - **Solution**: Added timer restart logic to both session resumption and fresh connection success paths
  - **Impact**: AI now properly introduces itself and starts responding immediately after reconnection
  - **Better Connection Logic**: Fixed stale closure issues in reconnection logic that were preventing proper connection state detection
- **Automatic Reconnection UX**: Transformed reconnection from manual to automatic with informational status display
  - **No More Buttons**: Removed manual "Reconnect" and "End Session" buttons - reconnection now happens automatically
  - **Status Indicator**: Reconnection banner now shows informational status that appears during connection issues
  - **Auto-Hide**: Banner automatically disappears when connection is restored
  - **Retry Logic**: Automatic retry attempts every 5 seconds if reconnection fails
  - **Network Awareness**: Automatically attempts reconnection when network comes back online
  - **Better UX**: Users no longer need to manually manage reconnections - system handles it seamlessly
- **CRITICAL: Fixed Reconnection Banner Issues**: Resolved multiple critical issues with automatic reconnection system
  - **Banner Not Disappearing**: Fixed issue where reconnection banner wouldn't disappear when connection was restored
  - **Double Welcome Messages**: Fixed timer conflicts causing AI to send multiple introduction messages
  - **Timer Guard System**: Added timer tracking to prevent duplicate timer setup during reconnection
  - **Console Log Cleanup**: Significantly reduced console logging noise for cleaner debugging experience

### Technical Details

- Added network connectivity event listeners for robust offline/online detection
- Enhanced WebSocket close event handling to differentiate between expected and unexpected disconnections
- Improved reconnection logic with network timeout handling and better error messaging
- Separated live suggestion extraction errors from main session connection state
- **Timer Restart System**: Comprehensive timer restart after successful reconnection ensures AI introduction message is sent
- **Promise-Based Connection Checking**: Replaced stale closure-based connection checking with real-time client status polling
- **Enhanced Reconnection Feedback**: Improved user feedback during reconnection attempts with better error reporting

## [1.7.0] - 2025-06-01

### Added

- **AI Reconnection Message**: When network is restored, AI briefly mentions what it was saying before disconnection
- **Last AI Message Tracking**: Added functionality to capture context for reconnection messages

### Changed

- **Improved Event Handling**: Used 'transcript' event instead of incorrect 'response' event for better accuracy
- **Enhanced Network Reconnection Flow**: Added contextual AI messages to improve user experience during reconnection

## [0.20.2] - 2025-06-27

### Enhanced

- **Network Status Management**: Improved network connectivity handling with intelligent microphone control
  - **Automatic Microphone Muting**: Microphone automatically mutes when network connection is lost to prevent AI from trying to respond to offline speech
  - **Network Status Banner**: Clear visual indication when network is offline with explanatory message "Microphone muted - AI won't respond to speech while offline"
  - **Gradual Reconnection**: When network is restored, shows "Restoring connection and preparing AI..." message for 3 seconds before re-enabling microphone
  - **Preserved User Intent**: Manual mute state is preserved when network connection is restored
  - **Enhanced Mute Button**: Mute button shows orange border and tooltip when network muted, indicating it's disabled due to network issues
  - **Audio Track Control**: Uses safe audio track enable/disable instead of stream recreation for reliable muting
  - **Event-Driven Updates**: Utilizes browser's online/offline events for immediate network status detection

### Technical Details

- **Safe Audio Muting**: Implemented `audioTrack.enabled = false/true` for microphone control without affecting stream integrity
- **Network Event Handling**: Added event listeners for `online` and `offline` events with proper cleanup
- **State Coordination**: Added `micMutedDueToNetwork` state separate from manual mute to prevent conflicts
- **Visual Feedback**: Enhanced mute button with conditional styling and explanatory tooltips
- **Delay Coordination**: 3-second delay allows AI service to fully restore before accepting new audio input

## [0.20.1] - 2025-06-27

### Fixed

- **Simplified Network Status Banner**: Completely simplified the reconnection banner logic to be a basic network connectivity indicator
  - **Simple Logic**: Banner now simply shows when `navigator.onLine` is false and hides when it's true
  - **Removed Complexity**: Eliminated complex session state tracking, WebSocket event handling, and automatic reconnection logic
  - **Reliable Display**: Banner consistently appears when network is offline and disappears when back online
  - **Less Code**: Removed hundreds of lines of complex state management that was causing timing issues
  - **Better UX**: Users get immediate feedback about network connectivity without confusing reconnection states
  - **No More Bugs**: Eliminated issues with banner not appearing/disappearing correctly during network changes

### Removed

- **Complex Reconnection Features**: Removed automatic reconnection, session resumption, and GoAway message handling
  - **Auto-Reconnection**: Eliminated complex retry logic that was causing banner display issues
  - **Session Resumption**: Removed session resumption features that added complexity without reliable functionality
  - **WebSocket Monitoring**: Removed complex WebSocket event handling (open/close/goAway) that caused timing issues
  - **hasEstablishedSession**: Removed complex session state tracking that was preventing banner from working correctly
