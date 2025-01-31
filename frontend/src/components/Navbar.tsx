import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface NavbarProps {
  userData: {
    name: string;
    lastName: string;
    role: string;
  };
}

const Navbar: React.FC<NavbarProps> = ({ userData }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { authMode, clearToken } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-900 text-gray-200 px-6 py-3 shadow-md">
      <div className="flex justify-between items-center">
        {/* Left Side - User Info & Mode */}
        <div>
          <span className="font-bold text-white">
            {userData.name} {userData.lastName}
          </span>
          <span className="ml-2 text-sm italic text-gray-400">({userData.role})</span>
          <span className="ml-4 text-sm bg-gray-700 px-2 py-1 rounded-md text-gray-300">
            Mode: {authMode}
          </span>
        </div>

        {/* Right Side - Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md transition"
          >
            Menu
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 text-gray-300 shadow-lg rounded-md">
              <ul>
                <li className="px-4 py-2 hover:bg-gray-700 cursor-pointer rounded-t-md">
                  <Link to="/profile">Profile</Link>
                </li>
                <li className="px-4 py-2 hover:bg-red-600 cursor-pointer rounded-b-md">
                  <button
                    onClick={() => {
                      clearToken();
                      navigate("/login");
                    }}
                    className="w-full text-left"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
);

};

export default Navbar;
