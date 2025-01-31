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
  name: string;
  lastName: string;
  email: string;
  role: string;
}

const Dashboard: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const { token, authMode } = useAuth(); // Pobieramy token i tryb z kontekstu
  const navigate = useNavigate();

  useEffect(() => {
    console.log(
      `[Dashboard] Current token: ${token}, Current authMode: ${authMode}`
    );
    const fetchData = async () => {
      if (!token) {
        console.log("[Dashboard] No token found. Redirecting to login.");
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/user/info",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserData(response.data);
        console.log(
          "[Dashboard] User data fetched successfully:",
          response.data
        );
      } catch (error) {
        console.error("[Dashboard] Error fetching user data:", error);
        navigate("/login");
      }
    };

    fetchData();
  }, [token, authMode, navigate]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar userData={userData} />
      <div className="p-4">
        <h1 className="text-2xl font-bold">Welcome, {userData.name}</h1>
        {userData.role === "Patient" && (
          <div>
            <h2 className="text-xl font-bold mt-4 mb-2">Doctor Tools</h2>
            {/* <PatientCalendar /> */}
            <DoctorCalendar doctorId={1} />
            <AvailabilityManager doctorId={1} />
            <AbsenceManager doctorId={1} />
            {/*
            <Basket patientId={1}/> */}
            {/* <AbsenceManager doctorId={userData.id} /> */}
          </div>
        )}
        {/* {userData.role === 'patient' && <p>Patient-specific dashboard coming soon!</p>} */}
      </div>
    </div>
  );
};

export default Dashboard;
