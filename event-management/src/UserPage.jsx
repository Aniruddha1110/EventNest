import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, UserCircle, ChevronDown } from 'lucide-react';

// Mock Data - Representing what you'd get from a Backend
const EVENT_DATA = [
  { id: 1, title: "Tech Innovators Conference", type: "Paid, Technology", date: "2024-05-18", status: "ongoing" },
  { id: 2, title: "Global Culture Fest - Day 1", type: "Free, Cultural", date: "2024-05-18", status: "ongoing" },
  { id: 3, title: "Summer Music Jam", type: "Paid, Cultural", date: "2024-05-20", status: "upcoming" },
  { id: 4, title: "Sci-Fi VR Experience", type: "Free, Abstract", date: "2024-05-22", status: "upcoming" },
];

const UserPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date()); // May 18, 2024   
  const [selectedDate, setSelectedDate] = useState("2024-05-18");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  // Filter Events based on selected calendar date
  const filteredEvents = useMemo(() => {
    return EVENT_DATA.filter(event => event.date === selectedDate);
  }, [selectedDate]);

  const ongoing = filteredEvents.filter(e => e.status === 'ongoing');
  const upcoming = filteredEvents.filter(e => e.status === 'upcoming');

  const handleDateClick = (day) => {
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dateString = `${currentDate.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateString);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-12">
        <div className="bg-black text-white px-3 py-1 font-bold text-sm">EventSphere</div>
        <div className="flex items-center gap-6">
          <a href="/profile" className="flex items-center gap-2 hover:text-lime-600 transition">
            <UserCircle size={24} />
            <span className="font-medium">View Profile</span>
          </a>
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 border rounded-md px-4 py-1 bg-white shadow-sm"
            >
              Events <ChevronDown size={16} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-xl z-10">
                <div className="p-3 hover:bg-gray-100 cursor-pointer">Ongoing Events</div>
                <div className="p-3 hover:bg-gray-100 cursor-pointer">Upcoming Events</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* LEFT COLUMN: EVENTS */}
        <div className="lg:col-span-2">
          <h1 className="text-6xl font-bold mb-10">Your Events Dashboard</h1>
          
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-lime-400 w-fit pb-1">Ongoing Events</h2>
            {ongoing.length > 0 ? ongoing.map(event => (
              <EventCard key={event.id} event={event} isActive />   //This is the logic where ongoing events in synced with the calender
            )) : <p className="text-gray-400 italic">No ongoing events for this date.</p>}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 border-b-2 border-lime-400 w-fit pb-1">Upcoming Events</h2>
            {upcoming.length > 0 ? upcoming.map(event => (
              <EventCard key={event.id} event={event} />
            )) : <p className="text-gray-400 italic">No upcoming events for this date.</p>}
          </section>
        </div>

        {/* RIGHT COLUMN: CALENDAR */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 self-start">
          <div className="flex justify-between items-center mb-6">
            <button onClick={() => changeMonth(-1)}><ChevronLeft /></button>
            <h3 className="font-bold text-lg">
              {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
            </h3>
            <button onClick={() => changeMonth(1)}><ChevronRight /></button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-sm mb-2 text-gray-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }, (_, i) => {
              const day = i + 1;
              const month = String(currentDate.getMonth() + 1).padStart(2, '0');
              const dateStr = `${currentDate.getFullYear()}-${month}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`p-2 rounded-full transition ${
                    isSelected ? 'ring-2 ring-lime-400 font-bold' : 'hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-500 mb-2">{filteredEvents.length} events found</p>
            <button className="w-full bg-lime-400 py-2 rounded font-bold hover:bg-lime-500 transition">
              View Events
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

// Sub-component for Event Cards
const EventCard = ({ event, isActive }) => (
  <div className="flex items-center justify-between bg-white p-4 mb-3 rounded-lg shadow-sm border-l-8 border-lime-400">
    <div>
      <h4 className="font-bold text-lg">{event.title}</h4>
      <p className="text-sm text-gray-500">{event.type}</p>
    </div>
    {isActive && (
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider animate-pulse">
        Active Now
      </span>
    )}
  </div>
);

export default UserPage;