import React, { useState, useEffect } from "react";

interface Consultation {
  id: number;
  doctor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  notes?: string;
}

const Basket: React.FC<{ patientID: number }> = ({ patientID }) => {
  const [patientConsultations, setPatientConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the patient's booked consultations
  const fetchPatientConsultations = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/patient/consultations?patientId=${patientID}`);
      if (!response.ok) throw new Error("Failed to fetch consultations");

      const data = await response.json();
      setPatientConsultations(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching consultations:", error);
      setError("Failed to load consultations.");
      setLoading(false);
    }
  };

  // Cancel a consultation
  const handleCancelConsultation = async (consultationId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/consultations/${consultationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientID }), // Ensure patient authentication
      });

      if (response.ok) {
        alert("Consultation canceled successfully!");
        setPatientConsultations((prevConsultations) =>
          prevConsultations.filter((c) => c.id !== consultationId)
        );
      } else {
        const errorData = await response.json();
        alert(`Cancellation failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error canceling consultation:", error);
      alert("Error canceling consultation.");
    }
  };

  // Fetch consultations when component mounts
  useEffect(() => {
    fetchPatientConsultations();
  }, [patientID]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-xl font-bold mb-2">My Booked Consultations</h2>

      {loading ? (
        <p className="text-gray-500">Loading consultations...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : patientConsultations.length === 0 ? (
        <p className="text-gray-500">You have no booked consultations.</p>
      ) : (
        <ul className="border rounded-lg p-4 bg-gray-50">
          {patientConsultations.map((consultation) => (
            <li key={consultation.id} className="flex justify-between items-center p-2 border-b last:border-none">
              <div>
                <strong>{consultation.type}</strong>
                <p>{consultation.date} | {consultation.start_time} - {consultation.end_time}</p>
                <p className="text-sm text-gray-600">{consultation.notes || "No additional notes"}</p>
              </div>
              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => handleCancelConsultation(consultation.id)}
              >
                Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Basket;
