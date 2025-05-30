import {
  LiveConnectConfig,
  Modality,
  StartSensitivity,
  EndSensitivity,
} from "@google/genai";
import { getCurrentVoice } from "../../config/aiConfig";

// Default values from centralized config
const DEFAULT_VOICE_NAME = getCurrentVoice();

// Interface for optional parameters to allow some flexibility
interface CreateLiveConfigOptions {
  model?: string;
  voiceName?: string; // Allow specifying voice name
  silenceDurationMs?: number;
  prefixPaddingMs?: number;
}

/**
 * Creates a LiveConnectConfig object for initiating a multimodal live session.
 *
 * @param promptText The system instruction prompt text.
 * @param options Optional parameters to override default config values.
 * @returns A LiveConnectConfig object.
 */
export function createLiveConfig(
  promptText: string,
  options?: CreateLiveConfigOptions
): LiveConnectConfig {
  const voiceName = options?.voiceName || DEFAULT_VOICE_NAME;

  // The main LiveConnectConfig object with session resumption enabled
  const liveConfig: LiveConnectConfig = {
    // Flattened config structure to avoid deprecation warning
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: voiceName,
        },
      },
    },
    systemInstruction: {
      parts: [{ text: promptText }],
    },
    // Enable session resumption to allow pause/resume functionality
    // For initial connections, set to empty object to enable feature
    sessionResumption: {},
    // Configure Voice Activity Detection for balanced sensitivity
    realtimeInputConfig: {
      automaticActivityDetection: {
        disabled: false, // Keep VAD enabled with balanced settings
        startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH, // High sensitivity to detect user speech
        endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH, // High sensitivity for speech end detection
        prefixPaddingMs: 100, // Moderate padding before speech starts
        silenceDurationMs: 500, // Moderate silence duration to end speech (500ms)
      },
    },
    // tools can be added here if needed in the future
  };

  return liveConfig;
}
