import React, { useEffect, useState, useCallback } from "react";

interface CalendarProps {
  hallId: number;
  onDateSelect: (hallId: number, date: string) => void;
}

interface AvailabilityData {
  date: string;
  reason: string;
  isBooked: boolean;
}

interface APIResponse {
  statusCode: number;
  message: string;
  data: {
    date: string;
    reason: string;
    is_booked: boolean;
    hall: {
      hall_id: number;
      name: string;
    };
  }[];
}

const Calendar: React.FC<CalendarProps> = ({ hallId, onDateSelect }) => {
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>(
    []
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    new Date().getMonth()
  );
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear()
  );

  const fetchAvailability = useCallback(async () => {
    try {
      const response = await fetch(`/api/halls/availability`);
      const result: APIResponse = await response.json();

      if (result.statusCode === 200) {
        const dataForHall = result.data
          .filter((item) => item.hall.hall_id === hallId)
          .map((item) => ({
            date: item.date.split("T")[0],
            reason: item.reason || "Available",
            isBooked: item.is_booked,
          }));
        setAvailabilityData(dataForHall);
      } else {
        console.error("Failed to fetch availability data");
      }
    } catch (error) {
      console.error("Error fetching availability:", error);
    }
  }, [hallId]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const getDaysInMonth = (month: number, year: number): string[] => {
    const days = [];
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    for (
      let date = startDate;
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      if (date >= new Date()) {
        days.push(date.toISOString().split("T")[0]);
      }
    }
    return days;
  };

  const handlePrevMonth = () => {
    if (
      currentMonth === new Date().getMonth() &&
      currentYear === new Date().getFullYear()
    ) {
      return;
    }
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prevYear) => prevYear - 1);
    } else {
      setCurrentMonth((prevMonth) => prevMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const today = new Date();
    const maxMonth = today.getMonth() + 36;
    const maxYear = today.getFullYear() + Math.floor(maxMonth / 12);

    if (currentMonth === maxMonth % 12 && currentYear === maxYear) {
      return;
    }
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prevYear) => prevYear + 1);
    } else {
      setCurrentMonth((prevMonth) => prevMonth + 1);
    }
  };

  const reasonColors: Record<string, string> = {
    Wedding: "text-blue-600",
    Upanayana: "text-yellow-600",
    Reception: "text-red-600",
    Available: "text-green-600",
    OnHold: "text-orange-600",
    Others: "text-purple-600",
  };

  const getReasonColor = (reason: string): string => {
    if (reason.includes("Wedding")) return reasonColors["Wedding"];
    if (reason.includes("Upanayana")) return reasonColors["Upanayana"];
    if (reason.includes("Reception")) return reasonColors["Reception"];
    if (reason.includes("Available")) return reasonColors["Available"];
    if (reason.includes("On hold")) return reasonColors["OnHold"];
    return reasonColors["Others"];
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  return (
    <div>
      <div className="flex justify-between mb-4 items-center">
        <button
          onClick={handlePrevMonth}
          className={`px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-800 font-medium ${
            currentMonth === new Date().getMonth() &&
            currentYear === new Date().getFullYear()
              ? "cursor-not-allowed opacity-50"
              : ""
          }`}
          disabled={
            currentMonth === new Date().getMonth() &&
            currentYear === new Date().getFullYear()
          }
        >
          Previous
        </button>
        <span className="font-medium text-gray-700">
          {new Date(currentYear, currentMonth).toLocaleString("default", {
            month: "long",
          })}{" "}
          {currentYear}
        </span>
        <button
          onClick={handleNextMonth}
          className={`px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-800 font-medium ${
            currentMonth === (new Date().getMonth() + 36) % 12 &&
            currentYear ===
              new Date().getFullYear() +
                Math.floor((new Date().getMonth() + 36) / 12)
              ? "cursor-not-allowed opacity-50"
              : ""
          }`}
          disabled={
            currentMonth === (new Date().getMonth() + 36) % 12 &&
            currentYear ===
              new Date().getFullYear() +
                Math.floor((new Date().getMonth() + 36) / 12)
          }
        >
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 md:grid-cols-5 sm:grid-cols-3 gap-2">
        {daysInMonth.map((day) => {
          const availability = availabilityData.find(
            (data) => data.date === day
          );
          return (
            <div key={day} className="text-center">
              <button
                onClick={() =>
                  !availability?.isBooked &&
                  availability?.reason !== "On hold" &&
                  onDateSelect(hallId, day)
                }
                className={`p-2 rounded-lg w-full ${
                  availability?.isBooked
                    ? "bg-red-100 cursor-not-allowed"
                    : availability?.reason === "On hold"
                    ? "bg-orange-100 cursor-not-allowed"
                    : "bg-green-100 hover:bg-green-200"
                }`}
                disabled={
                  availability?.isBooked || availability?.reason === "On hold"
                }
              >
                <span>{new Date(day).getDate()}</span>
              </button>
              {availability && (
                <div
                  className={`text-xs mt-1 font-medium ${getReasonColor(
                    availability.reason
                  )}`}
                >
                  {availability.reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
