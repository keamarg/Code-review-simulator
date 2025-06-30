/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from "classnames";

import {
  memo,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useGenAILiveContext } from "../../../contexts/GenAILiveContext";
import { AudioRecorder } from "../../../lib/audio-recorder";
import AudioPulse from "../../../components/audio-pulse/AudioPulse";
import "./control-tray-custom.scss";

// Browser detection
function isFirefox() {
  return navigator.userAgent.toLowerCase().includes("firefox");
}
function isSafari() {
  return (
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
    !navigator.userAgent.toLowerCase().includes("chrome")
  );
}

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  onButtonClicked?: (isButtonOn: boolean) => void;
  onEndReview?: () => void;
  forceStopAudio?: boolean;
  forceStopVideo?: boolean;
  onButtonReady?: (triggerButton: () => void) => void;
  onScreenShareCancelled?: () => void;
};

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  onButtonClicked = (isButtonOn) => {},
  onEndReview,
  supportsVideo,
  forceStopAudio,
  forceStopVideo,
  onButtonReady,
  onScreenShareCancelled,
}: ControlTrayProps) {
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const [buttonIsOn, setButtonIsOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showStartMic, setShowStartMic] = useState(false);
  const [pendingVideoStream, setPendingVideoStream] =
    useState<MediaStream | null>(null);
  const [showPreShareWarning, setShowPreShareWarning] = useState(false);
  const [pendingShareAction, setPendingShareAction] = useState<
    null | (() => void)
  >(null);

  // Track audio stream for proper cleanup
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Track if we've already notified about button ready to prevent multiple calls
  const hasNotifiedButtonReadyRef = useRef(false);

  // New state for two-step approach
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);

  const { client, connected, disconnect, volume } = useGenAILiveContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // Reset buttonIsOn when connection ends
  useEffect(() => {
    if (!connected) {
      console.log(
        "🔄 ControlTray: Connected became false, resetting buttonIsOn to false"
      );
      setButtonIsOn(false);
    } else {
      console.log("🔗 ControlTray: Connected became true");
    }
  }, [connected]);

  // Reset buttonIsOn when force stop is triggered (review ending)
  useEffect(() => {
    if (forceStopAudio || forceStopVideo) {
      console.log(
        "🛑 ControlTray: Force stop triggered, resetting buttonIsOn to false",
        { forceStopAudio, forceStopVideo }
      );
      setButtonIsOn(false);
    }
  }, [forceStopAudio, forceStopVideo]);

  // Debug effect to track button state
  useEffect(() => {
    console.log("🎛️ ControlTray: Button state changed", {
      buttonIsOn,
      connected,
      isRequestingPermissions,
      forceStopAudio,
      forceStopVideo,
      disabled:
        isRequestingPermissions || isSafari() || isFirefox() || connected,
    });
  }, [
    buttonIsOn,
    connected,
    isRequestingPermissions,
    forceStopAudio,
    forceStopVideo,
  ]);

  // Notify parent when button is ready for auto-triggering
  useEffect(() => {
    console.log("🎛️ ControlTray: onButtonReady effect triggered", {
      connected,
      isRequestingPermissions,
      buttonIsOn,
      isSafari: isSafari(),
      isFirefox: isFirefox(),
      hasOnButtonReady: !!onButtonReady,
      hasNotified: hasNotifiedButtonReadyRef.current,
    });

    if (
      !connected &&
      !isRequestingPermissions &&
      !isSafari() &&
      !isFirefox() &&
      !buttonIsOn && // Don't trigger when button is already on
      onButtonReady &&
      !hasNotifiedButtonReadyRef.current // Don't notify if we've already notified
    ) {
      console.log("🎛️ ControlTray: Button ready - notifying parent");
      hasNotifiedButtonReadyRef.current = true;
      onButtonReady(handleMainButtonClick);
    } else if (connected || isRequestingPermissions || buttonIsOn) {
      // Don't reset notification flag during connection state changes
      // The parent component (AIExaminerPage) handles preventing duplicate auto-triggers
      console.log(
        "🎛️ ControlTray: Button no longer ready - parent will handle auto-trigger prevention"
      );
    } else {
      console.log("🎛️ ControlTray: Button not ready for auto-trigger");
    }
  }, [connected, isRequestingPermissions, buttonIsOn, onButtonReady]);

  // Handle force stop video/screen sharing
  useEffect(() => {
    if (forceStopVideo && isScreenSharing) {
      if (activeVideoStream) {
        activeVideoStream.getTracks().forEach((track) => track.stop());
        setActiveVideoStream(null);
        onVideoStreamChange(null);
      }
      setIsScreenSharing(false);
    }
  }, [forceStopVideo, isScreenSharing, activeVideoStream, onVideoStreamChange]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  // Store handler functions so they can be removed - make them stable with useCallback
  const audioDataHandler = useCallback(
    (base64: string) => {
      const sampleRate = audioRecorder.audioContext?.sampleRate || 16000;
      client.sendRealtimeInput([
        {
          mimeType: `audio/pcm;rate=${sampleRate}`,
          data: base64,
        },
      ]);
    },
    [client, audioRecorder]
  );

  const audioVolumeHandler = useCallback((volume: number) => {
    setInVolume(volume);
  }, []);

  // Track if force stop is already in progress to prevent duplicates
  const forceStopInProgressRef = useRef(false);

  // Handle force stop audio/microphone
  useEffect(() => {
    if (forceStopAudio && !forceStopInProgressRef.current) {
      forceStopInProgressRef.current = true;
      console.log("🎛️ ControlTray: Force stopping audio recording...");

      audioRecorder.off("data", audioDataHandler);
      audioRecorder.off("volume", audioVolumeHandler);
      audioRecorder.stop();

      // Also stop the MediaStream tracks for complete cleanup
      cleanupAudioStream();

      console.log("✅ ControlTray: Audio recording and MediaStream stopped");

      // Reset flag after a short delay to allow for proper cleanup
      setTimeout(() => {
        forceStopInProgressRef.current = false;
      }, 100);
    }
  }, [forceStopAudio, audioRecorder, audioDataHandler, audioVolumeHandler]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }

    let timeoutId = -1;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) {
        return;
      }

      const ctx = canvas.getContext("2d")!;
      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;
      if (canvas.width + canvas.height > 0) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1, Infinity);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }
      if (connected) {
        timeoutId = window.setTimeout(sendVideoFrame, 1000 / 0.5);
      }
    }
    if (connected && activeVideoStream !== null) {
      requestAnimationFrame(sendVideoFrame);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  // Main button click handler
  const handleMainButtonClick = async () => {
    console.log("🎛️ ControlTray: Main button clicked", {
      connected,
      buttonIsOn,
      isRequestingPermissions,
      isSafari: isSafari(),
      isFirefox: isFirefox(),
      disabled:
        isRequestingPermissions || isSafari() || isFirefox() || connected,
    });

    // Safari and Firefox are not supported
    if (isSafari() || isFirefox()) {
      alert(
        "Safari and Firefox are not supported. Please use Chrome for the best experience."
      );
      return;
    }

    // Check if button should be disabled
    if (connected) {
      console.log(
        "⚠️ ControlTray: Button clicked while connected - this should not happen!"
      );
      return;
    }

    // Only handle starting a new review
    await startUnifiedFlow();
  };

  // Request permissions (microphone and screen sharing)
  const requestPermissions = async () => {
    if (isRequestingPermissions) return;

    console.log("🎛️ ControlTray: requestPermissions called");
    setIsRequestingPermissions(true);
    setButtonIsOn(true);

    try {
      console.log("🎛️ ControlTray: Requesting permissions...");

      // Request both permissions in parallel (like Chrome)
      const [audioStream, videoStream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        }),
        navigator.mediaDevices.getDisplayMedia({
          video: true,
        }),
      ]);

      console.log("✅ ControlTray: Both permissions granted successfully");
      console.log("🎛️ ControlTray: Audio stream received:", {
        active: audioStream.active,
        trackCount: audioStream.getTracks().length,
        trackStates: audioStream
          .getTracks()
          .map((t) => ({ kind: t.kind, readyState: t.readyState })),
      });

      // Store audio stream for cleanup - CRITICAL for Firefox flow
      audioStreamRef.current = audioStream;
      console.log(
        "🎛️ ControlTray: Audio stream stored in ref:",
        !!audioStreamRef.current
      );

      // Set up video stream
      const videoOnlyStream = new MediaStream(videoStream.getVideoTracks());
      setActiveVideoStream(videoOnlyStream);
      onVideoStreamChange(videoOnlyStream);
      setIsScreenSharing(true);

      // Mark permissions as granted
      setPermissionsGranted(true);
      setButtonIsOn(false);

      console.log("✅ ControlTray: Permissions granted, ready to start review");
    } catch (permissionError) {
      console.error(
        "❌ ControlTray: Permission request failed:",
        permissionError
      );
      setButtonIsOn(false);
      setIsRequestingPermissions(false);

      if (permissionError instanceof DOMException) {
        if (permissionError.name === "NotAllowedError") {
          // Check if this is a quick start session and call the cancellation callback
          if (onScreenShareCancelled) {
            console.log(
              "🚫 Permissions cancelled - calling cancellation callback"
            );
            onScreenShareCancelled();
            return;
          }

          alert(
            "Microphone and screen sharing permissions are required. Please allow both permissions and try again."
          );
        } else {
          alert("Permission error: " + permissionError.message);
        }
      } else {
        alert("Failed to get permissions. Please try again.");
      }
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  // Start the actual review (Firefox second step)
  const startReview = async () => {
    console.log("🎛️ ControlTray: startReview called");
    console.log(
      "🎛️ ControlTray: audioStreamRef.current:",
      !!audioStreamRef.current
    );
    console.log("🎛️ ControlTray: activeVideoStream:", !!activeVideoStream);
    console.log("🎛️ ControlTray: permissionsGranted:", permissionsGranted);

    if (!permissionsGranted) {
      console.error("❌ ControlTray: Permissions not granted yet");
      alert(
        "Please grant permissions first by clicking 'Share Screen & Microphone'."
      );
      return;
    }

    if (!audioStreamRef.current) {
      console.error("❌ ControlTray: Audio stream not available");
      alert(
        "Audio stream not available. Please try granting permissions again."
      );
      return;
    }

    if (!activeVideoStream) {
      console.error("❌ ControlTray: Video stream not available");
      alert(
        "Screen sharing not available. Please try granting permissions again."
      );
      return;
    }

    setButtonIsOn(true);

    try {
      console.log("🎛️ ControlTray: Starting code review...");

      // Start the review first, then start audio recording after connection is established
      console.log(
        "🎛️ ControlTray: Calling onButtonClicked(true) to start review"
      );
      onButtonClicked(true);
      console.log("✅ ControlTray: Review started successfully");

      // Start audio recording after the review/connection is established
      await audioRecorder.start(audioStreamRef.current);
      audioRecorder.on("data", audioDataHandler);
      audioRecorder.on("volume", audioVolumeHandler);
      console.log("✅ ControlTray: Audio recording started successfully");
    } catch (error) {
      console.error("❌ ControlTray: Failed to start review:", error);
      setButtonIsOn(false);
      alert("Failed to start the code review. Please try again.");
    }
  };

  // Handler for the pre-sharing warning modal
  const handlePreShareWarningOk = async () => {
    setShowPreShareWarning(false);
    if (pendingShareAction) await pendingShareAction();
  };

  // Handler for the Start Review modal (for Firefox and Safari)
  const handleStartReviewClick = async () => {
    console.log("🎛️ ControlTray: handleStartReviewClick called (modal)");
    setShowStartMic(false);

    // For Safari, request screen sharing in this user gesture
    if (isSafari()) {
      try {
        console.log(
          "🎛️ ControlTray: Safari - requesting screen sharing from modal..."
        );
        const videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        console.log("✅ ControlTray: Safari screen sharing granted from modal");

        // Set up video stream
        const videoOnlyStream = new MediaStream(videoStream.getVideoTracks());
        setActiveVideoStream(videoOnlyStream);
        onVideoStreamChange(videoOnlyStream);
        setIsScreenSharing(true);

        // Start audio recording now that we have both permissions
        if (audioStreamRef.current) {
          try {
            console.log(
              "🎛️ ControlTray: Safari - starting audio recording after screen sharing..."
            );
            await audioRecorder.start(audioStreamRef.current);
            audioRecorder.on("data", audioDataHandler);
            audioRecorder.on("volume", audioVolumeHandler);
            console.log(
              "✅ ControlTray: Safari audio recording started successfully"
            );
          } catch (audioError) {
            console.error(
              "❌ ControlTray: Safari audio recording start error:",
              audioError
            );
            setButtonIsOn(false);
            alert(
              "Failed to start microphone. Please check permissions and try again."
            );
            return;
          }
        }

        // Start the review
        console.log(
          "🎛️ ControlTray: Calling onButtonClicked(true) to start review (Safari modal)"
        );
        try {
          onButtonClicked(true);
          console.log(
            "🎛️ ControlTray: onButtonClicked(true) called successfully"
          );
        } catch (error) {
          console.error(
            "❌ ControlTray: Error calling onButtonClicked(true):",
            error
          );
          setButtonIsOn(false);
          alert("Failed to start the code review. Please try again.");
          return;
        }
      } catch (screenShareError) {
        console.error(
          "❌ ControlTray: Safari screen sharing failed:",
          screenShareError
        );
        setButtonIsOn(false);
        if (
          screenShareError instanceof DOMException &&
          screenShareError.name === "NotAllowedError"
        ) {
          // Check if this is a quick start session and call the cancellation callback
          if (onScreenShareCancelled) {
            console.log(
              "🚫 Safari screen sharing cancelled - calling cancellation callback"
            );
            onScreenShareCancelled();
            return;
          }

          alert(
            "Screen sharing is required to start the code review. Please allow screen sharing and try again."
          );
        } else {
          alert("Failed to start screen sharing. Please try again.");
        }
        return;
      }
      return;
    }

    // Original Firefox flow
    let audioStream: MediaStream;
    try {
      console.log(
        "🎛️ ControlTray: Requesting microphone access (from modal)..."
      );
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      console.log("✅ ControlTray: Microphone access granted");
    } catch (audioError) {
      console.error(
        "❌ ControlTray: Microphone access error (Firefox):",
        audioError
      );
      setButtonIsOn(false);
      alert(
        "Microphone access is required. Please allow microphone access and try again."
      );
      return;
    }
    try {
      // Store audio stream for cleanup
      audioStreamRef.current = audioStream;
      console.log(
        "🎛️ ControlTray: Audio stream stored in ref (Firefox modal):",
        !!audioStreamRef.current
      );
      console.log("🎛️ ControlTray: Audio stream received in Firefox modal:", {
        active: audioStream.active,
        trackCount: audioStream.getTracks().length,
        trackStates: audioStream
          .getTracks()
          .map((t) => ({ kind: t.kind, readyState: t.readyState })),
      });

      console.log(
        "🎛️ ControlTray: Starting audio recording from audio stream (from modal)..."
      );
      await audioRecorder.start(audioStream);
      audioRecorder.on("data", audioDataHandler);
      audioRecorder.on("volume", audioVolumeHandler);
      console.log("✅ ControlTray: Audio recording started successfully");
      console.log(
        "🎛️ ControlTray: Calling onButtonClicked(true) to start review"
      );
      try {
        onButtonClicked(true);
        console.log(
          "🎛️ ControlTray: onButtonClicked(true) called successfully"
        );
      } catch (error) {
        console.error(
          "❌ ControlTray: Error calling onButtonClicked(true):",
          error
        );
        setButtonIsOn(false);
        alert("Failed to start the code review. Please try again.");
        return;
      }
    } catch (audioError) {
      console.error(
        "❌ ControlTray: Audio recording start error (Firefox):",
        audioError
      );
      setButtonIsOn(false);
      alert(
        "Failed to start microphone. Please check permissions and try again."
      );
      return;
    }
  };

  // Unified flow - one click to share screen and start review (for Chrome and other browsers)
  const startUnifiedFlow = async () => {
    setButtonIsOn(true);

    try {
      // Start screen sharing first
      let videoStream: MediaStream;
      try {
        console.log("🎛️ ControlTray: Starting screen sharing (video only)...");
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        console.log("✅ ControlTray: Screen sharing started successfully");
      } catch (screenShareError) {
        setButtonIsOn(false);
        if (
          screenShareError instanceof DOMException &&
          screenShareError.name === "NotAllowedError"
        ) {
          // Check if this is a quick start session and call the cancellation callback
          if (onScreenShareCancelled) {
            console.log(
              "🚫 Screen sharing cancelled - calling cancellation callback"
            );
            onScreenShareCancelled();
            return;
          }

          alert(
            "Screen sharing is required to start the code review. Please allow screen sharing and try again."
          );
        } else {
          alert("Failed to start screen sharing. Please try again.");
        }
        return;
      }

      // Only attach video tracks to the video element to prevent echo
      const videoOnlyStream = new MediaStream(videoStream.getVideoTracks());
      setActiveVideoStream(videoOnlyStream);
      onVideoStreamChange(videoOnlyStream);
      setIsScreenSharing(true);

      // Try to request microphone immediately
      let audioStream: MediaStream | null = null;
      let micError: any = null;
      try {
        console.log(
          "🎛️ ControlTray: Requesting microphone access immediately after screen sharing..."
        );

        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
        console.log("✅ ControlTray: Microphone access granted");
        console.log("🎛️ ControlTray: Audio stream received in unified flow:", {
          active: audioStream.active,
          trackCount: audioStream.getTracks().length,
          trackStates: audioStream
            .getTracks()
            .map((t) => ({ kind: t.kind, readyState: t.readyState })),
        });
      } catch (error) {
        micError = error;
        console.error("❌ ControlTray: Microphone access error:", error);
      }

      if (audioStream) {
        // Store audio stream for cleanup
        audioStreamRef.current = audioStream;
        console.log(
          "🎛️ ControlTray: Audio stream stored in ref (unified flow):",
          !!audioStreamRef.current
        );

        // Start audio recording using only the audio stream
        try {
          console.log(
            "🎛️ ControlTray: Starting review first, then audio recording..."
          );

          // Start the review first
          console.log(
            "🎛️ ControlTray: Calling onButtonClicked(true) to start review (unified flow)"
          );
          onButtonClicked(true);
          console.log(
            "🎛️ ControlTray: onButtonClicked(true) called successfully"
          );

          // Start audio recording after the review/connection is established
          await audioRecorder.start(audioStream);
          audioRecorder.on("data", audioDataHandler);
          audioRecorder.on("volume", audioVolumeHandler);
          console.log("✅ ControlTray: Audio recording started successfully");
        } catch (audioError) {
          setButtonIsOn(false);
          alert(
            "Failed to start microphone. Please check permissions and try again."
          );
          return;
        }
      } else if (micError) {
        console.error("❌ ControlTray: Microphone access failed:", micError);
        setButtonIsOn(false);
        alert(
          "Microphone access is required. Please allow microphone access and try again."
        );
        return;
      }
    } catch (error) {
      console.error("Error starting review:", error);
      setButtonIsOn(false);
    }
  };

  // Get button text based on current state
  const getButtonText = () => {
    if (isSafari()) {
      return "Safari Not Supported";
    }
    if (isFirefox()) {
      return "Firefox Not Supported";
    }

    // For Chrome, use the one-click text
    return "Share screen & start review";
  };

  // Helper function to properly clean up audio stream
  const cleanupAudioStream = () => {
    if (audioStreamRef.current) {
      console.log("🎛️ ControlTray: Cleaning up audio stream...");
      audioStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("🎛️ ControlTray: Stopped audio track:", track.kind);
      });
      audioStreamRef.current = null;
      console.log("🎛️ ControlTray: Audio stream cleanup completed");
    }
  };

  return (
    <section className="control-tray flex flex-col items-center">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      <div className="connection-button-container flex flex-col items-center">
        {/* Only show main button when not connected */}
        {!connected && (
          <button
            ref={connectButtonRef}
            className={cn(
              "transition duration-200 ease-in-out focus:outline-none rounded border bg-tokyo-accent text-white shadow-sm hover:bg-tokyo-accent-darker hover:shadow-lg mb-2 py-5 px-8 cursor-pointer",
              {
                "opacity-50 cursor-not-allowed": isSafari() || isFirefox(),
              }
            )}
            onClick={handleMainButtonClick}
            disabled={isRequestingPermissions || isSafari() || isFirefox()} // Only disable for Safari/Firefox or while requesting permissions
          >
            {getButtonText()}
          </button>
        )}

        {/* Status indicators */}
        {isScreenSharing && (
          <div className="flex items-center text-sm text-tokyo-fg-dim mb-4">
            <span className="material-symbols-outlined mr-1 text-green-400">
              present_to_all
            </span>
            Screen sharing active
          </div>
        )}

        {permissionsGranted && !connected && (
          <div className="flex items-center text-sm text-tokyo-fg-dim mb-4">
            <span className="material-symbols-outlined mr-1 text-blue-400">
              mic
            </span>
            Permissions granted - ready to start
          </div>
        )}
      </div>

      <nav
        className={cn("actions-nav flex justify-center", {
          disabled: !connected,
        })}
      >
        <button
          className="transition duration-200 ease-in-out focus:outline-none rounded bg-tokyo-bg-lighter border border-tokyo-selection text-tokyo-fg shadow-sm hover:shadow-lg p-2 cursor-pointer flex items-center justify-between space-x-1"
          onClick={() => setMuted(!muted)}
        >
          <span className="material-symbols-outlined">
            {!muted ? "mic" : "mic_off"}
          </span>
          <AudioPulse volume={volume} active={connected} hover={false} />
        </button>

        {/* End Review Button */}
        {connected && onEndReview && (
          <button
            className="transition duration-200 ease-in-out focus:outline-none rounded bg-red-500 border border-red-600 text-white shadow-sm hover:bg-red-600 hover:shadow-lg px-3 py-2 cursor-pointer flex items-center ml-2"
            onClick={async () => {
              console.log("🛑 ControlTray: Red stop button clicked", {
                connected,
              });
              if (
                window.confirm(
                  "Are you sure you want to end this code review early?"
                )
              ) {
                console.log(
                  "🛑 ControlTray: User confirmed stop, calling onEndReview()"
                );
                // Just call the end review handler - let parent handle all cleanup
                onEndReview();
              } else {
                console.log("🛑 ControlTray: User cancelled stop");
              }
            }}
            title="End Review Early"
          >
            <span className="material-symbols-outlined mr-1">stop</span>
            <span className="text-xs whitespace-nowrap">Stop Code Review</span>
          </button>
        )}

        {/* Screen sharing is now integrated into the main button */}
        {children}
      </nav>
    </section>
  );
}

export default memo(ControlTray);
