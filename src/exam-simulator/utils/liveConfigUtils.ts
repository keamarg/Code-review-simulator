import {
  LiveConnectConfig,
  Modality,
  StartSensitivity,
  EndSensitivity,
} from "@google/genai";
import {
  AI_CONFIG,
  getCurrentVoice,
  getVADConfig,
} from "../../config/aiConfig";

// Default values from centralized config
const DEFAULT_VOICE_NAME = getCurrentVoice();
const VAD_CONFIG = getVADConfig();

// Interface for optional parameters to allow some flexibility
interface CreateLiveConfigOptions {
  model?: string;
  voiceName?: string; // Allow specifying voice name
  silenceDurationMs?: number;
  prefixPaddingMs?: number;
  startOfSpeechSensitivity?: keyof typeof StartSensitivity;
  endOfSpeechSensitivity?: keyof typeof EndSensitivity;
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
  const silenceDurationMs =
    options?.silenceDurationMs || VAD_CONFIG.silenceDurationMs;
  const prefixPaddingMs =
    options?.prefixPaddingMs || VAD_CONFIG.prefixPaddingMs;

  // Use centralized VAD sensitivity settings or allow override
  const startSensitivity = options?.startOfSpeechSensitivity
    ? StartSensitivity[options.startOfSpeechSensitivity]
    : StartSensitivity[
        VAD_CONFIG.startOfSpeechSensitivity as keyof typeof StartSensitivity
      ];

  const endSensitivity = options?.endOfSpeechSensitivity
    ? EndSensitivity[options.endOfSpeechSensitivity]
    : EndSensitivity[
        VAD_CONFIG.endOfSpeechSensitivity as keyof typeof EndSensitivity
      ];

  // The main LiveConnectConfig object
  const liveConfig: LiveConnectConfig = {
    // Flattened config structure to avoid deprecation warning
    responseModalities: [Modality.AUDIO], // Audio-only for stability
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
    // Enable output audio transcription to capture AI speech as text
    outputAudioTranscription: true, // Re-enabled since disabling didn't fix the cutoff issue
    // Configure Voice Activity Detection using centralized config values
    // These settings prevent the AI from cutting itself off mid-sentence
    realtimeInputConfig: {
      automaticActivityDetection: {
        disabled: false, // Re-enable VAD with very conservative settings
        startOfSpeechSensitivity: startSensitivity,
        endOfSpeechSensitivity: endSensitivity, // Lower sensitivity prevents AI voice cutoffs
        prefixPaddingMs: prefixPaddingMs, // Extra padding prevents false speech detection
        silenceDurationMs: silenceDurationMs, // Longer duration prevents interrupting AI mid-sentence
      },
    },
    // tools can be added here if needed in the future
  };

  return liveConfig;
}
