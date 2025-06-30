import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Layout from "../layout/Layout";
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

interface ExamSimulatorCardProps {
  sim: ExamSimulator;
  showToast: (message: string) => void;
  isNew?: boolean;
  isUpdated?: boolean;
}

function ExamSimulatorCard({
  sim,
  showToast,
  isNew = false,
  isUpdated = false,
}: ExamSimulatorCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    // Add a small delay to prevent immediate closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent menu close from click outside
    try {
      const fullUrl = `${window.location.origin}/Code-review-simulator/live?id=${sim.id}`;
      await navigator.clipboard.writeText(fullUrl);
      setMenuOpen(false);
      showToast("Link copied to clipboard!");
    } catch (err) {
      showToast("Could not copy link");
    }
  };

  return (
    <div
      className={`relative p-5 bg-tokyo-bg-lighter rounded-lg shadow-md transition-all duration-200 flex flex-col justify-between h-full border border-tokyo-selection ${
        isHovered ? "shadow-lg transform -translate-y-1" : ""
      } ${
        isNew || isUpdated ? "ring-2 ring-tokyo-accent ring-opacity-50" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* NEW/UPDATED indicator pill */}
      {(isNew || isUpdated) && (
        <div className="absolute top-0.5 right-1 z-10">
          <span
            className={`text-white text-xs px-3 py-0 rounded-full ${
              isNew ? "bg-green-500" : "bg-purple-600"
            }`}
          >
            {isNew ? "NEW" : "UPDATED"}
          </span>
        </div>
      )}

      {/* Card Header with Title and Menu */}
      <div className="flex justify-between items-start mb-3">
        <Link to={`/exam?id=${sim.id}`} className="group pr-20">
          <h2 className="text-xl font-bold text-tokyo-fg-bright group-hover:text-tokyo-accent transition-colors">
            {sim.title}
          </h2>
        </Link>

        {/* Three-dots Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 rounded-full hover:bg-tokyo-bg-lightest transition-colors cursor-pointer"
            aria-label="Menu"
          >
            <svg
              className="h-5 w-5 text-tokyo-comment"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
              <circle cx="12" cy="5" r="1" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute top-full right-0 mt-1 bg-tokyo-bg-lightest border border-tokyo-selection rounded-md shadow-xl backdrop-blur-sm z-20 w-48 py-1 overflow-hidden">
              <button
                onClick={handleCopyLink}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-tokyo-fg hover:bg-tokyo-selection transition-colors cursor-pointer"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Link
              </button>
              <Link
                to={`/exam?id=${sim.id}`}
                className="text-tokyo-accent hover:text-tokyo-accent-darker text-sm font-medium mr-4"
              >
                Edit Custom Review
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-grow">
        {/* Task Description */}
        <p className="text-tokyo-fg line-clamp-3 mb-3">{sim.description}</p>

        {/* Exam Details */}
        <div className="flex flex-wrap gap-3 mb-4">
          {sim.duration > 0 && (
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
              {formatDuration(sim.duration)}
            </div>
          )}

          {sim.type && (
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
              {sim.type}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-auto pt-3 border-t border-tokyo-selection">
        <Link
          to={`/live?id=${sim.id}`}
          className="w-full bg-tokyo-accent hover:bg-tokyo-accent-darker text-white text-center py-2 px-4 rounded-md transition-colors flex items-center justify-center"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Start code review
        </Link>
      </div>
    </div>
  );
}

// Empty state component
const EmptyState = () => (
  <div className="bg-tokyo-bg-lighter rounded-lg shadow-md p-8 text-center max-w-md mx-auto border border-tokyo-selection">
    <div className="mb-6 flex justify-center">
      <svg
        className="h-24 w-24 text-tokyo-comment"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-tokyo-fg-bright mb-2">
      No code reviews found.
    </h3>
    <p className="text-tokyo-fg mb-6">
      Create your first code review to get started.
    </p>
    <Link
      to="/create"
      className="inline-flex items-center justify-center bg-tokyo-accent hover:bg-tokyo-accent-darker text-white py-3 px-6 rounded-md transition-colors shadow-md"
    >
      <svg
        className="h-5 w-5 mr-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      Create your first code review
    </Link>
  </div>
);

export default function Dashboard() {
  const [toastMessage, setToastMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [examSimulators, setExamSimulators] = useState<ExamSimulator[]>([]);
  const [newlyCreatedExamId, setNewlyCreatedExamId] = useState<string | null>(
    null
  );
  const [recentlyUpdatedExamId, setRecentlyUpdatedExamId] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function getExamSimulators() {
      const { data: fetchedExamSimulators, error } = await supabase
        .from("exams")
        .select()
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching exams:", error);
        // Handle error appropriately, maybe show a message to the user
      } else if (fetchedExamSimulators) {
        setExamSimulators(fetchedExamSimulators as ExamSimulator[]);
      } else {
        setExamSimulators([]);
      }
    }

    getExamSimulators();

    // Check for newly created exam ID in localStorage
    const newlyCreatedId = localStorage.getItem("newlyCreatedExamId");
    const dashboardShownNew = localStorage.getItem("dashboardShownNew");
    if (newlyCreatedId && !dashboardShownNew) {
      setNewlyCreatedExamId(newlyCreatedId);
      // Mark that dashboard has shown the NEW pill
      localStorage.setItem("dashboardShownNew", "true");
    }

    // Check for recently updated exam ID in localStorage
    const recentlyUpdatedId = localStorage.getItem("recentlyUpdatedExamId");
    const dashboardShownUpdated = localStorage.getItem("dashboardShownUpdated");
    if (recentlyUpdatedId && !dashboardShownUpdated) {
      setRecentlyUpdatedExamId(recentlyUpdatedId);
      // Mark that dashboard has shown the UPDATED pill
      localStorage.setItem("dashboardShownUpdated", "true");
    }

    // Clean up if both components have shown their pills
    const landingPageShownNew = localStorage.getItem("landingPageShownNew");
    const landingPageShownUpdated = localStorage.getItem(
      "landingPageShownUpdated"
    );

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

  // Filter simulators based on search term
  const filteredSimulators = examSimulators.filter(
    (sim) =>
      sim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
      // Remove message after fade out animation completes
      setTimeout(() => setToastMessage(""), 300);
    }, 3000);
  };

  return (
    <Layout>
      <div className="relative min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold text-tokyo-fg-bright mb-4 md:mb-0">
              Your code reviews
            </h1>
          </div>

          {examSimulators.length > 0 && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-tokyo-comment"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search code reviews..."
                className="pl-10 pr-4 py-2 w-full md:w-64 border border-tokyo-selection bg-tokyo-bg-lighter text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Dashboard Content */}
        {examSimulators.length > 0 ? (
          <>
            {filteredSimulators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSimulators.map((sim) => (
                  <ExamSimulatorCard
                    key={sim.id}
                    sim={sim}
                    showToast={showToast}
                    isNew={sim.id === newlyCreatedExamId}
                    isUpdated={sim.id === recentlyUpdatedExamId}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-tokyo-bg-lighter rounded-lg shadow-md p-8 text-center border border-tokyo-selection">
                <p className="text-tokyo-fg">
                  No code reviews match your search. Try a different search term
                  or clear your search.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-tokyo-accent hover:text-tokyo-accent-lighter font-medium"
                >
                  Clear Search
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}

        {/* Mobile Create Button */}
        <Link
          to="/create"
          className="md:hidden fixed bottom-6 right-6 bg-tokyo-accent hover:bg-tokyo-accent-darker text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
          aria-label="Create new simulator"
        >
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </Link>

        {/* Toast Notification */}
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-tokyo-bg-lightest text-tokyo-fg-bright py-3 px-6 rounded-lg shadow-lg z-50 flex items-center transition-opacity duration-300 ${
            isToastVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <svg
            className="h-5 w-5 text-tokyo-green mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {toastMessage}
        </div>
      </div>
    </Layout>
  );
}
