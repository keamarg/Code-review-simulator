import React from 'react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">ExamSim</h1>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a href="#features" className="text-gray-600 hover:text-gray-900">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-bold text-white">
            Experience Your Exam Before the Real Test
          </h2>
          <p className="mt-4 text-xl text-blue-200">
            Teachers create AI-powered simulated exams to help students prepare effectively.
          </p>
          <div className="mt-8">
            <a
              href="/create"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-full shadow hover:bg-gray-100"
            >
              Create your first exam
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-gray-900 text-center">Features</h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow">
              <h4 className="text-xl font-semibold text-gray-800">AI-Generated Exams</h4>
              <p className="mt-2 text-gray-600">
                Create realistic exam simulations with AI-driven question generation.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h4 className="text-xl font-semibold text-gray-800">Anytime, Anywhere</h4>
              <p className="mt-2 text-gray-600">
                Practice exams are accessible on any device, whenever you need them.
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow">
              <h4 className="text-xl font-semibold text-gray-800">Detailed Feedback</h4>
              <p className="mt-2 text-gray-600">
                Get insights and feedback to improve your exam performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-gray-900">Get in Touch</h3>
          <p className="mt-4 text-gray-600">
            Have questions or need support? We're here to help.
          </p>
          <div className="mt-8">
            <a
              href="/contact"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full shadow hover:bg-blue-700"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-4 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          &copy; {new Date().getFullYear()} ExamSim. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
