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
  const currentDay = new Date().toISOString().split("T")[0];

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

  const currentMinute = new Date().getMinutes();


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
    <div className="p-6 bg-gray-900 text-gray-200 rounded-xl shadow-xl">
      {/* Show Full Schedule Toggle */}
      <div className="flex justify-center mt-4">
        <button
          className={`px-6 py-2 rounded-md font-semibold transition ${
            showFullSchedule
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
          onClick={() => setShowFullSchedule(!showFullSchedule)}
        >
          {showFullSchedule ? "Show Default Schedule" : "Show Full Schedule"}
        </button>
      </div>
  
      {/* Weekly Navigation */}
      <div className="flex justify-between items-center my-6">
        <button
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition text-white font-semibold"
          onClick={handlePrevWeek}
        >
          ◀ Previous Week
        </button>
        <h2 className="text-xl font-bold text-blue-400">
          {currentWeekStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          -{" "}
          {new Date(
            currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </h2>
        <button
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition text-white font-semibold"
          onClick={handleNextWeek}
        >
          Next Week ▶
        </button>
      </div>
  
      {/* Calendar Grid */}
      <div className="grid grid-cols-8 gap-2 border border-gray-700 rounded-lg p-4 bg-gray-800 bg-opacity-50">
        {/* Time Label Column */}
        <div className="text-center text-gray-400 font-bold p-2">Time</div>
  
        {/* Day Headers */}
        {schedule.map((day) => (
          <div
            key={day.date}
            className={`text-center font-bold p-2 rounded-lg transition ${
              day.date === currentDay
                ? "bg-blue-500 text-white"
                : "bg-gray-700 text-gray-300"
            }`}
          >
            <div className="text-md">
              {new Date(day.date).toLocaleDateString("en-US", {
                weekday: "long",
              })}
            </div>
            <div className="text-sm text-gray-400">
              {new Date(day.date).toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              })}
            </div>
          </div>
        ))}
  
        {/* Time Slots */}
        {hoursToDisplay.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time Labels */}
            <div className="text-center font-mono text-gray-400">
              <div
                className={`mb-1 p-2 ${
                  currentHour === hour && currentMinute < 30
                    ? "bg-blue-600 text-white rounded-md"
                    : ""
                }`}
              >
                {`${hour}:00`}
              </div>
              <div
                className={`${
                  currentHour === hour && currentMinute >= 30
                    ? "bg-blue-600 text-white rounded-md"
                    : ""
                }`}
              >
                {`${hour}:30`}
              </div>
            </div>
  
            {/* Time Slots for Each Day */}
            {schedule.map((day) => (
              <div key={`${day.date}-${hour}`} className="p-1">
                {day.slots
                  .filter((slot) =>
                    slot.time.startsWith(`${hour.toString().padStart(2, "0")}:`)
                  )
                  .map((slot, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-2 text-center font-semibold cursor-pointer transition ${
                        slot.status === "Booked"
                          ? "bg-green-600 text-white shadow-lg"
                          : slot.status === "Available"
                          ? "bg-gray-700 hover:bg-blue-500 text-white shadow-md"
                          : "bg-red-700 text-gray-400 opacity-50"
                      }`}
                      title={slot.details || "No details"}
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
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-96 text-gray-200">
            <h3 className="text-lg font-bold mb-4">Book Consultation</h3>
  
            <label className="block font-bold">Consultation Type:</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-600 p-2 rounded-md mb-2 text-gray-200"
            >
              <option value="">Select Consultation Type</option>
              <option value="First Visit">First Visit</option>
              <option value="Follow-up Visit">Follow-up Visit</option>
              <option value="Chronic Disease Consultation">
                Chronic Disease Consultation
              </option>
              <option value="Prescription Request">Prescription Request</option>
            </select>
  
            <label className="block font-bold">Consultation Duration:</label>
            <select
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value, 10),
                })
              }
              className="w-full bg-gray-800 border border-gray-600 p-2 rounded-md mb-2 text-gray-200"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
  
            <label className="block font-bold">Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-600 p-2 rounded-md mb-2 text-gray-200"
            />
  
            <label className="block font-bold">Gender:</label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-600 p-2 rounded-md mb-2 text-gray-200"
            >
              <option>Male</option>
              <option>Female</option>
            </select>
  
            <label className="block font-bold">Age:</label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-600 p-2 rounded-md mb-2 text-gray-200"
            />
  
            <label className="block font-bold">Additional Notes:</label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full bg-gray-800 border border-gray-600 p-2 rounded-md mb-2 text-gray-200"
            />
  
            <div className="flex justify-between mt-4">
              <button
                className="bg-red-600 hover:bg-red-500 transition-colors px-4 py-2 rounded-md text-white font-semibold"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-green-600 hover:bg-green-500 transition-colors px-4 py-2 rounded-md text-white font-semibold"
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
