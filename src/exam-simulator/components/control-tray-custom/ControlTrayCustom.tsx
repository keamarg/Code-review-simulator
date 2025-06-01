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

import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useGenAILiveContext } from "../../../contexts/GenAILiveContext";
import { UseMediaStreamResult } from "../../../hooks/use-media-stream-mux";
import { useScreenCapture } from "../../../hooks/use-screen-capture";
import { useWebcam } from "../../../hooks/use-webcam";
import { AudioRecorder } from "../../../lib/audio-recorder";
import AudioPulse from "../../../components/audio-pulse/AudioPulse";
import "./control-tray-custom.scss";

export type ControlTrayProps = {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  onButtonClicked?: (isButtonOn: boolean) => void;
  onEndReview?: () => void;
  hasExamStarted?: boolean;
};

type MediaStreamButtonProps = {
  isStreaming: boolean;
  onIcon: string;
  offIcon: string;
  start: () => Promise<any>;
  stop: () => any;
};

/**
 * button used for triggering webcam or screen-capture
 */
const MediaStreamButton = memo(
  ({ isStreaming, onIcon, offIcon, start, stop }: MediaStreamButtonProps) =>
    isStreaming ? (
      <button
        className="transition duration-200 ease-in-out focus:outline-none rounded bg-tokyo-bg-lighter border border-tokyo-selection text-tokyo-fg shadow-sm hover:shadow-lg p-2 cursor-pointer flex items-center"
        onClick={stop}
      >
        <span className="material-symbols-outlined">{onIcon}</span>
      </button>
    ) : (
      <button
        className="transition duration-200 ease-in-out focus:outline-none rounded bg-tokyo-bg-lighter border border-tokyo-selection text-tokyo-fg shadow-sm hover:shadow-lg p-2 cursor-pointer flex items-center"
        onClick={async (e) => {
          e.preventDefault();
          try {
            await start();
          } catch (error) {
            console.error("Error starting media stream:", error);
            // Don't throw the error to prevent unhandled promise rejection
          }
        }}
      >
        <span className="material-symbols-outlined">{offIcon}</span>
      </button>
    )
);

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  onButtonClicked = (isButtonOn) => {},
  onEndReview,
  supportsVideo,
  hasExamStarted,
}: ControlTrayProps) {
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const [buttonIsOn, setButtonIsOn] = useState(false);

  const { client, connected, disconnect, volume } = useGenAILiveContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };

    // Clean up existing listeners first
    audioRecorder.off("data", onData).off("volume", setInVolume);

    if (connected && !muted && audioRecorder) {
      // Add listeners and start recording
      audioRecorder.on("data", onData).on("volume", setInVolume);
      audioRecorder.start().catch((error) => {
        console.error("Failed to start audio recording:", error);
      });
    } else {
      // Stop recording when muted or disconnected
      audioRecorder.stop();
    }

    return () => {
      // Clean up listeners on unmount or dependency change
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

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

  // Enhanced handler for swapping from one video-stream to the next
  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    try {
      if (next) {
        const mediaStream = await next.start();
        setActiveVideoStream(mediaStream);
        onVideoStreamChange(mediaStream);
      } else {
        setActiveVideoStream(null);
        onVideoStreamChange(null);
      }

      videoStreams.filter((msr) => msr !== next).forEach((msr) => msr.stop());
    } catch (error) {
      console.error("Error changing video streams:", error);
      // Handle the error gracefully without throwing
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        console.warn(
          "Media permission denied. User may need to grant permission."
        );
      }
    }
  };

  // Enhanced button click handler with integrated screen sharing
  const handleMainButtonClick = async () => {
    const newButtonState = !buttonIsOn;
    setButtonIsOn(newButtonState);

    try {
      if (newButtonState) {
        // Starting - first ensure screen sharing is active
        if (!screenCapture.isStreaming) {
          console.log("Starting screen sharing before AI connection...");
          try {
            const mediaStream = await screenCapture.start();
            setActiveVideoStream(mediaStream);
            onVideoStreamChange(mediaStream);
            console.log("Screen sharing started successfully");
          } catch (screenShareError) {
            console.error("Screen sharing failed:", screenShareError);
            // Revert button state if screen sharing fails
            setButtonIsOn(false);

            // Show user-friendly error message
            if (
              screenShareError instanceof DOMException &&
              screenShareError.name === "NotAllowedError"
            ) {
              alert(
                "Screen sharing is required to start the code review. Please allow screen sharing and try again."
              );
            } else {
              alert("Failed to start screen sharing. Please try again.");
            }
            return; // Don't proceed with AI connection
          }
        }

        // Only proceed with AI connection after screen sharing is confirmed
        console.log(
          "Screen sharing confirmed, proceeding with AI connection..."
        );
        onButtonClicked(newButtonState);
      } else {
        // Pausing - disconnect from the API and stop screen sharing
        await disconnect();

        // Stop screen sharing when pausing
        if (screenCapture.isStreaming) {
          screenCapture.stop();
          setActiveVideoStream(null);
          onVideoStreamChange(null);
        }

        // Notify parent component
        onButtonClicked(newButtonState);
      }
    } catch (error) {
      console.error("Error toggling connection:", error);
      // Revert button state on error
      setButtonIsOn(!newButtonState);
    }
  };

  return (
    <section className="control-tray flex flex-col items-center">
      <canvas style={{ display: "none" }} ref={renderCanvasRef} />
      <div className="connection-button-container flex flex-col items-center">
        <button
          ref={connectButtonRef}
          className={cn(
            "transition duration-200 ease-in-out focus:outline-none rounded border bg-tokyo-accent text-white shadow-sm hover:bg-tokyo-accent-darker hover:shadow-lg mb-2 py-5 px-8 cursor-pointer"
          )}
          onClick={handleMainButtonClick}
          disabled={false} // Always enabled for better UX
        >
          {connected
            ? "Pause"
            : hasExamStarted
            ? "Resume"
            : "Share screen & start review"}
        </button>

        {/* Screen sharing status indicator */}
        {screenCapture.isStreaming && (
          <div className="flex items-center text-sm text-tokyo-fg-dim mb-4">
            <span className="material-symbols-outlined mr-1 text-green-400">
              present_to_all
            </span>
            Screen sharing active
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
              if (
                window.confirm(
                  "Are you sure you want to end this code review early?"
                )
              ) {
                // Stop audio recording
                audioRecorder.stop();

                // Disconnect from the API
                await disconnect();

                // Stop screen sharing
                if (screenCapture.isStreaming) {
                  screenCapture.stop();
                  setActiveVideoStream(null);
                  onVideoStreamChange(null);
                }

                // Reset button state
                setButtonIsOn(false);

                // Call the end review handler
                onEndReview();
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
