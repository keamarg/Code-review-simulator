import React from "react";
import { Link } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            ExamSim
          </Link>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link to="/create" className="text-gray-600 hover:text-gray-900">
                  Create
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-white py-4 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          Educational tool in beta. Contact{" "}
          <a href="mailto:behu@kea.dk" className="underline">
            Benjamin Hughes
          </a>{" "}
          for questions
        </div>
      </footer>
    </div>
  );
}