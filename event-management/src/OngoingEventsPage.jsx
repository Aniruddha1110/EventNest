import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Tag, ArrowLeft, ArrowRight } from "lucide-react";
import { MOCK_EVENTS } from "./mockData";
import { useTheme, ThemeToggle } from "./ThemeContext";

const API = "http://localhost:9090";
const PER_PAGE = 6;

const OngoingEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API}/api/events?status=ongoing`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        const mapped = (json.data || []).map((e) => ({
          id:           e.eventId,
          name:         e.eventName,
          startDate:    e.eventStartDate,
          endDate:      e.eventEndDate,
          time:         e.eventTime,
          duration:     e.eventDuration,
          description:  e.eventDescription,
          status:       e.eventStatus,
          type:         e.eventType  || "Free",
          category:     e.category   || "Cultural",
          organiserName: (e.programmes && e.programmes[0]?.organiserName) || "—",
          programmes:   e.programmes || [],
          feedbacks:    e.feedbacks  || [],
        }));
        setEvents(mapped);
        setBackendOnline(true);
      } catch {
        setEvents(MOCK_EVENTS.filter((e) => e.status === "ongoing"));
      }
    })();
  }, []);

  const totalPages = Math.max(1, Math.ceil(events.length / PER_PAGE));
  const pageEvents = events.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
        {/* Live indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C4F249] animate-pulse" />
          <span className="text-xs font-bold text-muted uppercase tracking-widest">
            Live Now
          </span>
        </div>
        <h1 className="text-[#C4F249] text-6xl md:text-7xl font-normal leading-[1.1] tracking-tight mb-2">
          Ongoing Events
        </h1>
        <p className="text-muted text-sm">
          {events.length} event{events.length !== 1 ? "s" : ""} happening right
          now
          {!backendOnline && (
            <span className="ml-3 text-yellow-600">⚠ Mock data</span>
          )}
        </p>
      </div>

      {/* ── Notice banner ── */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="bg-foreground text-[#C4F249] px-5 py-3 flex items-center gap-3 text-sm">
          <span className="font-bold">ℹ</span>
          <span>
            Ongoing events are currently in progress. Ticket purchasing is{" "}
            <strong>not available</strong> for ongoing events — you can only
            view details.
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {pageEvents.length === 0 ? (
          <div className="bg-surface border border-dashed border-border py-24 text-center">
            <p className="text-muted">No ongoing events at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            {pageEvents.map((event) => {
              const progCount = event.programmes?.length || 0;
              const totalSeats =
                event.programmes?.reduce((s, p) => s + (p.seatsLeft || 0), 0) || 0;

              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="bg-surface cursor-pointer group border border-border hover:border-[#C4F249] hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="h-1 bg-[#C4F249]" />
                  <div className="p-6">

                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-xl font-bold text-foreground group-hover:opacity-70 transition">
                        {event.name}
                      </h3>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <span className="bg-foreground text-[#C4F249] text-xs font-bold px-2.5 py-1 uppercase">
                          Live
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

                    <p className="text-sm text-muted leading-relaxed line-clamp-2 mb-4">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-muted mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(event.startDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        →{" "}
                        {new Date(event.endDate).toLocaleDateString("en-IN", {
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
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-background p-2 text-center border border-border">
                        <p className="text-xs text-muted mb-0.5">Programmes</p>
                        <p className="font-bold text-foreground">{progCount}</p>
                      </div>
                      <div className="bg-background p-2 text-center border border-border">
                        <p className="text-xs text-muted mb-0.5">Organiser</p>
                        <p className="font-bold text-foreground text-xs truncate">
                          {event.organiserName}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex justify-between items-center">
                      <span className="text-xs text-muted font-mono">
                        {event.id}
                      </span>
                      <span className="text-xs font-bold text-foreground group-hover:opacity-60 transition">
                        View Details →
                      </span>
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

export default OngoingEventsPage;