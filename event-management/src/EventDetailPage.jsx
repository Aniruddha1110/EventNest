import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Tag,
  ChevronLeft,
  Check,
  Star,
  AlertCircle,
} from "lucide-react";
import { MOCK_EVENTS, getEventById } from "./mockData";

const API = "http://localhost:9090";

// ─── Star Rating Input ────────────────────────────────────────────────────────
const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        onClick={() => onChange(star)}
        type="button"
        className="transition hover:scale-110"
      >
        <Star
          size={24}
          className={
            star <= value ? "fill-[#C4F249] text-[#C4F249]" : "text-gray-300"
          }
        />
      </button>
    ))}
  </div>
);

// ─── Feedback Card ────────────────────────────────────────────────────────────
const FeedbackCard = ({ fb }) => (
  <div className="bg-white border border-gray-100 p-4">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div>
        <p className="font-bold text-black text-sm">{fb.user}</p>
        <p className="text-xs text-gray-400">{fb.date}</p>
      </div>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            className={
              s <= fb.rating ? "fill-[#C4F249] text-[#C4F249]" : "text-gray-200"
            }
          />
        ))}
      </div>
    </div>
    <p className="text-sm text-gray-600 leading-relaxed">{fb.comment}</p>
  </div>
);

// ─── Seat bar ─────────────────────────────────────────────────────────────────
const SeatBar = ({ left, capacity }) => {
  const pct = Math.round(((capacity - left) / capacity) * 100);
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#C4F249";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 text-gray-400">
        <span>{left.toLocaleString()} seats left</span>
        <span>{pct}% filled</span>
      </div>
      <div className="h-1.5 bg-gray-100 w-full">
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
};

