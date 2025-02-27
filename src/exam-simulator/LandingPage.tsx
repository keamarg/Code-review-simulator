import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/layout/Layout";

const LandingPage: React.FC = () => {
  // Add scroll reveal animation effect
  useEffect(() => {
    const revealElements = document.querySelectorAll(".reveal");

    const revealOnScroll = () => {
      for (let i = 0; i < revealElements.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = revealElements[i].getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < windowHeight - elementVisible) {
          revealElements[i].classList.add("active");
        }
      }
    };

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll(); // Initial check

    return () => window.removeEventListener("scroll", revealOnScroll);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjUiPjxwYXRoIGQ9Ik0zNiAxOGMxLjIgMCAyLjEgMS4xIDIuMSAyLjNzLS45IDIuMy0yLjEgMi4zYy0xLjIgMC0yLjEtMS4xLTIuMS0yLjMgMC0xLjIuOS0yLjMgMi4xLTIuM3ptLTEyIDEyYzEuMiAwIDIuMSAxLjEgMi4xIDIuM3MtLjkgMi4zLTIuMSAyLjNjLTEuMiAwLTIuMS0xLjEtMi4xLTIuMyAwLTEuMi45LTIuMyAyLjEtMi4zem0xMiAxMmMxLjIgMCAyLjEgMS4xIDIuMSAyLjNzLS45IDIuMy0yLjEgMi4zYy0xLjIgMC0yLjEtMS4xLTIuMS0yLjMgMC0xLjIuOS0yLjMgMi4xLTIuM3ptLTEyLTI0YzEuMiAwIDIuMSAxLjEgMi4xIDIuM3MtLjkgMi4zLTIuMSAyLjNjLTEuMiAwLTIuMS0xLjEtMi4xLTIuMyAwLTEuMi45LTIuMyAyLjEtMi4zem0wIDI0YzEuMiAwIDIuMSAxLjEgMi4xIDIuM3MtLjkgMi4zLTIuMSAyLjNjLTEuMiAwLTIuMS0xLjEtMi4xLTIuMyAwLTEuMi45LTIuMyAyLjEtMi4zem0xMi0xMmMxLjIgMCAyLjEgMS4xIDIuMSAyLjNzLS45IDIuMy0yLjEgMi4zYy0xLjIgMC0yLjEtMS4xLTIuMS0yLjMgMC0xLjIuOS0yLjMgMi4xLTIuM3oiLz48L2c+PC9nPjwvc3ZnPg==')] bg-center"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-24 md:py-32 relative z-10">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                  Simulate. Practice.
                  <br />
                  <span className="text-blue-200">Excel.</span>
                </h1>
                <p className="mt-6 text-xl text-blue-100 max-w-lg mx-auto md:mx-0">
                  AI-powered exam simulations that prepare students for success
                  with realistic practice environments.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Link
                    to="/create"
                    className="px-8 py-4 bg-white text-blue-700 font-bold rounded-lg shadow-lg hover:bg-blue-50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    Create Exam
                  </Link>
                  <Link
                    to="/dashboard"
                    className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transform transition-all duration-300 hover:-translate-y-1 mb-36"
                  >
                    View Dashboard
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute -top-4 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
                  <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
                  <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>
                  <div className="relative">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl transform transition-all duration-500 hover:scale-105">
                      <div className="p-4 bg-blue-50 rounded-xl mb-4">
                        <svg
                          className="w-10 h-10 text-blue-600 mx-auto"
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
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        Multimodal Exam
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Create an AI-powered exam with text, images, and code
                        challenges.
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          60 min
                        </span>
                        <span className="text-gray-500">Just now</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              className="w-full h-auto"
            >
              <path
                fill="#ffffff"
                fillOpacity="1"
                d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,149.3C960,160,1056,160,1152,138.7C1248,117,1344,75,1392,53.3L1440,32L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 reveal">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-4">
                <p className="text-4xl font-bold text-blue-600">500+</p>
                <p className="text-gray-600 mt-2">Exams Created</p>
              </div>
              <div className="p-4">
                <p className="text-4xl font-bold text-blue-600">10k+</p>
                <p className="text-gray-600 mt-2">Students</p>
              </div>
              <div className="p-4">
                <p className="text-4xl font-bold text-blue-600">98%</p>
                <p className="text-gray-600 mt-2">Success Rate</p>
              </div>
              <div className="p-4">
                <p className="text-4xl font-bold text-blue-600">24/7</p>
                <p className="text-gray-600 mt-2">Support</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 reveal">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold tracking-wider text-blue-600 uppercase">
                Features
              </h2>
              <h3 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">
                Everything you need for exam preparation
              </h3>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
                Our platform provides all the tools educators need to create
                realistic exam simulations.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="p-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    AI-Generated Exams
                  </h4>
                  <p className="text-gray-600">
                    Create realistic exam simulations with advanced AI that
                    generates questions tailored to your curriculum.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="p-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                    <svg
                      className="w-6 h-6 text-blue-600"
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
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    Anytime, Anywhere
                  </h4>
                  <p className="text-gray-600">
                    Access your exam simulations on any device, at any time.
                    Perfect for remote learning and flexible study schedules.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                <div className="p-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">
                    Detailed Feedback
                  </h4>
                  <p className="text-gray-600">
                    Receive comprehensive analytics and personalized feedback to
                    identify strengths and areas for improvement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gray-50 reveal">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold tracking-wider text-blue-600 uppercase">
                Testimonials
              </h2>
              <h3 className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900">
                What educators are saying
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">S</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">Sarah Johnson</h4>
                    <p className="text-gray-600 text-sm">
                      Computer Science Professor
                    </p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "This platform has transformed how I prepare my students for
                  exams. The AI-generated questions are remarkably similar to
                  real exam questions."
                </p>
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">M</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">Michael Chen</h4>
                    <p className="text-gray-600 text-sm">
                      High School Math Teacher
                    </p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "My students' test scores have improved significantly since we
                  started using these exam simulations. The platform is
                  intuitive and easy to use."
                </p>
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xl">J</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900">Jessica Patel</h4>
                    <p className="text-gray-600 text-sm">
                      University Administrator
                    </p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "We've implemented this across multiple departments with great
                  success. The analytics provide valuable insights for our
                  curriculum development."
                </p>
                <div className="mt-4 flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 reveal">
          <div className="max-w-5xl mx-auto px-4">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-12 md:p-12 md:flex items-center justify-between">
                <div className="mb-8 md:mb-0 md:max-w-lg">
                  <h3 className="text-3xl font-bold text-white">
                    Ready to transform your exam preparation?
                  </h3>
                  <p className="mt-4 text-blue-100">
                    Join thousands of educators who are already using our
                    platform to create engaging and effective exam simulations.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/create"
                    className="px-8 py-4 bg-white text-blue-700 font-bold rounded-lg shadow-lg hover:bg-blue-50 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-center"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/contact"
                    className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transform transition-all duration-300 hover:-translate-y-1 text-center"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Add CSS for animations */}
      <style>
        {`
          .reveal {
            position: relative;
            opacity: 0;
            transform: translateY(30px);
            transition: all 1s ease;
          }
          .reveal.active {
            opacity: 1;
            transform: translateY(0);
          }

          @keyframes blob {
            0% {
              transform: scale(1);
            }
            33% {
              transform: scale(1.1);
            }
            66% {
              transform: scale(0.9);
            }
            100% {
              transform: scale(1);
            }
          }

          .animate-blob {
            animation: blob 7s infinite;
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}
      </style>
    </Layout>
  );
};

export default LandingPage;
