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
    <div className="p-6 bg-gray-900 text-gray-200 rounded-xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">
        Manage Availability
      </h2>

      {/* Availability Type Selection */}
      <div className="mb-6 flex space-x-6">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="availabilityType"
            value="cyclic"
            checked={availabilityType === "Cyclic"}
            onChange={() => setAvailabilityType("Cyclic")}
            className="hidden"
          />
          <span
            className={`px-4 py-2 rounded-lg transition ${
              availabilityType === "Cyclic"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}
          >
            Cyclic Availability
          </span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="availabilityType"
            value="single"
            checked={availabilityType === "Single"}
            onChange={() => setAvailabilityType("Single")}
            className="hidden"
          />
          <span
            className={`px-4 py-2 rounded-lg transition ${
              availabilityType === "Single"
                ? "bg-green-600 text-white"
                : "bg-gray-700 text-gray-400 hover:bg-gray-600"
            }`}
          >
            Single Availability
          </span>
        </label>
      </div>

      {/* Cyclic Availability Section */}
      {availabilityType === "Cyclic" && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-300">
              Date Range
            </label>
            <div className="flex space-x-4">
              <input
                type="date"
                value={cyclicAvailability.startDate}
                onChange={(e) =>
                  setCyclicAvailability({
                    ...cyclicAvailability,
                    startDate: e.target.value,
                  })
                }
                className="border border-gray-600 bg-gray-700 text-gray-200 px-3 py-2 rounded-lg"
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
                className="border border-gray-600 bg-gray-700 text-gray-200 px-3 py-2 rounded-lg"
              />
            </div>
          </div>

          {/* Days of the Week Selection */}
          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-300">
              Days of the Week
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <label key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    value={day}
                    className="hidden"
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
                  <span
                    className={`px-3 py-1 rounded-lg transition ${
                      cyclicAvailability.daysOfWeek?.includes(day)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {day}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Slots for Cyclic Availability */}
          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-300">
              Time Slots
            </label>
            {cyclicAvailability.timeSlots?.map((slot, index) => (
              <div key={index} className="flex space-x-4 mb-2">
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
                  className="border border-gray-600 bg-gray-700 text-gray-200 px-3 py-2 rounded-lg"
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
                  className="border border-gray-600 bg-gray-700 text-gray-200 px-3 py-2 rounded-lg"
                />
              </div>
            ))}

            <button
              onClick={() => handleAddTimeSlot("Cyclic")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition"
            >
              Add Time Slot
            </button>
          </div>
        </div>
      )}

      {/* Single Availability Section */}
      {availabilityType === "Single" && (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-300">Date</label>
            <input
              type="date"
              value={singleAvailability.singleDate}
              onChange={(e) =>
                setSingleAvailability({
                  ...singleAvailability,
                  singleDate: e.target.value,
                })
              }
              className="border border-gray-600 bg-gray-700 text-gray-200 px-3 py-2 rounded-lg"
            />
          </div>

          {/* Time Slots for Single Availability */}
          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-300">
              Time Slots
            </label>
            {singleAvailability.timeSlots?.map((slot, index) => (
              <div key={index} className="flex space-x-4 mb-2">
                <input
                  type="time"
                  step="1800"
                  value={slot.start}
                  onChange={(e) => {
                    const roundedTime = roundToNearest30(e.target.value);
                    const timeSlots = [...(singleAvailability.timeSlots || [])];
                    timeSlots[index].start = roundedTime;
                    setSingleAvailability({ ...singleAvailability, timeSlots });
                  }}
                  className="border border-gray-600 bg-gray-700 text-gray-200 px-3 py-2 rounded-lg"
                />
                <input
                  type="time"
                  value={slot.end}
                  onChange={(e) => {
                    const roundedTime = roundToNearest30(e.target.value);
                    const timeSlots = [...(singleAvailability.timeSlots || [])];
                    timeSlots[index].end = roundedTime;
                    setSingleAvailability({ ...singleAvailability, timeSlots });
                  }}
                  className="border border-gray-600 bg-gray-700 text-gray-200 px-3 py-2 rounded-lg"
                />
              </div>
            ))}

            <button
              onClick={() => handleAddTimeSlot("Single")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition"
            >
              Add Time Slot
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg transition"
      >
        Save Availability
      </button>
    </div>
  );
};

export default AvailabilityManager;
