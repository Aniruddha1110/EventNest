import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, UserCircle, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeContext";
import axios from "axios";
import { MOCK_EVENTS, MOCK_USER } from "./mockData";

// ─── CALENDAR HELPERS ────────────────────────────────────────────────────────
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── MOCK EVENT DATA ─────────────────────────────────────────────────────────
const EVENT_DATA = [
  { id: 1, title: "TechConf 2026", category: "Technology", type: "Paid", date: "2026-03-27", status: "ongoing", venue: "NSCI Dome, Mumbai", capacity: 320, attendees: 249 },
  { id: 2, title: "Indie Music Night", category: "Music", type: "Paid", date: "2026-04-12", status: "upcoming", venue: "Bandra Fort Grounds", capacity: 500, attendees: 321 },
  { id: 3, title: "AI & Future Summit", category: "Technology", type: "Paid", date: "2026-04-05", status: "upcoming", venue: "JW Marriott, BKC", capacity: 200, attendees: 0 },
];

const CATEGORY_COLORS = {
  Technology: "text-[#818cf8] bg-[#818cf8]/10 border-[#818cf8]/20",
  Music: "text-[#f472b6] bg-[#f472b6]/10 border-[#f472b6]/20",
  Business: "text-[#fb923c] bg-[#fb923c]/10 border-[#fb923c]/20",
  Abstract: "text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20",
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const OrganiserPage = () => {
  const todayStr = getTodayStr();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // const [showCreate, setShowCreate] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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


  const fmtDay = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const eventDateSet = useMemo(() => new Set(events.map((e) => e.date)), [events]);

  const filteredEvents = useMemo(
    () => events.filter((e) => e.date === selectedDate),
    [selectedDate, events]
  );

  const [userName, setUserName] = useState("Your Profile");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:9090/api/organiser/profile", {
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


  // const ongoing = filteredEvents.filter((e) => e.status === "ongoing");
  // const upcoming = filteredEvents.filter((e) => e.status === "upcoming");

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white font-sans">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-12 h-16 bg-[#0c0c0f]/90 backdrop-blur-md border-b border-[#1e1e22]">

        <button onClick={() => navigate("/")}>
          <span className="font-bold text-xl tracking-tight">
            Event<span className="text-[#a3e635]">Sphere</span>
          </span>
        </button>

        <div className="flex items-center gap-5">
          <ThemeToggle />

          {/* View Profile */}
          <Link
            to="/organiserprofile"
            className="flex items-center gap-2 text-[#a0a0ab] hover:text-[#a3e635] transition-colors no-underline"
          >
            <UserCircle size={20} />
            <span className="text-sm font-medium">{userName}</span>
          </Link>

          {/* Create Event button */}
          <button
            onClick={() => navigate("/events/create")}
            // onClick={() => setShowCreate(true)}
            className="bg-[#a3e635] text-[#0c0c0f] font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#b8f056] transition-all"
          >
            + Create New Event
          </button>

          {/* Events dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-[#111115] border border-[#1e1e22] rounded-xl px-4 py-2 text-sm text-[#a0a0ab] hover:border-[#a3e635] hover:text-white transition-all"
            >
              Events <ChevronDown size={14} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#131317] border border-[#1e1e22] rounded-xl shadow-2xl z-10 overflow-hidden">
                <button onClick={() => { setSelectedDate(todayStr); setIsDropdownOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-[#a0a0ab] hover:bg-[#1e1e22] hover:text-[#a3e635] transition-colors">
                  <Link to="/events/ongoing">Ongoing Events</Link>
                </button>
                <button onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-3 text-sm text-[#a0a0ab] hover:bg-[#1e1e22] hover:text-[#a3e635] transition-colors">
                  <Link to="/events/upcoming">Upcoming Events</Link>
                </button>
                <button onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-3 text-sm text-[#a0a0ab] hover:bg-[#1e1e22] hover:text-[#a3e635] transition-colors">
                  <Link to="/events/completed">Completed Events</Link>
                </button>
                <button onClick={() => setIsDropdownOpen(false)}
                  className="w-full text-left px-4 py-3 text-sm text-[#a0a0ab] hover:bg-[#1e1e22] hover:text-[#a3e635] transition-colors">
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
          <h1 className="text-5xl font-extrabold mb-10 tracking-tight leading-tight">
            Welcome <span className="text-[#a3e635]">Organisers</span>
          </h1>

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
                <div className="flex items-center justify-between border-b border-[#1e1e22] pd-4">
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
                        <EventCard key={event.id}
                          event={event}
                          isActive={event.status === "ongoing" && selectedDate === todayStr}
                        />
                      </div>
                    ))}

                    {/* Show "View More" if there are more than 5 events */}
                    {filteredEvents.length > 5 && (
                      <button onClick={() => navigate("/events")}
                        className="w-full py-3 border border-dashed border-[#1e1e22] rounder-2xl text-sm hover:text-[#a3e635]/50 transition-all font-medium">+ See {filteredEvents.length - 5} more events for this day</button>
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

          {/* Ongoing Events */}
          {/*<section className="mb-10">
            <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-white mb-5">
              <span className="inline-block w-6 h-0.5 bg-[#a3e635] rounded-full" />
              Ongoing Events (Latest 5)
            </h2>

            {ongoing.length > 0 ? (
              <div className="space-y-3">
                {ongoing.map((event) => (
                  <EventCard key={event.id} event={event} isActive />
                ))}
              </div>
            ) : (
              <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl px-6 py-5">
                <p className="text-[#3a3a42] text-sm italic">No active events found.</p>
              </div>
            )}
          </section>

          { Upcoming Events }
          <section className="mb-10">
            <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-white mb-5">
              <span className="inline-block w-6 h-0.5 bg-[#a3e635] rounded-full" />
              Upcoming Events
            </h2>

            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl px-6 py-5">
                <p className="text-[#3a3a42] text-sm italic">No upcoming events for this date.</p>
              </div>
            )}
          </section> */}

          {/* Create New Event CTA */}
          <button
            onClick={() => navigate("/events/create")}
            // onClick={() => setShowCreate(true)}
            className="bg-[#a3e635] text-[#0c0c0f] font-extrabold text-sm px-8 py-4 rounded-xl hover:bg-[#b8f056] transition-all"
          >
            + CREATE NEW EVENT
          </button>
        </div>

        {/* ── RIGHT: CALENDAR ───────────────────────────────────────── */}
        <div className="self-start sticky top-24">
          <div className="bg-[#131317] border border-[#1e1e22] rounded-2xl p-6 shadow-2xl">

            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e1e22] border border-[#2a2a2e] text-[#a0a0ab] hover:border-[#a3e635] hover:text-white transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-white text-base">{MONTHS[month]} {year}</span>
              <button
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e1e22] border border-[#2a2a2e] text-[#a0a0ab] hover:border-[#a3e635] hover:text-white transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-[10px] font-semibold text-[#3a3a42] py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array(firstDay).fill(null).map((_, i) => <div key={`blank-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const ds = fmtDay(day);
                const isSelected = ds === selectedDate;
                const isToday = ds === todayStr;
                const hasEvent = eventDateSet.has(ds);
                return (
                  <button key={day} onClick={() => setSelectedDate(ds)}
                    className={`relative w-full aspect-square rounded-lg text-xs transition-all ${isSelected ? "bg-[#a3e635] text-[#0c0c0f] font-bold"
                      : isToday ? "bg-[#1a2c0a] text-[#a3e635] ring-1 ring-[#a3e635]/40"
                        : "text-[#c0c0c8] hover:bg-[#1e1e22]"
                      }`}>
                    {day}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#a3e635]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-5 border-t border-[#1e1e22]">
              <p className="text-xs text-[#5a5a62] mb-4">
                <span className="text-white font-bold">{filteredEvents.length}</span>{" "}
                event{filteredEvents.length !== 1 ? "s" : ""} found
              </p>
              <button className="w-full bg-[#a3e635] text-[#0c0c0f] py-2.5 rounded-xl font-bold text-sm hover:bg-[#b8f056] transition-all">
                View Events
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── CREATE EVENT MODAL ───────────────────────────────────────── */}
      {/* {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setShowCreate(false)}>
          <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl p-8 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#a3e635] mb-1">New Event</p>
                <h2 className="text-xl font-extrabold text-white">Create Event</h2>
              </div>
              <button onClick={() => setShowCreate(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e1e22] text-[#6a6a72] hover:text-white transition-colors font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: "Event Title", placeholder: "e.g. TechConf 2026", type: "text" },
                { label: "Venue", placeholder: "e.g. NSCI Dome, Mumbai", type: "text" },
                { label: "Date", placeholder: "", type: "date" },
                { label: "Time", placeholder: "", type: "time" },
              ].map(({ label, placeholder, type }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-[#5a5a62] uppercase tracking-wider mb-2">{label}</label>
                  <input type={type} placeholder={placeholder}
                    className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#a3e635] transition-colors" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5a5a62] uppercase tracking-wider mb-2">Capacity</label>
                  <input type="number" placeholder="e.g. 300"
                    className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#a3e635] transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5a5a62] uppercase tracking-wider mb-2">Price</label>
                  <input type="text" placeholder="e.g. ₹499 or Free"
                    className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#a3e635] transition-colors" />
                </div>
              </div>
              <div>
                 <label className="block text-xs font-semibold text-[#5a5a62] uppercase tracking-wider mb-2">Description</label>
                <textarea rows={3} placeholder="What's this event about?"
                  className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#a3e635] transition-colors resize-none" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 border border-[#2a2a2e] text-[#a0a0ab] font-semibold text-sm py-3 rounded-xl hover:border-[#a3e635] hover:text-[#a3e635] transition-all">
                Cancel
              </button>
              <button className="flex-1 bg-[#a3e635] text-[#0c0c0f] font-bold text-sm py-3 rounded-xl hover:bg-[#b8f056] transition-all">
                Submit for Review →
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

// ─── EVENT CARD ──────────────────────────────────────────────────────────────
const EventCard = ({ event, isActive }) => {
  const pct = event.capacity > 0 ? Math.round((event.attendees / event.capacity) * 100) : 0;
  return (
    <div className={`flex items-center justify-between bg-[#111115] px-6 py-4 rounded-2xl border transition-all hover:-translate-y-0.5 ${isActive
      ? "border-l-4 border-l-[#a3e635] border-t-[#1e1e22] border-r-[#1e1e22] border-b-[#1e1e22]"
      : "border-[#1e1e22] border-l-4 border-l-[#2a2a2e] hover:border-[#a3e635]/20"
      }`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[event.category] || "text-[#a0a0ab] bg-[#1e1e22] border-[#2a2a2e]"}`}>
            {event.category}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${event.type === "Free" ? "text-[#34d399] bg-[#34d399]/10 border-[#34d399]/20" : "text-[#fb923c] bg-[#fb923c]/10 border-[#fb923c]/20"
            }`}>
            {event.type}
          </span>
        </div>
        <h4 className="font-bold text-white text-base mb-1">{event.title}</h4>
        <p className="text-sm text-[#5a5a62] mb-2">📍 {event.venue}</p>
        {event.attendees > 0 && (
          <div className="flex items-center gap-3">
            <div className="w-32 h-1.5 bg-[#1e1e22] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${pct >= 90 ? "bg-[#ef4444]" : pct >= 70 ? "bg-[#fb923c]" : "bg-[#a3e635]"}`}
                style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-[#5a5a62]">{event.attendees}/{event.capacity} attendees</span>
          </div>
        )}
      </div>
      {isActive && (
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#a3e635] uppercase tracking-wider flex-shrink-0 ml-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse" />
          Active Now
        </span>
      )}
    </div>
  );
};

export default OrganiserPage;