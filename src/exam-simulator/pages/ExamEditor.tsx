import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { supabase } from "../config/supabaseClient";
import { ExamSimulator } from "../contexts/ExamSimulatorContext";

export default function ExamEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get("id") || "";

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(examId !== "");

  useEffect(() => {
    const fetchExam = async () => {
      if (examId) {
        const { data, error } = await supabase
          .from("exams")
          .select("*")
          .eq("id", examId)
          .single();
        if (error) {
          console.error("Error fetching exam:", error);
        } else {
          setExam(data);
        }
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const [title, setTitle] = useState(exam ? exam.title : "");
  const [gradeCriteria, setGradeCriteria] = useState("");
  const [feedback, setFeedback] = useState(exam ? exam.feedback : "");
  const [duration, setDuration] = useState<number>(8);
  const [learningGoals, setLearningGoals] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Standard");
  const [typicalQuestions, setTypicalQuestions] = useState("");
  const [is_public, setIsPublic] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);

  const isEditMode = examId !== "" && exam !== undefined;

  useEffect(() => {
    if (exam) {
      setTitle(exam.title || "");
      setGradeCriteria(exam.grade_criteria || "");
      setFeedback(exam.feedback || "");
      setDuration(!isNaN(Number(exam.duration)) ? Number(exam.duration) : 8);
      setLearningGoals(exam.learning_goals || "");
      setDescription(exam.description || "");
      setType(exam.type || "Standard");
      setTypicalQuestions(exam.typical_questions || "");
      setIsPublic(exam.is_public || false);
    }
  }, [exam]);

  // Show toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
      // Remove message after fade out animation completes
      setTimeout(() => setToastMessage(""), 300);
    }, 3000);
  };

  const handleSave = async () => {
    // Assuming 'supabase' is your Supabase client instance available in this scope
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showToast("Fejl: Kunne ikke gemme. Brugeroplysninger mangler.");
      return; // Prevent saving if user is not found 14
    }

    if (isEditMode) {
      // Ensure exam is defined before accessing its properties
      if (!exam) {
        showToast("Fejl: Kunne ikke finde code review der skal opdateres.");
        return;
      }
      const updatedExam: ExamSimulator = {
        ...exam,
        title,
        description,
        type,
        duration,
        grade_criteria: gradeCriteria,
        feedback,
        learning_goals: learningGoals,
        typical_questions: typicalQuestions,
        is_public,
        user_id: user.id,
      };

      const { error: updateError } = await supabase
        .from("exams")
        .update(updatedExam)
        .eq("id", examId);

      if (updateError) {
        console.error("Error updating code review:", updateError);
        showToast(
          `Fejl: Kunne ikke opdatere code review. ${updateError.message}`
        );
        return;
      }

      showToast("Code review opdateret!");
    } else {
      const newExam: Omit<ExamSimulator, "id" | "created_at"> & {
        user_id: string;
      } = {
        // Use Omit to exclude DB-generated fields if Supabase handles them
        title,
        description,
        type,
        duration,
        grade_criteria: gradeCriteria,
        feedback,
        learning_goals: learningGoals,
        typical_questions: typicalQuestions,
        is_public,
        user_id: user.id,
      };
      // create newExam to supabase
      const { data: insertedExam, error: insertError } = await supabase
        .from("exams") // Ensure 'exams' is the correct table name
        .insert([newExam])
        .select()
        .single(); // To get the newly created record back, including DB-generated ID/timestamps

      if (insertError) {
        console.error("Error creating code review:", insertError);
        showToast(
          `Fejl: Kunne ikke oprette code review. ${insertError.message}`
        );
        return; // Stop execution if insert fails
      }

      showToast("Code review oprettet!");
    }
    //navigate("/dashboard");
  };

  const handleDelete = () => {
    if (!isEditMode) return;
    if (
      window.confirm("Er du sikker på, at du vil slette dette code review?")
    ) {
      // delete exam using supabase
      const deleteExam = async () => {
        const { error } = await supabase
          .from("exams")
          .delete()
          .eq("id", examId);

        if (error) {
          console.error("Error deleting code review:", error);
          showToast(`Fejl: Kunne ikke slette code review. ${error.message}`);
          return;
        }

        showToast("Code review slettet!");
        navigate("/dashboard");
      };

      deleteExam();
    }
  };

  return (
    <Layout>
      <div className="relative min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Link
            to="/dashboard"
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Tilbage til dashboard"
          >
            <svg
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? "Rediger code review" : "Opret code review"}
          </h1>
        </div>

        {/* Main form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            {/* Title field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Titel
                </div>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Indtast code review titel"
                required
              />
            </div>

            {/* Exam Task field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
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
                  Code review opgave
                </div>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-32 resize-none"
                placeholder="Beskriv code review opgaven"
              />
            </div>

            {/* Two-column layout for dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Exam Type Dropdown */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 text-gray-500"
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
                    Code review type
                  </div>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                >
                  <option value="Standard">Standard</option>
                  <option value="Github Repo">Github Repo</option>
                </select>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
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
                  Varighed: {duration} minut{duration !== 1 ? "ter" : ""}
                </div>
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="8"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Grade Criteria Dropdown */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Evalueringskriterier
                </div>
              </label>
              <select
                value={gradeCriteria}
                onChange={(e) => setGradeCriteria(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
              >
                <option value="">Vælg evalueringskriterium</option>
                <option value="no-grade">Ingen evaluering</option>
                <option value="7-skala">7-trinsskalaen</option>
                <option value="bestået-ikke-bestået">
                  Bestået/ikke bestået
                </option>
              </select>
            </div>

            {/* Feedback field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  Feedback
                </div>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-32 resize-none"
                placeholder="Indtast feedback-instruktioner"
              />
            </div>

            {/* Learning Goals field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Læringsmål
                </div>
              </label>
              <textarea
                value={learningGoals}
                onChange={(e) => setLearningGoals(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-32 resize-none"
                placeholder="Indtast læringsmål"
              />
            </div>

            {/* Typical Questions field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  Typiske Spørgsmål
                </div>
              </label>
              <textarea
                value={typicalQuestions}
                onChange={(e) => setTypicalQuestions(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors h-32 resize-none"
                placeholder="Indtast typiske spørgsmål til code review"
              />
            </div>

            {/* Is Public Checkbox */}
            <div className="mb-6">
              <label className="flex items-center text-gray-700 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={is_public}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                Gør code review offentligt
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Hvis markeret, vil andre brugere kunne se og tage dette code
                review.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <Link
                to="/dashboard"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Annuller
              </Link>
              <div className="flex space-x-3">
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-md transition-colors"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Slet
                  </button>
                )}
                <button
                  type="submit"
                  className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shadow-sm"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {isEditMode ? "Opdater code review" : "Opret code review"}
                </button>
              </div>
            </div>
          </form>
        </div>

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
