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

interface Absence {
  start_date: string;
  end_date: string;
}

const PatientCalendar: React.FC<{ doctorId: number; patientID: number }> = ({
  doctorId,
  patientID,
}) => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<{
    date: string;
    times: string[];
  } | null>(null);
  const [formData, setFormData] = useState({
    duration: 30,
    type: "",
    name: "",
    gender: "Male",
    age: "",
    notes: "",
  });

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.setDate(today.getDate() - today.getDay())); // Start of the current week
  });

  const [maxHoursVisible, setMaxHoursVisible] = useState(6);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  const currentHour = new Date().getHours();
  const startHour = Math.floor(currentHour);
  const adjustedMaxHours = Math.min(maxHoursVisible, 24 - startHour);

  const hoursToDisplay = showFullSchedule
    ? Array.from({ length: 24 }, (_, i) => i) // Full-day view
    : Array.from({ length: adjustedMaxHours }, (_, i) => startHour + i); // Limited to visible range

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const startDate = currentWeekStart.toISOString().split("T")[0];
        const endDate = new Date(currentWeekStart);
        endDate.setDate(endDate.getDate() + 6);
        const endDateString = endDate.toISOString().split("T")[0];

        const [availability, consultations, absences] = await Promise.all([
          fetch(
            `http://localhost:5000/api/auth/doctor/availability?doctorId=${doctorId}&startDate=${startDate}&endDate=${endDateString}`
          ).then((res) => res.json()),
          fetch(
            `http://localhost:5000/api/auth/doctor/consultations?doctorId=${doctorId}&startDate=${startDate}&endDate=${endDateString}`
          ).then((res) => res.json()),
          fetch(
            `http://localhost:5000/api/auth/doctor/absences?doctorId=${doctorId}&startDate=${startDate}&endDate=${endDateString}`
          ).then((res) => res.json()),
        ]);

        const startOfWeek = new Date(currentWeekStart);
        const generatedSchedule = Array.from({ length: 7 }).map(
          (_, dayIndex) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + dayIndex);
            const formattedDate = date.toISOString().split("T")[0];

            const slots: ScheduleSlot[] = Array.from({ length: 48 }).map(
              (_, slotIndex) => {
                const time = `${String(Math.floor(slotIndex / 2)).padStart(
                  2,
                  "0"
                )}:${slotIndex % 2 === 0 ? "00" : "30"}`;

                const isBooked = consultations.some(
                  (consultation: any) =>
                    consultation.date === formattedDate &&
                    consultation.start_time <= time &&
                    consultation.end_time > time
                );
                const isAvailable =
                  !isBooked &&
                  availability.some(
                    (availability: any) =>
                      availability.start_date <= formattedDate &&
                      availability.end_date >= formattedDate &&
                      availability.start_time <= time &&
                      availability.end_time > time
                  );
                const isAbsent = absences.some(
                  (absence: Absence) =>
                    absence.start_date <= formattedDate &&
                    absence.end_date >= formattedDate
                );

                return {
                  time,
                  status: isAbsent
                    ? "Cancelled"
                    : isBooked
                    ? "Booked"
                    : isAvailable
                    ? "Available"
                    : "Cancelled",
                  type: isBooked
                    ? "Consultation"
                    : isAvailable
                    ? "Available Slot"
                    : undefined,
                  details: isBooked
                    ? "This slot is booked"
                    : isAvailable
                    ? "Click to book"
                    : undefined,
                };
              }
            );

            return { date: formattedDate, slots };
          }
        );

        setSchedule(generatedSchedule);
      } catch (error) {
        console.error("Failed to fetch schedule data:", error);
      }
    };

    fetchSchedule();
  }, [currentWeekStart, doctorId]); 

  const handleBookingSubmit = async () => {
    if (!selectedSlots || selectedSlots.times.length === 0) {
      alert("Please select a valid time slot.");
      return;
    }
  
    const patientId = patientID; // Replace with actual logged-in patient ID
    const startTime = selectedSlots.times[0]; // First selected time slot
  
    // Calculate endTime by adding the duration (in minutes) to startTime
    const calculateEndTime = (startTime: string, duration: number) => {
      const [hours, minutes] = startTime.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes + duration; // Add duration to start time
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
    };
  
    const endTime = calculateEndTime(startTime, formData.duration);
  
    try {
      const response = await fetch("http://localhost:5000/api/auth/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: doctorId,
          patient_id: patientId,
          date: selectedSlots.date,
          start_time: startTime,
          end_time: endTime,
          type: formData.type,
          status: "Booked",
          notes: formData.notes,
        }),
      });
      console.log(JSON.stringify({
        doctor_id: doctorId,
        patient_id: patientId,
        date: selectedSlots.date,
        start_time: startTime,
        end_time: endTime,
        type: formData.type,
        status: "Pending",
        notes: formData.notes,
      }),)

      if (response.ok) {
        alert("Consultation booked successfully!");
        setIsModalOpen(false);
        setSelectedSlots(null);
        setFormData({
          duration: 30,
          type: "",
          name: "",
          gender: "Male",
          age: "",
          notes: "",
        }); // Reset form
      } else {
        const errorData = await response.json();
        alert(`Booking failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error booking consultation:", error);
      alert("Error booking consultation.");
    }
  };

  const handleCancelConsultation = async (consultationId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/consultations/${consultationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientID }), // Ensure patient authentication
      });
  
      if (response.ok) {
        alert("Consultation canceled successfully!");
        // Refresh the schedule after cancellation
        setSchedule((prevSchedule) =>
          prevSchedule.map((day) => ({
            ...day,
            slots: day.slots.map((slot) =>
              slot.status === "Booked" ? { ...slot, status: "Available", type: "Available Slot" } : slot
            ),
          }))
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
  

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const nextWeek = new Date(prev);
      nextWeek.setDate(prev.getDate() + 7);
      return nextWeek;
    });
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const prevWeek = new Date(prev);
      prevWeek.setDate(prev.getDate() - 7);
      return prevWeek;
    });
  };

  const handleSlotClick = (date: string, time: string) => {
    const selectedDateSchedule = schedule.find((d) => d.date === date);
    if (!selectedDateSchedule) return;

    const index = selectedDateSchedule.slots.findIndex(
      (slot) => slot.time === time
    );
    const selectedSlots = selectedDateSchedule.slots.slice(
      index,
      index + formData.duration / 30
    );

    if (
      selectedSlots.length < formData.duration / 30 ||
      selectedSlots.some((slot) => slot.status !== "Available")
    ) {
      alert(
        "Selected slots are not all available. Choose adjacent free slots."
      );
      return;
    }

    setSelectedSlots({ date, times: selectedSlots.map((slot) => slot.time) });
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-center mt-4">
        {!showFullSchedule ? (
          <button
            className="bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => setShowFullSchedule(true)}
          >
            Show Full Schedule
          </button>
        ) : (
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
            onClick={() => setShowFullSchedule(false)}
          >
            Show Default Schedule
          </button>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <button
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          onClick={handlePrevWeek}
        >
          Previous Week
        </button>
        <h2 className="text-xl font-bold">
          {currentWeekStart.toLocaleDateString()} -{" "}
          {new Date(
            currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
          ).toLocaleDateString()}
        </h2>
        <button
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          onClick={handleNextWeek}
        >
          Next Week
        </button>
      </div>

      <div className="grid grid-cols-8 gap-1">
        {/* Time Label Header */}
        <div className="border p-2 font-bold text-center">Time</div>
        {schedule.map((day) => (
          <div key={day.date} className="border p-2 font-bold text-center">
            {new Date(day.date).toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </div>
        ))}

        {/* Time Slots */}
        {hoursToDisplay.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time Column (HH:00 and HH:30 labels) */}
            <div className="border p-2 text-center flex flex-col justify-center items-center">
              <div className="mb-2">{`${hour}:00`}</div>
              <div>{`${hour}:30`}</div>
            </div>

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
                        slot.status === "Available"
                          ? "bg-gray-200 hover:bg-blue-200"
                          : "bg-red-200 opacity-50"
                      }`}
                      title={slot.details || "No details"}
                      onClick={() =>
                        slot.status === "Available" &&
                        handleSlotClick(day.date, slot.time)
                      } 
                    >
                      {slot.type || "Unavailable"}
                    </div>
                  ))}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      {isModalOpen && selectedSlots && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Book Consultation</h3>

            {/* Consultation Type */}
            <label className="block font-bold">Consultation Type:</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full border p-2 rounded mb-2"
            >
              <option value="">Select Consultation Type</option>
              <option value="First Visit">First Visit</option>
              <option value="Follow-up Visit">Follow-up Visit</option>
              <option value="Chronic Disease Consultation">
                Chronic Disease Consultation
              </option>
              <option value="Prescription Request">Prescription Request</option>
            </select>

            {/* Consultation Duration */}
            <label className="block font-bold">Consultation Duration:</label>
            <select
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value, 10),
                })
              }
              className="w-full border p-2 rounded mb-2"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>

            {/* Name */}
            <label className="block font-bold">Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full border p-2 rounded mb-2"
            />

            {/* Gender */}
            <label className="block font-bold">Gender:</label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full border p-2 rounded mb-2"
            >
              <option>Male</option>
              <option>Female</option>
            </select>

            {/* Age */}
            <label className="block font-bold">Age:</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
              className="w-full border p-2 rounded mb-2"
            />

            {/* Additional Notes */}
            <label className="block font-bold">Additional Notes:</label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border p-2 rounded mb-2"
            />

            {/* Buttons */}
            <div className="flex justify-between mt-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={handleBookingSubmit}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCalendar;
