import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useExamSimulators, ExamSimulator } from "../contexts/ExamSimulatorContext";
import Layout from "../components/layout/Layout";

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
  // New state for exam type ("Standard" or "Github Repo")
  const [examType, setExamType] = useState(exam ? exam.examType : "Standard");
  // New state for examiner type ("Friendly", "Strict", or "Challenging")
  const [examinerType, setExaminerType] = useState(exam ? exam.examinerType : "Friendly");

  const isEditMode = examId !== "" && exam !== undefined;

  const handleSave = () => {
    if (isEditMode) {
      const updatedExam: ExamSimulator = {
        ...exam,
        title,
        format,
        gradeCriteria,
        feedback,
        duration,
        learningGoals,
        task,
        examType,
        examinerType,
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
        examType,
        examinerType,
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
    <Layout>
        <div className="p-4  max-w-2xl mx-auto px-4 py-6">
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
            {/* New Exam Type Dropdown */}
            <div className="mb-10">
            <label className="block text-black text-sm font-bold mb-1">Exam Type:</label>
            <select
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
                className="border rounded w-full py-2 px-3 text-black"
            >
                <option value="Standard">Standard</option>
                <option value="Github Repo">Github Repo</option>
            </select>
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
                <option value="no-grade">Ingen karaktergivning</option>
                <option value="7-skala">7-trinsskalaen</option>
                <option value="bestået-ikke-bestået">Bestået/ikke bestået</option>
            </select>
            </div>
            {/* New Examiner Type Dropdown */}
            <div className="mb-10">
            <label className="block text-black text-sm font-bold mb-1">Examiner Type:</label>
            <select
                value={examinerType}
                onChange={(e) => setExaminerType(e.target.value)}
                className="border rounded w-full py-2 px-3 text-black"
            >
                <option value="Friendly">Friendly</option>
                <option value="Strict">Strict</option>
                <option value="Challenging">Challenging</option>
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
                className="bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-4 rounded cursor-pointer"
            >
                {isEditMode ? "Update Exam" : "Create Exam"}
            </button>
            {isEditMode && (
                <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-700 text-black font-bold py-2 px-4 rounded cursor-pointer"
                >
                Delete Exam
                </button>
            )}
            </div>
        </form>
        </div>
    </Layout>
  );
}
