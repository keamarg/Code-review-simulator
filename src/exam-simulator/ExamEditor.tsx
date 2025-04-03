import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useCodeReview,
  CodeReviewScenario,
} from "../contexts/ExamSimulatorContext";
import Layout from "../components/layout/Layout";

export default function ExamEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reviewScenarios, setReviewScenarios } = useCodeReview();
  const scenario = reviewScenarios.find((s) => s.id === id);

  const [formData, setFormData] = useState<CodeReviewScenario>({
    id: id || "",
    title: "",
    codeSnippet: "",
    language: "",
    reviewCriteria: [],
    timeLimit: 15,
    issues: [],
    learningObjectives: "",
    difficulty: "intermediate",
    category: "general",
    developerExperience: "mid",
  });

  const [autoDetect, setAutoDetect] = useState(true);
  const [developerExperience, setDeveloperExperience] = useState("mid");

  useEffect(() => {
    if (scenario) {
      setFormData(scenario);
    }
  }, [scenario]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scenario) {
      // Update existing scenario
      const updatedScenarios = reviewScenarios.map((s) =>
        s.id === id ? formData : s
      );
      setReviewScenarios(updatedScenarios);
    } else {
      // Create new scenario
      const newScenario: CodeReviewScenario = {
        ...formData,
        id: crypto.randomUUID(),
      };
      setReviewScenarios((prev) => [...prev, newScenario]);
    }
    navigate("/");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReviewCriteriaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const criteria = e.target.value.split("\n").filter((c) => c.trim());
    setFormData((prev) => ({ ...prev, reviewCriteria: criteria }));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          {scenario
            ? "Edit Code Review Scenario"
            : "Create Code Review Scenario"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Developer Experience Level */}
          <div>
            <label
              htmlFor="developerExperience"
              className="block text-sm font-medium text-gray-700"
            >
              Developer Experience Level
            </label>
            <select
              id="developerExperience"
              value={developerExperience}
              onChange={(e) => setDeveloperExperience(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="junior">Junior Developer (0-2 years)</option>
              <option value="mid">Mid-Level Developer (2-5 years)</option>
              <option value="senior">Senior Developer (5+ years)</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="language"
                className="block text-sm font-medium text-gray-700"
              >
                Programming Language
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoDetect"
                  checked={autoDetect}
                  onChange={(e) => setAutoDetect(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="autoDetect"
                  className="ml-2 text-sm text-gray-600"
                >
                  Auto-detect
                </label>
              </div>
            </div>
            <input
              type="text"
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              disabled={autoDetect}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Review Criteria */}
          <div>
            <label
              htmlFor="reviewCriteria"
              className="block text-sm font-medium text-gray-700"
            >
              Review Criteria (one per line, optional)
            </label>
            <textarea
              id="reviewCriteria"
              name="reviewCriteria"
              value={formData.reviewCriteria.join("\n")}
              onChange={handleReviewCriteriaChange}
              rows={5}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter review criteria (optional)"
            />
          </div>

          {/* Time Limit */}
          <div>
            <label
              htmlFor="timeLimit"
              className="block text-sm font-medium text-gray-700"
            >
              Time Limit (minutes, optional)
            </label>
            <input
              type="number"
              id="timeLimit"
              name="timeLimit"
              value={formData.timeLimit}
              onChange={handleChange}
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter time limit (optional)"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {scenario ? "Update Scenario" : "Create Scenario"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
