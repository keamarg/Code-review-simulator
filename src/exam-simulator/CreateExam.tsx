import React, { useState } from "react";
import { useExamSimulators } from "../contexts/ExamSimulatorContext";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function CreateExam() {
  const { setExamSimulators } = useExamSimulators();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("");
  const [gradeCriteria, setGradeCriteria] = useState("");
  const [feedback, setFeedback] = useState("");
  const [duration, setDuration] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [task, setTask] = useState(""); // New task field

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setExamSimulators((prev) => [
      ...prev,
      {
        id: uuidv4(),
        title,
        format,
        gradeCriteria,
        feedback,
        duration: parseInt(duration, 10),
        learningGoals,
        task, // Save the task with the exam
      },
    ]);

    navigate("/dashboard");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Create Exam Simulator</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Title</label>
          <input
            className="border p-2 w-full"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">
            Læringsmål der skal udprøves
          </label>
          <textarea
            className="border p-2 w-full"
            value={learningGoals}
            onChange={(e) => setLearningGoals(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Exam Task</label>
          <textarea
            className="border p-2 w-full"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Enter the exam task for the students"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">
            Hvordan skal karakteren vurderes?
          </label>
          <input
            className="border p-2 w-full"
            type="text"
            value={gradeCriteria}
            onChange={(e) => setGradeCriteria(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Hvordan skal der gives feedback?</label>
          <input
            className="border p-2 w-full"
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          />
        </div>
        {/* Duration and format fields can be added or commented out as needed */}
        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Opret en eksamenssimulation
        </button>
      </form>
    </div>
  );
}
