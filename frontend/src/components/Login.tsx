import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // Dodano Link
import { useAuth } from "./AuthContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setToken, authMode } = useAuth();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );
      const token = response.data.token;
      setToken(token); // Zapisz token zgodnie z trybem
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-gray-800 p-6 shadow-lg rounded-lg"
      >
        <h2 className="text-3xl font-bold text-center text-blue-400 mb-6">Login</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 mb-4"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 mb-4"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 transition px-4 py-2 rounded-md text-white font-semibold shadow-md"
        >
          Login
        </button>
        <div className="text-center mt-4 text-gray-400">
          <span>Don't have an account? </span>
          <Link to="/register" className="text-blue-400 hover:underline">
            Register here
          </Link>
        </div>
      </form>
    </div>
  );
  
};

export default Login;
