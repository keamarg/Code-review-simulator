# GenAI Live Client Upgrade Guide

## Overview

The codebase now includes an improved **GenAI Live Client** based on the latest `@google/genai` package, which provides several significant improvements over the previous implementation.

## Key Improvements

### 1. **Official Google GenAI SDK**

- Uses the official `@google/genai` package instead of custom WebSocket implementation
- Leverages Google's maintained types and interfaces
- Better compatibility with Google's Live API updates

### 2. **Session Resumption & Automatic Reconnection**

- **Session resumption handles** - Can maintain state across disconnections
- **Automatic reconnection** - Attempts to reconnect on WebSocket close (code 1011)
- **Reconnection limits** - Prevents infinite retry loops (max 1 attempt)
- **500ms delay** before reconnection attempts

### 3. **Improved Connection Management**

- **Status tracking**: `"connected" | "disconnected" | "connecting"`
- **Better error handling** with detailed logging
- **Proper cleanup** on disconnection

### 4. **Enhanced Event System**

- More comprehensive event types
- Better logging for debugging
- Session resumption event handling

## Files Created/Updated

### New Files:

- ✅ `src/lib/genai-live-client.ts` - New improved client implementation
- ✅ `src/hooks/use-genai-live.ts` - New hook for the improved client
- ✅ `src/contexts/GenAILiveContext.tsx` - New context provider
- ✅ `src/types/index.ts` - Supporting types

### Existing Files (Available for migration):

- 🔄 `src/lib/multimodal-live-client.ts` - Original implementation (still available)
- 🔄 `src/hooks/use-live-api.ts` - Original hook (still available)
- 🔄 `src/contexts/LiveAPIContext.tsx` - Original context (still available)

## How to Use the New Client

### Option 1: Use New Context Directly

```typescript
import {
  GenAILiveProvider,
  useGenAILiveContext,
} from "../contexts/GenAILiveContext";

// In your app component
<GenAILiveProvider apiKey="your-api-key">
  <YourComponent />
</GenAILiveProvider>;

// In your component
const { client, connected, connect, disconnect, status } =
  useGenAILiveContext();

// Connect with model and config
await connect("models/gemini-2.0-flash-live-001", {
  generationConfig: {
    responseModalities: "audio",
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
    },
  },
  systemInstruction: {
    parts: [{ text: "Your system prompt here" }],
  },
});
```

### Option 2: Use Hook Directly

```typescript
import { useGenAILive } from "../hooks/use-genai-live";

const MyComponent = () => {
  const { client, connected, connect, disconnect, status, volume } =
    useGenAILive({
      apiKey: "your-api-key",
    });

  // Use the client...
};
```

## Migration Path

### Immediate Benefits (No Migration Required)

The new implementation is **additive** - your existing code continues to work unchanged while you get:

- Updated model support (`models/gemini-2.0-flash-live-001`)
- Better logging and debugging
- More robust connection handling

### Optional Migration

If you want to leverage the new features like session resumption:

1. **Replace context import**:

   ```typescript
   // Old
   import { useLiveAPIContext } from "../contexts/LiveAPIContext";

   // New
   import { useGenAILiveContext } from "../contexts/GenAILiveContext";
   ```

2. **Update provider**:

   ```typescript
   // Old
   <LiveAPIProvider apiKey="key" url="optional">

   // New (URL is handled automatically)
   <GenAILiveProvider apiKey="key">
   ```

3. **Update connection method**:

   ```typescript
   // Old
   await connect();

   // New (more explicit)
   await connect(model, config);
   ```

## New Features Available

### Session Resumption

```typescript
// The client automatically handles session resumption
// No additional code needed - it's built into the connection logic
```

### Connection Status Monitoring

```typescript
const { status } = useGenAILiveContext();
console.log(status); // "connected" | "disconnected" | "connecting"
```

### Enhanced Logging

```typescript
client.on("log", (log) => {
  console.log(`${log.type}:`, log.message);
});
```

### Automatic Reconnection

- Automatically attempts reconnection on WebSocket close (code 1011)
- Uses session resumption handle when available
- Limited to 1 reconnection attempt to prevent loops

## Compatibility

- ✅ **Backward Compatible** - Existing code continues to work
- ✅ **Model Support** - Works with all Gemini models including the new `models/gemini-2.0-flash-live-001`
- ✅ **API Compatibility** - Same event interface as before
- ✅ **Node Version** - Requires Node.js 16+ (same as current project)

## Recommended Usage

For **new features**, use the new `GenAILiveClient`. For **existing working code**, migration is optional but recommended for better reliability and session management.

The new client is particularly beneficial for:

- Long-running sessions
- Unstable network connections
- Applications requiring session continuity
- Better debugging and monitoring
