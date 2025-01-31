import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import DoctorCalendar from "./DoctorCalendar";
import AvailabilityManager from "./AvalibilityManager";
import AbsenceManager from "./AbsenceManager";
import PatientCalendar from "./PatientCalendar";
import Basket from "./Basket";

interface UserData {
  id: number;
  name: string;
  lastName: string;
  email: string;
  role: "Doctor" | "Patient";
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
    <div className="min-h-screen bg-gray-100">
      <Navbar userData={userData} />
      <div className="p-4">
        <h1 className="text-2xl font-bold">Welcome, {userData.name}</h1>

        {/* Patient Dashboard */}
        {userData.role === "Patient" && (
          <div>
            <h2 className="text-xl font-bold mt-4 mb-2">Select Your Doctor</h2>

            {/* Dropdown for selecting a doctor */}
            <select
              className="border p-2 rounded mb-4"
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
              <>
                <PatientCalendar doctorId={selectedDoctorId} patientID={userData.id} />
                <Basket patientID={userData.id} />
              </>
            )}
          </div>
        )}

        {/* Doctor Dashboard */}
        {userData.role === "Doctor" && (
          <div>
            <h2 className="text-xl font-bold mt-4 mb-2">My Schedule</h2>
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
