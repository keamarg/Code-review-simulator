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
    school: "",
    educationName: "",
    semester: "",
    isStudent: false,
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
            school: formData.school,
            education_name: formData.educationName,
            semester: formData.semester,
            is_student: formData.isStudent,
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Opret en konto
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="fullName" className="sr-only">
                  Fulde navn
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Fulde navn"
                  onChange={handleChange}
                  value={formData.fullName}
                />
              </div>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email adresse
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email adresse"
                  onChange={handleChange}
                  value={formData.email}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Adgangskode
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Adgangskode"
                  onChange={handleChange}
                  value={formData.password}
                />
              </div>
              <div>
                <label htmlFor="school" className="sr-only">
                  Skole (Fx KEA eller DTU)
                </label>
                <input
                  id="school"
                  name="school"
                  type="text"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Skole (Fx KEA eller DTU)"
                  onChange={handleChange}
                  value={formData.school}
                />
              </div>
              <div>
                <label htmlFor="educationName" className="sr-only">
                  Uddannelsesnavn (Fx Datamatiker)
                </label>
                <input
                  id="educationName"
                  name="educationName"
                  type="text"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Uddannelsesnavn (Fx Datamatiker)"
                  onChange={handleChange}
                  value={formData.educationName}
                />
              </div>
              <div>
                <label htmlFor="semester" className="sr-only">
                  Semester
                </label>
                <input
                  id="semester"
                  name="semester"
                  type="number"
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Semester"
                  onChange={handleChange}
                  value={formData.semester}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="isStudent"
                name="isStudent"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.isStudent}
                onChange={handleChange}
              />
              <label
                htmlFor="isStudent"
                className="ml-2 block text-sm text-gray-900"
              >
                Er du studerende?
              </label>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
              >
                Opret konto
              </button>
            </div>
          </form>
          <div className="text-sm text-center">
            <span className="text-gray-600">Har du allerede en konto? </span>
            <Link
              to="/login" // Changed link to /login
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Log ind
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SignUp;
