import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import DoctorCalendar from "./DoctorCalendar";
import AvailabilityManager from "./AvalibilityManager";
import AbsenceManager from "./AbsenceManager";
import PatientCalendar from "./PatientCalendar";
import AdminPanel from "./AdminPanel";
import Basket from "./Basket";

interface UserData {
  id: number;
  name: string;
  lastName: string;
  email: string;
  role: "Doctor" | "Patient" | 'Admin';
}

interface Doctor {
  id: number;
  name: string;
  lastName: string;
}

const Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const { token, authMode } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);

  useEffect(() => {
    console.log(`[Dashboard] Current token: ${token}, Current authMode: ${authMode}`);

    const fetchData = async () => {
      if (!token) {
        console.log("[Dashboard] No token found. Redirecting to login.");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/auth/user/info", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserData(response.data);
        console.log("[Dashboard] User data fetched successfully:", response.data);
      } catch (error) {
        console.error("[Dashboard] Error fetching user data:", error);
        navigate("/login");
      }
    };

    fetchData();
  }, [token, authMode, navigate]);

  // Fetch list of doctors for patients to select from
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/doctors");
        setDoctors(response.data);
        if (response.data.length > 0) {
          setSelectedDoctorId(response.data[0].id);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };

    if (userData?.role === "Patient") {
      fetchDoctors();
    }
  }, [userData]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Navbar userData={userData} />
      <div className="p-6 max-w-10xl mx-auto">
        <h1 className="text-3xl font-semibold text-white">Welcome, {userData.name}</h1>

        {userData.role === "Admin" && (
          <div className="mt-4">
            <h2 className="text-xl font-bold">Admin Dashboard</h2>
            <AdminPanel/>
          </div>
        )}
  
        {/* Patient Dashboard */}
        {userData.role === "Patient" && (
          <div className="mt-6 p-6 bg-gray-800 bg-opacity-60 shadow-lg rounded-xl">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">
              Select Your Doctor
            </h2>
  
            {/* Dropdown for selecting a doctor */}
            <select
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 hover:border-blue-400 transition"
              value={selectedDoctorId ?? ""}
              onChange={(e) => setSelectedDoctorId(parseInt(e.target.value, 10))}
            >
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name} {doctor.lastName}
                </option>
              ))}
            </select>
  
            {/* Show doctor's availability and patient tools if a doctor is selected */}
            {selectedDoctorId && (
              <div className="mt-6">
                <PatientCalendar doctorId={selectedDoctorId} patientID={userData.id} />
                <Basket patientID={userData.id} />
              </div>
            )}
          </div>
        )}
  
        {/* Doctor Dashboard */}
        {userData.role === "Doctor" && (
          <div className="mt-6 p-6 bg-gray-800 bg-opacity-60 shadow-lg rounded-xl">
            <h2 className="text-xl font-semibold text-blue-400 mb-4">
              My Schedule
            </h2>
            <DoctorCalendar doctorId={userData.id} />
            <AvailabilityManager doctorId={userData.id} />
            <AbsenceManager doctorId={userData.id} />
          </div>
        )}
      </div>
    </div>
  );
  
};

export default Dashboard;
