import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Clock, Tag, ArrowRight } from "lucide-react";
import { MOCK_EVENTS } from "./mockData";
import { ThemeToggle } from "./ThemeContext";

const API = "http://localhost:9090";

// ─── Event Card ───────────────────────────────────────────────────────────────
const EventCard = ({ event, onClick }) => {
  const statusStyle = {
    ongoing:   { badge: "bg-foreground text-[#C4F249]", bar: "bg-[#C4F249]" },
    upcoming:  { badge: "bg-[#C4F249] text-black",      bar: "bg-foreground" },
    completed: { badge: "bg-surface border border-border text-muted", bar: "bg-border" },
  }[event.status] || { badge: "bg-surface border border-border text-muted", bar: "bg-border" };

  const avgRating = event.feedbacks?.length
    ? (
        event.feedbacks.reduce((s, f) => s + f.rating, 0) /
        event.feedbacks.length
      ).toFixed(1)
    : null;

  const ctaLabel =
    {
      ongoing:   "View Details →",
      upcoming:  event.type === "Paid" ? "Buy Ticket →" : "Register →",
      completed: "Feedback →",
    }[event.status] || "View →";

  return (
    <div
      onClick={onClick}
      className="bg-surface cursor-pointer group border border-border hover:border-foreground hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className={`h-1 w-full ${statusStyle.bar}`} />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-xl font-bold text-foreground group-hover:opacity-70 transition leading-tight">
            {event.name}
          </h3>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wide ${statusStyle.badge}`}>
              {event.status}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 ${
                event.type === "Paid"
                  ? "bg-foreground text-[#C4F249]"
                  : "bg-[#C4F249] text-black"
              }`}
            >
              {event.type}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted leading-relaxed mb-4 line-clamp-2 flex-1">
          {event.description}
        </p>

        <div className="flex flex-wrap gap-3 text-xs text-muted mb-4">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(event.startDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {event.time}
          </span>
          <span className="flex items-center gap-1">
            <Tag size={12} />
            {event.duration}h
          </span>
          {avgRating && <span>⭐ {avgRating}</span>}
        </div>

        <div className="pt-3 border-t border-border flex justify-between items-center">
          <span className="text-xs text-muted font-mono">{event.id}</span>
          <span className="text-xs font-bold text-foreground group-hover:opacity-60 transition">
            {ctaLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = ({ title, subtitle, events, accentColor, onCardClick, viewAllPath, navigate }) => (
  <section className="mb-16">
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-4xl font-bold" style={{ color: accentColor }}>
          {title}
        </h2>
        <p className="text-muted text-sm mt-1">{subtitle}</p>
      </div>
      {viewAllPath && events.length >= 3 && (
        <button
          onClick={() => navigate(viewAllPath)}
          className="flex items-center gap-1.5 text-sm font-bold border-b-2 border-foreground text-foreground hover:opacity-60 transition pb-0.5"
        >
          View All <ArrowRight size={14} />
        </button>
      )}
    </div>
    {events.length === 0 ? (
      <div className="bg-surface border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted">No {title.toLowerCase()} right now</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.slice(0, 3).map((e) => (
          <EventCard key={e.id} event={e} onClick={() => onCardClick(e.id)} />
        ))}
      </div>
    )}
  </section>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const EventsPage = () => {
  const navigate = useNavigate();
  const [allEvents,     setAllEvents]     = useState([]);
  const [search,        setSearch]        = useState("");
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/api/events`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        if (!res.ok) throw new Error("Backend returned an error");

        const json = await res.json();
        const mappedEvents = (json.data || []).map((e) => ({
          id:          e.eventId,
          title:       e.eventName,
          name:        e.eventName,
          date:        e.eventStartDate,
          startDate:   e.eventStartDate,
          endDate:     e.eventEndDate,
          time:        e.eventTime,
          duration:    e.eventDuration,
          status:      e.eventStatus?.toLowerCase(),
          type:        e.eventType,
          category:    e.category,
          feedbacks:   e.feedbacks || [],
          venue:       e.programmes?.[0]?.venueName     || "Venue TBA",
          attendees:   0,
          capacity:    e.programmes?.[0]?.venueCapacity || 0,
        }));

        setAllEvents(mappedEvents);
        setBackendOnline(true);
      } catch (error) {
        console.error("Backend offline, falling back to mock data:", error);
        setAllEvents(MOCK_EVENTS);
        setBackendOnline(false);
      }
    };

    fetchAllEvents();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = search.trim()
    ? allEvents.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allEvents;

  const ongoing   = filtered.filter((e) => e.status === "ongoing");
  const upcoming  = filtered.filter(
    (e) => e.status === "upcoming" && new Date(e.startDate) > today,
  );
  const completed = filtered.filter((e) => e.status === "completed");

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-lime-200">

      {/* ── Nav ── */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

        {/* Logo — two-tone, matches LandingPage */}
        <button
          onClick={() => navigate("/user")}
          className="text-lg font-bold tracking-tight hover:opacity-80 transition"
        >
          <span className="text-foreground">Event</span>
          <span className="text-[#C4F249]">Sphere</span>
        </button>

        <div className="flex items-center gap-5">
          <ThemeToggle />
          <button
            onClick={() => navigate("/events/ongoing")}
            className="text-sm font-medium text-muted hover:text-foreground transition"
          >
            Ongoing
          </button>
          <button
            onClick={() => navigate("/events/upcoming")}
            className="text-sm font-medium text-muted hover:text-foreground transition"
          >
            Upcoming
          </button>
          <button
            onClick={() => {
              const r = localStorage.getItem("role") || "user";
              navigate(r === "organiser" ? "/organiserprofile" : "/userprofile");
            }}
            className="text-sm font-medium text-muted hover:text-foreground transition"
          >
            My Profile
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-foreground text-[#C4F249] text-sm font-semibold px-4 py-1.5 hover:opacity-80 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-10">
        <h1 className="text-[#C4F249] text-6xl md:text-7xl font-normal leading-[1.1] tracking-tight mb-4">
          Events
        </h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-muted text-sm">
            {ongoing.length} ongoing · {upcoming.length} upcoming ·{" "}
            {completed.length} completed
            {!backendOnline && (
              <span className="ml-3 text-yellow-600 text-xs">
                ⚠ Mock data — backend offline
              </span>
            )}
          </p>

          {/* Search */}
          <div className="relative max-w-sm w-full">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-border bg-surface text-foreground text-sm focus:outline-none focus:border-foreground transition placeholder:text-muted"
            />
          </div>
        </div>
      </div>

      {/* ── Three sections ── */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <Section
          title="Ongoing Events"
          subtitle="Happening right now"
          events={ongoing}
          accentColor="#C4F249"
          onCardClick={(id) => navigate(`/events/${id}`)}
          viewAllPath="/events/ongoing"
          navigate={navigate}
        />
        <Section
          title="Upcoming Events"
          subtitle="Register early — limited seats"
          events={upcoming}
          accentColor="var(--color-foreground)"
          onCardClick={(id) => navigate(`/events/${id}`)}
          viewAllPath="/events/upcoming"
          navigate={navigate}
        />
        <Section
          title="Completed Events"
          subtitle="Past events — leave your feedback"
          events={completed}
          accentColor="var(--color-muted)"
          onCardClick={(id) => navigate(`/events/${id}`)}
          viewAllPath="/events/completed"
          navigate={navigate}
        />
      </div>
    </div>
  );
};

export default EventsPage;