// ─── Programme Card ───────────────────────────────────────────────────────────
const ProgrammeCard = ({ prog, selected, onToggle, isFree, disabled }) => (
  <div
    onClick={() => !disabled && prog.seatsLeft > 0 && onToggle(prog.id)}
    className={`border-2 p-5 transition-all ${
      disabled
        ? "border-gray-100 opacity-60 cursor-default"
        : prog.seatsLeft === 0
          ? "border-gray-100 opacity-50 cursor-not-allowed"
          : selected
            ? "border-black cursor-pointer"
            : "border-gray-100 hover:border-gray-300 cursor-pointer"
    }`}
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {!disabled && (
            <div
              className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 transition ${selected ? "bg-black border-black" : "border-gray-300"}`}
            >
              {selected && <Check size={12} className="text-[#C4F249]" />}
            </div>
          )}
          <h4 className="font-bold text-black">{prog.name}</h4>
          {prog.seatsLeft === 0 && (
            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5">
              FULL
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 leading-relaxed ml-7">
          {prog.description}
        </p>
      </div>
      <span className="text-lg font-bold text-black shrink-0">
        {isFree ? "Free" : `₹${prog.price}`}
      </span>
    </div>
    <div className="ml-7 space-y-2">
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {prog.venueName}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          Cap. {prog.venueCapacity.toLocaleString()}
        </span>
      </div>
      {!disabled && (
        <SeatBar left={prog.seatsLeft} capacity={prog.venueCapacity} />
      )}
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const EventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProgs, setSelectedProgs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  // Feedback form state
  const [fbRating, setFbRating] = useState(0);
  const [fbComment, setFbComment] = useState("");
  const [fbSent, setFbSent] = useState(false);
  const [fbError, setFbError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/events/${eventId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEvent(data);
        setFeedbacks(data.feedbacks || []);
      } catch {
        const mock =
          getEventById(eventId) || MOCK_EVENTS.find((e) => e.id === eventId);
        setEvent(mock || null);
        setFeedbacks(mock?.feedbacks || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId]);

  const toggleProg = (id) =>
    setSelectedProgs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const handleSubmitFeedback = () => {
    if (fbRating === 0) {
      setFbError("Please select a star rating.");
      return;
    }
    if (!fbComment.trim()) {
      setFbError("Please write a comment.");
      return;
    }
    // Backend: POST /api/events/:id/feedback  { rating: fbRating, comment: fbComment }
    const newFb = {
      user: "You",
      rating: fbRating,
      comment: fbComment,
      date: new Date().toISOString().split("T")[0],
    };
    setFeedbacks((prev) => [newFb, ...prev]);
    setFbSent(true);
    setFbRating(0);
    setFbComment("");
    setFbError("");
  };

  const handleProceed = () => {
    if (selectedProgs.length === 0) return;
    const selProgs = event.programmes.filter((p) =>
      selectedProgs.includes(p.id),
    );
    const total =
      event.type === "Paid" ? selProgs.reduce((s, p) => s + p.price, 0) : 0;
    const isFree = event.type === "Free";

    if (isFree) {
      navigate(`/events/${eventId}/ticket`, {
        state: {
          event,
          selectedProgrammes: selProgs,
          totalPrice: 0,
          isFree: true,
        },
      });
    } else {
      navigate(`/events/${eventId}/payment`, {
        state: { event, selectedProgrammes: selProgs, totalPrice: total },
      });
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center font-sans">
        <div className="animate-pulse text-xl font-bold text-gray-300">
          Loading event...
        </div>
      </div>
    );
  if (!event) return null;

  const isFree = event.type === "Free";
  const isOngoing = event.status === "ongoing";
  const isUpcoming = event.status === "upcoming";
  const isCompleted = event.status === "completed";

  const selectedProgrammes =
    event.programmes?.filter((p) => selectedProgs.includes(p.id)) || [];
  const totalPrice = selectedProgrammes.reduce((s, p) => s + (p.price || 0), 0);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(
        1,
      )
    : null;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-sans selection:bg-lime-200">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <button
          onClick={() => navigate("/events")}
          className="bg-black text-main text-sm font-bold px-3 py-1.5 tracking-wide hover:opacity-90 transition"
        >
          EventSphere
        </button>
        <button
          onClick={() => navigate("/events")}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition"
        >
          <ChevronLeft size={15} /> Back to Events
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* ── LEFT ───────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">
            {/* Status banner */}
            {isOngoing && (
              <div className="bg-black text-[#C4F249] px-5 py-3 flex items-center gap-3 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-[#C4F249] animate-pulse" />
                This event is currently ongoing. Ticket purchasing is not
                available.
              </div>
            )}
            {isCompleted && (
              <div className="bg-gray-100 text-gray-600 px-5 py-3 flex items-center gap-3 text-sm font-medium">
                ✓ This event has ended. You can view details and leave feedback
                below.
              </div>
            )}

            {/* Title */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wide ${
                    isOngoing
                      ? "bg-black text-[#C4F249]"
                      : isUpcoming
                        ? "bg-[#C4F249] text-black"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {event.status}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 uppercase ${isFree ? "bg-[#C4F249] text-black" : "bg-black text-[#C4F249]"}`}
                >
                  {event.type}
                </span>
                {avgRating && (
                  <span className="text-xs font-bold px-2.5 py-1 bg-white border border-gray-200">
                    ⭐ {avgRating} ({feedbacks.length} reviews)
                  </span>
                )}
              </div>
              <h1 className="text-[#C4F249] text-5xl md:text-6xl font-normal leading-[1.1] tracking-tight mb-4">
                {event.name}
              </h1>
              <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
                {event.description}
              </p>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Start Date",
                  value: formatDate(event.startDate),
                  icon: <Calendar size={18} />,
                },
                {
                  label: "End Date",
                  value: formatDate(event.endDate),
                  icon: <Calendar size={18} />,
                },
                { label: "Time", value: event.time, icon: <Clock size={18} /> },
                {
                  label: "Duration",
                  value: `${event.duration} hours`,
                  icon: <Tag size={18} />,
                },
              ].map(({ label, value, icon }) => (
                <div
                  key={label}
                  className="bg-white border border-gray-100 p-4"
                >
                  <div className="text-gray-400 mb-2">{icon}</div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">
                    {label}
                  </p>
                  <p className="text-sm font-bold text-black">{value}</p>
                </div>
              ))}
            </div>

            {/* Organiser */}
            <div className="bg-white border border-gray-100 p-5">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">
                Organised by
              </p>
              <p className="text-xl font-bold text-black">
                {event.organiserName}
              </p>
            </div>

            {/* Programmes */}
            <div>
              <h2 className="text-2xl font-bold text-black mb-1">Programmes</h2>
              <p className="text-sm text-gray-400 mb-6">
                {isUpcoming &&
                  !isFree &&
                  "Select programmes to add to your ticket."}
                {isUpcoming &&
                  isFree &&
                  "Select programmes you want to attend — it's free!"}
                {isOngoing &&
                  "Programmes currently in progress at these venues."}
                {isCompleted && "Programmes that were part of this event."}
              </p>

              {(event.programmes || []).length === 0 ? (
                <div className="bg-white border border-dashed border-gray-200 p-10 text-center">
                  <p className="text-gray-400 text-sm">
                    Programme details will be available soon.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {event.programmes.map((prog) => (
                    <ProgrammeCard
                      key={prog.id}
                      prog={prog}
                      selected={selectedProgs.includes(prog.id)}
                      onToggle={toggleProg}
                      isFree={isFree}
                      disabled={isOngoing || isCompleted}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Feedback Section (completed only) ──────────────────────── */}
            {isCompleted && (
              <div>
                <h2 className="text-2xl font-bold text-black mb-6">Feedback</h2>

                {/* Submit form */}
                {!fbSent ? (
                  <div className="bg-white border border-gray-100 p-6 mb-6">
                    <h3 className="font-bold text-black mb-4">
                      Leave Your Feedback
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
                          Your Rating
                        </p>
                        <StarRating value={fbRating} onChange={setFbRating} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-2">
                          Your Comment
                        </p>
                        <textarea
                          rows={4}
                          placeholder="How was your experience at this event?"
                          value={fbComment}
                          onChange={(e) => setFbComment(e.target.value)}
                          className="w-full border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:border-black transition"
                        />
                      </div>
                      {fbError && (
                        <div className="flex items-center gap-2 text-red-600 text-xs">
                          <AlertCircle size={13} />
                          {fbError}
                        </div>
                      )}
                      <button
                        onClick={handleSubmitFeedback}
                        className="bg-black text-[#C4F249] px-8 py-3 font-bold text-sm hover:opacity-80 transition active:scale-95"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#C4F249] border border-black p-5 mb-6 flex items-center gap-3">
                    <Check size={20} className="text-black" />
                    <p className="font-bold text-black">
                      Thank you! Your feedback has been submitted.
                    </p>
                  </div>
                )}

                {/* All feedbacks */}
                {feedbacks.length > 0 ? (
                  <div className="space-y-3">
                    {feedbacks.map((fb, i) => (
                      <FeedbackCard key={i} fb={fb} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    No feedback yet — be the first to review!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Booking panel ──────────────────────────────────────── */}
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="bg-white border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-black mb-4">
                {isOngoing ? "Event Info" : ""}
                {isUpcoming ? "Your Selection" : ""}
                {isCompleted ? "Event Summary" : ""}
              </h3>

              {isOngoing && (
                <div className="space-y-3 mb-4">
                  <div className="bg-[#C4F249] p-4 text-center">
                    <span className="w-2 h-2 rounded-full bg-black inline-block mr-2 animate-pulse" />
                    <span className="font-bold text-black text-sm">
                      Currently Live
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    This event is in progress. You cannot purchase tickets for
                    ongoing events. Visit the venue directly to check
                    availability.
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Organiser</span>
                      <span className="font-bold text-black">
                        {event.organiserName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Programmes</span>
                      <span className="font-bold text-black">
                        {event.programmes?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {isUpcoming && (
                <>
                  {selectedProgrammes.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-gray-200 mb-4">
                      <p className="text-sm text-gray-400">
                        No programmes selected
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        Select from the list on the left
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {selectedProgrammes.map((p) => (
                        <div
                          key={p.id}
                          className="flex justify-between items-center text-sm py-2 border-b border-gray-50"
                        >
                          <span className="text-gray-700 font-medium">
                            {p.name}
                          </span>
                          <span className="font-bold text-black">
                            {isFree ? "Free" : `₹${p.price}`}
                          </span>
                        </div>
                      ))}
                      {!isFree && (
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-bold text-black">Total</span>
                          <span className="text-xl font-bold text-black">
                            ₹{totalPrice}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedProgrammes.some((p) => p.seatsLeft < 100) && (
                    <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 p-3 mb-4 text-xs text-yellow-700">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      Almost full — book quickly!
                    </div>
                  )}

                  <button
                    onClick={handleProceed}
                    disabled={selectedProgs.length === 0}
                    className={`w-full py-4 font-bold text-base transition active:scale-95 ${
                      selectedProgs.length === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : isFree
                          ? "bg-[#C4F249] text-black hover:opacity-90"
                          : "bg-black text-[#C4F249] hover:opacity-80"
                    }`}
                  >
                    {selectedProgs.length === 0
                      ? "Select a Programme"
                      : isFree
                        ? `Join Now (${selectedProgs.length} programme${selectedProgs.length > 1 ? "s" : ""})`
                        : `Buy Ticket — ₹${totalPrice}`}
                  </button>

                  {selectedProgs.length > 0 && (
                    <p className="text-xs text-gray-400 text-center mt-3">
                      {isFree
                        ? "Free entry — show ticket at gate"
                        : "Secure payment on next page"}
                    </p>
                  )}
                </>
              )}

              {isCompleted && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Organiser</span>
                    <span className="font-bold text-black">
                      {event.organiserName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Programmes</span>
                    <span className="font-bold text-black">
                      {event.programmes?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Reviews</span>
                    <span className="font-bold text-black">
                      {feedbacks.length}
                    </span>
                  </div>
                  {avgRating && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg. Rating</span>
                      <span className="font-bold text-black">
                        ⭐ {avgRating} / 5
                      </span>
                    </div>
                  )}
                  <div className="bg-gray-100 text-gray-600 text-center py-3 text-xs font-bold uppercase tracking-wide">
                    Event Completed
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-300 text-center font-mono">
              {event.id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;
