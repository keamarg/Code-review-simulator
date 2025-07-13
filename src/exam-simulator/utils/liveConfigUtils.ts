import {
  LiveConnectConfig,
  Modality,
  StartSensitivity,
  EndSensitivity,
} from "@google/genai";
import { getCurrentVoice, getVADConfig } from "../../config/aiConfig";

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
  // Get current voice preference each time config is created (not cached at module level)
  const voiceName = options?.voiceName || getCurrentVoice();

  // Get current VAD config each time (not cached at module level) to pick up environment changes
  const VAD_CONFIG = getVADConfig();

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
    // Enable session resumption for pause/resume and network reconnection
    sessionResumption: {
      // Enable the server to send session resumption handles
    },
    // Enable context window compression to prevent session timeouts
    // This allows unlimited session duration as recommended by Google
    contextWindowCompression: {
      slidingWindow: {},
    },
    // Enable output audio transcription to capture AI speech as text
    outputAudioTranscription: true, // Re-enabled since disabling didn't fix the cutoff issue
    // Enable input audio transcription to capture user speech as text
    inputAudioTranscription: true,
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
