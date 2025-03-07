import React, { useState } from "react";

interface Availability {
  type: "Cyclic" | "Single";
  startDate?: string;
  endDate?: string;
  daysOfWeek?: string[];
  timeSlots?: { start: string; end: string }[];
  singleDate?: string;
}

const AvailabilityManager: React.FC<{ doctorId: number }> = ({ doctorId }) => {
  const [availabilityType, setAvailabilityType] = useState<"Cyclic" | "Single">(
    "Cyclic"
  );
  const [cyclicAvailability, setCyclicAvailability] = useState<Availability>({
    type: "Cyclic",
    startDate: "",
    endDate: "",
    daysOfWeek: [],
    timeSlots: [],
  });
  const [singleAvailability, setSingleAvailability] = useState<Availability>({
    type: "Single",
    singleDate: "",
    timeSlots: [],
  });

  const roundToNearest30 = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const roundedMinutes = minutes < 15 ? 0 : minutes < 45 ? 30 : 0;
    const adjustedHours = minutes >= 45 ? (hours + 1) % 24 : hours;
    return `${String(adjustedHours).padStart(2, "0")}:${String(
      roundedMinutes
    ).padStart(2, "0")}`;
  };

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handleAddTimeSlot = (type: "Cyclic" | "Single") => {
    if (type === "Cyclic") {
      setCyclicAvailability({
        ...cyclicAvailability,
        timeSlots: [
          ...(cyclicAvailability.timeSlots || []),
          { start: "", end: "" },
        ],
      });
    } else {
      setSingleAvailability({
        ...singleAvailability,
        timeSlots: [
          ...(singleAvailability.timeSlots || []),
          { start: "", end: "" },
        ],
      });
    }
  };

  const handleSubmit = async () => {
    const data =
      availabilityType === "Cyclic"
        ? {
            doctorId,
            startDate: cyclicAvailability.startDate,
            endDate: cyclicAvailability.endDate,
            daysMask: cyclicAvailability.daysOfWeek?.join(","),
            timeSlots: cyclicAvailability.timeSlots,
            type: "Cyclic",
          }
        : {
            doctorId,
            date: singleAvailability.singleDate,
            timeSlots: singleAvailability.timeSlots,
            type: "Single",
          };

    try {
      console.log(JSON.stringify(data));
      const response = await fetch(
        "http://localhost:5000/api/auth/availability",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        alert("Availability saved successfully!");
      } else {
        const error = await response.json();
        console.error("Failed to save availability:", error);
        alert("Failed to save availability.");
      }
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Error occurred while saving availability.");
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Manage Availability</h2>

      {/* Wybór trybu dostępności */}
      <div className="mb-4">
        <label className="mr-4">
          <input
            type="radio"
            name="availabilityType"
            value="cyclic"
            checked={availabilityType === "Cyclic"}
            onChange={() => setAvailabilityType("Cyclic")}
          />
          Cyclic Availability
        </label>
        <label>
          <input
            type="radio"
            name="availabilityType"
            value="single"
            checked={availabilityType === "Single"}
            onChange={() => setAvailabilityType("Single")}
          />
          Single Availability
        </label>
      </div>

      {/* Cyclic Availability */}
      {availabilityType === "Cyclic" && (
        <div>
          <div className="mb-4">
            <label className="block mb-2 font-bold">Date Range</label>
            <input
              type="date"
              value={cyclicAvailability.startDate}
              onChange={(e) =>
                setCyclicAvailability({
                  ...cyclicAvailability,
                  startDate: e.target.value,
                })
              }
              className="border p-2 rounded mr-2"
            />
            <input
              type="date"
              value={cyclicAvailability.endDate}
              onChange={(e) =>
                setCyclicAvailability({
                  ...cyclicAvailability,
                  endDate: e.target.value,
                })
              }
              className="border p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-bold">Days of the Week</label>
            {daysOfWeek.map((day) => (
              <label key={day} className="mr-4">
                <input
                  type="checkbox"
                  value={day}
                  onChange={(e) => {
                    const selectedDays = cyclicAvailability.daysOfWeek || [];
                    if (e.target.checked) {
                      setCyclicAvailability({
                        ...cyclicAvailability,
                        daysOfWeek: [...selectedDays, day],
                      });
                    } else {
                      setCyclicAvailability({
                        ...cyclicAvailability,
                        daysOfWeek: selectedDays.filter((d) => d !== day),
                      });
                    }
                  }}
                />
                {day}
              </label>
            ))}
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-bold">Time Slots</label>
            {cyclicAvailability.timeSlots?.map((slot, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="time"
                  step="1800"
                  list="time-options"
                  value={slot.start}
                  onChange={(e) => {
                    const roundedTime = roundToNearest30(e.target.value);
                    const timeSlots = [...(cyclicAvailability.timeSlots || [])];
                    timeSlots[index].start = roundedTime;
                    setCyclicAvailability({ ...cyclicAvailability, timeSlots });
                  }}
                  className="border p-2 rounded mr-2"
                />
                <input
                  type="time"
                  step="1800"
                  list="time-options"
                  value={slot.end}
                  onChange={(e) => {
                    const roundedTime = roundToNearest30(e.target.value);
                    const timeSlots = [...(cyclicAvailability.timeSlots || [])];
                    timeSlots[index].end = roundedTime;
                    setCyclicAvailability({ ...cyclicAvailability, timeSlots });
                  }}
                  className="border p-2 rounded"
                />
              </div>
            ))}

            <datalist id="time-options">
              {Array.from({ length: 48 }).map((_, index) => {
                const hours = Math.floor(index / 2);
                const minutes = index % 2 === 0 ? "00" : "30";
                return (
                  <option
                    key={index}
                    value={`${String(hours).padStart(2, "0")}:${minutes}`}
                  />
                );
              })}
            </datalist>

            <button
              onClick={() => handleAddTimeSlot("Cyclic")}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Time Slot
            </button>
          </div>
        </div>
      )}

      {/* Single Availability */}
      {availabilityType === "Single" && (
        <div>
          <div className="mb-4">
            <label className="block mb-2 font-bold">Date</label>
            <input
              type="date"
              value={singleAvailability.singleDate}
              onChange={(e) =>
                setSingleAvailability({
                  ...singleAvailability,
                  singleDate: e.target.value,
                })
              }
              className="border p-2 rounded"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-bold">Time Slots</label>
            {singleAvailability.timeSlots?.map((slot, index) => (
              <div key={index} className="flex mb-2">
                <input
                  type="time"
                  step="1800"
                  list="time-options"
                  value={slot.start}
                  onChange={(e) => {
                    const roundedTime = roundToNearest30(e.target.value);
                    const timeSlots = [...(singleAvailability.timeSlots || [])];
                    timeSlots[index].start = roundedTime;
                    setSingleAvailability({ ...singleAvailability, timeSlots });
                  }}
                  className="border p-2 rounded mr-2"
                />
                <input
                  type="time"
                  value={slot.end}
                  list="time-options"
                  onChange={(e) => {
                    const roundedTime = roundToNearest30(e.target.value);
                    const timeSlots = [...(singleAvailability.timeSlots || [])];
                    timeSlots[index].end = roundedTime;
                    setSingleAvailability({ ...singleAvailability, timeSlots });
                  }}
                  className="border p-2 rounded"
                />
              </div>
            ))}

            <datalist id="time-options">
              {Array.from({ length: 48 }).map((_, index) => {
                const hours = Math.floor(index / 2);
                const minutes = index % 2 === 0 ? "00" : "30";
                return (
                  <option
                    key={index}
                    value={`${String(hours).padStart(2, "0")}:${minutes}`}
                  />
                );
              })}
            </datalist>

            <button
              onClick={() => handleAddTimeSlot("Single")}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Time Slot
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Save Availability
      </button>
    </div>
  );
};

export default AvailabilityManager;
