import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useExamSimulators } from "../contexts/ExamSimulatorContext";
import Layout from "../components/layout/Layout";
import { ExamSimulator } from "../contexts/ExamSimulatorContext";

// Format badge component
const FormatBadge = ({ format }: { format: string }) => {
  if (!format) return null;

  return (
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
      {format}
    </span>
  );
};

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
}

function ExamSimulatorCard({ sim, showToast }: ExamSimulatorCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = () => setMenuOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent menu close from click outside
    try {
      const fullUrl = `${window.location.origin}/live?id=${sim.id}`;
      await navigator.clipboard.writeText(fullUrl);
      setMenuOpen(false);
      showToast("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy the link", err);
      showToast("Failed to copy link");
    }
  };

  return (
    <div
      className={`relative p-5 bg-white rounded-lg shadow-md transition-all duration-200 flex flex-col justify-between h-full border border-gray-100 ${
        isHovered ? "shadow-lg transform -translate-y-1" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header with Title and Menu */}
      <div className="flex justify-between items-start mb-3">
        <Link to={`/exam?id=${sim.id}`} className="group">
          <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
            {sim.title}
          </h2>
        </Link>

        {/* Three-dots Menu Button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            <svg
              className="h-5 w-5 text-gray-500"
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
            <div className="absolute top-full right-0 mt-1 bg-white border rounded-md shadow-lg z-10 w-48 py-1 overflow-hidden">
              <button
                onClick={handleCopyLink}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
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
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                onClick={() => setMenuOpen(false)}
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit Exam
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-grow">
        {/* Format Badge */}
        {sim.format && (
          <div className="mb-3">
            <FormatBadge format={sim.format} />
          </div>
        )}

        {/* Task Description */}
        <p className="text-gray-600 line-clamp-3 mb-3">{sim.task}</p>

        {/* Exam Details */}
        <div className="flex flex-wrap gap-3 mb-4">
          {sim.duration > 0 && (
            <div className="flex items-center text-sm text-gray-500">
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

          {sim.examType && (
            <div className="flex items-center text-sm text-gray-500">
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
              {sim.examType}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="mt-auto pt-3 border-t border-gray-100">
        <Link
          to={`/live?id=${sim.id}`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors flex items-center justify-center"
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
          Start Simulator
        </Link>
      </div>
    </div>
  );
}

// Empty state component
const EmptyState = () => (
  <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md mx-auto">
    <div className="mb-6 flex justify-center">
      <svg
        className="h-24 w-24 text-gray-300"
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
    <h3 className="text-xl font-semibold text-gray-800 mb-2">
      No Exam Simulators Yet
    </h3>
    <p className="text-gray-600 mb-6">
      Create your first exam simulator to get started with testing your
      students.
    </p>
    <Link
      to="/create"
      className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md transition-colors shadow-md"
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
      Create Your First Simulator
    </Link>
  </div>
);

export default function Dashboard() {
  const { examSimulators } = useExamSimulators();
  const [toastMessage, setToastMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);

  // Filter simulators based on search term
  const filteredSimulators = examSimulators.filter(
    (sim) =>
      sim.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sim.task.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="relative min-h-screen max-w-5xl mx-auto px-4 py-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
              Your Exam Simulators
            </h1>
          </div>

          {examSimulators.length > 0 && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
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
                placeholder="Search simulators..."
                className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">
                  No simulators match your search. Try a different term or clear
                  your search.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
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
          className="md:hidden fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors"
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
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white py-3 px-6 rounded-lg shadow-lg z-50 flex items-center transition-opacity duration-300 ${
            isToastVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <svg
            className="h-5 w-5 text-green-400 mr-2"
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
