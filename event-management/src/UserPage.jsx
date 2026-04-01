import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  UserCircle,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "./ThemeContext";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const EVENT_DATA = [
  {
    id: 1,
    title: "Tech Innovators Conference",
    type: "Paid",
    category: "Technology",
    date: "2026-03-26",
    status: "ongoing",
    venue: "NSCI Dome, Mumbai",
  },
  {
    id: 2,
    title: "Global Culture Fest - Day 1",
    type: "Free",
    category: "Cultural",
    date: "2026-03-26",
    status: "ongoing",
    venue: "Nehru Centre, Worli",
  },
  {
    id: 3,
    title: "Summer Music Jam",
    type: "Paid",
    category: "Music",
    date: "2026-03-28",
    status: "upcoming",
    venue: "Bandra Fort Grounds",
  },
  {
    id: 4,
    title: "Sci-Fi VR Experience",
    type: "Free",
    category: "Abstract",
    date: "2026-03-31",
    status: "upcoming",
    venue: "Phoenix Palladium",
  },
  {
    id: 5,
    title: "Startup Pitch Night",
    type: "Free",
    category: "Business",
    date: "2026-04-05",
    status: "upcoming",
    venue: "WeWork BKC",
  },
];

const CATEGORY_COLORS_MAP = {
  Technology: "text-[#818cf8] bg-[#818cf8]/10 border-[#818cf8]/20",
  Cultural: "text-[#f472b6] bg-[#f472b6]/10 border-[#f472b6]/20",
  Music: "text-[#f472b6] bg-[#f472b6]/10 border-[#f472b6]/20",
  Business: "text-[#fb923c] bg-[#fb923c]/10 border-[#fb923c]/20",
  Abstract: "text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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
      <p className="text-sm text-muted">📍 {event.venue}</p>
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const fmtDay = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Dates that have at least one event — for dot indicators
  const eventDateSet = useMemo(
    () => new Set(EVENT_DATA.map((e) => e.date)),
    [],
  );

  // Filter events by selected calendar date
  const filteredEvents = useMemo(
    () => EVENT_DATA.filter((e) => e.date === selectedDate),
    [selectedDate],
  );

  const ongoing = filteredEvents.filter((e) => e.status === "ongoing");
  const upcoming = filteredEvents.filter((e) => e.status === "upcoming");

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
            <span className="text-sm font-medium">View Profile</span>
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
                  Ongoing Events
                </button>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-3 text-sm text-textMuted hover:bg-[#1e1e22] hover:text-themeAccent transition-colors"
                >
                  Upcoming Events
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
          <h1 className="text-5xl font-extrabold mb-10 tracking-tight leading-tight">
            Your Events <span className="text-themeAccent">Dashboard</span>
          </h1>

          {/* Ongoing Events */}
          <section className="mb-10">
            <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-main mb-5">
              <span className="inline-block w-6 h-0.5 bg-themeAccent rounded-full" />
              Ongoing Events
            </h2>

            {ongoing.length > 0 ? (
              <div className="space-y-3">
                {ongoing.map((event) => (
                  <EventCard key={event.id} event={event} isActive />
                ))}
              </div>
            ) : (
              <div className="bg-cardBg border border-border rounded-2xl px-6 py-5">
                <p className="text-[#3a3a42] text-sm italic">
                  No ongoing events for this date.
                </p>
              </div>
            )}
          </section>

          {/* Upcoming Events */}
          <section>
            <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-main mb-5">
              <span className="inline-block w-6 h-0.5 bg-themeAccent rounded-full" />
              Upcoming Events
            </h2>

            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="bg-cardBg border border-border rounded-2xl px-6 py-5">
                <p className="text-[#3a3a42] text-sm italic">
                  No upcoming events for this date.
                </p>
              </div>
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
