import React from "react";
import { Link } from "react-router-dom";

export function Navigation() {
  return (
    <nav className="bg-gray-800 p-4">
      <ul className="flex space-x-4">
        <li>
          <Link className="text-white" to="/">
            Home
          </Link>
        </li>
        <li>
          <Link className="text-white" to="/dashboard">
            Dashboard
          </Link>
        </li>
        <li>
          <Link className="text-white" to="/create">
            Create Exam
          </Link>
        </li>
        <li>
          <Link className="text-white" to="/live">
            Live
          </Link>
        </li>
      </ul>
    </nav>
  );
}
