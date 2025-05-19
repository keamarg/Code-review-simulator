import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../logo.png"; // Import the logo from src folder
import { useAuth } from "../contexts/AuthContext"; // Import useAuth

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth(); // Get user and signOut from context
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center"
          >
            <img
              src={logo}
              alt="CodeReview Logo"
              className="h-12 w-auto mr-4"
            />
            CodeReview
          </Link>
          <nav>
            <ul className="flex space-x-6 items-center">
              {user && (
                <>
                  <li>
                    <Link
                      to="/create"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Opret
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Oversigt
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      Log ud
                    </button>
                  </li>
                </>
              )}
              {!user && (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Log ind
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/signup"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Opret konto
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow relative">{children}</main>

      <footer className="bg-white py-4 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          Prototype i beta. Kontakt{" "}
          <a href="mailto:marg@kea.dk" className="underline">
            Martin Gundtoft
          </a>{" "}
          for spørgsmål (marg@kea.dk).
          <br />
          <br /> Baseret på https://github.com/behu-kea/exam-simulator af
          Benjamin Hughes
        </div>
      </footer>
    </div>
  );
}
