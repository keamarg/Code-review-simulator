# AI Model Configuration Guide

## Overview

The application now uses a centralized AI configuration system to manage model settings across all components, with support for the latest GenAI Live models.

## Configuration File

All AI settings are centralized in: `src/config/aiConfig.ts`

## Current Model References

The model is now configured centrally and used in the following locations:

- ✅ `src/reviewer/utils/liveConfigUtils.ts` - Uses centralized config
- ✅ `src/reviewer/components/code-review/CodeReviewWorkflow.impl.tsx` - Uses centralized config
- ✅ `src/hooks/use-live-api.ts` - Uses centralized config (legacy)
- ✅ `src/hooks/use-genai-live.ts` - Uses centralized config (new)
  Altair component has been removed as part of legacy cleanup.

## How to Change the Model

### Method 1: Update Configuration File

Edit `src/config/aiConfig.ts`:

```typescript
export const AI_CONFIG = {
  // Change this line to use a different model
  DEFAULT_MODEL: "models/gemini-2.0-flash-live-001", // Current default
  // DEFAULT_MODEL: "models/gemini-1.5-pro", // Alternative
  // DEFAULT_MODEL: "models/gemini-1.5-flash", // Alternative

  // ... rest of config
};
```

### Method 2: Environment Variables (Recommended for Production)

Create a `.env` file in your project root:

```bash
# AI Model Configuration
REACT_APP_AI_MODEL=models/gemini-2.0-flash-live-001
REACT_APP_AI_VOICE=Puck
```

## Available Models

### Live API Models (Recommended)

- `models/gemini-2.0-flash-live-001` ⭐ **Current default** - Latest live model with session resumption
- `models/gemini-2.0-flash-exp` - Experimental live model

### Standard Models

- `models/gemini-1.5-pro` - Stable, more capable (not live)
- `models/gemini-1.5-flash` - Faster, good performance (not live)

## Available Voices

- `Puck` (default)
- `Charon`
- `Kore`
- `Fenrir`
- `Aoede`

## Live Client Implementation

The application now supports **two implementations**:

### 1. New GenAI Live Client (Recommended)

- **File**: `src/lib/genai-live-client.ts`
- **Hook**: `src/hooks/use-genai-live.ts`
- **Context**: `src/contexts/GenAILiveContext.tsx`
- **Features**: Session resumption, automatic reconnection, better error handling
- **Best for**: New features, better reliability

### 2. Legacy Multimodal Live Client

- **File**: `src/lib/multimodal-live-client.ts`
- **Hook**: `src/hooks/use-live-api.ts`
- **Context**: `src/contexts/LiveAPIContext.tsx`
- **Status**: Still supported, backward compatible
- **Best for**: Existing working code

## Migration Notes

All hardcoded model references have been replaced with calls to `getCurrentModel()` which:

1. First checks for `process.env.REACT_APP_AI_MODEL`
2. Falls back to `AI_CONFIG.DEFAULT_MODEL`

This allows for easy configuration without code changes across both client implementations.

## New Features with GenAI Live Client

### Session Resumption

```typescript
// Automatic - no additional code needed
// The client handles session resumption automatically
```

### Connection Status

```typescript
import { useGenAILiveContext } from "../contexts/GenAILiveContext";

const { status, connected } = useGenAILiveContext();
console.log(status); // "connected" | "disconnected" | "connecting"
```

### Enhanced Logging

```typescript
client.on("log", (log) => {
  console.log(`${log.type}:`, log.message);
});
```

## Testing Different Models

To test different models, simply update the environment variable or config file and restart the development server:

```bash
# In .env file
REACT_APP_AI_MODEL=models/gemini-2.0-flash-live-001

# Restart server
npm start
```

## Recommended Setup

For **new projects** or **enhanced reliability**:

```typescript
import { GenAILiveProvider, useGenAILiveContext } from "../contexts/GenAILiveContext";

// Use the new implementation with session resumption
```

For **existing working code**:

```typescript
import { LiveAPIProvider, useLiveAPIContext } from "../contexts/LiveAPIContext";

// Continue using the legacy implementation
```

## Configuration Files Created/Modified

- ✅ `src/config/aiConfig.ts` - Centralized configuration
- ✅ `src/lib/genai-live-client.ts` - New improved client
- ✅ `src/hooks/use-genai-live.ts` - New hook implementation
- ✅ `src/contexts/GenAILiveContext.tsx` - New context
- ✅ `src/reviewer/utils/liveConfigUtils.ts` - Updated to use config
- ✅ `src/reviewer/components/code-review/CodeReviewWorkflow.impl.tsx` - Updated to use config
- ✅ `src/hooks/use-live-api.ts` - Updated to use config (legacy)
  Altair component removed.
