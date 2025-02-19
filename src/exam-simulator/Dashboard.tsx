import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useExamSimulators } from "../contexts/ExamSimulatorContext";
import Layout from "../components/layout/Layout";

interface ExamSimulator {
  id: string;
  title: string;
  duration: number;
  task: string; // The exam task description
}

interface ExamSimulatorCardProps {
  sim: ExamSimulator;
  showToast: (message: string) => void;
}

function ExamSimulatorCard({ sim, showToast }: ExamSimulatorCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      const fullUrl = `${window.location.origin}/live?id=${sim.id}`;
      await navigator.clipboard.writeText(fullUrl);
      setMenuOpen(false);
      showToast("Link copied!");
    } catch (err) {
      console.error("Failed to copy the link", err);
    }
  };

  return (
    <div className="relative p-4 bg-white rounded shadow flex flex-col justify-between">
      {/* Three-dots Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="absolute top-2 right-0 cursor-pointer text-gray-600 py-1 px-2 rounded"
      >
        <svg
          className="h-8 w-8 text-slate-500"
          width="100%"
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
        <div className="absolute top-10 right-2 bg-white border rounded shadow-md z-10">
          <button
            onClick={handleCopyLink}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Copy Link to Simulator
          </button>
          <Link
            to={`/exam?id=${sim.id}`}
            className="block px-4 py-2 hover:bg-gray-100"
            onClick={() => setMenuOpen(false)}
          >
            Edit Exam
          </Link>
        </div>
      )}

      <div>
        <Link to={`/exam?id=${sim.id}`}>
          <h2 className="text-xl font-semibold hover:underline">{sim.title}</h2>
        </Link>
        {/* Show the first two lines of the exam task */}
        <p className="mt-2 text-gray-700 line-clamp-2">{sim.task}</p>
      </div>
      <div className="mt-4 flex flex-col space-y-2">
        <Link
          to={`/live?id=${sim.id}`}
          className="bg-blue-500 hover:bg-blue-600 text-white text-center py-2 px-4 rounded"
        >
          Start Simulator
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { examSimulators } = useExamSimulators();
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <Layout>
      <div className="relative p-6 min-h-screen max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        {examSimulators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {examSimulators.map((sim) => (
              <ExamSimulatorCard key={sim.id} sim={sim} showToast={showToast} />
            ))}
          </div>
        ) : (
          <div className="text-gray-700">
            <p>No exam simulators available. Please create a new exam simulator.</p>
            <Link
              to="/create"
              className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
            >
              Create Exam Simulator
            </Link>
          </div>
        )}

        <Link
          to="/create"
          className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg text-3xl"
        >
          +
        </Link>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white py-2 px-4 rounded shadow-md">
            {toastMessage}
          </div>
        )}
      </div>
    </Layout>
  );
}
