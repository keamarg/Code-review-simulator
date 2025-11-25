import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import cn from "classnames";
import { mediaStreamService } from "../../lib/mediaStreamService";

interface ScreenShareSetupProps {
  onScreenShareReady: (videoStream: MediaStream) => void;
  onCancel?: () => void;
}

/**
 * Simplified screen sharing setup component
 * Step 1: Request screen sharing
 * Step 2: Show "Start review" button after screen sharing is granted
 */
export const ScreenShareSetup: React.FC<ScreenShareSetupProps> = ({
  onScreenShareReady,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [screenSharingGranted, setScreenSharingGranted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect Safari
  const isSafari =
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
    !navigator.userAgent.toLowerCase().includes("chrome");

  // Set video element source when stream is available
  useEffect(() => {
    if (videoRef.current && videoStreamRef.current) {
      const videoOnlyStream = new MediaStream(videoStreamRef.current.getVideoTracks());
      videoRef.current.srcObject = videoOnlyStream;
    }
  }, [screenSharingGranted]);

  const handleShareScreen = () => {
    if (isSafari) {
      setError("Safari is not currently supported. Please use Chrome, Firefox, or Edge.");
      return;
    }

    setIsRequesting(true);
    setError(null);

    // Request screen sharing
    navigator.mediaDevices
      .getDisplayMedia({ video: true })
      .then((videoStream) => {
        videoStreamRef.current = videoStream;
        setScreenSharingGranted(true);
        setIsRequesting(false);

        // Notify parent that screen sharing is ready
        onScreenShareReady(videoStream);
      })
      .catch((err) => {
        setIsRequesting(false);
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setError("Screen sharing was cancelled or denied. Please try again.");
          if (onCancel) {
            onCancel();
          }
        } else {
          setError(
            `Failed to start screen sharing: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      });
  };

  const handleStartReview = () => {
    if (videoStreamRef.current) {
      // Store the stream in the service so CodeReviewPage can pick it up
      mediaStreamService.setStream(videoStreamRef.current);

      // Navigate to live page - the video stream will be passed via the service
      navigate("/live");
    }
  };

  const handleCancel = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    if (onCancel) {
      onCancel();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-tokyo-bg p-4">
      <div className="max-w-md w-full bg-tokyo-bg-lighter rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-tokyo-fg mb-6 text-center">Screen Sharing Setup</h2>

        {isSafari && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-center">
            <p className="font-semibold mb-2">Safari is not currently supported</p>
            <p className="text-sm">
              Please use Chrome, Firefox, or Edge to start a code review session.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 rounded text-red-800 text-center">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!screenSharingGranted ? (
          <div className="space-y-4">
            <p className="text-tokyo-fg-dim text-center mb-6">
              Click the button below to share your screen. You'll be able to select which window or
              tab to share.
            </p>
            <button
              onClick={handleShareScreen}
              disabled={isRequesting || isSafari}
              className={cn(
                "w-full py-4 px-6 rounded-lg font-semibold text-white transition duration-200",
                {
                  "bg-tokyo-accent hover:bg-tokyo-accent-darker": !isRequesting && !isSafari,
                  "bg-gray-400 cursor-not-allowed": isRequesting || isSafari,
                },
              )}
            >
              {isRequesting ? "Requesting screen sharing..." : "Share Screen"}
            </button>
            {onCancel && (
              <button
                onClick={handleCancel}
                className="w-full py-2 px-4 rounded-lg text-tokyo-fg-dim hover:text-tokyo-fg transition"
              >
                Cancel
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-4">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full rounded-lg border border-tokyo-selection"
                style={{ maxHeight: "300px" }}
              />
            </div>
            <p className="text-tokyo-fg-dim text-center mb-6">
              Screen sharing is active! Click "Start Review" to begin your code review session.
            </p>
            <button
              onClick={handleStartReview}
              className="w-full py-4 px-6 rounded-lg font-semibold bg-green-600 hover:bg-green-700 text-white transition duration-200"
            >
              Start Review
            </button>
            <button
              onClick={handleCancel}
              className="w-full py-2 px-4 rounded-lg text-tokyo-fg-dim hover:text-tokyo-fg transition"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
