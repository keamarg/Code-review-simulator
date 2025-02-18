import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useExamSimulators } from "../contexts/ExamSimulatorContext";

function ExamSimulatorCard({ sim }: { sim: { id: string; title: string; duration: number } }) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText("/live");
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy the link", err);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow flex flex-col justify-between">
      <div>
        <Link to={`/exam?id=${sim.id}`}>
          <h2 className="text-xl font-semibold hover:underline">{sim.title}</h2>
        </Link>
        <p className="mt-2 text-gray-600">Duration: {sim.duration} minutes</p>
      </div>
      <div className="mt-4 flex flex-col space-y-2">
        <button
          onClick={handleCopyLink}
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          Copy link to students
        </button>
        <Link
          to={`/live?id=${sim.id}`}
          className="bg-blue-500 hover:bg-blue-600 text-white text-center py-2 px-4 rounded"
        >
          Go to Simulator
        </Link>
        {linkCopied && (
          <div className="text-sm text-green-600 text-center">Link copied!</div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { examSimulators } = useExamSimulators();

  return (
    <div className="relative p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      {examSimulators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {examSimulators.map((sim) => (
            <ExamSimulatorCard key={sim.id} sim={sim} />
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
    </div>
  );
}
