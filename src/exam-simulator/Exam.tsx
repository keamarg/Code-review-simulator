import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useExamSimulators, ExamSimulator } from "../contexts/ExamSimulatorContext";

export default function Exam() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get("id") || "";
  const { examSimulators, setExamSimulators } = useExamSimulators();
  console.log(examId);

  const exam = examSimulators.find((e) => e.id === examId);
  console.log(exam);
  
  // Initialize states unconditionally using exam values if available
  const [title, setTitle] = useState(exam ? exam.title : "");
  const [format, setFormat] = useState(exam ? exam.format : "");
  const [gradeCriteria, setGradeCriteria] = useState(exam ? exam.gradeCriteria : "");
  const [feedback, setFeedback] = useState(exam ? exam.feedback : "");
  const [duration, setDuration] = useState<number>(() => {
    if (exam && !isNaN(Number(exam.duration))) {
      return Number(exam.duration);
    }
    return 0;
  });
  const [learningGoals, setLearningGoals] = useState(exam ? exam.learningGoals : "");
  const [task, setTask] = useState(exam ? exam.task : ""); // New state for exam task

  if (!examId) {
    return <div className="text-center text-xl text-red-500 mt-8">No exam id provided.</div>;
  }
  if (!exam) {
    return <div className="text-center text-xl text-red-500 mt-8">Exam not found.</div>;
  }

  const handleUpdate = () => {
    const updatedExam: ExamSimulator = {
      id: exam.id,
      title,
      format,
      gradeCriteria,
      feedback,
      duration,
      learningGoals,
      task, // Save updated task
    };

    console.log(updatedExam);
    
    setExamSimulators((prev) => prev.map((e) => (e.id === examId ? updatedExam : e)));
    alert("Exam updated!");
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      setExamSimulators((prev) => prev.filter((e) => e.id !== examId));
      alert("Exam deleted!");
      navigate("/");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Edit Exam</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleUpdate();
        }}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 max-w-lg mx-auto"
      >
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>
        {/* Other fields */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Exam Task:</label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-24"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Format:</label>
          <input
            type="text"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Grade Criteria:</label>
          <input
            type="text"
            value={gradeCriteria}
            onChange={(e) => setGradeCriteria(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Feedback:</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-24"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Duration (minutes):</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Learning Goals:</label>
          <textarea
            value={learningGoals}
            onChange={(e) => setLearningGoals(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-24"
          />
        </div>
        <div className="flex items-center justify-between">
          <button 
            type="submit" 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Update Exam
          </button>
        </div>
      </form>
      <div className="text-center">
        <button
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Delete Exam
        </button>
      </div>
    </div>
  );
}