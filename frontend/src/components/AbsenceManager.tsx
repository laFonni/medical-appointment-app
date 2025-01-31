import React, { useState, useEffect } from "react";

interface Absence {
  id: number;
  start_date: string;
  end_date: string;
  reason?: string;
}

const AbsenceManager: React.FC<{ doctorId: number }> = ({ doctorId }) => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  // Pobieranie listy absencji z backendu
  const fetchAbsences = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/doctor/all-absences?doctorId=${doctorId}`
      );

      if (!response.ok) throw new Error("Failed to fetch absences");

      const data = await response.json();
      setAbsences(data);
    } catch (error) {
      console.error("Error fetching absences:", error);
    }
  };

  useEffect(() => {
    fetchAbsences();
  }, [doctorId]);

  // Dodawanie nowej absencji
  const handleAddAbsence = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, startDate, endDate, reason }),
      });

      if (response.ok) {
        setStartDate("");
        setEndDate("");
        setReason("");
        fetchAbsences();
      } else {
        console.error("Failed to add absence");
      }
    } catch (error) {
      console.error("Error adding absence:", error);
    }
  };

  // Usuwanie absencji
  const handleDeleteAbsence = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/absences/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        fetchAbsences();
      } else {
        console.error("Failed to delete absence");
      }
    } catch (error) {
      console.error("Error deleting absence:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-900 text-gray-200 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-100">Manage Absences</h2>
  
      {/* Add Absence Section */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-md">
        <h3 className="font-semibold text-lg text-gray-300 mb-3">Add Absence</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-gray-700 text-gray-300 border border-gray-600 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-gray-700 text-gray-300 border border-gray-600 p-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-gray-700 text-gray-300 border border-gray-600 p-2 rounded-md w-full sm:w-auto focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            onClick={handleAddAbsence}
            className="bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-md text-white font-semibold shadow-md"
          >
            Add
          </button>
        </div>
      </div>
  
      {/* List of Absences */}
      <h3 className="text-lg font-bold mb-3 text-gray-300">Planned Absences</h3>
  
      {absences.length === 0 ? (
        <p className="text-gray-500 text-center p-4 bg-gray-800 rounded-md">
          No absences recorded.
        </p>
      ) : (
        <ul className="space-y-3">
          {absences.map((absence) => (
            <li
              key={absence.id}
              className="flex justify-between items-center p-3 bg-gray-800 rounded-md shadow-md border border-gray-700"
            >
              <span className="text-gray-300">
                {absence.start_date} - {absence.end_date}
                {absence.reason && ` - ${absence.reason}`}
              </span>
              <button
                onClick={() => handleDeleteAbsence(absence.id)}
                className="bg-red-600 hover:bg-red-700 transition-colors px-3 py-1 rounded-md text-white font-semibold shadow-md"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  
};

export default AbsenceManager;
