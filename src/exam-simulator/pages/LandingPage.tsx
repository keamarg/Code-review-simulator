import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../layout/Layout";
import RecentCodeReviews from "../components/RecentCodeReviews";
import { QuickStartModal } from "../components/ui/QuickStartModal";
import { useAuth } from "../contexts/AuthContext";

const LandingPage: React.FC = () => {
  const [showQuickStartModal, setShowQuickStartModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user && location.state?.reopenQuickStart) {
      // Clear the state to prevent it from reopening on subsequent visits
      window.history.replaceState({}, document.title);

      // Open the quick start modal
      setShowQuickStartModal(true);
    }
  }, [user, location.state]);

  // Check if user just signed in and wants to continue with quick start
  useEffect(() => {
    if (user) {
      const quickStartIntent = localStorage.getItem("quickStartIntent");
      if (quickStartIntent) {
        localStorage.removeItem("quickStartIntent");
        setShowQuickStartModal(true);
      }
    }
  }, [user]);

  useEffect(() => {
    // Auto fade-in elements that should appear immediately after page load
    const autoFadeElements = document.querySelectorAll(".fade-in-auto");
    setTimeout(() => {
      autoFadeElements.forEach((el) => {
        el.classList.add("visible");
      });
    }, 300); // Small delay for smooth page load transition

    // Scroll-triggered fade-in elements
    const scrollFadeElements = document.querySelectorAll(".fade-in");

    const fadeInOnScroll = () => {
      scrollFadeElements.forEach((el) => {
        const elementTop = el.getBoundingClientRect().top;
        // Increased threshold to ensure Recent Code Reviews always requires scrolling
        if (elementTop < window.innerHeight - 200) {
          el.classList.add("visible");
        }
      });
    };

    window.addEventListener("scroll", fadeInOnScroll);

    return () => window.removeEventListener("scroll", fadeInOnScroll);
  }, []);

  const handleQuickStart = (
    type: string,
    developerLevel: string,
    repoUrl?: string
  ) => {
    // Navigate to live page with quick start parameters and auto-start flag
    navigate("/live", {
      state: {
        quickStart: true,
        autoStart: true, // This will trigger automatic start
        type,
        developerLevel,
        repoUrl, // Pass the repo URL if provided
      },
    });
  };

  const handleQuickStartButtonClick = () => {
    if (!user) {
      // Store the quick start intent and redirect to login
      localStorage.setItem("quickStartIntent", "true");
      navigate("/login");
      return;
    }

    // User is authenticated, show the modal
    setShowQuickStartModal(true);
  };

  return (
    <Layout>
      <div className="bg-tokyo-bg">
        {/* Hero Section */}
        <section className="relative bg-tokyo-accent-darker py-16 md:py-14">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-full text-center">
                <h1 className="text-3xl md:text-5xl font-bold text-tokyo-fg-brightest">
                  Code Review Simulator
                </h1>
                <p className="mt-4 text-xl text-tokyo-fg-bright">
                  Practice code reviews with an interactive AI assistant
                </p>

                {/* Quick Start Button - Enhanced */}
                <div className="mt-12">
                  <button
                    onClick={handleQuickStartButtonClick}
                    className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-5 px-10 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-xl font-bold shadow-lg border-2 border-orange-400 hover:border-orange-300"
                  >
                    <svg
                      className="h-7 w-7 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Quick Start
                  </button>
                  <p className="text-sm text-tokyo-fg-bright mt-3">
                    Start a general code review session immediately
                  </p>
                  <p className="text-xs text-tokyo-fg-dim mt-2 flex items-center justify-center">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Google Chrome required for screen sharing and microphone
                    access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Research focus section */}
        <section className="pb-8 md:pb-10 fade-in-auto bg-tokyo-bg-lighter">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tokyo-bg-lightest flex items-center justify-center">
              <svg
                className="h-8 w-8 text-tokyo-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-tokyo-fg-bright mb-3">
              Research Project
            </h2>
            <p className="text-lg text-tokyo-fg-bright mb-3">
              This code review simulator is part of an academic research project
              investigating how AI assisted task solving impacts worklife and
              skill development through interactive code reviews.
            </p>
            <p className="text-tokyo-fg">
              By participating, you contribute to research on AI-assisted
              education and help improve tools for developers and students. All
              participation is anonymous and data is used for research purposes
              only.
            </p>
          </div>
        </section>

        {/* Recent Code Reviews Section */}
        <RecentCodeReviews />

        {/* Update CTA section to focus on research contribution */}
        <section className="py-12 md:py-16 bg-tokyo-accent-darker fade-in">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mt-4"></div>
          </div>
        </section>
      </div>

      {/* Quick Start Modal */}
      <QuickStartModal
        isOpen={showQuickStartModal}
        onClose={() => setShowQuickStartModal(false)}
        onStartReview={handleQuickStart}
      />

      {/* CSS for animations */}
      <style>
        {`
          .fade-in {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
          }
          
          .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
          }

          .fade-in-auto {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
          }
          
          .fade-in-auto.visible {
            opacity: 1;
            transform: translateY(0);
          }

          .line-clamp-2 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
          }

          .line-clamp-3 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
          }
        `}
      </style>
    </Layout>
  );
};

export default LandingPage;
