import React, { useState, useEffect } from 'react';

interface Consultation {
  id: number;
  date: string;
  time: string;
  type: string;
  doctorName: string;
  price: number;
  status: 'Booked' | 'Paid';
}

const Basket: React.FC<{ patientId: number }> = ({ patientId }) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/basket/${patientId}`);
        const data = await response.json();
        setConsultations(data);
      } catch (error) {
        console.error('Error fetching consultations:', error);
      }
    };

    fetchConsultations();
  }, [patientId]);

  const handlePayment = async (consultationId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/consultations/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultationId }),
      });

      if (response.ok) {
        setConsultations((prev) =>
          prev.map((consultation) =>
            consultation.id === consultationId
              ? { ...consultation, status: 'Paid' }
              : consultation
          )
        );
        alert('Payment successful!');
      } else {
        alert('Payment failed.');
      }
    } catch (error) {
      console.error('Error during payment:', error);
      alert('An error occurred during payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancellation = async (consultationId: number) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/consultations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consultationId }),
      });
  
      if (response.ok) {
        setConsultations((prev) =>
          prev.filter((consultation) => consultation.id !== consultationId)
        );
        alert('Consultation cancelled successfully.');
      } else {
        alert('Failed to cancel consultation.');
      }
    } catch (error) {
      console.error('Error during cancellation:', error);
      alert('An error occurred during cancellation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Your Basket</h2>

      {consultations.length === 0 ? (
        <p>No consultations booked yet.</p>
      ) : (
        <ul>
          {consultations.map((consultation) => (
           <li
           key={consultation.id}
           className="border p-4 rounded mb-2 flex justify-between items-center"
         >
           <div>
             <p>
               <strong>Doctor:</strong> {consultation.doctorName}
             </p>
             <p>
               <strong>Date:</strong> {consultation.date}
             </p>
             <p>
               <strong>Time:</strong> {consultation.time}
             </p>
             <p>
               <strong>Type:</strong> {consultation.type}
             </p>
             <p>
               <strong>Price:</strong> ${consultation.price.toFixed(2)}
             </p>
             <p>
               <strong>Status:</strong>{' '}
               <span
                 className={`font-bold ${
                   consultation.status === 'Paid' ? 'text-green-500' : 'text-red-500'
                 }`}
               >
                 {consultation.status}
               </span>
             </p>
           </div>
           {consultation.status === 'Booked' && (
             <button
               onClick={() => handleCancellation(consultation.id)}
               className={`bg-red-500 text-white px-4 py-2 rounded ${
                 loading ? 'opacity-50 cursor-not-allowed' : ''
               }`}
               disabled={loading}
             >
               Cancel
             </button>
           )}
         </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Basket;
