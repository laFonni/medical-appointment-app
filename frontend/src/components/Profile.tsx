import React from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";

const Profile: React.FC = () => {
  const { authMode, setAuthMode, clearToken } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md bg-gray-700 p-6 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-100">Profile</h2>
        <p className="text-center mb-4 text-gray-300">
          Current Session Mode: <strong className="text-white">{authMode}</strong>
        </p>

        <div className="flex justify-around mb-6">
          <button
            onClick={() => setAuthMode("LOCAL")}
            className={`px-4 py-2 rounded-md transition ${
              authMode === "LOCAL"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            }`}
          >
            LOCAL
          </button>
          <button
            onClick={() => setAuthMode("SESSION")}
            className={`px-4 py-2 rounded-md transition ${
              authMode === "SESSION"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            }`}
          >
            SESSION
          </button>
          <button
            onClick={() => setAuthMode("NONE")}
            className={`px-4 py-2 rounded-md transition ${
              authMode === "NONE"
                ? "bg-blue-500 text-white shadow-md"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
            }`}
          >
            NONE
          </button>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gray-600 hover:bg-gray-500 transition px-4 py-2 rounded-md text-gray-200"
          >
            Back to Dashboard
          </button>
          <button
            onClick={clearToken}
            className="bg-red-600 hover:bg-red-500 transition px-4 py-2 rounded-md text-white"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
