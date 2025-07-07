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
  networkMuted?: boolean;
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
  networkMuted = false,
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
  const [screenSharingSource, setScreenSharingSource] = useState<string>("");
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

  // New state for pause/resume functionality
  const [hasEverConnected, setHasEverConnected] = useState(false);

  const { client, connected, disconnect, volume } = useGenAILiveContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // Reset buttonIsOn when connection ends
  useEffect(() => {
    if (!connected) {
      setButtonIsOn(false);
    }
  }, [connected]);

  // Track when we've ever connected for pause/resume logic
  useEffect(() => {
    if (connected) {
      setHasEverConnected(true);
    }
  }, [connected]);

  // Reset buttonIsOn when force stop is triggered (review ending)
  useEffect(() => {
    if (forceStopAudio || forceStopVideo) {
      setButtonIsOn(false);
      // Reset session state when review ends completely
      setHasEverConnected(false);
    }
  }, [forceStopAudio, forceStopVideo]);

  // Notify parent when button is ready for auto-triggering
  useEffect(() => {
    if (
      !connected &&
      !isRequestingPermissions &&
      !isSafari() &&
      !isFirefox() &&
      !buttonIsOn && // Don't trigger when button is already on
      onButtonReady &&
      !hasNotifiedButtonReadyRef.current // Don't notify if we've already notified
    ) {
      hasNotifiedButtonReadyRef.current = true;
      onButtonReady(handleMainButtonClick);
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
      setScreenSharingSource("");
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

  // Simple mute toggle - just enable/disable the audio track
  const handleMuteToggle = useCallback(() => {
    if (audioStreamRef.current) {
      const audioTrack = audioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        // Only allow user toggle if not network muted
        if (!networkMuted) {
          audioTrack.enabled = !audioTrack.enabled;
          setMuted(!audioTrack.enabled);
        }
      }
    }
  }, [networkMuted]);

  // Handle network-based muting automatically
  useEffect(() => {
    if (audioStreamRef.current) {
      const audioTrack = audioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        if (networkMuted) {
          // Network is down - mute the microphone
          audioTrack.enabled = false;
        } else {
          // Network is back - restore microphone state (only if user hasn't manually muted)
          if (!muted) {
            audioTrack.enabled = true;
          }
        }
      }
    }
  }, [networkMuted, muted]);

  // Track if force stop is already in progress to prevent duplicates
  const forceStopInProgressRef = useRef(false);

  // Handle force stop audio/microphone
  useEffect(() => {
    if (forceStopAudio && !forceStopInProgressRef.current) {
      forceStopInProgressRef.current = true;

      audioRecorder.off("data", audioDataHandler);
      audioRecorder.off("volume", audioVolumeHandler);
      audioRecorder.stop();

      // Also stop the MediaStream tracks for complete cleanup
      cleanupAudioStream();

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
    // Safari and Firefox are not supported
    if (isSafari() || isFirefox()) {
      alert(
        "Safari and Firefox are not supported. Please use Chrome for the best experience."
      );
      return;
    }

    // Handle different states: Start, Pause, Resume
    if (connected) {
      // Currently connected - this is a PAUSE
      console.log("🔄 Pausing session - preserving for resumption");
      disconnect(); // This preserves session data for resumption
      setButtonIsOn(false);
      onButtonClicked(false); // Notify parent that we're pausing
    } else if (hasEverConnected) {
      // Not connected but has connected before - this is a RESUME
      console.log("🔄 Resuming session using session resumption");
      setButtonIsOn(true);

      try {
        // Use session resumption to continue from where we left off
        const resumeSuccess = await client.reconnectWithResumption();
        if (resumeSuccess) {
          console.log("✅ Session resumed successfully");
          onButtonClicked(true); // Notify parent that we're resuming
        } else {
          console.error("❌ Session resume failed");
          setButtonIsOn(false);
          // Reset and allow fresh start
          setHasEverConnected(false);
        }
      } catch (error) {
        console.error("❌ Resume error:", error);
        setButtonIsOn(false);
        // Reset and allow fresh start
        setHasEverConnected(false);
      }
    } else {
      // Never connected before - this is a START
      console.log("🔄 Starting new session");
      await startUnifiedFlow();
    }
  };

  // Request permissions (microphone and screen sharing)
  const requestPermissions = async () => {
    if (isRequestingPermissions) return;

    setIsRequestingPermissions(true);
    setButtonIsOn(true);

    try {
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

      // Store audio stream for cleanup - CRITICAL for Firefox flow
      audioStreamRef.current = audioStream;

      // Set up video stream
      const videoOnlyStream = new MediaStream(videoStream.getVideoTracks());
      setActiveVideoStream(videoOnlyStream);
      onVideoStreamChange(videoOnlyStream);
      setIsScreenSharing(true);
      setScreenSharingSource(getScreenSharingSourceName(videoStream));

      // Mark permissions as granted
      setPermissionsGranted(true);
      setButtonIsOn(false);
    } catch (permissionError) {
      setButtonIsOn(false);
      setIsRequestingPermissions(false);

      if (permissionError instanceof DOMException) {
        if (permissionError.name === "NotAllowedError") {
          // Check if this is a quick start session and call the cancellation callback
          if (onScreenShareCancelled) {
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
    if (!permissionsGranted) {
      alert(
        "Please grant permissions first by clicking 'Share Screen & Microphone'."
      );
      return;
    }

    if (!audioStreamRef.current) {
      alert(
        "Audio stream not available. Please try granting permissions again."
      );
      return;
    }

    if (!activeVideoStream) {
      alert(
        "Screen sharing not available. Please try granting permissions again."
      );
      return;
    }

    setButtonIsOn(true);

    try {
      // Start the review first, then start audio recording after connection is established
      onButtonClicked(true);

      // Start audio recording after the review/connection is established
      await audioRecorder.start(audioStreamRef.current);
      audioRecorder.on("data", audioDataHandler);
      audioRecorder.on("volume", audioVolumeHandler);
    } catch (error) {
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
    setShowStartMic(false);

    // For Safari, request screen sharing in this user gesture
    if (isSafari()) {
      try {
        const videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        // Set up video stream
        const videoOnlyStream = new MediaStream(videoStream.getVideoTracks());
        setActiveVideoStream(videoOnlyStream);
        onVideoStreamChange(videoOnlyStream);
        setIsScreenSharing(true);
        setScreenSharingSource(getScreenSharingSourceName(videoStream));

        // Start audio recording now that we have both permissions
        if (audioStreamRef.current) {
          try {
            await audioRecorder.start(audioStreamRef.current);
          } catch (audioError) {
            setButtonIsOn(false);
            alert(
              "Failed to start microphone. Please check permissions and try again."
            );
            return;
          }
        }

        // Start the review
        try {
          onButtonClicked(true);
        } catch (error) {
          setButtonIsOn(false);
          alert("Failed to start the code review. Please try again.");
          return;
        }
      } catch (screenShareError) {
        setButtonIsOn(false);
        if (
          screenShareError instanceof DOMException &&
          screenShareError.name === "NotAllowedError"
        ) {
          // Check if this is a quick start session and call the cancellation callback
          if (onScreenShareCancelled) {
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
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
    } catch (audioError) {
      setButtonIsOn(false);
      alert(
        "Microphone access is required. Please allow microphone access and try again."
      );
      return;
    }
    try {
      // Store audio stream for cleanup
      audioStreamRef.current = audioStream;

      // Start audio recording from audio stream
      await audioRecorder.start(audioStream);
      audioRecorder.on("data", audioDataHandler);
      audioRecorder.on("volume", audioVolumeHandler);

      // Start the review
      try {
        onButtonClicked(true);
      } catch (error) {
        setButtonIsOn(false);
        alert("Failed to start the code review. Please try again.");
        return;
      }
    } catch (audioError) {
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
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
      } catch (screenShareError) {
        setButtonIsOn(false);
        if (
          screenShareError instanceof DOMException &&
          screenShareError.name === "NotAllowedError"
        ) {
          // Check if this is a quick start session and call the cancellation callback
          if (onScreenShareCancelled) {
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
      setScreenSharingSource(getScreenSharingSourceName(videoStream));

      // Try to request microphone immediately
      let audioStream: MediaStream | null = null;
      let micError: any = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
      } catch (error) {
        micError = error;
      }

      if (audioStream) {
        // Store audio stream for cleanup
        audioStreamRef.current = audioStream;

        // Start audio recording using only the audio stream
        try {
          await audioRecorder.start(audioStream);
          audioRecorder.on("data", audioDataHandler);
          audioRecorder.on("volume", audioVolumeHandler);
        } catch (audioError) {
          setButtonIsOn(false);
          alert(
            "Failed to start microphone. Please check permissions and try again."
          );
          return;
        }

        // Start the review after both screen sharing and audio are set up
        try {
          onButtonClicked(true);
        } catch (error) {
          setButtonIsOn(false);
          alert("Failed to start the code review. Please try again.");
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

    // Dynamic text based on connection state
    if (connected) {
      return "Pause";
    } else if (hasEverConnected) {
      return "Resume";
    } else {
      return "Share screen & start review";
    }
  };

  // Helper function to properly clean up audio stream
  const cleanupAudioStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      audioStreamRef.current = null;
    }
  };

  // Helper function to extract screen sharing source name
  const getScreenSharingSourceName = (videoStream: MediaStream): string => {
    const videoTrack = videoStream.getVideoTracks()[0];
    if (!videoTrack) return "Unknown";

    // Extract meaningful name from the track label and settings
    const label = videoTrack.label || "";
    const settings = videoTrack.getSettings();
    const displaySurface = settings.displaySurface;

    // Use displaySurface for accurate classification
    if (displaySurface === "browser") {
      // Browser tab sharing
      return "Browser Tab";
    }

    if (displaySurface === "window") {
      // Application window sharing
      // Extract window ID for distinction if multiple windows
      const windowMatch = label.match(/window:(\d+)/);
      if (windowMatch) {
        const windowId = windowMatch[1];
        // Note: Browsers don't provide app names for privacy reasons
        return `Application Window ${windowId}`;
      }
      return "Application Window";
    }

    if (displaySurface === "monitor") {
      // Full screen sharing
      const screenMatch = label.match(/screen:(\d+)/);
      if (screenMatch) {
        const screenNum = parseInt(screenMatch[1]) + 1; // Convert 0-based to 1-based
        return `Screen ${screenNum}`;
      }
      return "Screen";
    }

    // Chrome tab sharing - web-contents-media-stream pattern
    if (label.includes("web-contents-media-stream")) {
      return "Browser Tab";
    }

    // Chrome tab sharing - alternative pattern
    if (label.includes("tab:")) {
      return "Browser Tab";
    }

    // Window pattern with ID
    if (label.includes("window:")) {
      const windowMatch = label.match(/window:(\d+)/);
      if (windowMatch) {
        const windowId = windowMatch[1];
        return `Application Window ${windowId}`;
      }
      return "Application Window";
    }

    // Application window sharing - single digit fallback
    if (/^[0-9]$/.test(label.trim())) {
      return "Application Window";
    }

    // Screen sharing patterns
    if (label.includes("screen:")) {
      const screenMatch = label.match(/screen:(\d+)/);
      if (screenMatch) {
        const screenNum = parseInt(screenMatch[1]) + 1;
        return `Screen ${screenNum}`;
      }
    }

    // More flexible screen detection
    const screenNumMatch = label.match(/(\d+)/);
    if (
      screenNumMatch &&
      (label.toLowerCase().includes("screen") || label.includes("display"))
    ) {
      const screenNum = parseInt(screenNumMatch[1]) + 1;
      return `Screen ${screenNum}`;
    }

    // Fallback patterns
    if (label.toLowerCase().includes("screen")) {
      return "Screen";
    }
    if (label.toLowerCase().includes("window")) {
      return "Application Window";
    }
    if (label.toLowerCase().includes("tab")) {
      return "Browser Tab";
    }
    if (label.toLowerCase().includes("display")) {
      return "Display";
    }

    // If we have a label but no recognizable pattern, use it directly (truncated)
    if (label && label.length > 0) {
      return label.length > 30 ? label.substring(0, 27) + "..." : label;
    }

    return "Screen";
  };

  // Function to change screen sharing source during active review
  const changeScreenShare = async () => {
    if (!connected || !isScreenSharing) {
      return;
    }

    try {
      // Stop current video stream
      if (activeVideoStream) {
        activeVideoStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // Request new screen sharing
      const newVideoStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      // Set up new video stream
      const videoOnlyStream = new MediaStream(newVideoStream.getVideoTracks());
      setActiveVideoStream(videoOnlyStream);
      onVideoStreamChange(videoOnlyStream);
      setScreenSharingSource(getScreenSharingSourceName(newVideoStream));
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert(
          "Screen sharing permission was denied. The current screen will continue to be shared."
        );
      } else {
        alert(
          "Failed to change screen sharing. The current screen will continue to be shared."
        );
      }
    }
  };

  return (
    <section className="control-tray flex flex-col items-center">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      <div className="connection-button-container flex flex-col items-center">
        {/* Always show main button - it serves as Start/Pause/Resume */}
        <button
          ref={connectButtonRef}
          className={cn(
            "transition duration-200 ease-in-out focus:outline-none rounded border bg-tokyo-accent text-white shadow-sm hover:bg-tokyo-accent-darker hover:shadow-lg mb-2 py-5 px-8 cursor-pointer",
            {
              "opacity-50 cursor-not-allowed": isSafari() || isFirefox(),
              "bg-orange-500 hover:bg-orange-600": connected, // Different color when pausing
            }
          )}
          onClick={handleMainButtonClick}
          disabled={isRequestingPermissions || isSafari() || isFirefox()} // Only disable for Safari/Firefox or while requesting permissions
        >
          {getButtonText()}
        </button>

        {/* Status indicators */}
        {isScreenSharing && (
          <div className="flex items-center text-sm text-tokyo-fg-dim mb-4">
            <span className="material-symbols-outlined mr-1 text-green-400">
              present_to_all
            </span>
            Currently sharing {screenSharingSource || "Screen"}
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
          className={cn(
            "transition duration-200 ease-in-out focus:outline-none rounded bg-tokyo-bg-lighter border border-tokyo-selection text-tokyo-fg shadow-sm hover:shadow-lg p-2 cursor-pointer flex items-center justify-between space-x-1",
            {
              "opacity-50 cursor-not-allowed": networkMuted,
              "border-orange-500 bg-orange-100": networkMuted,
            }
          )}
          onClick={handleMuteToggle}
          disabled={networkMuted}
          title={
            networkMuted
              ? "Microphone muted due to network connection issues"
              : muted
              ? "Unmute microphone"
              : "Mute microphone"
          }
        >
          <span className="material-symbols-outlined">
            {!muted && !networkMuted ? "mic" : "mic_off"}
          </span>
          <AudioPulse
            volume={volume}
            active={connected && !networkMuted}
            hover={false}
          />
        </button>

        {/* End Review Button */}
        {connected && onEndReview && (
          <button
            className="transition duration-200 ease-in-out focus:outline-none rounded bg-red-500 border border-red-600 text-white shadow-sm hover:bg-red-600 hover:shadow-lg px-3 py-2 cursor-pointer flex items-center ml-2"
            onClick={async () => {
              if (
                window.confirm(
                  "Are you sure you want to end this code review early?"
                )
              ) {
                onEndReview();
              }
            }}
            title="End Review Early"
          >
            <span className="material-symbols-outlined mr-1">stop</span>
            <span className="text-xs whitespace-nowrap">Stop Code Review</span>
          </button>
        )}

        {/* Change Screen Button */}
        {connected && isScreenSharing && (
          <button
            className="transition duration-200 ease-in-out focus:outline-none rounded bg-blue-500 border border-blue-600 text-white shadow-sm hover:bg-blue-600 hover:shadow-lg px-3 py-2 cursor-pointer flex items-center ml-2"
            onClick={changeScreenShare}
            title="Change Screen Share"
          >
            <span className="material-symbols-outlined mr-1">screen_share</span>
            <span className="text-xs whitespace-nowrap">Change Screen</span>
          </button>
        )}

        {/* Screen sharing is now integrated into the main button */}
        {children}
      </nav>
    </section>
  );
}

export default memo(ControlTray);
