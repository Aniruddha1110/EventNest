import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Tag, ArrowLeft, Users } from "lucide-react";
import { MOCK_EVENTS } from "./mockData";
import { ThemeToggle } from "./ThemeContext";

const API = "http://localhost:9090";
const PER_PAGE = 6;

const UpcomingEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all"); // "all" | "free" | "paid"
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/api/events?status=upcoming`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        const mapped = (json.data || []).map((e) => ({
          id:          e.eventId,
          name:        e.eventName,
          startDate:   e.eventStartDate,
          endDate:     e.eventEndDate,
          time:        e.eventTime,
          duration:    e.eventDuration,
          description: e.eventDescription,
          status:      e.eventStatus,
          type:        e.eventType,
          category:    e.category,
          programmes: (e.programmes || []).map((p) => ({
            programmeId:   p.programmeId,
            programmeName: p.programmeName,
            price:         p.price    ?? 0,
            seatsLeft:     p.seatsLeft ?? 0,
          })),
          feedbacks: e.feedbacks || [],
        }));
        setEvents(mapped);
        setBackendOnline(true);
      } catch {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setEvents(
          MOCK_EVENTS.filter(
            (e) => e.status === "upcoming" && new Date(e.startDate) > today,
          ),
        );
      }
    })();
  }, []);

  const filtered =
    filter === "all"
      ? events
      : events.filter((e) => e.type.toLowerCase() === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageEvents = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const daysUntil = (dateStr) => {
    const diff = Math.ceil(
      (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24),
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `In ${diff} days`;
  };

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

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => navigate("/events")}
            className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition"
          >
            <ArrowLeft size={15} /> All Events
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-10">
        <h1 className="text-foreground text-6xl md:text-7xl font-normal leading-[1.1] tracking-tight mb-2">
          Upcoming
          <br />
          <span className="text-[#C4F249]">Events</span>
        </h1>
        <p className="text-muted text-sm mt-3">
          {events.length} event{events.length !== 1 ? "s" : ""} coming up — book
          your spot early
          {!backendOnline && (
            <span className="ml-3 text-yellow-600">⚠ Mock data</span>
          )}
        </p>
      </div>

      {/* ── Filter pills ── */}
      <div className="max-w-7xl mx-auto px-6 mb-8 flex gap-3">
        {[
          ["all",  "All Events"],
          ["free", "Free Only"],
          ["paid", "Paid Only"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => {
              setFilter(val);
              setPage(1);
            }}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wide transition ${
              filter === val
                ? "bg-foreground text-[#C4F249]"
                : "bg-surface border border-border text-muted hover:border-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {pageEvents.length === 0 ? (
          <div className="bg-surface border border-dashed border-border py-24 text-center">
            <p className="text-muted">No upcoming events matching your filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            {pageEvents.map((event) => {
              const totalSeats =
                event.programmes?.reduce((s, p) => s + (p.seatsLeft || 0), 0) || 0;
              const minPrice =
                event.type === "Paid"
                  ? Math.min(...(event.programmes?.map((p) => p.price) || [0]))
                  : 0;
              const countdown = daysUntil(event.startDate);

              return (
                <div
                  key={event.id}
                  className="bg-surface border border-border hover:border-foreground hover:shadow-xl transition-all overflow-hidden group"
                >
                  <div className="h-1 bg-foreground" />
                  <div className="p-6">

                    {/* Countdown chip */}
                    <div className="inline-flex items-center gap-1.5 bg-[#C4F249] text-black text-xs font-bold px-2.5 py-1 mb-3">
                      🗓 {countdown}
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-xl font-bold text-foreground group-hover:opacity-70 transition">
                        {event.name}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 shrink-0 ${
                          event.type === "Paid"
                            ? "bg-foreground text-[#C4F249]"
                            : "bg-[#C4F249] text-black"
                        }`}
                      >
                        {event.type}
                      </span>
                    </div>

                    <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-4">
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
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {totalSeats.toLocaleString()} seats left
                      </span>
                    </div>

                    {/* Programmes mini-list */}
                    <div className="mb-4 space-y-1">
                      {(event.programmes || []).slice(0, 2).map((p) => (
                        <div
                          key={p.programmeId}
                          className="flex justify-between items-center text-xs py-1 border-b border-border"
                        >
                          <span className="text-muted truncate">
                            {p.programmeName}
                          </span>
                          <span className="font-bold text-foreground ml-2 shrink-0">
                            {event.type === "Paid" ? `₹${p.price}` : "Free"}
                          </span>
                        </div>
                      ))}
                      {(event.programmes?.length || 0) > 2 && (
                        <p className="text-xs text-muted">
                          + {event.programmes.length - 2} more programme
                          {event.programmes.length - 2 > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center gap-3">
                      {event.type === "Paid" && (
                        <div>
                          <p className="text-xs text-muted">Starting from</p>
                          <p className="text-xl font-bold text-foreground">
                            ₹{minPrice}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${event.id}`);
                        }}
                        className={`flex-1 py-3 font-bold text-sm transition active:scale-95 ${
                          event.type === "Paid"
                            ? "bg-foreground text-[#C4F249] hover:opacity-80"
                            : "bg-[#C4F249] text-black hover:opacity-90"
                        }`}
                      >
                        {event.type === "Paid" ? "Buy Ticket" : "Register Free"}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-border text-sm font-medium text-muted disabled:opacity-30 hover:border-foreground hover:text-foreground transition"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 text-sm font-bold transition ${
                  page === p
                    ? "bg-foreground text-[#C4F249]"
                    : "border border-border text-muted hover:border-foreground hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-border text-sm font-medium text-muted disabled:opacity-30 hover:border-foreground hover:text-foreground transition"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEventsPage;