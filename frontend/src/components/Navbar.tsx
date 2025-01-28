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
    <nav className="bg-blue-500 text-white px-4 py-2 shadow-md">
      <div className="flex justify-between items-center">
        {/* Lewa część - Dane użytkownika i tryb */}
        <div>
          <span className="font-bold">
            {userData.name} {userData.lastName}
          </span>
          <span className="ml-2 text-sm italic">({userData.role})</span>
          <span className="ml-4 text-sm bg-gray-700 px-2 py-1 rounded">
            Mode: {authMode}
          </span>
        </div>

        {/* Prawa część - Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="focus:outline-none hover:bg-blue-600 p-2 rounded"
          >
            Menu
          </button>

          {/* Rozwijane menu */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-md rounded">
              <ul>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <Link to="/profile">Profile</Link>
                </li>
                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <button
                    onClick={() => {
                      clearToken();
                      navigate("/login");
                    }}
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
