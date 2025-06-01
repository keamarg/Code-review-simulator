import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { ExamSimulator } from "../../types/ExamSimulator";

// Duration formatter
const formatDuration = (minutes: number): string => {
  if (!minutes) return "No duration set";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

const RecentCodeReviews: React.FC = () => {
  const [recentReviews, setRecentReviews] = useState<ExamSimulator[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyCreatedExamId, setNewlyCreatedExamId] = useState<string | null>(
    null
  );
  const [recentlyUpdatedExamId, setRecentlyUpdatedExamId] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function getRecentReviews() {
      const { data: fetchedReviews, error } = await supabase
        .from("exams")
        .select()
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error fetching recent reviews:", error);
      } else if (fetchedReviews) {
        setRecentReviews(fetchedReviews as ExamSimulator[]);
      } else {
        setRecentReviews([]);
      }
      setLoading(false);
    }

    getRecentReviews();

    // Check for newly created exam ID in localStorage
    const newlyCreatedId = localStorage.getItem("newlyCreatedExamId");
    const landingPageShownNew = localStorage.getItem("landingPageShownNew");
    if (newlyCreatedId && !landingPageShownNew) {
      setNewlyCreatedExamId(newlyCreatedId);
      // Mark that landing page has shown the NEW pill
      localStorage.setItem("landingPageShownNew", "true");
    }

    // Check for recently updated exam ID in localStorage
    const recentlyUpdatedId = localStorage.getItem("recentlyUpdatedExamId");
    const landingPageShownUpdated = localStorage.getItem(
      "landingPageShownUpdated"
    );
    if (recentlyUpdatedId && !landingPageShownUpdated) {
      setRecentlyUpdatedExamId(recentlyUpdatedId);
      // Mark that landing page has shown the UPDATED pill
      localStorage.setItem("landingPageShownUpdated", "true");
    }

    // Clean up if both components have shown their pills
    const dashboardShownNew = localStorage.getItem("dashboardShownNew");
    const dashboardShownUpdated = localStorage.getItem("dashboardShownUpdated");

    if (landingPageShownNew && dashboardShownNew) {
      localStorage.removeItem("newlyCreatedExamId");
      localStorage.removeItem("landingPageShownNew");
      localStorage.removeItem("dashboardShownNew");
    }

    if (landingPageShownUpdated && dashboardShownUpdated) {
      localStorage.removeItem("recentlyUpdatedExamId");
      localStorage.removeItem("landingPageShownUpdated");
      localStorage.removeItem("dashboardShownUpdated");
    }
  }, []);

  if (loading) {
    return (
      <section className="py-8 md:py-12 bg-tokyo-bg-lighter fade-in">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h2 className="text-2xl md:text-3xl font-bold text-tokyo-fg-bright">
                Recent Code Reviews
              </h2>
            </div>
            <p className="text-lg text-tokyo-fg">
              Check out some recently created code review sessions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-tokyo-bg-lightest rounded-lg p-6 border border-tokyo-selection animate-pulse"
              >
                <div className="h-6 bg-tokyo-selection rounded mb-4"></div>
                <div className="h-4 bg-tokyo-selection rounded mb-2"></div>
                <div className="h-4 bg-tokyo-selection rounded mb-4 w-3/4"></div>
                <div className="flex gap-3 mb-4">
                  <div className="h-4 bg-tokyo-selection rounded w-16"></div>
                  <div className="h-4 bg-tokyo-selection rounded w-20"></div>
                </div>
                <div className="h-10 bg-tokyo-selection rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (recentReviews.length === 0) {
    return (
      <section className="py-8 md:py-12 bg-tokyo-bg-lighter fade-in">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tokyo-bg-lightest flex items-center justify-center">
            <svg
              className="h-8 w-8 text-tokyo-comment"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-tokyo-fg-bright mb-3">
            Recent Code Reviews
          </h2>
          <p className="text-lg text-tokyo-fg mb-4">
            No public code reviews available yet.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center bg-tokyo-accent hover:bg-tokyo-accent-darker text-white py-3 px-6 rounded-md transition-colors"
          >
            Create your first review
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12 bg-tokyo-bg-lighter fade-in">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-tokyo-fg-bright mb-3">
            Recent Code Reviews
          </h2>
          <p className="text-lg text-tokyo-fg">
            Check out some recently created code review sessions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {recentReviews.map((review) => {
            const isNew = review.id === newlyCreatedExamId;
            const isUpdated = review.id === recentlyUpdatedExamId;

            return (
              <div
                key={review.id}
                className={`relative bg-tokyo-bg-lightest rounded-lg p-6 border border-tokyo-selection hover:shadow-lg transition-all duration-200 hover:transform hover:-translate-y-1 ${
                  isNew || isUpdated
                    ? "ring-2 ring-tokyo-accent ring-opacity-50"
                    : ""
                }`}
              >
                {/* NEW/UPDATED indicator pill */}
                {(isNew || isUpdated) && (
                  <div className="absolute top-0.5 right-1 z-10">
                    <span
                      className={`absolute top-0.5 right-1 text-white text-xs font-bold px-3 py-0 rounded-full ${
                        isNew ? "bg-green-500" : "bg-purple-600"
                      }`}
                    >
                      {isNew ? "NEW" : "UPDATED"}
                    </span>
                  </div>
                )}

                {/* Review Title */}
                <h3 className="text-xl font-bold text-tokyo-fg-bright mb-3 line-clamp-2 pr-20">
                  {review.title}
                </h3>

                {/* Review Description */}
                <p className="text-tokyo-fg text-sm mb-4 line-clamp-3">
                  {review.description}
                </p>

                {/* Review Details */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {review.duration > 0 && (
                    <div className="flex items-center text-sm text-tokyo-comment">
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
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formatDuration(review.duration)}
                    </div>
                  )}

                  {review.type && (
                    <div className="flex items-center text-sm text-tokyo-comment">
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {review.type}
                    </div>
                  )}

                  {review.learning_goals && (
                    <div className="flex items-center text-sm text-tokyo-comment">
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {review.learning_goals}
                    </div>
                  )}
                </div>

                {/* Try Review Button */}
                <Link
                  to={`/live?id=${review.id}`}
                  className="w-full bg-tokyo-accent hover:bg-tokyo-accent-darker text-white text-center py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10v4a2 2 0 002 2h2a2 2 0 002-2v-4M9 10V9a2 2 0 012-2h2a2 2 0 012 2v1.01"
                    />
                  </svg>
                  Try this review
                </Link>
              </div>
            );
          })}
        </div>

        {/* View All Reviews Link */}
        <div className="text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-tokyo-accent hover:text-tokyo-accent-lighter font-medium transition-colors"
          >
            View all reviews
            <svg
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default RecentCodeReviews;
