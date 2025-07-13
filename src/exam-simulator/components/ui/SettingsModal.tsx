import React, { useState, useEffect } from "react";
import {
  getCurrentVoice,
  getCurrentVADEnvironment,
  VAD_ENVIRONMENTS,
} from "../../../config/aiConfig";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional props for mid-session voice changes
  onVoiceChange?: (newVoice: string) => void;
  // Optional props for mid-session environment changes
  onEnvironmentChange?: (newEnvironment: string) => void;
  isSessionActive?: boolean;
}

interface VoiceOption {
  name: string;
  label: string;
  description: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  { name: "Puck", label: "Puck", description: "Upbeat and energetic" },
  { name: "Charon", label: "Charon", description: "Informative and clear" },
  { name: "Kore", label: "Kore", description: "Firm and professional" },
  { name: "Fenrir", label: "Fenrir", description: "Excitable and dynamic" },
  { name: "Aoede", label: "Aoede", description: "Breezy and relaxed" },
  { name: "Zephyr", label: "Zephyr", description: "Bright and cheerful" },
  { name: "Leda", label: "Leda", description: "Youthful and engaging" },
];

export function SettingsModal({
  isOpen,
  onClose,
  onVoiceChange,
  onEnvironmentChange,
  isSessionActive = false,
}: SettingsModalProps) {
  const [selectedVoice, setSelectedVoice] = useState<string>(getCurrentVoice());
  const [selectedEnvironment, setSelectedEnvironment] = useState<
    keyof typeof VAD_ENVIRONMENTS
  >(getCurrentVADEnvironment());
  const [justSelected, setJustSelected] = useState<string | null>(null);
  const [justSelectedEnvironment, setJustSelectedEnvironment] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (isOpen) {
      const currentVoice = getCurrentVoice();
      const currentEnvironment = getCurrentVADEnvironment();
      setSelectedVoice(currentVoice);
      setSelectedEnvironment(currentEnvironment);
      setJustSelected(null);
      setJustSelectedEnvironment(null);
    }
  }, [isOpen]);

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    setJustSelected(voiceName);

    // Add a longer delay with visual feedback
    setTimeout(() => {
      // Save immediately
      localStorage.setItem("ai_voice_setting", voiceName);

      // If we're in an active session and have a voice change handler, trigger mid-session change
      if (isSessionActive && onVoiceChange) {
        onVoiceChange(voiceName);
      }

      // Close modal
      onClose();
    }, 1000);
  };

  const handleEnvironmentChange = (
    environment: keyof typeof VAD_ENVIRONMENTS
  ) => {
    setSelectedEnvironment(environment);
    setJustSelectedEnvironment(environment);

    // Add a delay with visual feedback for mid-session changes
    setTimeout(
      () => {
        // Save immediately
        localStorage.setItem("ai_vad_environment", environment);

        // If we're in an active session and have an environment change handler, trigger mid-session change
        if (isSessionActive && onEnvironmentChange) {
          onEnvironmentChange(environment);
        }

        // Close modal
        onClose();
      },
      isSessionActive ? 1000 : 500
    ); // Longer delay for mid-session changes to show feedback
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-tokyo-bg-lighter rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 flex-shrink-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-tokyo-fg-brightest">
              Settings
            </h2>
            <button
              onClick={handleCancel}
              className="text-tokyo-fg hover:text-tokyo-fg-brightest"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable settings list */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-8">
          {/* VAD Environment Selection */}
          <div>
            <h3 className="text-lg font-semibold text-tokyo-fg-bright mb-4">
              Microphone Sensitivity
            </h3>
            {isSessionActive && (
              <p className="text-sm text-tokyo-fg-dim mb-4">
                ⚡ Sensitivity will change immediately in your active session
              </p>
            )}
            <p className="text-sm text-tokyo-fg-dim mb-4">
              Choose the environment that best matches your current setting
            </p>
            <div className="space-y-3">
              {Object.entries(VAD_ENVIRONMENTS).map(([key, environment]) => (
                <label
                  key={key}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                    justSelectedEnvironment === key
                      ? "bg-tokyo-fg-bright text-tokyo-bg border-tokyo-fg-bright"
                      : "border-tokyo-selection hover:bg-tokyo-bg-lightest"
                  }`}
                >
                  <input
                    type="radio"
                    name="environment"
                    value={key}
                    checked={selectedEnvironment === key}
                    onChange={() =>
                      handleEnvironmentChange(
                        key as keyof typeof VAD_ENVIRONMENTS
                      )
                    }
                    className="mr-3 text-tokyo-accent"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium ${
                          justSelectedEnvironment === key
                            ? "text-tokyo-bg"
                            : "text-tokyo-fg-bright"
                        }`}
                      >
                        {environment.name}
                      </span>
                      {selectedEnvironment === key && (
                        <span
                          className={`text-sm font-medium ${
                            justSelectedEnvironment === key
                              ? "text-tokyo-bg"
                              : "text-tokyo-accent"
                          }`}
                        >
                          {justSelectedEnvironment === key
                            ? isSessionActive
                              ? "Changing..."
                              : "Saving..."
                            : "Selected"}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        justSelectedEnvironment === key
                          ? "text-tokyo-bg"
                          : "text-tokyo-fg"
                      }`}
                    >
                      {environment.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* AI Voice Selection */}
          <div>
            <h3 className="text-lg font-semibold text-tokyo-fg-bright mb-4">
              AI Voice Selection
            </h3>
            {isSessionActive && (
              <p className="text-sm text-tokyo-fg-dim mb-4">
                ⚡ Voice will change immediately in your active session
              </p>
            )}
            <div className="space-y-3">
              {VOICE_OPTIONS.map((voice) => (
                <label
                  key={voice.name}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                    justSelected === voice.name
                      ? "bg-tokyo-fg-bright text-tokyo-bg border-tokyo-fg-bright"
                      : "border-tokyo-selection hover:bg-tokyo-bg-lightest"
                  }`}
                >
                  <input
                    type="radio"
                    name="voice"
                    value={voice.name}
                    checked={selectedVoice === voice.name}
                    onChange={() => handleVoiceChange(voice.name)}
                    className="mr-3 text-tokyo-accent"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium ${
                          justSelected === voice.name
                            ? "text-tokyo-bg"
                            : "text-tokyo-fg-bright"
                        }`}
                      >
                        {voice.label}
                      </span>
                      {selectedVoice === voice.name && (
                        <span
                          className={`text-sm font-medium ${
                            justSelected === voice.name
                              ? "text-tokyo-bg"
                              : "text-tokyo-accent"
                          }`}
                        >
                          {justSelected === voice.name
                            ? isSessionActive
                              ? "Changing..."
                              : "Saving..."
                            : "Selected"}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        justSelected === voice.name
                          ? "text-tokyo-bg"
                          : "text-tokyo-fg"
                      }`}
                    >
                      {voice.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
