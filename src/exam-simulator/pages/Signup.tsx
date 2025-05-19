import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { supabase } from "./../config/supabaseClient";
import Layout from "../layout/Layout"; // Import Layout

const SignUp = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    organization: "",
    role: "",
    experience: "",
    isDeveloper: false,
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target;
    setFormData((prevFormData) => {
      return {
        ...prevFormData,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo:
            "https://keamarg.github.io/Code-review-simulator/login",
          data: {
            full_name: formData.fullName,
            organization: formData.organization,
            role: formData.role,
            experience: formData.experience,
            is_developer: formData.isDeveloper,
          },
        },
      });
      if (error) throw error;
      alert("Check your email for verification link");
      navigate("/login"); // Navigate to login page
    } catch (error) {
      alert(error);
    }
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-tokyo-bg-lighter p-10 rounded-lg shadow-md border border-tokyo-selection">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-tokyo-fg-bright">
              Create an account
            </h2>
            <p className="mt-2 text-center text-sm text-tokyo-comment">
              Join our research project to help improve code review learning
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="fullName" className="sr-only">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-tokyo-selection bg-tokyo-bg-lightest placeholder-tokyo-comment text-tokyo-fg-bright rounded-t-md focus:outline-none focus:ring-tokyo-accent focus:border-tokyo-accent focus:z-10 sm:text-sm"
                  placeholder="Full name"
                  onChange={handleChange}
                  value={formData.fullName}
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-tokyo-selection bg-tokyo-bg-lightest placeholder-tokyo-comment text-tokyo-fg-bright focus:outline-none focus:ring-tokyo-accent focus:border-tokyo-accent focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  onChange={handleChange}
                  value={formData.email}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-tokyo-selection bg-tokyo-bg-lightest placeholder-tokyo-comment text-tokyo-fg-bright focus:outline-none focus:ring-tokyo-accent focus:border-tokyo-accent focus:z-10 sm:text-sm"
                  placeholder="Password"
                  onChange={handleChange}
                  value={formData.password}
                />
              </div>
              <div>
                <label htmlFor="organization" className="sr-only">
                  Organization (Company or University)
                </label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-tokyo-selection bg-tokyo-bg-lightest placeholder-tokyo-comment text-tokyo-fg-bright focus:outline-none focus:ring-tokyo-accent focus:border-tokyo-accent focus:z-10 sm:text-sm"
                  placeholder="Organization (Company or University)"
                  onChange={handleChange}
                  value={formData.organization}
                />
              </div>
              <div>
                <label htmlFor="role" className="sr-only">
                  Role (e.g. Developer, Student)
                </label>
                <input
                  id="role"
                  name="role"
                  type="text"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-tokyo-selection bg-tokyo-bg-lightest placeholder-tokyo-comment text-tokyo-fg-bright focus:outline-none focus:ring-tokyo-accent focus:border-tokyo-accent focus:z-10 sm:text-sm"
                  placeholder="Role (e.g. Developer, Student)"
                  onChange={handleChange}
                  value={formData.role}
                />
              </div>
              <div>
                <label htmlFor="experience" className="sr-only">
                  Years of experience
                </label>
                <input
                  id="experience"
                  name="experience"
                  type="number"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-tokyo-selection bg-tokyo-bg-lightest placeholder-tokyo-comment text-tokyo-fg-bright rounded-b-md focus:outline-none focus:ring-tokyo-accent focus:border-tokyo-accent focus:z-10 sm:text-sm"
                  placeholder="Years of experience"
                  onChange={handleChange}
                  value={formData.experience}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="isDeveloper"
                name="isDeveloper"
                type="checkbox"
                className="h-4 w-4 text-tokyo-accent focus:ring-tokyo-accent-lighter border-tokyo-selection rounded bg-tokyo-bg-lightest"
                checked={formData.isDeveloper}
                onChange={handleChange}
              />
              <label
                htmlFor="isDeveloper"
                className="ml-2 block text-sm text-tokyo-fg"
              >
                I am a professional developer
              </label>
            </div>

            <div>
              <p className="text-sm text-tokyo-comment mb-4">
                By signing up, you agree to participate in our research. Your
                data will be used solely for research purposes.
              </p>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-tokyo-accent hover:bg-tokyo-accent-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tokyo-accent-lighter cursor-pointer"
              >
                Create account
              </button>
            </div>
          </form>
          <div className="text-sm text-center">
            <span className="text-tokyo-comment">
              Already have an account?{" "}
            </span>
            <Link
              to="/login"
              className="font-medium text-tokyo-accent hover:text-tokyo-accent-lighter"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SignUp;
