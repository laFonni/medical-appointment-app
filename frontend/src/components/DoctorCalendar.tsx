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
                    consultation.start_time === time
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
      {/* Weekly Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          onClick={handlePrevWeek}
        >
          Previous Week
        </button>
        <h2 className="text-xl font-bold">
          Weekly Schedule (
          {currentWeekStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}{" "}
          -{" "}
          {new Date(
            currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000
          ).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          )
        </h2>
        <button
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
          onClick={handleNextWeek}
        >
          Next Week
        </button>
      </div>

      {/* Calendar */}
      <div className="grid grid-cols-8 gap-1">
        {/* Day Headers */}
        <div className="border p-2 font-bold text-center">Time</div>
        {schedule.map((day) => (
          <div
            key={day.date}
            className={`border p-2 font-bold text-center ${
              day.date === currentDay ? "bg-yellow-100" : ""
            }`}
          >
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

        {/* Time Slots */}
        {hoursToDisplay.map((hour) => (
          <React.Fragment key={hour}>
            {/* Time Labels */}
            <div className="border p-2 text-center flex flex-col justify-center items-center">
              <div
                className={`mb-2 ${
                  currentHour === hour && currentMinute < 30
                    ? "bg-blue-200 font-bold"
                    : ""
                }`}
              >
                {`${hour}:00`}
              </div>
              <div
                className={`${
                  currentHour === hour && currentMinute >= 30
                    ? "bg-blue-200 font-bold"
                    : ""
                }`}
              >
                {`${hour}:30`}
              </div>
            </div>
            {schedule.map((day) => (
              <div
                key={`${day.date}-${hour}`}
                className={`border p-1 ${
                  day.date === currentDay ? "bg-yellow-50" : ""
                }`}
              >
                {day.slots
                  .filter((slot) =>
                    slot.time.startsWith(`${hour.toString().padStart(2, "0")}:`)
                  )
                  .map((slot, idx) => (
                    <div
                      key={idx}
                      className={`rounded p-1 text-center ${
                        slot.status === "Booked"
                          ? "bg-green-200"
                          : slot.status === "Available"
                          ? "bg-gray-200 hover:bg-blue-200"
                          : "bg-red-200 opacity-50"
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
