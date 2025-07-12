import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import Layout from "../layout/Layout";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((prevFormData) => {
      return {
        ...prevFormData,
        [name]: value,
      };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // Check if user was trying to do a quick start
      const quickStartIntent = localStorage.getItem("quickStartIntent");
      if (quickStartIntent) {
        localStorage.removeItem("quickStartIntent");
        navigate("/", { state: { reopenQuickStart: true } });
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      alert("Login failed: " + (error as Error).message);
    }
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-tokyo-bg-lighter p-10 rounded-lg shadow-md border border-tokyo-selection">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-tokyo-fg-bright">
              Log in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-tokyo-comment">
              This application is part of a research project
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
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
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-tokyo-selection bg-tokyo-bg-lightest placeholder-tokyo-comment text-tokyo-fg-bright rounded-t-md focus:outline-none focus:ring-tokyo-accent focus:border-tokyo-accent focus:z-10 sm:text-sm"
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
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-tokyo-selection bg-tokyo-bg-lightest placeholder-tokyo-comment text-tokyo-fg-bright rounded-b-md focus:outline-none focus:ring-tokyo-accent focus:border-tokyo-accent focus:z-10 sm:text-sm"
                  placeholder="Password"
                  onChange={handleChange}
                  value={formData.password}
                />
              </div>
            </div>

            {/* Optional: Add remember me checkbox or forgot password link here */}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-tokyo-accent hover:bg-tokyo-accent-darker focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tokyo-accent-lighter cursor-pointer"
              >
                Log in
              </button>
            </div>
          </form>
          <div className="text-sm text-center">
            <span className="text-tokyo-comment">Don't have an account? </span>
            <Link
              to="/signup"
              className="font-medium text-tokyo-accent hover:text-tokyo-accent-lighter"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;
