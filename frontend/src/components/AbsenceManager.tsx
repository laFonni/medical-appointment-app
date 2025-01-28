import React, { useState, useEffect } from "react";

interface Absence {
  date: string;
}

const AbsenceManager: React.FC<{ doctorId: number }> = ({ doctorId }) => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [newAbsence, setNewAbsence] = useState<string>("");

  useEffect(() => {
    // Pobranie listy absencji z backendu
    const fetchAbsences = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/absences/${doctorId}`
        );
        const data = await response.json();
        setAbsences(data);
      } catch (error) {
        console.error("Error fetching absences:", error);
      }
    };

    fetchAbsences();
  }, [doctorId]);

  const handleAddAbsence = async () => {
    if (!newAbsence) return;

    try {
      const response = await fetch("http://localhost:5000/api/absences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId, date: newAbsence }),
      });

      if (response.ok) {
        setAbsences([...absences, { date: newAbsence }]);
        setNewAbsence("");
      } else {
        console.error("Failed to add absence");
      }
    } catch (error) {
      console.error("Error adding absence:", error);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Manage Absences</h2>
      <div className="mb-4">
        <label className="block font-bold mb-2">Add Absence</label>
        <input
          type="date"
          value={newAbsence}
          onChange={(e) => setNewAbsence(e.target.value)}
          className="border p-2 rounded mr-2"
        />
        <button
          onClick={handleAddAbsence}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      <h3 className="text-lg font-bold mb-2">Planned Absences</h3>
      <ul>
        {absences.map((absence, idx) => (
          <li key={idx} className="mb-2">
            <span className="block p-2 bg-red-200 rounded">{absence.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AbsenceManager;
