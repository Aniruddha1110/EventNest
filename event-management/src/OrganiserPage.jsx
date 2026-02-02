import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  addMonths,
  format,
  getDaysInMonth,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { User, ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE = "http://localhost:5000"; 

export default function OrganiserDashboard() {
  const navigate = useNavigate();

  // --- State Management ---
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState([]);
  const [loadingDateEvents, setLoadingDateEvents] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    const fetchLatestOngoing = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/events/ongoing?limit=5`);
        setOngoingEvents(res.data || []);
      } catch (err) {
        console.error("Failed to fetch ongoing events:", err);
      }
    };
    fetchLatestOngoing();
  }, []);

  useEffect(() => {
    const fetchEventsForDate = async () => {
      try {
        setLoadingDateEvents(true);
        const formatted = format(selectedDate, "yyyy-MM-dd");
        const res = await axios.get(`${API_BASE}/api/events/by-date?date=${formatted}`);
        setEventsByDate(res.data || []);
      } catch (err) {
        console.error("Failed to fetch date events:", err);
      } finally {
        setLoadingDateEvents(false);
      }
    };

    fetchEventsForDate();
    const interval = setInterval(fetchEventsForDate, 15000); // 15s Real-time sync
    return () => clearInterval(interval);
  }, [selectedDate]);

  // --- Calendar Logic ---
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    const startWeekday = start.getDay();
    const totalCells = Math.ceil((startWeekday + daysInMonth) / 7) * 7;

    const days = [];
    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startWeekday + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) {
        days.push(null);
      } else {
        days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber));
      }
    }
    return days;
  }, [currentMonth]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] px-10 py-8 font-sans text-gray-900">
      
      {/* Header Section */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="bg-black px-4 py-1 text-lg font-bold text-white transition hover:opacity-90"
        >
          EventSphere
        </button>

        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 text-sm font-semibold transition hover:text-gray-600"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300">
              <User size={18} />
            </div>
            View Profile
          </button>

          <div className="relative group">
            <select
              onChange={(e) => navigate(`/events/${e.target.value}`)}
              className="appearance-none rounded-md border border-gray-200 bg-white py-2 pl-4 pr-10 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300"
            >
              <option value="">Events</option>
              <option value="ongoing">Ongoing Events</option>
              <option value="upcoming">Upcoming Events</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
              <span className="text-[10px]">▼</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Title */}
      <h1 className="mt-16 text-7xl font-bold tracking-tight text-black">
        Welcome Organisers
      </h1>

      <div className="mt-16 grid grid-cols-1 gap-16 lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* Left Section: Ongoing Events */}
        <section>
          <div className="relative mb-10 inline-block">
            <h2 className="text-2xl font-bold">Ongoing Events (Latest 5)</h2>
            <div className="absolute -bottom-1 left-0 h-[3px] w-full bg-[#CCF05A]" />
          </div>

          <div className="flex flex-col gap-4">
            {ongoingEvents.length > 0 ? (
              ongoingEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="group flex cursor-pointer items-center bg-white py-3 pr-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
                >
                  <div className="mr-4 h-10 w-2 bg-[#CCF05A]" />
                  <span className="flex-1 text-xl font-medium group-hover:underline">
                    {event.title}
                  </span>
                  <span className="text-sm italic text-gray-400">
                    {event.statusText || "Active Now"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No active events found.</p>
            )}
          </div>

          <button
            onClick={() => navigate("/events/create")}
            className="mt-10 flex items-center gap-2 bg-[#CCF05A] px-6 py-3 font-bold uppercase tracking-wide transition hover:brightness-105 active:scale-95 shadow-sm"
          >
            + Create New Event
          </button>
        </section>

        {/* Right Section: Calendar */}
        <section className="relative flex flex-col items-center lg:items-end">
          <div className="w-full max-w-sm bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] ring-1 ring-gray-50">
            
            {/* Calendar Nav */}
            <div className="mb-6 flex items-center justify-between px-2">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft size={20} className="text-gray-300 hover:text-black" />
              </button>
              <h3 className="text-lg font-bold">{format(currentMonth, "MMMM yyyy")}</h3>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight size={20} className="text-gray-300 hover:text-black" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="mb-4 grid grid-cols-7 text-center text-xs font-semibold text-gray-400">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {calendarDays.map((day, idx) => {
                const isSelected = day && isSameDay(day, selectedDate);
                const isToday = day && isSameDay(day, new Date());
                
                return (
                  <button
                    key={idx}
                    disabled={!day}
                    onClick={() => day && setSelectedDate(day)}
                    className={`h-10 text-sm transition-all duration-200 
                      ${!day ? "pointer-events-none" : "hover:bg-gray-50"} 
                      ${isSelected ? "font-bold text-[#CCF05A]" : "text-gray-700"}
                      ${isToday && !isSelected ? "underline decoration-[#CCF05A] underline-offset-4" : ""}
                    `}
                  >
                    {day ? format(day, "d") : ""}
                  </button>
                );
              })}
            </div>

            {/* Upcoming Popover (Floating UI) */}
            <div className="absolute -bottom-12 -right-4 min-w-[200px] border border-gray-50 bg-white p-5 shadow-2xl">
              <p className="mb-3 text-xs font-bold text-gray-800">
                {eventsByDate.length} upcoming events
              </p>
              <button
                onClick={() => navigate("/events")}
                className="w-full bg-[#CCF05A] py-2 text-[11px] font-black uppercase tracking-widest text-black transition hover:brightness-105"
              >
                View Events
              </button>
            </div>
          </div>
          
          <p className="mt-20 self-end text-[10px] text-gray-300">
            *Real-time database sync active
          </p>
        </section>
      </div>
    </div>
  );
}