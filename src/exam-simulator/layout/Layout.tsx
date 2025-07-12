import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth
import { SettingsModal } from "../components/ui/SettingsModal";

interface LayoutProps {
  children: React.ReactNode;
  onVoiceChange?: (newVoice: string) => void;
  isSessionActive?: boolean;
}

export default function Layout({
  children,
  onVoiceChange,
  isSessionActive = false,
}: LayoutProps) {
  const { user, signOut } = useAuth(); // Get user and signOut from context
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  const handleVoiceChange = async (newVoice: string) => {
    if (onVoiceChange) {
      // If we have a voice change handler (from AIExaminerPage), use it
      onVoiceChange(newVoice);
    } else {
      // Otherwise, just store the preference for future sessions
      console.log(`🎤 Voice preference saved: ${newVoice}`);
    }
  };

  return (
    <div className="min-h-screen bg-tokyo-bg text-tokyo-fg">
      <header className="bg-tokyo-bg-lighter border-b border-tokyo-selection">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link
                to="/"
                className="flex items-center space-x-3 text-xl font-bold text-tokyo-fg-brightest"
              >
                <div className="h-12 w-12 mr-4 flex-shrink-0">
                  <svg
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-full w-full"
                  >
                    <rect width="100" height="100" rx="10" fill="#1a1b26" />

                    {/* Code angle brackets */}
                    <path
                      d="M30 25 L15 50 L30 75"
                      stroke="#7aa2f7"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M75 25 L90 50 L75 75"
                      stroke="#7aa2f7"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Shorter backslash */}
                    <path
                      d="M45 35 L55 65"
                      stroke="#bb9af7"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* AI symbol after backslash */}
                    <text
                      x="57"
                      y="50"
                      fontSize="16"
                      fontWeight="bold"
                      fill="#f7768e"
                      fontFamily="monospace"
                    >
                      AI
                    </text>
                  </svg>
                </div>
                <span>Code Review Simulator</span>
              </Link>
            </div>

            <nav>
              <ul className="flex space-x-6 items-center">
                {user && (
                  <>
                    <li>
                      <Link
                        to="/create"
                        className="text-tokyo-fg hover:text-tokyo-fg-brightest transition-colors"
                      >
                        Create Review
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/dashboard"
                        className="text-tokyo-fg hover:text-tokyo-fg-brightest transition-colors"
                      >
                        Saved Reviews
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="text-tokyo-fg hover:text-tokyo-fg-brightest transition-colors cursor-pointer"
                      >
                        Log out
                      </button>
                    </li>
                    <li>
                      {/* Settings Icon */}
                      <button
                        onClick={handleSettingsClick}
                        className="text-tokyo-fg hover:text-tokyo-fg-brightest transition-colors flex items-center"
                        title="Settings"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                    </li>
                  </>
                )}
                {!user && (
                  <>
                    <li>
                      <Link
                        to="/login"
                        className="text-tokyo-fg hover:text-tokyo-fg-brightest transition-colors"
                      >
                        Log in
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/signup"
                        className="bg-tokyo-accent text-white px-4 py-2 rounded-md hover:bg-tokyo-accent-lighter transition-colors"
                      >
                        Create account
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-tokyo-bg-lighter border-t border-tokyo-selection py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-tokyo-fg text-sm mb-2">
              This application is a research project investigating AI
              interaction in code reviews. Not for commercial use. All data
              collected is used solely for research purposes.
            </p>
            <p className="text-tokyo-fg text-sm mb-2">
              For questions or feedback about the research, please contact
              Martin Gundtoft (marg@kea.dk)
            </p>
            <p className="text-tokyo-fg text-xs text-tokyo-fg-dim">
              Based on exam-simulator by Benjamin Hughes
            </p>
          </div>
        </div>
      </footer>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
        onVoiceChange={handleVoiceChange}
        isSessionActive={isSessionActive}
      />
    </div>
  );
}
