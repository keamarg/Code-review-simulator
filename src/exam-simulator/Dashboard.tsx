import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCodeReview } from "../contexts/ExamSimulatorContext";
import Layout from "../components/layout/Layout";
import { CodeReviewScenario } from "../contexts/ExamSimulatorContext";

// Format badge component
const FormatBadge = ({ format }: { format: string }) => (
  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    {format}
  </span>
);

// Duration formatter
const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}min`
    : `${hours}h`;
};

interface CodeReviewCardProps {
  scenario: CodeReviewScenario;
  showToast: (message: string) => void;
}

function CodeReviewCard({ scenario, showToast }: CodeReviewCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const fullUrl = `${window.location.origin}/live?id=${scenario.id}`;
      await navigator.clipboard.writeText(fullUrl);
      setMenuOpen(false);
      showToast("Link copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy link:", err);
      showToast("Failed to copy link");
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md p-4 flex flex-col h-full hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header with Title and Menu */}
      <div className="flex justify-between items-start mb-3">
        <Link to={`/exam?id=${scenario.id}`} className="group">
          <h2 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
            {scenario.title}
          </h2>
        </Link>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
              <button
                onClick={handleCopyLink}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Copy Link
              </button>
              <Link
                to={`/exam?id=${scenario.id}`}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex-grow">
        {/* Language Badge */}
        <div className="mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {scenario.language}
          </span>
        </div>

        {/* Review Criteria */}
        {scenario.reviewCriteria && scenario.reviewCriteria.length > 0 && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Review Criteria:
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {scenario.reviewCriteria.map((criterion, index) => (
                <li key={index} className="mb-1">
                  {criterion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Scenario Details */}
        <div className="flex flex-wrap gap-3 mb-4">
          {scenario.timeLimit && scenario.timeLimit > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {formatDuration(scenario.timeLimit)}
            </div>
          )}

          {scenario.developerExperience && (
            <div className="flex items-center text-sm text-gray-500">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {scenario.developerExperience === "junior"
                ? "Junior Developer"
                : scenario.developerExperience === "mid"
                ? "Mid-Level Developer"
                : "Senior Developer"}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100">
        <Link
          to={`/live?id=${scenario.id}`}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors flex items-center justify-center"
        >
          Start Review
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
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
      No Review Scenarios Found
    </h3>
    <p className="text-gray-600 mb-6">
      Create your first code review scenario to get started with reviewing code.
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
          d="M12 4v16m8-8H4"
        />
      </svg>
      Create Scenario
    </Link>
  </div>
);

export default function Dashboard() {
  const { reviewScenarios } = useCodeReview();
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const filteredScenarios = reviewScenarios.filter(
    (scenario) =>
      scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scenario.learningObjectives
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Code Review Scenarios</h1>
          <Link
            to="/create"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Scenario
          </Link>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search scenarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filteredScenarios.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenarios.map((scenario) => (
              <CodeReviewCard
                key={scenario.id}
                scenario={scenario}
                showToast={showToastMessage}
              />
            ))}
          </div>
        )}

        {showToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg">
            {toastMessage}
          </div>
        )}
      </div>
    </Layout>
  );
}
