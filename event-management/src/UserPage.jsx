import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { MOCK_EVENTS, MOCK_USER } from "./mockData";
import { ThemeToggle } from "./ThemeContext";
import axios from "axios";

// ─── MOCK DATA & CONSTANTS ───────────────────────────────────────────────────
const CATEGORY_COLORS_MAP = {
  Technology: "text-[#818cf8] bg-[#818cf8]/10 border-[#818cf8]/20",
  Cultural: "text-[#f472b6] bg-[#f472b6]/10 border-[#f472b6]/20",
  Music: "text-[#f472b6] bg-[#f472b6]/10 border-[#f472b6]/20",
  Business: "text-[#fb923c] bg-[#fb923c]/10 border-[#fb923c]/20",
  Abstract: "text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── EVENT CARD ──────────────────────────────────────────────────────────────
const EventCard = ({ event, isActive }) => (
  <div
    className={`flex items-center justify-between bg-cardBg px-6 py-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${
      isActive
        ? "border-l-4 border-l-[#a3e635] border-t-[#1e1e22] border-r-[#1e1e22] border-b-[#1e1e22] hover:border-t-[#a3e635]/20 hover:border-r-[#a3e635]/20 hover:border-b-[#a3e635]/20"
        : "border-border border-l-4 border-l-[#2a2a2e] hover:border-[#a3e635]/20"
    }`}
  >
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${CATEGORY_COLORS_MAP[event.category] || "text-textMuted bg-[#1e1e22] border-themeBorder"}`}
        >
          {event.category}
        </span>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            event.type === "Free"
              ? "text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20"
              : "text-[#fb923c] bg-[#fb923c]/10 border-[#fb923c]/20"
          }`}
        >
          {event.type}
        </span>
      </div>
      <h4 className="font-bold text-main text-base mb-1">{event.title}</h4>
      <p className="text-sm text-muted">📍 {event.venue || event.venueName}</p>
    </div>

    {isActive && (
      <span className="flex items-center gap-1.5 text-[11px] font-bold text-themeAccent uppercase tracking-wider flex-shrink-0 ml-4">
        <span className="w-1.5 h-1.5 rounded-full bg-themeAccent animate-pulse" />
        Active Now
      </span>
    )}
  </div>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const UserPage = () => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Your Profile");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("http://localhost:9090/api/events");
        const data = response.data;
        setEvents(data.map(e => ({
          ...e,
          title: e.name || e.title,
          date: e.startDate || e.date
        })));
      } catch (error) {
        console.error("Backend offline, falling back to mock data", error);
        setEvents(MOCK_EVENTS.map(e => ({
          ...e,
          title: e.name || e.title,
          date: e.startDate || e.date
        })));
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:9090/api/users/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        })
        setUserName(res.data.name);
      } catch (error) {
        console.error("Error fetching profile", error);
        setUserName(MOCK_USER.name);
      }
    }
    fetchProfile();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const fmtDay = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Dates that have at least one event — for dot indicators
  const eventDateSet = useMemo(
    () => new Set(events.map((e) => e.date)),
    [events],
  );

  // Filter events by selected calendar date
  const filteredEvents = useMemo(
    () => events.filter((e) => e.date === selectedDate),
    [selectedDate, events],
  );

  return (
    <div className="min-h-screen bg-pageBg text-main font-sans">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-12 h-16 bg-pageBg/90 backdrop-blur-md border-b border-border">
        {/* Logo */}
        <button onClick={() => navigate("/")}>
          <span className="font-bold text-xl tracking-tight">
            Event<span className="text-themeAccent">Sphere</span>
          </span>
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-5">
          <ThemeToggle />

          {/* View Profile */}
          <Link
            to="/userprofile"
            className="flex items-center gap-2 text-textMuted hover:text-themeAccent transition-colors no-underline"
          >
            <UserCircle size={20} />
            <span className="text-sm font-medium">{userName}</span>
          </Link>

          {/* Events dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-cardBg border border-border rounded-xl px-4 py-2 text-sm text-textMuted hover:border-[#a3e635] hover:text-main transition-all"
            >
              Events <ChevronDown size={14} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-cardBg border border-border rounded-xl shadow-2xl z-10 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-textMuted hover:bg-[#1e1e22] hover:text-themeAccent transition-colors"
                >
                  <Link to="/events/ongoing">Ongoing Events</Link>
                </button>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-3 text-sm text-textMuted hover:bg-[#1e1e22] hover:text-themeAccent transition-colors"
                >
                  <Link to="/events/upcoming">Upcoming Events</Link>
                </button>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-3 text-sm text-[#a0a0ab] hover:bg-[#1e1e22] hover:text-[#a3e635] transition-colors"
                >
                  <Link to="/events/completed">Completed Events</Link>
                </button>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-3 text-sm text-[#a0a0ab] hover:bg-[#1e1e22] hover:text-[#a3e635] transition-colors"
                >
                  <Link to="/events">All Events</Link>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* ── LEFT: EVENT SECTIONS ──────────────────────────────────── */}
        <div className="lg:col-span-2">
          <header className="mb-10">
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight leading-tight">
              Your Events <span className="text-themeAccent">Dashboard</span>
            </h1>
            <p className="text-textMuted text-lg">Manage and explore your schedule at a glance.</p>
          </header>

          {/* Dynamic Schedule Section */}
          <section className="space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-[#111115]/30 border border-[#1e1e22] rounded-3xl">
                <div className="w-10 h-10 border-2 border-[#a3e635]/20 border-t-[#a3e635] rounded-full animate-spin mb-4" />
                <p className="text-center text-[#5a5a62] animate-pulse font-medium">
                  Syncing with EventSphere...
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-[#1e1e22] pb-4">
                  <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-white">
                    <span className="inline-block w-6 h-0.5 bg-[#a3e635] rounded-full" />
                    {selectedDate === todayStr ? "Today's Schedule" : `Schedule for ${new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                  </h2>
                  <span className="text-xs font-medium text-[#5a5a62] bg-[#111115] px-3 py-1 rounded-full border border-[#1e1e22]">
                    {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'}
                  </span>
                </div>

                {filteredEvents.length > 0 ? (
                  <div className="space-y-4">
                    {/* Show at max 5 events */}
                    {filteredEvents.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="cursor-pointer"
                      >
                        <EventCard 
                          event={event}
                          isActive={event.status === "ongoing" && selectedDate === todayStr}
                        />
                      </div>
                    ))}

                    {/* Show "View More" if there are more than 5 events */}
                    {filteredEvents.length > 5 && (
                      <button onClick={() => navigate("/events")}
                        className="w-full py-3 border border-dashed border-[#1e1e22] rounded-2xl text-sm hover:text-[#a3e635]/50 transition-all font-medium">
                        + See {filteredEvents.length - 5} more events for this day
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-[#111115]/50 border border-dashed border-[#1e1e22] rounded-3xl">
                    <div className="w-12 h-12 bg-[#1e1e22] rounded-full flex items-center justify-center mb-4 text-xl">
                      <span className="text-[#3a3a42]">📅</span>
                    </div>
                    <p className="text-[#a0a0ab] text-sm font-medium">
                      No events scheduled for this date.
                    </p>
                    {/* Only show Return to Today if the user is not on today's date */}
                    {selectedDate !== todayStr && (
                      <button onClick={() => {
                        setSelectedDate(todayStr);
                        setCurrentDate(new Date());
                      }}
                        className="mt-4 text-[#a3e635] text-xs font-bold uppercase tracking-widest hover:underline"
                      >
                        Return to Today
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* ── RIGHT: CALENDAR ───────────────────────────────────────── */}
        <div className="self-start sticky top-24">
          <div className="bg-cardBg border border-border rounded-2xl p-6 shadow-2xl">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e1e22] border border-themeBorder text-textMuted hover:border-[#a3e635] hover:text-main transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-main text-base">
                {MONTHS[month]} {year}
              </span>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e1e22] border border-themeBorder text-textMuted hover:border-[#a3e635] hover:text-main transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-[10px] font-semibold text-[#3a3a42] py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array(firstDay)
                .fill(null)
                .map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const ds = fmtDay(day);
                const isSelected = ds === selectedDate;
                const isToday = ds === todayStr;
                const hasEvent = eventDateSet.has(ds);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(ds)}
                    className={`relative w-full aspect-square rounded-lg text-xs transition-all ${
                      isSelected
                        ? "bg-themeAccent text-[#0c0c0f] font-bold"
                        : isToday
                          ? "bg-themeAccent/20 text-themeAccent ring-1 ring-themeAccent/40"
                          : "text-[#c0c0c8] hover:bg-[#1e1e22]"
                    }`}
                  >
                    {day}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-themeAccent" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-5 border-t border-border">
              <p className="text-xs text-muted mb-4">
                <span className="text-main font-bold">
                  {filteredEvents.length}
                </span>{" "}
                event{filteredEvents.length !== 1 ? "s" : ""} found
              </p>
              <button className="w-full bg-themeAccent text-[#0c0c0f] py-2.5 rounded-xl font-bold text-sm hover:bg-[#b8f056] transition-all">
                View Events
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserPage;