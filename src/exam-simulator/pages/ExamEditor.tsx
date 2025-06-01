import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { supabase } from "../config/supabaseClient";
import { ExamSimulator } from "../../types/ExamSimulator";

export default function ExamEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get("id") || "";

  const [exam, setExam] = useState<any>(null);
  // const [loading, setLoading] = useState(examId !== "");

  // Add ref for immediate click protection
  const isSavingRef = React.useRef(false);
  const lastClickTimeRef = React.useRef(0);

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
        // setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const [title, setTitle] = useState(exam ? exam.title : "");
  const [developerLevel, setDeveloperLevel] = useState("intermediate");
  const [duration, setDuration] = useState<number>(10);
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Standard");
  const [is_public, setIsPublic] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = examId !== "" && exam !== undefined;

  useEffect(() => {
    if (exam) {
      setTitle(exam.title || "");
      setDeveloperLevel(exam.learning_goals || "intermediate");
      setDuration(!isNaN(Number(exam.duration)) ? Number(exam.duration) : 10);
      setDescription(exam.description || "");
      setType(exam.type || "Standard");
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
    const now = Date.now();

    // Multiple layers of protection
    if (isSaving || isSavingRef.current) return;

    // Debouncing - prevent clicks within 1 second of each other
    if (now - lastClickTimeRef.current < 1000) {
      console.log("Click ignored due to debouncing");
      return;
    }

    lastClickTimeRef.current = now;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      // Assuming 'supabase' is your Supabase client instance available in this scope
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showToast("Error: Could not save. User information missing.");
        return; // Prevent saving if user is not found 14
      }

      if (isEditMode) {
        // Ensure exam is defined before accessing its properties
        if (!exam) {
          showToast("Error: Could not find code review to update.");
          return;
        }
        const updatedExam: ExamSimulator = {
          ...exam,
          title,
          description,
          type,
          duration,
          learning_goals: developerLevel,
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
            `Error: Could not update code review. ${updateError.message}`
          );
          return;
        }

        showToast("Code review updated!");

        // Store the recently updated exam ID in localStorage for highlighting in dashboard
        localStorage.setItem("recentlyUpdatedExamId", examId);

        // Navigate back to dashboard after successful update
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        const newExam: Omit<ExamSimulator, "id" | "created_at"> & {
          user_id: string;
        } = {
          // Use Omit to exclude DB-generated fields if Supabase handles them
          title,
          description,
          type,
          duration,
          learning_goals: developerLevel,
          is_public,
          user_id: user.id,
        };
        // create newExam to supabase
        const { data: createdExam, error: insertError } = await supabase
          .from("exams") // Ensure 'exams' is the correct table name
          .insert([newExam])
          .select()
          .single(); // To get the newly created record back, including DB-generated ID/timestamps

        if (insertError) {
          console.error("Error creating code review:", insertError);
          showToast(
            `Error: Could not create code review. ${insertError.message}`
          );
          return; // Stop execution if insert fails
        }

        showToast("Code review created!");

        // Store the newly created exam ID in localStorage for highlighting in dashboard
        if (createdExam?.id) {
          localStorage.setItem("newlyCreatedExamId", createdExam.id);
        }

        // Navigate to dashboard after successful creation
        setTimeout(() => navigate("/dashboard"), 800);
      }
    } catch (error) {
      console.error("Unexpected error during save:", error);
      showToast("An unexpected error occurred. Please try again.");
    } finally {
      // Reset after a delay to prevent rapid re-clicking
      setTimeout(() => {
        isSavingRef.current = false;
        setIsSaving(false);
      }, 1000);
    }
  };

  const handleDelete = () => {
    if (!isEditMode) return;
    if (window.confirm("Are you sure you want to delete this code review?")) {
      // delete exam using supabase
      const deleteExam = async () => {
        const { error } = await supabase
          .from("exams")
          .delete()
          .eq("id", examId);

        if (error) {
          console.error("Error deleting code review:", error);
          showToast(`Error: Could not delete code review. ${error.message}`);
          return;
        }

        showToast("Code review deleted!");
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
            className="mr-4 p-2 rounded-full hover:bg-neutral-20 transition-colors"
            aria-label="Back to dashboard"
          >
            <svg
              className="h-5 w-5 text-neutral-60"
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
          <h1 className="text-3xl font-bold text-neutral-90">
            {isEditMode ? "Edit Code Review" : "Create Code Review"}
          </h1>
        </div>

        {/* Main form */}
        <div
          className={`bg-neutral-15 rounded-lg shadow-md p-6 border border-neutral-30 ${
            isSaving ? "pointer-events-none opacity-75" : ""
          }`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Additional protection at form level
              if (isSaving || isSavingRef.current) return;
              const now = Date.now();
              if (now - lastClickTimeRef.current < 1000) return;
              handleSave();
            }}
            className="space-y-6"
          >
            {/* Title field */}
            <div className="mb-6">
              <label className="block text-neutral-90 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-neutral-60"
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
                  Title
                </div>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-30 bg-neutral-20 text-neutral-90 rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent transition-colors"
                placeholder="Enter code review title"
                required
              />
            </div>

            {/* Code Review Task field */}
            <div className="mb-6">
              <label className="block text-neutral-90 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-neutral-60"
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
                  Code review focus
                </div>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-30 bg-neutral-20 text-neutral-90 rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent transition-colors h-32 resize-none"
                placeholder="Describe the code review task"
              />
            </div>

            {/* Two-column layout for dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Code Review Type Dropdown */}
              <div>
                <label className="block text-neutral-90 text-sm font-medium mb-2">
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 text-neutral-60"
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
                  className="w-full px-4 py-2 border border-neutral-30 bg-neutral-20 text-neutral-90 rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent transition-colors"
                >
                  <option value="Standard">Standard</option>
                  <option value="Github Repo">Github Repo</option>
                </select>
              </div>
            </div>

            {/* Duration Slider */}
            <div className="mb-6">
              <label className="block text-neutral-90 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-neutral-60"
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
                  Duration: {duration} minute{duration !== 1 ? "s" : ""}
                </div>
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="duration-slider w-full h-2 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Developer Level Dropdown */}
            <div className="mb-6">
              <label className="block text-neutral-90 text-sm font-medium mb-2">
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-neutral-60"
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
                  Developer Experience Level
                </div>
              </label>
              <select
                value={developerLevel}
                onChange={(e) => setDeveloperLevel(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-30 bg-neutral-20 text-neutral-90 rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent transition-colors"
                required
              >
                <option value="junior">Junior Developer</option>
                <option value="intermediate">Intermediate Developer</option>
                <option value="senior">Senior Developer</option>
              </select>
              <p className="text-xs text-neutral-500 mt-1">
                This will determine the depth and style of feedback provided
                during the code review.
              </p>
            </div>

            {/* Is Public Checkbox */}
            <div className="mb-6">
              <label className="flex items-center text-neutral-90 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={is_public}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="custom-checkbox mr-2 h-4 w-4 rounded"
                />
                Make code review public
              </label>
              <p className="text-xs text-neutral-500 mt-1">
                If checked, other users will be able to see and take this code
                review.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-30">
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-neutral-20 text-tokyo-fg hover:text-tokyo-fg-bright hover:bg-tokyo-bg-lightest border border-neutral-30 font-medium transition-all duration-200 rounded-md"
              >
                Cancel
              </Link>
              <div className="flex space-x-3">
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 hover:shadow-lg text-white font-medium rounded-md transition-all duration-200 transform hover:scale-105"
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
                    Delete
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving || isSavingRef.current}
                  className={`flex items-center px-6 py-2 ${
                    isSaving || isSavingRef.current
                      ? "bg-gray-400 cursor-not-allowed"
                      : isEditMode
                      ? "bg-tokyo-accent hover:bg-tokyo-accent-darker"
                      : "bg-green-600 hover:bg-green-700"
                  } hover:shadow-lg text-white font-medium rounded-md transition-all duration-200 transform ${
                    !(isSaving || isSavingRef.current) ? "hover:scale-105" : ""
                  }`}
                >
                  {isSaving ? (
                    <svg
                      className="animate-spin h-4 w-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
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
                  )}
                  {isSaving
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                    ? "Update Code Review"
                    : "Create Code Review"}
                </button>
              </div>
            </div>
          </form>
        </div>

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

        {/* Custom CSS for Duration Slider */}
        <style>
          {`
            /* Tokyo Theme Colors */
            .bg-tokyo-accent {
              background-color: #7c3aed !important;
            }
            
            .bg-tokyo-accent-darker {
              background-color: #5b21b6 !important;
            }
            
            .hover\\:bg-tokyo-accent-darker:hover {
              background-color: #5b21b6 !important;
            }
            
            .bg-green-600 {
              background-color: #16a34a !important;
            }
            
            .bg-green-700 {
              background-color: #15803d !important;
            }
            
            .hover\\:bg-green-700:hover {
              background-color: #15803d !important;
            }
            
            .text-tokyo-fg {
              color: #e2e8f0 !important;
            }
            
            .text-tokyo-fg-bright {
              color: #f1f5f9 !important;
            }
            
            .hover\\:text-tokyo-fg-bright:hover {
              color: #f1f5f9 !important;
            }
            
            .bg-tokyo-bg-lightest {
              background-color: #334155 !important;
            }
            
            .hover\\:bg-tokyo-bg-lightest:hover {
              background-color: #334155 !important;
            }

            .duration-slider {
              -webkit-appearance: none;
              appearance: none;
              background: #2a2e3a;
              border-radius: 8px;
              outline: none;
            }
            
            .duration-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #7c3aed;
              cursor: pointer;
              border: 2px solid #5b21b6;
              transition: all 0.2s ease;
            }
            
            .duration-slider::-webkit-slider-thumb:hover {
              background: #8b5cf6;
              transform: scale(1.1);
            }
            
            .duration-slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #7c3aed;
              cursor: pointer;
              border: 2px solid #5b21b6;
              transition: all 0.2s ease;
            }
            
            .duration-slider::-moz-range-thumb:hover {
              background: #8b5cf6;
              transform: scale(1.1);
            }
            
            .duration-slider::-moz-range-track {
              background: #2a2e3a;
              border-radius: 8px;
              height: 8px;
            }

            .custom-checkbox {
              -webkit-appearance: none;
              -moz-appearance: none;
              appearance: none;
              background-color: #2a2e3a;
              border: 2px solid #4a5568;
              border-radius: 4px;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            
            .custom-checkbox:checked {
              background-color: #7c3aed;
              border-color: #7c3aed;
            }
            
            .custom-checkbox:checked::after {
              content: '✓';
              color: white;
              font-size: 12px;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
            }
            
            .custom-checkbox:hover {
              border-color: #7c3aed;
            }
            
            .custom-checkbox:focus {
              outline: none;
              ring: 2px solid #7c3aed;
              ring-opacity: 50%;
            }

            .bg-gray-400 {
              background-color: #9ca3af !important;
            }
            
            .cursor-not-allowed {
              cursor: not-allowed !important;
            }
            
            .pointer-events-none {
              pointer-events: none !important;
            }
            
            .opacity-75 {
              opacity: 0.75 !important;
            }
          `}
        </style>
      </div>
    </Layout>
  );
}
