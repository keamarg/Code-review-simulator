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
import { CountdownTimer } from "../../components/CountdownTimer";

import {
  memo,
  ReactNode,
  RefObject,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useGenAILiveContext } from "../../../contexts/GenAILiveContext";
import { AudioRecorder } from "../../../lib/audio-recorder";
import AudioPulse from "../../../components/audio-pulse/AudioPulse";
import { appLogger } from "../../../lib/utils";
import { mediaStreamService } from "../../lib/mediaStreamService";
import "./control-tray-custom.scss";

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
  /** Optional preflight validation before starting first-time share. Return a string to block and show message. */
  preflightCheck?: () => string | null | undefined;
  /**
   * When true, the main connect / start button is rendered but visually hidden. This lets
   * external code auto-trigger the button via the existing refs / callbacks while removing it
   * from the visible UI.
   */
  hideMainButton?: boolean;
  isReadyForAutoTrigger?: boolean;
  /**
   * Callback to update environment settings in the audio recorder
   */
  onEnvironmentChange?: (environment: string) => void;
  /**
   * When false, hides action buttons/indicators until AI starts speaking
   */
  showActions?: boolean;
  showIndicators?: boolean;
  /**
   * Notify parent when we are connected and actively sharing (for synchronized UI fade-in)
   */
  onSharingReady?: () => void;
  /** Fade in the entire tray container when it becomes visible */
  fadeInContainer?: boolean;
  /** Whether the whole tray should be visible now (e.g., after sharing is ready) */
  visibleContainer?: boolean;
  /** Optional timer config; when provided, an inline timer is shown next to action buttons */
  timerTotalMs?: number;
  timerStartTrigger?: boolean;
  timerOnTimeUp?: () => void;
  timerOnIntroduction?: () => void;
  timerOnFarewell?: () => void;
  /** Stable key to persist timer remaining time across conditional mounts */
  timerPersistKey?: string;
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
  preflightCheck,
  networkMuted = false,
  hideMainButton = false,
  isReadyForAutoTrigger = false,
  onEnvironmentChange,
  showActions = true,
  showIndicators = true,
  onSharingReady,
  fadeInContainer = false,
  visibleContainer = true,
  timerTotalMs,
  timerStartTrigger,
  timerOnTimeUp,
  timerOnIntroduction,
  timerOnFarewell,
  timerPersistKey,
}: ControlTrayProps) {
  const hasAnnouncedSharingReadyRef = useRef(false);
  const [activeVideoStream, setActiveVideoStream] = useState<MediaStream | null>(null);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const [buttonIsOn, setButtonIsOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenSharingSource, setScreenSharingSource] = useState<string>("");
  // Track if we detected a stream from modal (before it's consumed by getStream())
  const hasDetectedModalStreamRef = useRef(false);

  // Track audio stream for proper cleanup
  const audioStreamRef = useRef<MediaStream | null>(null);
  // Track video stream for proper cleanup (full stream with audio tracks)
  const videoStreamRef = useRef<MediaStream | null>(null);

  // Track if we've already notified about button ready to prevent multiple calls
  const hasNotifiedButtonReadyRef = useRef(false);

  // New state for two-step approach (used to hide UI during system dialogs)
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  // Track if screen sharing has been granted (step 1 of two-step flow)
  const [screenSharingGranted, setScreenSharingGranted] = useState(false);

  // New state for pause/resume functionality
  const [hasEverConnected, setHasEverConnected] = useState(false);

  // Track if audio recorder should be started when connection is established
  const [shouldStartAudioRecorder, setShouldStartAudioRecorder] = useState(false);
  const userInitiatedRef = useRef(false);
  // Guard to prevent repeated audio recorder start attempts
  const isStartingAudioRecorderRef = useRef(false);
  // Track if we need to restart audio recorder after screen change
  const needsAudioRecorderRestartRef = useRef(false);

  const isChangingScreenRef = useRef(false);
  // Guard to prevent stream detection from running multiple times
  const hasCheckedStreamRef = useRef(false);
  // Guard to prevent automatic review start from running multiple times
  const hasAutoStartedRef = useRef(false);

  // Detect Safari
  const isSafari = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !ua.includes("chrome");
  }, []);

  const { client, connected, disconnect, volume, status } = useGenAILiveContext();

  const hasLiveAudioTrack = useCallback((stream: MediaStream | null) => {
    if (!stream) return false;
    const tracks = stream.getAudioTracks();
    if (tracks.length === 0) return false;
    return tracks.some((track) => track.readyState === "live");
  }, []);

  // Unified function to set up a video stream (used by both regular and quick start modes)
  const setupVideoStream = useCallback(
    (stream: MediaStream, autoStart: boolean = false) => {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0 || !stream.active) {
        return false;
      }

      // Set up the stream - same logic for both modes
      const videoOnlyStream = new MediaStream(videoTracks);
      setActiveVideoStream(videoOnlyStream);
      onVideoStreamChange(videoOnlyStream);
      setIsScreenSharing(true);
      setScreenSharingSource(getScreenSharingSourceName(stream));
      setScreenSharingGranted(true);
      videoStreamRef.current = stream;

      // Update videoRef
      if (videoRef.current) {
        videoRef.current.srcObject = videoOnlyStream;
      }

      // If autoStart is true (regular mode from modal), automatically start review
      if (autoStart && !hasAutoStartedRef.current) {
        hasAutoStartedRef.current = true;
        userInitiatedRef.current = true;
        setIsRequestingPermissions(true);

        // Request microphone and start review
        navigator.mediaDevices
          .getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
            },
          })
          .then((audioStream) => {
            audioStreamRef.current = audioStream;
            setShouldStartAudioRecorder(true);
            setIsRequestingPermissions(false);
            onButtonClicked(true);
          })
          .catch((error) => {
            setIsRequestingPermissions(false);
            hasAutoStartedRef.current = false;
            appLogger.error.audio(error instanceof Error ? error.message : String(error));
            alert("Microphone access is required. Please allow microphone access and try again.");
          });
      }

      return true;
    },
    [onVideoStreamChange, onButtonClicked, videoRef],
  );

  // Sync activeVideoStream when video stream is provided externally (e.g., from modal - regular mode)
  // When stream is detected, automatically start the review (request mic and start)
  // This runs AFTER quick start detection to handle streams from modal navigation
  useEffect(() => {
    // Prevent multiple automatic starts
    if (hasAutoStartedRef.current || connected || hasEverConnected || activeVideoStream) {
      return;
    }

    // Skip if stream check already ran AND set up a stream (prevents both useEffects from running)
    if (hasCheckedStreamRef.current && activeVideoStream) {
      return;
    }

    // Check if we have a video stream from the video element (set by CodeReviewPage)
    // OR check mediaStreamService directly BEFORE getStream() consumes it
    const checkForExternalStream = async () => {
      // First check mediaStreamService.stream directly (before it's consumed)
      if (mediaStreamService.stream && !hasAutoStartedRef.current && !activeVideoStream) {
        const stream = mediaStreamService.stream;
        const videoTracks = stream.getVideoTracks();
        const hasActiveVideoTracks =
          videoTracks.length > 0 && videoTracks.some((track) => track.readyState === "live");

        // Only process if stream is active (regular mode from modal)
        // Quick start mode streams are handled by the other useEffect
        // Auto-start for regular mode - user already pressed "Start review" in modal
        if (stream.active && hasActiveVideoTracks) {
          // Use unified setup function with autoStart=true - start review automatically
          setupVideoStream(stream, true);
          return; // Exit early if we processed stream from service
        }
      }

      // Fallback: check videoRef (stream might already be set by CodeReviewPage)
      const videoElement = videoRef.current;
      if (
        videoElement &&
        videoElement.srcObject &&
        !hasAutoStartedRef.current &&
        !activeVideoStream
      ) {
        const stream = videoElement.srcObject as MediaStream;
        const videoTracks = stream.getVideoTracks();
        const hasActiveVideoTracks =
          videoTracks.length > 0 && videoTracks.some((track) => track.readyState === "live");

        // Process if stream is active (from modal - user already pressed "Start review")
        // Auto-start: user already pressed "Start review" in modal
        if (stream.active && hasActiveVideoTracks) {
          // Use unified setup function with autoStart=true - start review automatically
          setupVideoStream(stream, true);
        }
      }
    };

    // Check immediately and also set up interval to catch stream when it's set
    // Check immediately first (no delay) to catch streams from modal ASAP
    // Then set up interval with small delay to let quick start detection run first if applicable
    checkForExternalStream(); // Check immediately for streams from modal
    let intervalId: NodeJS.Timeout | null = null;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(checkForExternalStream, 100);
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVideoStream, connected, hasEverConnected, setupVideoStream]);

  // Effect to detect streams that are already present (from quick start or page refresh)
  // This runs after the external stream detection to catch streams set on videoRef by CodeReviewPage
  useEffect(() => {
    // Skip if already set up or auto-started
    if (hasAutoStartedRef.current || activeVideoStream || hasCheckedStreamRef.current) {
      return;
    }

    // Check videoRef for stream (set by CodeReviewPage for quick start)
    const checkVideoRef = () => {
      const videoElement = videoRef.current;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        const videoTracks = stream.getVideoTracks();
        const hasActiveVideoTracks =
          videoTracks.length > 0 && videoTracks.some((track) => track.readyState === "live");

        if (stream.active && hasActiveVideoTracks) {
          // Mark as checked to prevent duplicate processing
          hasCheckedStreamRef.current = true;

          // Stream already present - use unified setup function
          // autoStart=false means user clicks button to start (same for both modes)
          setupVideoStream(stream, false);

          // Prepare audio stream for when connection is established
          if (!audioStreamRef.current) {
            navigator.mediaDevices
              .getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                  channelCount: 1,
                },
              })
              .then((audioStream) => {
                audioStreamRef.current = audioStream;
                setShouldStartAudioRecorder(true);
              })
              .catch((error) => {
                appLogger.error.audio(error instanceof Error ? error.message : String(error));
              });
          } else {
            setShouldStartAudioRecorder(true);
          }
          return true; // Stream found and processed
        }
      }
      return false; // No stream found
    };

    // Check immediately
    if (checkVideoRef()) {
      return; // Stream found and processed
    }

    // If not found immediately, set up interval to check periodically
    // This handles race conditions where CodeReviewPage sets videoRef.srcObject after this effect runs
    const intervalId = setInterval(() => {
      if (checkVideoRef()) {
        clearInterval(intervalId);
      }
    }, 100);

    // Clean up interval after reasonable time or when stream is found
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (!activeVideoStream) {
        hasCheckedStreamRef.current = true; // Mark as checked even if no stream found
      }
    }, 2000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef, activeVideoStream, setupVideoStream]);

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  // Reset button only on true disconnect (not while connecting, and only if user initiated a session)
  useEffect(() => {
    if (status === "disconnected" && hasEverConnected && userInitiatedRef.current) {
      setButtonIsOn(false);
      setScreenSharingGranted(false);
      // Reset sharing ready announcement so it can be called again on next connection
      hasAnnouncedSharingReadyRef.current = false;
    }
  }, [status, hasEverConnected]);

  // Track when we've ever connected for pause/resume logic
  useEffect(() => {
    if (connected) {
      setHasEverConnected(true);

      // If we need to restart audio recorder after screen change, do it now
      if (needsAudioRecorderRestartRef.current && hasLiveAudioTrack(audioStreamRef.current)) {
        needsAudioRecorderRestartRef.current = false;
        setShouldStartAudioRecorder(true);
      }
    }
  }, [connected, hasLiveAudioTrack]);

  // Call onSharingReady when both connected and screen sharing are active
  // This triggers the UI fade-in - simple: if both are true, call it once
  useEffect(() => {
    if (connected && isScreenSharing && onSharingReady && !hasAnnouncedSharingReadyRef.current) {
      hasAnnouncedSharingReadyRef.current = true;
      onSharingReady();
    }
    // Reset when disconnected so it can be called again on next connection
    if (!connected) {
      hasAnnouncedSharingReadyRef.current = false;
    }
  }, [connected, isScreenSharing, onSharingReady]);

  // Reset buttonIsOn when force stop is triggered (review ending)
  useEffect(() => {
    if (forceStopAudio || forceStopVideo) {
      setButtonIsOn(false);
      // Reset session state when review ends completely
      setHasEverConnected(false);
      setScreenSharingGranted(false);
    }
  }, [forceStopAudio, forceStopVideo]);

  // Notify parent when button is ready for auto-triggering
  useEffect(() => {
    if (
      isReadyForAutoTrigger &&
      !connected &&
      !isRequestingPermissions &&
      !buttonIsOn && // Don't trigger when button is already on
      onButtonReady &&
      !hasNotifiedButtonReadyRef.current
    ) {
      hasNotifiedButtonReadyRef.current = true;
      onButtonReady(handleMainButtonClick);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    connected,
    isRequestingPermissions,
    buttonIsOn,
    onButtonReady,
    hideMainButton,
    isReadyForAutoTrigger,
    // handleMainButtonClick cannot be included as it's defined after this useEffect
  ]);

  // When the main button transitions from hidden → visible, allow a new notification
  useEffect(() => {
    if (!hideMainButton) {
      hasNotifiedButtonReadyRef.current = false;
    }
  }, [hideMainButton]);

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
    [client, audioRecorder],
  );

  // Simple mute toggle - just enable/disable the audio track
  const handleMuteToggle = useCallback(() => {
    if (audioStreamRef.current) {
      const audioTrack = audioStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        // Only allow user toggle if not network muted
        if (!networkMuted) {
          audioTrack.enabled = !audioTrack.enabled;
          setMuted(!audioTrack.enabled);

          // Log the mute/unmute action
          if (audioTrack.enabled) {
            appLogger.user.unmute();
          } else {
            appLogger.user.mute();
          }
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

  // Create stable references for audioRecorder methods
  const audioRecorderRef = useRef(audioRecorder);
  audioRecorderRef.current = audioRecorder;

  const updateEnvironmentCallback = useCallback((environment: string) => {
    if (audioRecorderRef.current.recording) {
      audioRecorderRef.current.updateEnvironment(environment);
    }
  }, []);

  const stopAudioRecorderCallback = useCallback(() => {
    audioRecorderRef.current.off("data", audioDataHandler);
    audioRecorderRef.current.stop();
  }, [audioDataHandler]);

  // Create stable reference for cleanupAudioStream
  const cleanupAudioStreamRef = useRef<(() => void) | null>(null);

  // Effect to set environment when audio recorder starts or when environment changes
  useEffect(() => {
    if (audioRecorder.recording) {
      const currentEnvironment = localStorage.getItem("ai_vad_environment") || "QUIET";
      updateEnvironmentCallback(currentEnvironment);
    }
  }, [audioRecorder.recording, onEnvironmentChange, updateEnvironmentCallback]);

  // Listen for environment changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "ai_vad_environment") {
        const newEnvironment = e.newValue || "QUIET";
        updateEnvironmentCallback(newEnvironment);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [updateEnvironmentCallback]);

  // Handle force stop audio/microphone
  useEffect(() => {
    if (forceStopAudio && !forceStopInProgressRef.current) {
      forceStopInProgressRef.current = true;

      stopAudioRecorderCallback();

      // Also stop the MediaStream tracks for complete cleanup
      if (cleanupAudioStreamRef.current) {
        cleanupAudioStreamRef.current();
      }

      setTimeout(() => {
        forceStopInProgressRef.current = false;
      }, 100);
    }
  }, [forceStopAudio, stopAudioRecorderCallback]);

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
      const vw = video.videoWidth || 0;
      const vh = video.videoHeight || 0;
      if (vw === 0 || vh === 0) {
        // Video metadata not ready yet; retry shortly without bailing the loop completely
        timeoutId = window.setTimeout(sendVideoFrame, 100);
        return;
      }
      canvas.width = vw * 0.25;
      canvas.height = vh * 0.25;
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

  // Start audio recorder when connection is established
  useEffect(() => {
    // Prevent repeated attempts - only run if we should start and haven't already tried
    if (
      !connected ||
      !shouldStartAudioRecorder ||
      !hasLiveAudioTrack(audioStreamRef.current) ||
      isStartingAudioRecorderRef.current
    ) {
      return;
    }

    const startAudioRecorderWhenConnected = async () => {
      // Double-check guard
      if (isStartingAudioRecorderRef.current) {
        return;
      }

      isStartingAudioRecorderRef.current = true;

      try {
        // Only start if not already started
        if (!audioRecorder.recording && audioStreamRef.current) {
          await audioRecorder.start(audioStreamRef.current);
          audioRecorder.on("data", audioDataHandler);
        }
      } catch (error) {
        appLogger.error.audio(error instanceof Error ? error.message : String(error));
      } finally {
        setShouldStartAudioRecorder(false);
        isStartingAudioRecorderRef.current = false;
      }
    };

    // Wrap in try-catch to prevent unhandled promise rejections (especially important for Safari)
    startAudioRecorderWhenConnected().catch((error) => {
      appLogger.error.audio(error instanceof Error ? error.message : String(error));
      isStartingAudioRecorderRef.current = false;
      setShouldStartAudioRecorder(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, shouldStartAudioRecorder, hasLiveAudioTrack]); // Removed audioRecorder and audioDataHandler from deps - they're stable

  // Ensure microphone stream is stopped when component unmounts (e.g., navigation away)
  useEffect(() => {
    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
        audioStreamRef.current = null;
      }
    };
  }, []);

  // Step 1: Request screen sharing (called from onClick handler synchronously for Safari compatibility)
  const requestScreenSharing = async () => {
    // Optional preflight validation
    if (typeof preflightCheck === "function") {
      try {
        const message = preflightCheck();
        if (typeof message === "string" && message.trim().length > 0) {
          alert(message);
          return;
        }
      } catch {
        // If validation throws, do not block start unnecessarily
      }
    }

    // Hard-reset any stale live session state before starting a fresh one
    try {
      client.terminateSession?.();
    } catch {}

    setIsRequestingPermissions(true);
    setButtonIsOn(true);

    try {
      const videoStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      // Store video stream
      const videoOnlyStream = new MediaStream(videoStream.getVideoTracks());
      setActiveVideoStream(videoOnlyStream);
      onVideoStreamChange(videoOnlyStream);
      setIsScreenSharing(true);
      setScreenSharingSource(getScreenSharingSourceName(videoStream));

      // Mark screen sharing as granted - this will show "Start review" button
      setScreenSharingGranted(true);
      setPermissionsGranted(true);
      setIsRequestingPermissions(false);

      // Store video stream reference for cleanup
      videoStreamRef.current = videoStream;
    } catch (error) {
      setIsRequestingPermissions(false);
      setButtonIsOn(false);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        if (onScreenShareCancelled) {
          onScreenShareCancelled();
          return;
        }
        alert("Screen sharing is required. Please allow screen sharing and try again.");
      } else {
        alert(
          `Failed to start screen sharing: ${error instanceof Error ? error.message : String(error)}. Please try again.`,
        );
      }
    }
  };

  // Step 2: Start review (requests microphone and starts the review)
  const startReview = async () => {
    userInitiatedRef.current = true;
    setIsRequestingPermissions(true);

    try {
      // Request microphone
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      // Store audio stream
      audioStreamRef.current = audioStream;
      setShouldStartAudioRecorder(true);

      // Start the review
      try {
        if (userInitiatedRef.current) {
          onButtonClicked(true);
        }
      } catch (error) {
        setIsRequestingPermissions(false);
        setButtonIsOn(false);
        alert("Failed to start the code review. Please try again.");
        return;
      }

      setIsRequestingPermissions(false);
    } catch (error) {
      setIsRequestingPermissions(false);
      appLogger.error.audio(error instanceof Error ? error.message : String(error));
      setButtonIsOn(false);
      alert("Microphone access is required. Please allow microphone access and try again.");
    }
  };

  // Main button click handler
  const handleMainButtonClick = async () => {
    userInitiatedRef.current = true;

    // Handle different states: Start, Pause, Resume
    if (connected) {
      // Currently connected - this is a PAUSE
      try {
        client.interrupt?.();
      } catch {}
      disconnect(); // This preserves session data for resumption
      setButtonIsOn(false);
      onButtonClicked(false); // Notify parent that we're pausing
    } else if (hasEverConnected) {
      // Not connected but has connected before - this is a RESUME
      setButtonIsOn(true);

      try {
        // Use session resumption to continue from where we left off
        const resumeSuccess = await client.reconnectWithResumption();
        if (resumeSuccess) {
          onButtonClicked(true); // Notify parent that we're resuming
        } else {
          appLogger.error.session("Session resume failed");
          setButtonIsOn(false);
          // Reset and allow fresh start
          setHasEverConnected(false);
        }
      } catch (error) {
        appLogger.error.session(error instanceof Error ? error.message : String(error));
        setButtonIsOn(false);
        // Reset and allow fresh start
        setHasEverConnected(false);
      }
    } else {
      // Check if we already have a video stream before requesting screen sharing
      // This handles both regular mode (stream from modal) and quick start mode
      const existingStream = activeVideoStream || (videoRef.current?.srcObject as MediaStream);
      if (existingStream && existingStream.getVideoTracks().length > 0) {
        // We have a stream - just start the review (request mic and start)
        await startReview();
      } else if (screenSharingGranted) {
        // Screen sharing granted here (not from modal), now start review (step 2)
        await startReview();
      } else {
        // Never connected before and no screen sharing - request screen sharing (step 1)
        await requestScreenSharing();
      }
    }
  };

  // Get button text based on current state
  const getButtonText = () => {
    // Dynamic text based on connection state
    // Check connected/hasEverConnected FIRST to avoid showing "Start review" after auto-start
    if (connected) {
      return "Pause";
    } else if (hasEverConnected) {
      return "Resume";
    } else if (screenSharingGranted && !hasAutoStartedRef.current) {
      // Only show "Start review" if screen sharing granted AND not auto-started (regular mode manual flow)
      return "Start review";
    } else if (activeVideoStream && !connected && !hasEverConnected) {
      // Have stream but not started yet (quick start mode waiting for user click)
      return "Start review";
    } else {
      return "Share screen";
    }
  };

  // Hide the main button if we don't have screen sharing yet (it's handled in the modal)
  // Hide button when auto-start is in progress (regular mode from modal)
  // Hide button IMMEDIATELY if stream exists (from modal) - prevents race condition
  // Check both videoRef AND mediaStreamService to catch streams immediately
  // IMPORTANT: Check mediaStreamService.stream BEFORE CodeReviewPage calls getStream() (which consumes it)
  const hasStreamOnVideoRef =
    videoRef.current?.srcObject !== null && videoRef.current?.srcObject !== undefined;
  // Check mediaStreamService.stream directly - this is checked BEFORE getStream() consumes it
  // We need to check this synchronously during render to catch it before useEffect runs
  const streamInService = mediaStreamService.stream !== null;

  // If we detect a stream from modal, mark it so button stays hidden even after stream is consumed
  if (
    (hasStreamOnVideoRef || streamInService) &&
    !hasCheckedStreamRef.current &&
    !hasDetectedModalStreamRef.current
  ) {
    hasDetectedModalStreamRef.current = true;
  }

  // If we have a stream on videoRef OR in service, it's from modal (or already set up)
  const streamFromModal =
    (hasStreamOnVideoRef || streamInService || hasDetectedModalStreamRef.current) &&
    !hasCheckedStreamRef.current;

  // Hide button if: no stream anywhere, OR auto-start in progress, OR stream from modal detected
  const shouldHideMainButtonForSetup =
    (!activeVideoStream &&
      !connected &&
      !hasEverConnected &&
      !screenSharingGranted &&
      !hasStreamOnVideoRef &&
      !streamInService &&
      !hasDetectedModalStreamRef.current) ||
    (hasAutoStartedRef.current && !connected && !hasEverConnected) ||
    streamFromModal; // Hide immediately if stream from modal (even before auto-start begins)

  // Helper function to properly clean up audio stream
  const cleanupAudioStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      audioStreamRef.current = null;
    }
  };

  // Store the cleanup function in ref for stable reference
  cleanupAudioStreamRef.current = cleanupAudioStream;

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
    if (screenNumMatch && (label.toLowerCase().includes("screen") || label.includes("display"))) {
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
    appLogger.generic.info("🔍 ChangeScreen: invoked");
    if (isChangingScreenRef.current) return;
    isChangingScreenRef.current = true;

    // Get current stream - check all possible sources
    // Priority: activeVideoStream (state) > videoStreamRef (full stream) > videoRef.srcObject
    // This works for both quick start and regular mode
    let currentStream = activeVideoStream;
    if (!currentStream || currentStream.getVideoTracks().length === 0) {
      currentStream = videoStreamRef.current || null;
    }
    if (!currentStream || currentStream.getVideoTracks().length === 0) {
      currentStream = (videoRef.current?.srcObject as MediaStream) || null;
    }

    if (!currentStream || currentStream.getVideoTracks().length === 0) {
      appLogger.generic.info("🔍 ChangeScreen: no activeVideoStream present");
      isChangingScreenRef.current = false;
      return;
    }

    appLogger.generic.info(
      `🔍 ChangeScreen: found stream with ${currentStream.getVideoTracks().length} video tracks`,
    );

    try {
      // Mark for UI to suppress flicker on close
      (client as any).screenChangeInProgress = true;
      // Deliberately pause the AI session first to preserve resumption handle (matches prior behavior)
      if (connected) {
        try {
          onButtonClicked?.(false);
          await (client as any).disconnect?.();
        } catch {}
      }

      // Ask the user for a new screen (tab / window / monitor)
      const newVideoStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      // Validate stream
      const newTracks = newVideoStream.getVideoTracks();
      if (!newTracks || newTracks.length === 0) {
        appLogger.generic.info("🔍 ChangeScreen: no video tracks in new stream");
        alert(
          "No video track found in the selected source. The current screen will continue to be shared.",
        );
        try {
          newVideoStream.getTracks().forEach((t) => t.stop());
        } catch {}
        isChangingScreenRef.current = false;
        return;
      }

      // Stop old stream tracks before setting up new one
      try {
        currentStream.getTracks().forEach((track) => track.stop());
      } catch {}

      // Use unified setup function to ensure consistent state for both quick start and regular mode
      // Don't auto-start - we'll resume the connection below
      const setupSuccess = setupVideoStream(newVideoStream, false);
      if (!setupSuccess) {
        appLogger.generic.info("🔍 ChangeScreen: failed to set up new stream");
        alert(
          "Failed to set up new screen sharing. The current screen will continue to be shared.",
        );
        try {
          newVideoStream.getTracks().forEach((t) => t.stop());
        } catch {}
        isChangingScreenRef.current = false;
        return;
      }

      const newScreenName = getScreenSharingSourceName(newVideoStream);
      appLogger.generic.info(`🔍 ChangeScreen: replaced stream with ${newScreenName}`);

      // Stop any ongoing generation to avoid mixing pre-change context
      try {
        (client as any).interrupt?.();
      } catch {}

      // Defer visual re-anchor until after resume completes (below)

      // Log the screen change
      appLogger.user.changeScreen(newScreenName);

      // Proactively stop any extra tracks from newVideoStream that we didn't keep
      try {
        newVideoStream.getAudioTracks().forEach((track) => track.stop());
      } catch {}

      // If the AI connection dropped during screen change, resume automatically
      try {
        {
          // Prefer session resumption to preserve context
          const resumed = await (client as any).reconnectWithResumption?.();
          if (!resumed) {
            // Fallback to reconnect with existing config (no prompt rebuild)
            const cfg = (client as any).getConfig?.();
            const model = (client as any).model;
            if (cfg && model) {
              await (client as any).connect(model, cfg);
            } else {
              // As a last resort, nudge parent to resume
              onButtonClicked?.(true);
            }
          }
          // Ensure UI reflects resumed state and audio is properly connected
          // Audio stream should already be set from before screen change, but ensure it's still active
          if (!hasLiveAudioTrack(audioStreamRef.current)) {
            // Re-request audio if it was lost
            try {
              const audioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                  channelCount: 1,
                },
              });
              audioStreamRef.current = audioStream;
              setShouldStartAudioRecorder(true);
            } catch (error) {
              appLogger.error.audio(error instanceof Error ? error.message : String(error));
            }
          } else {
            // Stop and restart audio recorder to ensure it's properly connected
            try {
              if (audioRecorder.recording) {
                audioRecorder.stop();
                audioRecorder.removeAllListeners("data");
              }
            } catch {}

            // Dispose any existing audio tracks before re-requesting
            try {
              audioStreamRef.current?.getTracks().forEach((track) => track.stop());
            } catch {}
            audioStreamRef.current = null;

            // Always grab a fresh microphone stream after a screen change
            try {
              const freshAudioStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true,
                  channelCount: 1,
                },
              });
              audioStreamRef.current = freshAudioStream;
              setShouldStartAudioRecorder(false);
              needsAudioRecorderRestartRef.current = true;
              if (connected) {
                needsAudioRecorderRestartRef.current = false;
                setShouldStartAudioRecorder(true);
              }
            } catch (error) {
              appLogger.error.audio(error instanceof Error ? error.message : String(error));
            }
          }

          onButtonClicked?.(true);

          // After resume: tell AI the screen changed and push a short frame burst so it sees the new screen
          try {
            client.send([
              {
                text: `Screen changed to: ${newScreenName}. Please continue based on what is visible now.`,
              },
            ]);
          } catch {}

          const burstOnce = () => {
            try {
              const video = videoRef.current as HTMLVideoElement | null;
              const canvas = renderCanvasRef.current as HTMLCanvasElement | null;
              if (!video || !canvas) return;
              const vw = video.videoWidth || 0;
              const vh = video.videoHeight || 0;
              if (vw === 0 || vh === 0) return;
              const ctx = canvas.getContext("2d");
              if (!ctx) return;
              canvas.width = Math.max(1, Math.floor(vw * 0.25));
              canvas.height = Math.max(1, Math.floor(vh * 0.25));
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64 = canvas.toDataURL("image/jpeg", 1.0);
              const data = base64.slice(base64.indexOf(",") + 1);
              client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
            } catch {}
          };

          // Wait a moment for video metadata to settle after stream swap
          for (let i = 0; i < 5; i++) {
            await new Promise((r) => setTimeout(r, 120));
            burstOnce();
          }
        }
      } catch {}
    } catch (error) {
      appLogger.generic.info(
        `🔍 ChangeScreen: error ${error instanceof Error ? error.message : String(error)}`,
      );
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        alert(
          "Screen sharing permission was denied. The current screen will continue to be shared.",
        );
      } else {
        alert("Failed to change screen sharing. The current screen will continue to be shared.");
      }
    } finally {
      (client as any).screenChangeInProgress = false;
      isChangingScreenRef.current = false;
    }
  };

  // Hide entire tray only during OS permission dialogs
  // Don't hide when screen sharing is granted (need to show "Start review" button)
  // Only hide if requesting permissions AND screen sharing not yet granted
  const shouldHideAllUi = isRequestingPermissions && !screenSharingGranted;
  // Show UI if: connected OR has ever connected (paused state) OR screen sharing granted OR visibleContainer is true
  const isHidden =
    shouldHideAllUi ||
    (!connected && !hasEverConnected && !screenSharingGranted && !visibleContainer);

  return (
    <section
      className={cn("control-tray flex flex-col items-center", {
        "fade-in-quick": fadeInContainer,
      })}
      style={{
        display: isHidden ? "none" : undefined,
      }}
    >
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      {isSafari && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-center max-w-md">
          <p className="font-semibold mb-2">Safari is not currently supported</p>
          <p className="text-sm">
            Please use Chrome, Firefox, or Edge to start a code review session.
          </p>
        </div>
      )}
      {/* Old UI - removed since we auto-start now */}
      {/* Only show if screen sharing was granted HERE (not from modal) and not auto-starting */}
      {/* Hide if stream from modal exists (check service and videoRef) */}
      {screenSharingGranted &&
        !connected &&
        !hasEverConnected &&
        !hasAutoStartedRef.current &&
        !hasDetectedModalStreamRef.current &&
        !mediaStreamService.stream &&
        !(videoRef.current?.srcObject && !hasCheckedStreamRef.current) && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded text-blue-800 text-center max-w-md">
            <p className="font-semibold mb-2">Screen sharing active!</p>
            <p className="text-sm">
              Position this browser window next to the shared window, then click "Start review"
              below.
            </p>
            <p className="text-xs mt-2 text-blue-600">
              💡 Tip: Use your OS window management (e.g., Mission Control on Mac, Windows key +
              arrows) to arrange windows side by side.
            </p>
          </div>
        )}
      <div className="connection-button-container flex flex-col items-center">
        {/* Always show main button - it serves as Start/Pause/Resume */}
        <button
          ref={connectButtonRef}
          className={cn(
            "transition duration-200 ease-in-out focus:outline-none rounded border bg-tokyo-accent text-white shadow-sm hover:bg-tokyo-accent-darker hover:shadow-lg mb-2 py-5 px-8 cursor-pointer",
            {
              "bg-orange-500 hover:bg-orange-600": connected, // Different color when pausing
              hidden: hideMainButton || shouldHideAllUi || shouldHideMainButtonForSetup,
            },
          )}
          onClick={async () => {
            // Safari is not supported - show message and return
            if (isSafari) {
              return;
            }

            // Check state FIRST - handle different states appropriately
            if (connected) {
              // Pause
              handleMainButtonClick().catch((error) => {
                appLogger.error.general(error instanceof Error ? error.message : String(error));
              });
              return;
            }

            if (hasEverConnected) {
              // Resume
              handleMainButtonClick().catch((error) => {
                appLogger.error.general(error instanceof Error ? error.message : String(error));
              });
              return;
            }

            // Check for auto-start FIRST - if auto-start is happening, don't do anything
            if (hasAutoStartedRef.current) {
              // Auto-start is in progress/completed - don't interfere
              return;
            }

            // Check if we already have a video stream (from modal or quick start)
            // If so, just start the review without requesting screen sharing again
            // This works for both regular mode (stream from modal) and quick start mode
            // Check videoRef.current FIRST to catch streams from modal immediately
            const streamOnVideoRef = videoRef.current?.srcObject as MediaStream;
            const existingStream = activeVideoStream || streamOnVideoRef;
            if (existingStream && existingStream.getVideoTracks().length > 0) {
              // We have a stream - use handleMainButtonClick which will call startReview()
              // This ensures consistent flow and proper mic handling
              handleMainButtonClick().catch((error) => {
                appLogger.error.general(error instanceof Error ? error.message : String(error));
              });
              return;
            }

            // Also check if stream is being set up (from modal) - prevent duplicate request
            const streamFromModal = streamOnVideoRef && !hasCheckedStreamRef.current;
            if (streamFromModal) {
              // Stream from modal is being processed - don't request screen sharing again
              return;
            }

            if (screenSharingGranted) {
              // Step 2: Start review (screen sharing already granted here, not from modal)
              handleMainButtonClick().catch((error) => {
                appLogger.error.general(error instanceof Error ? error.message : String(error));
              });
              return;
            }

            // Step 1: Request screen sharing (only if we don't have a stream AND not from modal)
            // This should only happen if user manually requests screen sharing on live page
            setIsRequestingPermissions(true);
            setButtonIsOn(true);

            try {
              // Preflight check
              if (typeof preflightCheck === "function") {
                try {
                  const message = preflightCheck();
                  if (typeof message === "string" && message.trim().length > 0) {
                    alert(message);
                    setIsRequestingPermissions(false);
                    setButtonIsOn(false);
                    return;
                  }
                } catch {
                  // If validation throws, do not block start unnecessarily
                }
              }

              // Reset session state
              try {
                client.terminateSession?.();
              } catch {}

              // Request screen sharing
              const videoStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

              // Store video stream
              const videoOnlyStream = new MediaStream(videoStream.getVideoTracks());
              setActiveVideoStream(videoOnlyStream);
              onVideoStreamChange(videoOnlyStream);
              setIsScreenSharing(true);
              setScreenSharingSource(getScreenSharingSourceName(videoStream));
              videoStreamRef.current = videoStream;

              // Mark screen sharing as granted - shows "Start review" button
              setScreenSharingGranted(true);
              setPermissionsGranted(true);
              setIsRequestingPermissions(false);
              setButtonIsOn(true);
            } catch (error) {
              setIsRequestingPermissions(false);
              setButtonIsOn(false);
              if (error instanceof DOMException && error.name === "NotAllowedError") {
                if (onScreenShareCancelled) {
                  onScreenShareCancelled();
                  return;
                }
                alert("Screen sharing is required. Please allow screen sharing and try again.");
              } else {
                alert(
                  `Failed to start screen sharing: ${error instanceof Error ? error.message : String(error)}. Please try again.`,
                );
              }
            }
          }}
          disabled={isRequestingPermissions || isSafari} // Disable for Safari (not supported) or while requesting permissions
        >
          {getButtonText()}
        </button>

        {/* When paused (not connected but has ever connected): show timer under main button (custom) */}
        {!connected && hasEverConnected && typeof timerTotalMs === "number" && timerTotalMs > 0 && (
          <div className="mt-2">
            <CountdownTimer
              totalMs={timerTotalMs}
              variant="inline"
              autoStart={false}
              startTrigger={Boolean(timerStartTrigger)}
              pauseTrigger={!connected}
              isDeliberatePause={!connected}
              persistKey={timerPersistKey}
              onTimeUp={timerOnTimeUp}
              onIntroduction={timerOnIntroduction}
              onFarewell={timerOnFarewell}
            />
          </div>
        )}

        {/* When paused: show End Review under main button - but only if not showing in nav */}
        {/* (The nav button shows when connected, so this one only shows when paused) */}
        {!connected && hasEverConnected && onEndReview && (
          <button
            className="transition duration-200 ease-in-out focus:outline-none rounded bg-red-500 border border-red-600 text-white shadow-sm hover:bg-red-600 hover:shadow-lg px-3 py-2 cursor-pointer flex items-center mt-2"
            onClick={async () => {
              if (window.confirm("Are you sure you want to end this code review early?")) {
                onEndReview();
              }
            }}
            title="End Review Early"
          >
            <svg
              className="mr-1"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 6h12v12H6z" />
            </svg>
            <span className="text-xs whitespace-nowrap">Stop Code Review</span>
          </button>
        )}

        {/* Status indicators - show when screen sharing is active (connected or paused) */}
        {/* Simple: if screen sharing is active, show it */}
        {isScreenSharing && (connected || hasEverConnected) && (
          <div className="sharing-indicator flex items-center text-sm text-tokyo-fg-dim mb-4">
            <svg
              className="mr-1 text-green-400"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 16H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2zM4 6v8h16V6H4zm8 9c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" />
            </svg>
            Currently sharing {screenSharingSource || "Screen"}
          </div>
        )}

        {/* Old UI - removed since we auto-start now */}
        {/* Only show if permissions granted HERE (not from modal) and not auto-starting */}
        {/* Hide if stream from modal exists (check service and videoRef) */}
        {permissionsGranted &&
          !connected &&
          !hasEverConnected &&
          !hasAutoStartedRef.current &&
          !hasDetectedModalStreamRef.current &&
          !mediaStreamService.stream &&
          !(videoRef.current?.srcObject && !hasCheckedStreamRef.current) && (
            <div className="flex items-center text-sm text-tokyo-fg-dim mb-4">
              <svg
                className="mr-1 text-blue-400"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zM11 19.93V22h2v-2.07A8.001 8.001 0 0020 13h-2a6 6 0 11-12 0H4a8.001 8.001 0 007 6.93z" />
              </svg>
              Permissions granted - ready to start
            </div>
          )}
      </div>

      {/* Show nav when: connected OR paused (hasEverConnected) AND not requesting initial permissions */}
      {/* When paused, we show Change Screen button, so nav must be visible */}
      {/* Add dynamic class based on whether Stop button is shown (connected) */}
      <nav
        className={cn("actions-nav flex justify-center", {
          disabled: !connected && !hasEverConnected,
          // Hide nav only if: never connected AND (requesting permissions OR no screen sharing granted)
          hidden:
            !connected && !hasEverConnected && (isRequestingPermissions || !screenSharingGranted),
          // When paused (not connected), use 2-column layout (Mic + Change Screen)
          // When connected, use 3-column layout (Mic + Stop + Change Screen)
          "nav-paused": !connected && hasEverConnected,
        })}
      >
        {/* Show mute button only when connected (not when paused) */}
        {connected && showActions && (
          <button
            className={cn(
              "transition duration-200 ease-in-out focus:outline-none rounded bg-tokyo-bg-lighter border border-tokyo-selection text-tokyo-fg shadow-sm hover:shadow-lg p-2 cursor-pointer flex items-center justify-between space-x-1",
              {
                "opacity-50 cursor-not-allowed": networkMuted,
                "border-orange-500 bg-orange-100": networkMuted,
              },
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
            {!muted && !networkMuted ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zM11 19.93V22h2v-2.07A8.001 8.001 0 0020 13h-2a6 6 0 11-12 0H4a8.001 8.001 0 007 6.93z" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19 11a7 7 0 01-11.9 4.9l1.42-1.42A5 5 0 0017 11h2zm-7-8a3 3 0 00-3 3v3.18l3.9 3.9A3 3 0 0015 11V6a3 3 0 00-3-3zm8.9 18.49L3.51 4.1 2.1 5.51l3.1 3.1V11a7 7 0 006 6.92V21h2v-3.08a6.96 6.96 0 003.9-1.63l3.49 3.49 1.41-1.41z" />
              </svg>
            )}
            <AudioPulse volume={volume} active={connected && !networkMuted} hover={false} />
          </button>
        )}

        {/* End Review Button - show only when connected (when paused, show button under main button instead) */}
        {connected && onEndReview && showActions && (
          <button
            className="action-button transition duration-200 ease-in-out focus:outline-none rounded bg-red-500 border border-red-600 text-white shadow-sm hover:bg-red-600 hover:shadow-lg px-3 py-2 cursor-pointer flex items-center ml-2"
            onClick={async () => {
              if (window.confirm("Are you sure you want to end this code review early?")) {
                onEndReview();
              }
            }}
            title="End Review Early"
          >
            <svg
              className="mr-1"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 6h12v12H6z" />
            </svg>
            <span className="text-xs whitespace-nowrap">Stop Code Review</span>
          </button>
        )}

        {/* Change Screen Button - show when screen sharing is active, AFTER stop button */}
        {/* Works for both quick start and regular mode - if screen sharing is active, allow changing */}
        {/* Show when: connected (NOT paused) AND screen sharing is active AND showActions */}
        {/* Only show when actively connected - hide when paused */}
        {isScreenSharing && connected && showActions && (
          <button
            className="action-button transition duration-200 ease-in-out focus:outline-none rounded bg-blue-500 border border-blue-600 text-white shadow-sm hover:bg-blue-600 hover:shadow-lg px-3 py-2 cursor-pointer flex items-center ml-2"
            onClick={changeScreenShare}
            title="Change Screen Share"
          >
            <svg
              className="mr-1"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M20 18c1.1 0 2-.9 2-2V6a2 2 0 00-2-2H4C2.9 4 2 4.9 2 6v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6zm8 3l4 4h-3v3h-2v-3H8l4-4z" />
            </svg>
            <span className="text-xs whitespace-nowrap">Change Screen</span>
          </button>
        )}

        {/* Inline Countdown Timer (custom mode) */}
        {connected && typeof timerTotalMs === "number" && timerTotalMs > 0 && (
          <div className="ml-2 flex items-center">
            <CountdownTimer
              totalMs={timerTotalMs}
              variant="inline"
              autoStart={false}
              startTrigger={Boolean(timerStartTrigger) && connected}
              pauseTrigger={!connected}
              isDeliberatePause={!connected}
              persistKey={timerPersistKey}
              onTimeUp={timerOnTimeUp}
              onIntroduction={timerOnIntroduction}
              onFarewell={timerOnFarewell}
            />
          </div>
        )}

        {/* Screen sharing is now integrated into the main button */}
        {children}
      </nav>
    </section>
  );
}

export default memo(ControlTray);
