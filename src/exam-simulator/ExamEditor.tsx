import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useExamSimulators, ExamSimulator } from "../contexts/ExamSimulatorContext";

export default function ExamEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get("id") || "";
  const { examSimulators, setExamSimulators } = useExamSimulators();
  const exam = examSimulators.find((e) => e.id === examId);

  const [title, setTitle] = useState(exam ? exam.title : "");
  const [format, setFormat] = useState(exam ? exam.format : "");
  const [gradeCriteria, setGradeCriteria] = useState(exam ? exam.gradeCriteria : "");
  const [feedback, setFeedback] = useState(exam ? exam.feedback : "");
  const [duration, setDuration] = useState<number>(() => {
    return exam && !isNaN(Number(exam.duration)) ? Number(exam.duration) : 0;
  });
  const [learningGoals, setLearningGoals] = useState(exam ? exam.learningGoals : "");
  const [task, setTask] = useState(exam ? exam.task : "");

  const isEditMode = examId !== "" && exam !== undefined;

  const handleSave = () => {
    if (isEditMode) {
      const updatedExam: ExamSimulator = {
        id: exam.id,
        title,
        format,
        gradeCriteria,
        feedback,
        duration,
        learningGoals,
        task,
      };
      setExamSimulators((prev) =>
        prev.map((e) => (e.id === exam.id ? updatedExam : e))
      );
      alert("Exam updated!");
    } else {
      const newExam: ExamSimulator = {
        id: Date.now().toString(),
        title,
        format,
        gradeCriteria,
        feedback,
        duration,
        learningGoals,
        task,
      };
      setExamSimulators((prev) => [...prev, newExam]);
      alert("Exam created!");
    }
    navigate("/dashboard");
  };

  const handleDelete = () => {
    if (!isEditMode) return;
    if (window.confirm("Are you sure you want to delete this exam?")) {
      setExamSimulators((prev) => prev.filter((e) => e.id !== exam.id));
      alert("Exam deleted!");
      navigate("/");
    }
  };

  return (
    <div className="p-4 bg-white">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? "Edit Exam" : "Create Exam"}
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >
        <div className="mb-12">
          <label className="block text-black text-sm font-bold mb-1">Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border rounded w-full py-2 px-3 text-black"
          />
        </div>
        <div className="mb-10">
          <label className="block text-black text-sm font-bold mb-1">Exam Task:</label>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            className="border rounded w-full py-2 px-3 text-black h-24"
          />
        </div>
        {/* Grade Criteria Dropdown */}
        <div className="mb-10">
          <label className="block text-black text-sm font-bold mb-1">Grade Criteria:</label>
          <select
            value={gradeCriteria}
            onChange={(e) => setGradeCriteria(e.target.value)}
            className="border rounded w-full py-2 px-3 text-black"
          >
            <option value="">Select grade</option>
            <option value="7-skala">7-trinsskalaen</option>
            <option value="bestået-ikke-bestået">Bestået/ikke bestået</option>
          </select>
        </div>
        <div className="mb-10">
          <label className="block text-black text-sm font-bold mb-1">Feedback:</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="border rounded w-full py-2 px-3 text-black h-24"
          />
        </div>
        {/* <div className="mb-10">
          <label className="block text-black text-sm font-bold mb-1">Duration (minutes):</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="border rounded w-full py-2 px-3 text-black"
          />
        </div> */}
        <div className="mb-10">
          <label className="block text-black text-sm font-bold mb-1">Learning Goals:</label>
          <textarea
            value={learningGoals}
            onChange={(e) => setLearningGoals(e.target.value)}
            className="border rounded w-full py-2 px-3 text-black h-24"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-4 rounded"
          >
            {isEditMode ? "Update Exam" : "Create Exam"}
          </button>
          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-700 text-black font-bold py-2 px-4 rounded"
            >
              Delete Exam
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
