import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
import RecentCodeReviews from "../components/RecentCodeReviews";

const LandingPage: React.FC = () => {
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

  return (
    <Layout>
      <div className="bg-tokyo-bg">
        {/* Hero Section */}
        <section className="relative bg-tokyo-accent-darker py-12 md:py-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-full text-center">
                <h1 className="text-3xl md:text-5xl font-bold text-tokyo-fg-brightest">
                  Code Review Simulator
                </h1>
                <p className="mt-4 text-xl text-tokyo-fg-bright">
                  Practice code reviews with an interactive AI assistant
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Research focus section */}
        <section className="py-12 md:py-16 fade-in-auto bg-tokyo-bg-lighter">
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
