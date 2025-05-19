import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth(); // Get user and signOut from context
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-dark">
      <header className="bg-neutral-15 shadow-md border-b border-tokyo-selection">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-tokyo-accent hover:text-tokyo-accent-lighter transition-colors flex items-center"
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
            Code Review Simulator
          </Link>
          <nav>
            <ul className="flex space-x-6 items-center">
              {user && (
                <>
                  <li>
                    <Link
                      to="/create"
                      className="text-tokyo-fg hover:text-tokyo-fg-brightest"
                    >
                      Create Review
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard"
                      className="text-tokyo-fg hover:text-tokyo-fg-brightest"
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="text-tokyo-fg hover:text-tokyo-fg-brightest cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </li>
                </>
              )}
              {!user && (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="text-tokyo-fg hover:text-tokyo-fg-brightest"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/signup"
                      className="text-tokyo-fg hover:text-tokyo-fg-brightest"
                    >
                      Create Account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow relative bg-neutral-10">{children}</main>

      <footer className="bg-neutral-15 py-4 shadow-inner border-t border-tokyo-selection">
        <div className="max-w-7xl mx-auto px-4 text-center text-tokyo-fg">
          <p>
            This application is a research project investigating AI interaction
            in code reviews. Not for commercial use. All data collected is used
            solely for research purposes.
          </p>
          <p className="mt-2">
            For questions or feedback about the research, please contact{" "}
            <a
              href="mailto:marg@kea.dk"
              className="underline text-tokyo-accent"
            >
              Martin Gundtoft
            </a>{" "}
            (marg@kea.dk)
          </p>
          <p className="mt-2 text-sm">
            Based on{" "}
            <a
              href="https://github.com/behu-kea/exam-simulator"
              className="underline text-tokyo-accent"
            >
              exam-simulator
            </a>{" "}
            by Benjamin Hughes
          </p>
        </div>
      </footer>
    </div>
  );
}
