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

const DoctorCalendar: React.FC<{ doctorId: number }> = ({ doctorId }) => {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.setDate(today.getDate() - today.getDay())); // Start of the current week
  });
  const currentDay = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const startDate = currentWeekStart.toISOString().split("T")[0];
        const endDate = new Date(currentWeekStart);
        endDate.setDate(endDate.getDate() + 6); // End of the current week
        const endDateString = endDate.toISOString().split("T")[0];

        // Fetch data from the backend using fetch
        // Fetch availability, consultations, and absences concurrently
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

        // Generate schedule based on API data

        const startOfWeek = new Date(currentWeekStart);
        const generatedSchedule = Array.from({ length: 7 }).map(
          (_, dayIndex) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + dayIndex);
            const formattedDate = date.toISOString().split("T")[0];
            const getDayName = (date: Date) => {
              const days = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ];
              return days[date.getDay()];
            };
            const getDayOfWeek = (dateString: string): number => {
              const date = new Date(dateString);
              return date.getDay(); // Zwraca numer dnia tygodnia
            };

            const slots: ScheduleSlot[] = Array.from({ length: 48 }).map(
              (_, slotIndex) => {
                const time = `${String(Math.floor(slotIndex / 2)).padStart(
                  2,
                  "0"
                )}:${slotIndex % 2 === 0 ? "00" : "30"}`;

                const timeToMinutes = (time: string) => {
                  const [hours, minutes] = time.split(":").map(Number);
                  return hours * 60 + minutes;
                };

                const isInTimeRange = (
                  start: string,
                  end: string,
                  current: string
                ) => {
                  const startMins = timeToMinutes(start);
                  const endMins = timeToMinutes(end);
                  const currentMins = timeToMinutes(current);

                  if (startMins <= endMins) {
                    return currentMins >= startMins && currentMins < endMins;
                  } else {
                    return currentMins >= startMins || currentMins < endMins;
                  }
                };

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
                      isInTimeRange(
                        availability.start_time,
                        availability.end_time,
                        time
                      ) &&
                      (availability.type == "Cyclic"
                        ? availability.days_mask
                            .split(",")
                            .includes(getDayName(date))
                        : [
                            getDayName(new Date(availability.start_date)),
                          ].includes(getDayName(date)))
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
                    ? "This slot is available"
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

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const nextWeek = new Date(prev);
      nextWeek.setDate(prev.getDate() + 7); // Go to next week
      return nextWeek;
    });
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const prevWeek = new Date(prev);
      prevWeek.setDate(prev.getDate() - 7); // Go to previous week
      return prevWeek;
    });
  };
  
  const [maxHoursVisible, setMaxHoursVisible] = useState(6);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  // Oblicz pierwszą godzinę dla domyślnego widoku (zaokrąglona w dół pełna godzina)
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const startHour = Math.floor(currentHour);
  const adjustedMaxHours = Math.min(maxHoursVisible, 24 - startHour);

  // Generuj zakres godzin
  const hoursToDisplay = showFullSchedule
    ? Array.from({ length: 24 }, (_, i) => i) // Wszystkie godziny od 0 do 23
    : Array.from({ length: adjustedMaxHours }, (_, i) => startHour + i);

    return (
      <div className="p-6 bg-gray-900 text-gray-200 rounded-xl shadow-xl">
        {/* Show Full Schedule Toggle */}
        <div className="flex justify-center mt-4">
          <button
            className={`px-4 py-2 rounded-md font-semibold transition ${
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
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition"
            onClick={handlePrevWeek}
          >
            ◀ Previous Week
          </button>
          <h2 className="text-xl font-bold text-blue-400">
            {currentWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
            {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h2>
          <button
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md transition"
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
                day.date === currentDay ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-300"
              }`}
            >
              <div className="text-md">{new Date(day.date).toLocaleDateString("en-US", { weekday: "long" })}</div>
              <div className="text-sm text-gray-400">{new Date(day.date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</div>
            </div>
          ))}
    
          {/* Time Slots */}
          {hoursToDisplay.map((hour) => (
            <React.Fragment key={hour}>
              {/* Time Labels */}
              <div className="text-center font-mono text-gray-400">
                <div className={`mb-1 p-2 ${currentHour === hour && currentMinute < 30 ? "bg-blue-600 text-white rounded-md" : ""}`}>
                  {`${hour}:00`}
                </div>
                <div className={`${currentHour === hour && currentMinute >= 30 ? "bg-blue-600 text-white rounded-md" : ""}`}>
                  {`${hour}:30`}
                </div>
              </div>
    
              {/* Time Slots for Each Day */}
              {schedule.map((day) => (
                <div key={`${day.date}-${hour}`} className="p-1">
                  {day.slots
                    .filter((slot) => slot.time.startsWith(`${hour.toString().padStart(2, "0")}:`))
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
      </div>
    );
    
};

export default DoctorCalendar;
