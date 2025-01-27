import React, { useState } from 'react';

interface Availability {
  type: 'cyclic' | 'single';
  startDate?: string;
  endDate?: string;
  daysOfWeek?: string[]; // Maski dni tygodnia
  timeSlots?: { start: string; end: string }[];
  singleDate?: string;
}

const AvailabilityManager: React.FC<{ doctorId: number }> = ({ doctorId }) => {
  const [availabilityType, setAvailabilityType] = useState<'cyclic' | 'single'>('cyclic');
  const [cyclicAvailability, setCyclicAvailability] = useState<Availability>({
    type: 'cyclic',
    startDate: '',
    endDate: '',
    daysOfWeek: [],
    timeSlots: [],
  });
  const [singleAvailability, setSingleAvailability] = useState<Availability>({
    type: 'single',
    singleDate: '',
    timeSlots: [],
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleAddTimeSlot = (type: 'cyclic' | 'single') => {
    if (type === 'cyclic') {
      setCyclicAvailability({
        ...cyclicAvailability,
        timeSlots: [...(cyclicAvailability.timeSlots || []), { start: '', end: '' }],
      });
    } else {
      setSingleAvailability({
        ...singleAvailability,
        timeSlots: [...(singleAvailability.timeSlots || []), { start: '', end: '' }],
      });
    }
  };

  const handleSubmit = async () => {
    const data =
      availabilityType === 'cyclic'
        ? {
            doctorId,
            type: 'cyclic',
            startDate: cyclicAvailability.startDate,
            endDate: cyclicAvailability.endDate,
            daysMask: cyclicAvailability.daysOfWeek?.join(','),
            timeSlots: cyclicAvailability.timeSlots,
          }
        : {
            doctorId,
            type: 'single',
            date: singleAvailability.singleDate,
            timeSlots: singleAvailability.timeSlots,
          };

    try {
      const response = await fetch('http://localhost:5000/api/auth/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Availability saved successfully!');
      } else {
        const error = await response.json();
        console.error('Failed to save availability:', error);
        alert('Failed to save availability.');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Error occurred while saving availability.');
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
            checked={availabilityType === 'cyclic'}
            onChange={() => setAvailabilityType('cyclic')}
          />
          Cyclic Availability
        </label>
        <label>
          <input
            type="radio"
            name="availabilityType"
            value="single"
            checked={availabilityType === 'single'}
            onChange={() => setAvailabilityType('single')}
          />
          Single Availability
        </label>
      </div>

      {/* Cyclic Availability */}
      {availabilityType === 'cyclic' && (
        <div>
          <div className="mb-4">
            <label className="block mb-2 font-bold">Date Range</label>
            <input
              type="date"
              value={cyclicAvailability.startDate}
              onChange={(e) =>
                setCyclicAvailability({ ...cyclicAvailability, startDate: e.target.value })
              }
              className="border p-2 rounded mr-2"
            />
            <input
              type="date"
              value={cyclicAvailability.endDate}
              onChange={(e) =>
                setCyclicAvailability({ ...cyclicAvailability, endDate: e.target.value })
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
                  value={slot.start}
                  onChange={(e) => {
                    const timeSlots = [...(cyclicAvailability.timeSlots || [])];
                    timeSlots[index].start = e.target.value;
                    setCyclicAvailability({ ...cyclicAvailability, timeSlots });
                  }}
                  className="border p-2 rounded mr-2"
                />
                <input
                  type="time"
                  value={slot.end}
                  onChange={(e) => {
                    const timeSlots = [...(cyclicAvailability.timeSlots || [])];
                    timeSlots[index].end = e.target.value;
                    setCyclicAvailability({ ...cyclicAvailability, timeSlots });
                  }}
                  className="border p-2 rounded"
                />
              </div>
            ))}
            <button
              onClick={() => handleAddTimeSlot('cyclic')}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Time Slot
            </button>
          </div>
        </div>
      )}

      {/* Single Availability */}
      {availabilityType === 'single' && (
        <div>
          <div className="mb-4">
            <label className="block mb-2 font-bold">Date</label>
            <input
              type="date"
              value={singleAvailability.singleDate}
              onChange={(e) =>
                setSingleAvailability({ ...singleAvailability, singleDate: e.target.value })
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
                  value={slot.start}
                  onChange={(e) => {
                    const timeSlots = [...(singleAvailability.timeSlots || [])];
                    timeSlots[index].start = e.target.value;
                    setSingleAvailability({ ...singleAvailability, timeSlots });
                  }}
                  className="border p-2 rounded mr-2"
                />
                <input
                  type="time"
                  value={slot.end}
                  onChange={(e) => {
                    const timeSlots = [...(singleAvailability.timeSlots || [])];
                    timeSlots[index].end = e.target.value;
                    setSingleAvailability({ ...singleAvailability, timeSlots });
                  }}
                  className="border p-2 rounded"
                />
              </div>
            ))}
            <button
              onClick={() => handleAddTimeSlot('single')}
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
