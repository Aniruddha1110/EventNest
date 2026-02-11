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
// Mock Data - Representing what you'd get from a Backend
const EVENT_DATA = [
  { id: 1, title: "Tech Innovators Conference", type: "Paid, Technology", date: "2024-05-18", status: "ongoing" },
  { id: 2, title: "Global Culture Fest - Day 1", type: "Free, Cultural", date: "2024-05-18", status: "ongoing" },
  { id: 3, title: "Summer Music Jam", type: "Paid, Cultural", date: "2024-05-20", status: "upcoming" },
  { id: 4, title: "Sci-Fi VR Experience", type: "Free, Abstract", date: "2024-05-22", status: "upcoming" },
];

export default function OrganiserPage() {
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

  //Filtered Evenets based on selected calendar
  const filteredEvents = useMemo(() => {
      return EVENT_DATA.filter(event => event.date === selectedDate);
    }, [selectedDate]);
  
    const ongoing = filteredEvents.filter(e => e.status === 'ongoing');
    const upcoming = filteredEvents.filter(e => e.status === 'upcoming');

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

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2 text-sm font-semibold transition hover:text-gray-600"
          >
            <div className="flex h-9 w-20 items-center justify-center rounded-full border border-gray-300">
              <User size={18} />
            </div>
          </button>
            View Profile
          

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

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-12 mt-12 items-start">
        
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

        <div className="self-start -mt-12 bg-white p-6 rounded-xl shadow-sm border border-gray-100">

      {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft />
          </button>

          <h3 className="font-bold text-lg">
            {format(currentMonth, "MMMM yyyy")}
          </h3>

          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight />
          </button>
        </div>

      {/* Weekdays */}
        <div className="grid grid-cols-7 gap-2 text-center text-sm mb-2 text-gray-400">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
        <div key={d}>{d}</div>
      ))}
        </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-2 text-center">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={idx}></div>;

            const isSelected = isSameDay(day, selectedDate);

        return (
          <button
            key={idx}
            onClick={() => setSelectedDate(day)}
            className={`p-2 rounded-full transition ${
              isSelected
                ? "ring-2 ring-lime-400 font-bold"
                : "hover:bg-gray-100"
           }`}
        >
          {format(day, "d")}
        </button>
      );
    })}
      </div>

        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500 mb-2">
            {eventsByDate.length} events found
          </p>
          <button className="w-full bg-lime-400 py-2 rounded font-bold hover:bg-lime-500 transition">
            View Events
          </button>
        </div>
        </div>
      </main>
    </div>
  );
}