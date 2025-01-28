import React, { useState, useEffect } from "react";

interface ScheduleSlot {
  time: string;
  status: "Available" | "Booked" | "Cancelled";
  type?: string;
  details?: string;
}

interface DaySchedule {
  date: string;
  slots: ScheduleSlot[];
}

interface ReservationDetails {
  duration: number;
  type: string;
  patientName: string;
  gender: string;
  age: number;
  notes: string;
}

const generateMockSchedule = (startDate: Date): DaySchedule[] => {
  const startOfWeek = new Date(startDate);

  return Array.from({ length: 7 }).map((_, dayIndex) => {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + dayIndex);

    return {
      date: date.toISOString().split("T")[0],
      slots: Array.from({ length: 48 }).map((_, slotIndex) => ({
        time: `${String(Math.floor(slotIndex / 2)).padStart(2, "0")}:${
          slotIndex % 2 === 0 ? "00" : "30"
        }`,
        status: Math.random() > 0.7 ? "Available" : "Booked",
        type: Math.random() > 0.7 ? "Specialist" : "Standard",
        details: `Details for slot ${slotIndex}`,
      })),
    };
  });
};

const PatientCalendar: React.FC = () => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    time: string;
  } | null>(null);
  const [reservationFormVisible, setReservationFormVisible] =
    useState<boolean>(false);
  const [reservationDetails, setReservationDetails] =
    useState<ReservationDetails>({
      duration: 0,
      type: "",
      patientName: "",
      gender: "",
      age: 0,
      notes: "",
    });

  useEffect(() => {
    setSchedule(generateMockSchedule(currentWeekStart));
  }, [currentWeekStart]);

  const handleNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekStart(nextWeek);
  };

  const handlePrevWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekStart(prevWeek);
  };

  const handleSlotClick = (date: string, time: string, status: string) => {
    if (status === "Available") {
      setSelectedSlot({ date, time });
      setReservationFormVisible(true);
    } else if (status === "Booked") {
      alert("This slot is already booked. Please select another slot.");
    } else {
      alert("This slot is unavailable.");
    }
  };

  const handleReservationSubmit = async () => {
    if (reservationDetails.duration <= 0) {
      alert("Duration must be greater than 0.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reservationDetails,
          date: selectedSlot?.date,
          time: selectedSlot?.time,
        }),
      });

      if (response.ok) {
        alert("Reservation successful!");
        setReservationFormVisible(false);
        setSchedule((prev) =>
          prev.map((day) =>
            day.date === selectedSlot?.date
              ? {
                  ...day,
                  slots: day.slots.map((slot) =>
                    slot.time === selectedSlot?.time
                      ? { ...slot, status: "Booked" }
                      : slot
                  ),
                }
              : day
          )
        );
      } else {
        alert("Failed to reserve the slot.");
      }
    } catch (error) {
      console.error("Error during reservation:", error);
      alert("An error occurred during reservation.");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {/* Nawigacja tygodniowa */}
      <div className="flex justify-between items-center mb-4">
        <button
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          onClick={handlePrevWeek}
        >
          Previous Week
        </button>
        <h2 className="text-xl font-bold">Your Calendar</h2>
        <button
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          onClick={handleNextWeek}
        >
          Next Week
        </button>
      </div>

      {/* Kalendarz */}
      <div className="grid grid-cols-8 gap-1">
        {/* Nagłówki dni tygodnia */}
        <div className="border p-2 font-bold text-center">Time</div>
        {schedule.map((day) => (
          <div key={day.date} className="border p-2 font-bold text-center">
            <div>
              {new Date(day.date).toLocaleDateString("en-US", {
                weekday: "long",
              })}
            </div>
            <div>
              {new Date(day.date).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>
        ))}

        {/* Sloty czasowe */}
        {Array.from({ length: 24 }).map((_, hour) => (
          <React.Fragment key={hour}>
            <div className="border p-2 text-right">{`${hour}:00`}</div>
            {schedule.map((day) => (
              <div key={`${day.date}-${hour}`} className="border p-1">
                {day.slots
                  .filter((slot) =>
                    slot.time.startsWith(`${hour.toString().padStart(2, "0")}:`)
                  )
                  .map((slot, idx) => (
                    <div
                      key={idx}
                      className={`rounded p-1 text-center cursor-pointer ${
                        slot.status === "Booked"
                          ? "bg-green-200 hover:bg-red-200"
                          : slot.status === "Available"
                          ? "bg-gray-200 hover:bg-blue-200"
                          : "bg-red-200 opacity-50"
                      }`}
                      onClick={() =>
                        handleSlotClick(day.date, slot.time, slot.status)
                      }
                    >
                      {slot.type || "Available"}
                    </div>
                  ))}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Formularz rezerwacji */}
      {reservationFormVisible && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-md w-1/3">
            <h2 className="text-xl font-bold mb-4">Reserve a Consultation</h2>
            <div className="mb-4">
              <label className="block font-bold mb-2">
                Duration (in 30-min slots):
              </label>
              <input
                type="number"
                value={reservationDetails.duration}
                onChange={(e) =>
                  setReservationDetails({
                    ...reservationDetails,
                    duration: parseInt(e.target.value, 10),
                  })
                }
                className="border p-2 rounded w-full"
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2">Consultation Type:</label>
              <select
                value={reservationDetails.type}
                onChange={(e) =>
                  setReservationDetails({
                    ...reservationDetails,
                    type: e.target.value,
                  })
                }
                className="border p-2 rounded w-full"
              >
                <option value="">Select type</option>
                <option value="First Visit">First Visit</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Chronic Disease">Chronic Disease</option>
                <option value="Prescription">Prescription</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block font-bold mb-2">Patient Name:</label>
              <input
                type="text"
                value={reservationDetails.patientName}
                onChange={(e) =>
                  setReservationDetails({
                    ...reservationDetails,
                    patientName: e.target.value,
                  })
                }
                className="border p-2 rounded w-full"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setReservationFormVisible(false)}
                className="bg-gray-300 px-4 py-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleReservationSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Reserve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCalendar;
