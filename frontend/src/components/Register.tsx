// Register.tsx
import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate for redirection

interface FormData {
  name: string;
  lastName: string; // Dodanie tego pola do interfejsu
  email: string;
  password: string;
  role: string; // Precyzyjne typowanie roli
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    lastName: "", // Inicjalizacja tego pola
    email: "",
    password: "",
    role: "Patient", // Domyślnie ustawiona rola na 'patient'
  });

  const navigate = useNavigate();

  const { name, lastName, email, password, role } = formData;

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );
      console.log("Registered:", response.data);
      navigate("/login"); // Redirect to login page after successful registration
    } catch (error) {
      const err = error as AxiosError;
      if (err.response) {
        console.error("Error registering:", err.response.data);
      } else {
        console.error("Error registering:", err.message);
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="w-full max-w-xs p-6 rounded-lg bg-gray-800 shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-blue-400">Register</h2>
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <input
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              placeholder="Name"
              required
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              name="lastName"
              value={lastName}
              onChange={onChange}
              placeholder="Last Name"
              required
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>
          <div className="mb-4">
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="Email"
              required
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>
          <div className="mb-4">
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="Password"
              required
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="role" className="block mb-2 text-sm font-medium text-gray-300">
              Select your role:
            </label>
            <select
              name="role"
              value={role}
              onChange={onChange}
              required
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Patient">Patient</option>
              <option value="Doctor">Doctor</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 transition px-4 py-2 rounded-md text-white font-semibold shadow-md"
          >
            Register
          </button>
          <p className="mt-4 text-center text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
  
};

export default Register;
