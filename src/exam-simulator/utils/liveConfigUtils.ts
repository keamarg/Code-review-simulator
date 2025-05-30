import { LiveConfig, LiveGenerationConfig } from "../../multimodal-live-types"; // Adjust path as needed
import {
  AI_CONFIG,
  getCurrentModel,
  getCurrentVoice,
} from "../../config/aiConfig";

// Default values from centralized config
const DEFAULT_MODEL = getCurrentModel();
const DEFAULT_VOICE_NAME = getCurrentVoice();
const DEFAULT_SILENCE_DURATION_MS = AI_CONFIG.DEFAULT_SILENCE_DURATION_MS;
const DEFAULT_PREFIX_PADDING_MS = AI_CONFIG.DEFAULT_PREFIX_PADDING_MS;

// Interface for optional parameters to allow some flexibility
interface CreateLiveConfigOptions {
  model?: string;
  voiceName?: string; // Allow specifying voice name
  silenceDurationMs?: number;
  prefixPaddingMs?: number;
}

/**
 * Creates a LiveConfig object for initiating a multimodal live session.
 *
 * @param promptText The system instruction prompt text.
 * @param options Optional parameters to override default config values.
 * @returns A LiveConfig object.
 */
export function createLiveConfig(
  promptText: string,
  options?: CreateLiveConfigOptions
): LiveConfig {
  const model = options?.model || DEFAULT_MODEL;
  const voiceName = options?.voiceName || DEFAULT_VOICE_NAME;
  const silenceDurationMs =
    options?.silenceDurationMs || DEFAULT_SILENCE_DURATION_MS;
  const prefixPaddingMs = options?.prefixPaddingMs || DEFAULT_PREFIX_PADDING_MS;

  // Construct the generationConfig part, ensuring correct typing
  const generationConfig: Partial<LiveGenerationConfig> = {
    responseModalities: "audio", // As per requirement
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: voiceName,
        },
      },
    },
  };

  // The main LiveConfig object
  const liveConfig: LiveConfig = {
    model: model,
    generationConfig: generationConfig,
    systemInstruction: {
      parts: [{ text: promptText }],
    },
    // tools can be added here if needed in the future
  };

  return liveConfig;
}
