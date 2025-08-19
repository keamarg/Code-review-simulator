import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import Layout from "../layout/Layout";
import { getSupabaseClient } from "../config/supabaseClient";
import { CodeReviewTemplate } from "../../types/CodeReviewTemplate";
import { appLogger } from "../../lib/utils";

export default function ReviewTemplateEditor() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reviewId = searchParams.get("id") || "";

  const [review, setReview] = useState<any>(null);
  const isSavingRef = React.useRef(false);
  const lastClickTimeRef = React.useRef(0);

  useEffect(() => {
    const fetchReview = async () => {
      if (reviewId) {
        const supabaseClient = await getSupabaseClient();
        const { data, error } = await supabaseClient
          .from("exams")
          .select("*")
          .eq("id", reviewId)
          .single();
        if (error) {
          appLogger.error.general(error instanceof Error ? error.message : String(error));
        } else {
          setReview(data);
        }
      }
    };
    fetchReview();
  }, [reviewId]);

  const [title, setTitle] = useState(review ? review.title : "");
  const [developerLevel, setDeveloperLevel] = useState("intermediate");
  const [duration, setDuration] = useState<number>(10);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"Standard" | "Github Repo">("Standard");
  const [is_public, setIsPublic] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = reviewId !== "" && review !== undefined;

  useEffect(() => {
    if (review) {
      setTitle(review.title || "");
      setDeveloperLevel(review.learning_goals || "intermediate");
      setDuration(!isNaN(Number(review.duration)) ? Number(review.duration) : 10);
      setDescription(review.description || "");
      setType((review.type as "Standard" | "Github Repo") || "Standard");
      setIsPublic(review.is_public || false);
    }
  }, [review]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setIsToastVisible(true);
    setTimeout(() => {
      setIsToastVisible(false);
      setTimeout(() => setToastMessage(""), 300);
    }, 3000);
  };

  const handleSave = async () => {
    const now = Date.now();
    if (isSaving || isSavingRef.current) return;
    if (now - lastClickTimeRef.current < 1000) return;
    lastClickTimeRef.current = now;
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const supabaseClient = await getSupabaseClient();
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) {
        showToast("Error: Could not save. User information missing.");
        return;
      }

      if (isEditMode) {
        if (!review) {
          showToast("Error: Could not find custom review to update.");
          return;
        }
        const updatedReview: CodeReviewTemplate = {
          ...review,
          title,
          description,
          type,
          duration,
          learning_goals: developerLevel,
          is_public,
          user_id: user.id,
        };

        const { error: updateError } = await supabaseClient
          .from("exams")
          .update(updatedReview)
          .eq("id", reviewId);

        if (updateError) {
          appLogger.error.general(
            updateError instanceof Error ? updateError.message : String(updateError),
          );
          showToast(`Error: Could not update custom review. ${updateError.message}`);
          return;
        }

        showToast("Custom review updated!");
        localStorage.setItem("recentlyUpdatedReviewId", reviewId);
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        const newReview: Omit<CodeReviewTemplate, "id" | "created_at"> & { user_id: string } = {
          title,
          description,
          type,
          duration,
          learning_goals: developerLevel,
          is_public,
          user_id: user.id,
        };
        const { data: createdReview, error: insertError } = await supabaseClient
          .from("exams")
          .insert([newReview])
          .select()
          .single();

        if (insertError) {
          appLogger.error.general(
            insertError instanceof Error ? insertError.message : String(insertError),
          );
          showToast(`Error: Could not create custom review. ${insertError.message}`);
          return;
        }

        showToast("Custom review created!");
        if (createdReview?.id) {
          localStorage.setItem("newlyCreatedReviewId", createdReview.id);
        }
        setTimeout(() => navigate("/dashboard"), 800);
      }
    } catch (error) {
      appLogger.error.general(error instanceof Error ? error.message : String(error));
      showToast("An unexpected error occurred. Please try again.");
    } finally {
      setTimeout(() => {
        isSavingRef.current = false;
        setIsSaving(false);
      }, 1000);
    }
  };

  const handleDelete = () => {
    if (!isEditMode) return;
    if (window.confirm("Are you sure you want to delete this custom review?")) {
      const deleteReview = async () => {
        const supabaseClient = await getSupabaseClient();
        const { error } = await supabaseClient.from("exams").delete().eq("id", reviewId);
        if (error) {
          appLogger.error.general(error instanceof Error ? error.message : String(error));
          showToast(`Error: Could not delete custom review. ${error.message}`);
          return;
        }
        showToast("Custom review deleted!");
        navigate("/dashboard");
      };
      deleteReview();
    }
  };

  return (
    <Layout>
      <div className="relative min-h-screen max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center mb-6">
          <Link
            to="/dashboard"
            className="mr-4 p-2 rounded-full hover:bg-tokyo-bg-lightest border border-tokyo-selection transition-colors"
            aria-label="Back to dashboard"
          >
            <svg
              className="h-5 w-5 text-tokyo-fg"
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
          <h1 className="text-3xl font-bold text-tokyo-fg-bright">
            {isEditMode ? "Edit Custom Review" : "Create Custom Review"}
          </h1>
        </div>

        <div className="bg-tokyo-bg-lighter rounded-lg shadow-xl border border-tokyo-selection">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-tokyo-fg-bright mb-2 flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-tokyo-comment"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c.5304 0 1.0391-.2107 1.4142-.5858C13.7893 10.0391 14 9.5304 14 9s-.2107-1.0391-.5858-1.4142C13.0391 7.2107 12.5304 7 12 7s-1.0391.2107-1.4142.5858C10.2107 7.9609 10 8.4696 10 9s.2107 1.0391.5858 1.4142C10.9609 10.7893 11.4696 11 12 11z"
                    />
                  </svg>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-tokyo-selection bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent"
                  placeholder="Enter custom review title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-tokyo-fg-bright mb-2 flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-tokyo-comment"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-3.866 0-7 1.343-7 3v5h14v-5c0-1.657-3.134-3-7-3z"
                    />
                  </svg>
                  Custom review type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-tokyo-selection bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent"
                >
                  <option value="Standard">Standard</option>
                  <option value="Github Repo">Github Repo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-tokyo-fg-bright mb-2 flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-tokyo-comment"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3"
                    />
                  </svg>
                  Duration: {duration} minutes
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value || "0", 10))}
                  className="w-full h-1.5 bg-tokyo-bg-lightest rounded appearance-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-tokyo-fg-bright mb-2 flex items-center">
                  <svg
                    className="h-4 w-4 mr-2 text-tokyo-comment"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h18M3 10h18M3 17h18"
                    />
                  </svg>
                  Developer Experience Level
                </label>
                <select
                  value={developerLevel}
                  onChange={(e) => setDeveloperLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-tokyo-selection bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent"
                >
                  <option value="junior">Junior Developer</option>
                  <option value="intermediate">Intermediate Developer</option>
                  <option value="senior">Senior Developer</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-medium text-tokyo-fg-bright mb-2 flex items-center">
                <svg
                  className="h-4 w-4 mr-2 text-tokyo-comment"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 20l9-5-9-5-9 5 9 5z"
                  />
                </svg>
                Custom review focus
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={14}
                className="flex-1 w-full px-4 py-2 border border-tokyo-selection bg-tokyo-bg text-tokyo-fg-bright rounded-md focus:outline-none focus:ring-2 focus:ring-tokyo-accent focus:border-transparent"
                placeholder="Describe the custom review task"
              />
            </div>
          </div>

          <div className="bg-tokyo-bg-darker rounded-b-lg px-6 py-4 flex justify-between items-center border-t border-tokyo-selection">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 border font-medium transition-all duration-200 rounded-md"
              style={{ backgroundColor: "#334155", color: "#e2e8f0", borderColor: "#475569" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#475569";
                e.currentTarget.style.color = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#334155";
                e.currentTarget.style.color = "#e2e8f0";
              }}
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {isEditMode && (
                <button
                  onClick={handleDelete}
                  className="px-5 py-2 rounded-md transition-all duration-200 flex items-center text-white hover:shadow-lg transform hover:scale-102"
                  style={{ background: "linear-gradient(to right, #ef4444, #dc2626)" }}
                  disabled={isSaving}
                >
                  <svg
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                  Delete
                </button>
              )}
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-md transition-all duration-200 flex items-center text-white hover:shadow-lg transform hover:scale-102"
                style={{
                  background: isEditMode
                    ? "linear-gradient(to right, #8b5cf6, #7c3aed)"
                    : "linear-gradient(to right, #22c55e, #16a34a)",
                }}
                disabled={isSaving}
              >
                <svg
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {isSaving
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update Custom Review"
                    : "Create Custom Review"}
              </button>
            </div>
          </div>
        </div>

        {isToastVisible && toastMessage && (
          <div className="fixed bottom-6 right-6 bg-tokyo-bg-lightest border border-tokyo-selection text-tokyo-fg-bright px-4 py-2 rounded shadow-lg">
            {toastMessage}
          </div>
        )}
      </div>
    </Layout>
  );
}
