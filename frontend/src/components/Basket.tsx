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
  const [isPaying, setIsPaying] = useState<boolean>(false);

  // Fetch the patient's booked consultations
  const fetchPatientConsultations = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/patient/consultations?patientId=${patientID}`
      );
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
      const response = await fetch(
        `http://localhost:5000/api/auth/consultations/${consultationId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patient_id: patientID }),
        }
      );

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

  // Calculate the total price based on consultation type and duration
  const calculatePrice = (consultation: Consultation): number => {
    const duration = getConsultationDuration(consultation.start_time, consultation.end_time);
    const basePrice = 50; // Base price for a 30-minute session
    return (duration / 30) * basePrice;
  };

  // Calculate consultation duration in minutes
  const getConsultationDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    return (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
  };

  // Simulate checkout and mark all consultations as paid
  const handleCheckout = async () => {
    setIsPaying(true);
    try {
      const unpaidConsultations = patientConsultations.filter(c => c.status === "Booked");

      if (unpaidConsultations.length === 0) {
        alert("No unpaid consultations available.");
        setIsPaying(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/auth/patient/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientID }),
      });

      if (response.ok) {
        alert("Payment successful! Your consultations have been confirmed.");
        setPatientConsultations(prevConsultations =>
          prevConsultations.map(c =>
            c.status === "Booked" ? { ...c, status: "Paid" } : c
          )
        );
      } else {
        const errorData = await response.json();
        alert(`Payment failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Error processing payment.");
    } finally {
      setIsPaying(false);
    }
  };

  // Fetch consultations when component mounts
  useEffect(() => {
    fetchPatientConsultations();
  }, [patientID]);

  return (
    <div className="p-6 bg-gray-900 text-gray-200 rounded-xl shadow-lg mt-6">
      <h2 className="text-2xl font-bold mb-4 text-blue-400">My Booked Consultations</h2>
  
      {loading ? (
        <p className="text-gray-400">Loading consultations...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : patientConsultations.length === 0 ? (
        <p className="text-gray-400">You have no booked consultations.</p>
      ) : (
        <div className="bg-gray-800 rounded-lg shadow-md p-4">
          <ul>
            {patientConsultations.map((consultation) => (
              <li
                key={consultation.id}
                className="flex justify-between items-center p-4 border-b border-gray-700 last:border-none bg-gray-700 rounded-lg shadow-md mb-3"
              >
                <div>
                  <h3 className="text-lg font-bold text-blue-300">{consultation.type}</h3>
                  <p className="text-gray-300">
                    {consultation.date} | {consultation.start_time} - {consultation.end_time}
                  </p>
                  <p className="text-sm text-gray-400">
                    {consultation.notes || "No additional notes"}
                  </p>
                  <p className="text-sm font-bold text-yellow-400">
                    Price: ${calculatePrice(consultation)}
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      consultation.status === "Paid" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    Status: {consultation.status}
                  </p>
                </div>
                {consultation.status === "Booked" && (
                  <button
                    className="bg-red-600 hover:bg-red-500 transition px-4 py-2 rounded-md text-white font-semibold shadow-md"
                    onClick={() => handleCancelConsultation(consultation.id)}
                  >
                    Cancel
                  </button>
                )}
              </li>
            ))}
          </ul>
  
          {/* Show checkout button if there are unpaid consultations */}
          {patientConsultations.some((c) => c.status === "Booked") && (
            <div className="flex justify-end mt-4">
              <button
                className={`bg-green-600 hover:bg-green-500 transition px-5 py-2 rounded-md text-white font-semibold shadow-md ${
                  isPaying ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleCheckout}
                disabled={isPaying}
              >
                {isPaying ? "Processing..." : "Checkout & Pay"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
  
};

export default Basket;
