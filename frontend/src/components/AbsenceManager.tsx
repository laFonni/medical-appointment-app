import React, { useState, useEffect } from "react";

interface Absence {
  id: number;
  date: string;
  reason?: string;
}

const AbsenceManager: React.FC<{ doctorId: number }> = ({ doctorId }) => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [newAbsence, setNewAbsence] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  // Funkcja pobierająca listę absencji z backendu
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

  // Pobranie danych przy pierwszym renderze
  useEffect(() => {
    fetchAbsences();
  }, [doctorId]);

  // Dodanie nowej absencji
  const handleAddAbsence = async () => {
    if (!newAbsence) {
      alert("Please select a date.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, date: newAbsence, reason }),
      });

      if (response.ok) {
        setNewAbsence("");
        setReason("");
        fetchAbsences(); // Pobranie aktualnej listy po dodaniu nowej absencji
      } else {
        console.error("Failed to add absence");
      }
    } catch (error) {
      console.error("Error adding absence:", error);
    }
  };

  // Usunięcie absencji
  const handleDeleteAbsence = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/absences/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        fetchAbsences(); // Pobranie aktualnej listy po usunięciu absencji
      } else {
        console.error("Failed to delete absence");
      }
    } catch (error) {
      console.error("Error deleting absence:", error);
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Manage Absences</h2>

      {/* Dodawanie nowej absencji */}
      <div className="mb-4">
        <label className="block font-bold mb-2">Add Absence</label>
        <div className="flex">
          <input
            type="date"
            value={newAbsence}
            onChange={(e) => setNewAbsence(e.target.value)}
            className="border p-2 rounded mr-2"
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border p-2 rounded mr-2"
          />
          <button
            onClick={handleAddAbsence}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </div>
      </div>

      {/* Lista zaplanowanych absencji */}
      <h3 className="text-lg font-bold mb-2">Planned Absences</h3>

      {absences.length === 0 || absences.length === undefined ? (
        <p className="text-gray-500">No absences recorded.</p>
      ) : (
        <ul>
          {absences.map((absence) => (
            <li
              key={absence.id}
              className="flex justify-between items-center mb-2 p-2 bg-red-200 rounded"
            >
              <span>
                {absence.date} {absence.reason && `- ${absence.reason}`}
              </span>
              <button
                onClick={() => handleDeleteAbsence(absence.id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
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
