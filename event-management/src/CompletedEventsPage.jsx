import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Tag,
  ArrowLeft,
  Star,
  MessageSquare,
  Users,
} from "lucide-react";
import { MOCK_EVENTS } from "./mockData";
import { ThemeToggle } from "./ThemeContext";

const API = "http://localhost:9090";
const PER_PAGE = 9;

const CompletedEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [backendOnline, setBackendOnline] = useState(false);

  // CompletedEventsPage.jsx

useEffect(() => {
  const fetchCompletedEvents = async () => {
    try {
      // 1. Retrieve the JWT token
      const token = localStorage.getItem("token");
      
      // 2. Add Authorization header to the fetch call
      const res = await fetch(`${API}/api/events?status=completed`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const json = await res.json();

      // 3. Map Backend EventResponse to Frontend State
      // json.data contains the list of EventResponse objects
      const mapped = (json.data || []).map(e => ({
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
        organiserName: (e.programmes && e.programmes[0]?.organiserName) || "—", // Added mapping for organiserName
        programmes:  e.programmes || [],
        feedbacks:   e.feedbacks  || [],
      }));

      setEvents(mapped);
      setBackendOnline(true);
    } catch (err) {
      console.error("Backend fetch failed:", err);
      setBackendOnline(false);
      
      // Optional: Only fallback to mock data if the backend is actually unreachable
      // Otherwise, keep the events list empty to show "No events found"
      // setEvents(MOCK_EVENTS.filter(e => e.status === "completed"));
    }
  };

  fetchCompletedEvents();
}, []);

  const totalPages = Math.max(1, Math.ceil(events.length / PER_PAGE));
  const pageEvents = events.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const avgRating = (feedbacks) => {
    if (!feedbacks?.length) return null;
    return (
      feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length
    ).toFixed(1);
  };

  const StarDisplay = ({ rating, count }) => {
    if (!rating)
      return (
        <span className="text-xs text-gray-300 flex items-center gap-1">
          <MessageSquare size={11} /> No reviews yet
        </span>
      );
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={12}
              className={
                parseFloat(rating) >= s
                  ? "fill-[#C4F249] text-[#C4F249]"
                  : "text-gray-200"
              }
            />
          ))}
        </div>
        <span className="text-xs font-bold text-black">{rating}</span>
        <span className="text-xs text-gray-400">({count})</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-lime-200">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <button
          onClick={() => navigate("/user")}
          className="bg-black text-main text-sm font-bold px-3 py-1.5 tracking-wide hover:opacity-90 transition"
        >
          EventSphere
        </button>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
          onClick={() => navigate("/events")}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={15} /> All Events
        </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-10">
        <h1 className="text-6xl md:text-7xl font-normal leading-[1.1] tracking-tight mb-2">
          <span className="text-gray-400">Completed</span>
          <br />
          <span className="text-black">Events</span>
        </h1>
        <p className="text-gray-400 text-sm mt-3">
          {events.length} past event{events.length !== 1 ? "s" : ""} — browse
          and leave your feedback
          {!backendOnline && (
            <span className="ml-3 text-yellow-600 text-xs">⚠ Mock data</span>
          )}
        </p>
      </div>

      {/* Info banner */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <div className="bg-gray-100 border border-gray-200 px-5 py-3 flex items-center gap-3 text-sm text-gray-600">
          <MessageSquare size={15} className="shrink-0" />
          These events have ended. You can view details and leave a star rating
          + feedback for any event you attended.
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {pageEvents.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 py-24 text-center">
            <p className="text-gray-400">No completed events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
            {pageEvents.map((event) => {
              const rating = avgRating(event.feedbacks);
              const fbCount = event.feedbacks?.length || 0;
              const progCount = event.programmes?.length || 0;
              const totalProg =
                event.programmes?.reduce((s, p) => s + 1, 0) || 0;

              return (
                <div
                  key={event.id}
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="bg-white cursor-pointer group border border-gray-100 hover:border-gray-400 hover:shadow-lg transition-all overflow-hidden flex flex-col"
                >
                  {/* Top bar — gray for completed */}
                  <div className="h-1 bg-gray-300" />

                  <div className="p-6 flex flex-col flex-1">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xs font-bold px-2.5 py-1 bg-gray-200 text-gray-600 uppercase tracking-wide">
                        Completed
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 ${event.type === "Paid" ? "bg-black text-[#C4F249]" : "bg-[#C4F249] text-black"}`}
                      >
                        {event.type}
                      </span>
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold text-black group-hover:opacity-70 transition leading-tight mb-2">
                      {event.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">
                      {event.description}
                    </p>

                    {/* Star rating */}
                    <div className="mb-4">
                      <StarDisplay rating={rating} count={fbCount} />
                    </div>

                    {/* Meta */}
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
                    </div>

                    {/* Programmes + organiser */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-gray-50 p-2 text-center">
                        <p className="text-xs text-gray-400 mb-0.5">
                          Programmes
                        </p>
                        <p className="font-bold text-black text-sm">
                          {progCount}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-2 text-center">
                        <p className="text-xs text-gray-400 mb-0.5">
                          Organiser
                        </p>
                        <p className="font-bold text-black text-xs truncate">
                          {event.organiserName}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-300 font-mono">
                        {event.id}
                      </span>
                      <span className="text-xs font-bold text-gray-500 group-hover:text-black transition">
                        {fbCount > 0
                          ? `${fbCount} review${fbCount > 1 ? "s" : ""}`
                          : "Be first to review"}{" "}
                        →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
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

export default CompletedEventsPage;