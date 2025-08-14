import React from "react";

interface ReconnectionBannerProps {
  isVisible: boolean;
  isReconnecting: boolean;
  timeLeft?: number;
  onReconnect?: () => void;
  onEndSession?: () => void;
  showReconnectButton?: boolean;
}

export const ReconnectionBanner: React.FC<ReconnectionBannerProps> = ({
  isVisible,
  isReconnecting,
  timeLeft,
}) => {
  if (!isVisible) return null;

  return (
    <>
      {/* Overlay backdrop - lighter to show it's informational */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" />

      {/* Modal content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-tokyo-base border border-tokyo-selection rounded-lg shadow-2xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {isReconnecting ? (
                  <div className="w-6 h-6 border-2 border-tokyo-accent border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg
                    className="w-6 h-6 text-tokyo-orange"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-tokyo-fg-bright">
                  {isReconnecting
                    ? "Reconnecting..."
                    : timeLeft
                    ? "Connection Closing"
                    : "Network Offline"}
                </h3>
                <p className="text-sm text-tokyo-fg-dim mt-1">
                  {isReconnecting
                    ? "Restoring session and AI connection... Your conversation will continue from where it left off."
                    : timeLeft
                    ? `Connection will close in ${Math.ceil(
                        timeLeft / 1000
                      )} seconds, then reconnect automatically`
                    : "Network connection lost. Reconnection will start automatically when network is restored."}
                </p>

                {!isReconnecting && !timeLeft && (
                  <p className="text-xs text-tokyo-fg-dim mt-2 opacity-75">
                    Waiting for network connection to be restored...
                  </p>
                )}

                {isReconnecting && (
                  <p className="text-xs text-tokyo-fg-dim mt-2 opacity-75">
                    Please wait while we restore your session with full
                    conversation context...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
