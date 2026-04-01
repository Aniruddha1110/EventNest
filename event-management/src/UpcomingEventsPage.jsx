import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Tag, ArrowLeft, Users } from "lucide-react";
import { MOCK_EVENTS } from "./mockData";

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
        const res = await fetch(`${API}/api/events?status=upcoming`);
        if (!res.ok) throw new Error();
        setEvents(await res.json());
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
    <div className="min-h-screen bg-[#F9F9F9] font-sans selection:bg-lime-200">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <button
          onClick={() => navigate("/user")}
          className="bg-black text-main text-sm font-bold px-3 py-1.5 tracking-wide hover:opacity-90 transition"
        >
          EventSphere
        </button>
        <button
          onClick={() => navigate("/events")}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={15} /> All Events
        </button>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-10">
        <h1 className="text-black text-6xl md:text-7xl font-normal leading-[1.1] tracking-tight mb-2">
          Upcoming
          <br />
          <span className="text-[#C4F249]">Events</span>
        </h1>
        <p className="text-gray-400 text-sm mt-3">
          {events.length} event{events.length !== 1 ? "s" : ""} coming up — book
          your spot early
          {!backendOnline && (
            <span className="ml-3 text-yellow-600">⚠ Mock data</span>
          )}
        </p>
      </div>

      {/* Filter pills */}
      <div className="max-w-7xl mx-auto px-6 mb-8 flex gap-3">
        {[
          ["all", "All Events"],
          ["free", "Free Only"],
          ["paid", "Paid Only"],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => {
              setFilter(val);
              setPage(1);
            }}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wide transition ${filter === val ? "bg-black text-[#C4F249]" : "bg-white border border-gray-200 text-gray-500 hover:border-black"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {pageEvents.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 py-24 text-center">
            <p className="text-gray-400">
              No upcoming events matching your filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            {pageEvents.map((event) => {
              const totalSeats =
                event.programmes?.reduce((s, p) => s + (p.seatsLeft || 0), 0) ||
                0;
              const minPrice =
                event.type === "Paid"
                  ? Math.min(...(event.programmes?.map((p) => p.price) || [0]))
                  : 0;
              const countdown = daysUntil(event.startDate);

              return (
                <div
                  key={event.id}
                  className="bg-white border border-gray-100 hover:border-black hover:shadow-xl transition-all overflow-hidden group"
                >
                  <div className="h-1 bg-black" />
                  <div className="p-6">
                    {/* Countdown chip */}
                    <div className="inline-flex items-center gap-1.5 bg-[#C4F249] text-black text-xs font-bold px-2.5 py-1 mb-3">
                      🗓 {countdown}
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-xl font-bold text-black group-hover:opacity-70 transition">
                        {event.name}
                      </h3>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 shrink-0 ${event.type === "Paid" ? "bg-black text-[#C4F249]" : "bg-[#C4F249] text-black"}`}
                      >
                        {event.type}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-4">
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
                          key={p.id}
                          className="flex justify-between items-center text-xs py-1 border-b border-gray-50"
                        >
                          <span className="text-gray-600 truncate">
                            {p.name}
                          </span>
                          <span className="font-bold text-black ml-2 shrink-0">
                            {event.type === "Paid" ? `₹${p.price}` : "Free"}
                          </span>
                        </div>
                      ))}
                      {(event.programmes?.length || 0) > 2 && (
                        <p className="text-xs text-gray-400">
                          + {event.programmes.length - 2} more programme
                          {event.programmes.length - 2 > 1 ? "s" : ""}
                        </p>
                      )}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center gap-3">
                      {event.type === "Paid" && (
                        <div>
                          <p className="text-xs text-gray-400">Starting from</p>
                          <p className="text-xl font-bold text-black">
                            ₹{minPrice}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${event.id}`);
                        }}
                        className={`flex-1 py-3 font-bold text-sm transition active:scale-95 ${event.type === "Paid" ? "bg-black text-[#C4F249] hover:opacity-80" : "bg-[#C4F249] text-black hover:opacity-90"}`}
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

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-200 text-sm font-medium disabled:opacity-30 hover:border-black transition"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 text-sm font-bold transition ${page === p ? "bg-black text-[#C4F249]" : "border border-gray-200 text-gray-600 hover:border-black"}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-200 text-sm font-medium disabled:opacity-30 hover:border-black transition"
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
