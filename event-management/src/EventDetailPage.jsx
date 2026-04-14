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
import { ThemeToggle } from "./ThemeContext";

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
            star <= value ? "fill-[#C4F249] text-[#C4F249]" : "text-muted"
          }
        />
      </button>
    ))}
  </div>
);

// ─── Feedback Card ────────────────────────────────────────────────────────────
const FeedbackCard = ({ fb }) => (
  <div className="bg-surface border border-border p-4">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div>
        <p className="font-bold text-foreground text-sm">{fb.user}</p>
        <p className="text-xs text-muted">{fb.date}</p>
      </div>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            className={
              s <= fb.rating ? "fill-[#C4F249] text-[#C4F249]" : "text-muted"
            }
          />
        ))}
      </div>
    </div>
    <p className="text-sm text-muted leading-relaxed">{fb.comment}</p>
  </div>
);

// ─── Seat bar ─────────────────────────────────────────────────────────────────
const SeatBar = ({ left, capacity }) => {
  const safeCapacity = capacity > 0 ? capacity : 1;
  const filled = Math.max(0, safeCapacity - left);
  const pct = Math.round((filled / safeCapacity) * 100);
  const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#C4F249";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1 text-muted">
        <span>{left.toLocaleString()} seats left</span>
        <span>{pct}% filled</span>
      </div>
      <div className="h-1.5 bg-border w-full">
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
        ? "border-border opacity-60 cursor-default"
        : prog.seatsLeft === 0
          ? "border-border opacity-50 cursor-not-allowed"
          : selected
            ? "border-foreground cursor-pointer"
            : "border-border hover:border-muted cursor-pointer"
    }`}
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {!disabled && (
            <div
              className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 transition ${
                selected
                  ? "bg-foreground border-foreground"
                  : "border-muted"
              }`}
            >
              {selected && <Check size={12} className="text-[#C4F249]" />}
            </div>
          )}
          <h4 className="font-bold text-foreground">{prog.name}</h4>
          {prog.seatsLeft === 0 && (
            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5">
              FULL
            </span>
          )}
        </div>
        <p className="text-sm text-muted leading-relaxed ml-7">
          {prog.description}
        </p>
      </div>
      <span className="text-lg font-bold text-foreground shrink-0">
        {isFree ? "Free" : `₹${prog.price}`}
      </span>
    </div>
    <div className="ml-7 space-y-2">
      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <MapPin size={12} />
          {prog.venueName || "Venue TBA"}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          Cap. {(prog.venueCapacity || 0).toLocaleString()}
        </span>
      </div>
      {!disabled && prog.venueCapacity > 0 && (
        <SeatBar left={prog.seatsLeft} capacity={prog.venueCapacity} />
      )}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const EventDetailPage = () => {
  const params  = useParams();
  const eventId = params.eventId || params.id;
  const navigate = useNavigate();

  const [event,         setEvent]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [selectedProgs, setSelectedProgs] = useState([]);
  const [feedbacks,     setFeedbacks]     = useState([]);
  const [fbRating,      setFbRating]      = useState(0);
  const [fbComment,     setFbComment]     = useState("");
  const [fbSent,        setFbSent]        = useState(false);
  const [fbError,       setFbError]       = useState("");

  useEffect(() => {
    if (!eventId) {
      setError("Event ID missing — cannot load event.");
      setLoading(false);
      return;
    }

    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const res = await fetch(`${API}/api/events/${eventId}`, {
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.message || `Server responded with ${res.status}`);
        }

        const json = await res.json();
        const e = json.data;
        if (!e) throw new Error("Empty response from server");

        const mappedEvent = {
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
          organiserName:
            e.programmes && e.programmes.length > 0 && e.programmes[0].organiserName
              ? e.programmes[0].organiserName
              : "—",
          programmes: (e.programmes || []).map((p) => ({
            id:            p.programmeId,
            name:          p.programmeName,
            description:   p.programmeDescription || "",
            status:        p.programmeStatus,
            price:         p.price         ?? 0,
            seatsLeft:     p.seatsLeft     ?? 0,
            venueName:     p.venueName     || "Venue TBA",
            venueCapacity: p.venueCapacity || 0,
          })),
        };

        setEvent(mappedEvent);
        setFeedbacks(e.feedbacks || []);
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const toggleProg = (progId) =>
    setSelectedProgs((prev) =>
      prev.includes(progId) ? prev.filter((p) => p !== progId) : [...prev, progId],
    );

  const handleSubmitFeedback = async () => {
    if (fbRating === 0)      { setFbError("Please select a star rating."); return; }
    if (!fbComment.trim())   { setFbError("Please write a comment.");      return; }
    setFbError("");

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/api/events/${eventId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ rating: fbRating, comment: fbComment }),
      });
      const json = await res.json();
      if (!res.ok) { setFbError(json.message || "Failed to submit feedback."); return; }
    } catch {
      // offline — add optimistically
    }

    setFeedbacks((prev) => [
      {
        user:    localStorage.getItem("name") || "You",
        rating:  fbRating,
        comment: fbComment,
        date:    new Date().toISOString().split("T")[0],
      },
      ...prev,
    ]);
    setFbSent(true);
    setFbRating(0);
    setFbComment("");
  };

  const handleProceed = () => {
    if (selectedProgs.length === 0) return;
    const selProgs = event.programmes.filter((p) => selectedProgs.includes(p.id));
    const total    = event.type === "Paid" ? selProgs.reduce((s, p) => s + p.price, 0) : 0;
    const isFree   = event.type === "Free";
    if (isFree) {
      navigate(`/events/${eventId}/ticket`, {
        state: { event, selectedProgrammes: selProgs, totalPrice: 0, isFree: true },
      });
    } else {
      navigate(`/events/${eventId}/payment`, {
        state: { event, selectedProgrammes: selProgs, totalPrice: total },
      });
    }
  };

  // ── Loading ──
  if (loading)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#C4F249]/30 border-t-[#C4F249] rounded-full animate-spin" />
          <p className="text-muted font-medium animate-pulse">Loading event details...</p>
        </div>
      </div>
    );

  // ── Error ──
  if (error)
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-sans gap-4">
        <AlertCircle size={48} className="text-red-400" />
        <p className="text-muted font-medium text-center max-w-sm">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-bold text-foreground underline hover:opacity-60 transition"
        >
          ← Go Back
        </button>
      </div>
    );

  if (!event) return null;

  const isFree      = event.type === "Free";
  const isOngoing   = event.status === "ongoing";
  const isUpcoming  = event.status === "upcoming";
  const isCompleted = event.status === "completed";

  const selectedProgrammes = event.programmes?.filter((p) => selectedProgs.includes(p.id)) || [];
  const totalPrice = selectedProgrammes.reduce((s, p) => s + (p.price || 0), 0);

  const avgRating = feedbacks.length
    ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1)
    : null;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-lime-200">

      {/* ── Nav ── */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

        {/* Logo — two-tone, matches LandingPage */}
        <button
          onClick={() => navigate("/events")}
          className="text-lg font-bold tracking-tight hover:opacity-80 transition"
        >
          <span className="text-foreground">Event</span>
          <span className="text-[#C4F249]">Sphere</span>
        </button>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition"
          >
            <ChevronLeft size={15} /> Back
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

          {/* ── LEFT ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Status banners */}
            {isOngoing && (
              <div className="bg-foreground text-[#C4F249] px-5 py-3 flex items-center gap-3 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-[#C4F249] animate-pulse" />
                This event is currently ongoing. Ticket purchasing is not available.
              </div>
            )}
            {isCompleted && (
              <div className="bg-surface border border-border text-muted px-5 py-3 flex items-center gap-3 text-sm font-medium">
                ✓ This event has ended. View details and leave feedback below.
              </div>
            )}

            {/* Title block */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span
                  className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wide ${
                    isOngoing
                      ? "bg-foreground text-[#C4F249]"
                      : isUpcoming
                        ? "bg-[#C4F249] text-black"
                        : "bg-surface border border-border text-muted"
                  }`}
                >
                  {event.status}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-1 uppercase ${
                    isFree ? "bg-[#C4F249] text-black" : "bg-foreground text-[#C4F249]"
                  }`}
                >
                  {event.type}
                </span>
                {event.category && (
                  <span className="text-xs font-bold px-2.5 py-1 bg-surface border border-border text-muted">
                    {event.category}
                  </span>
                )}
                {avgRating && (
                  <span className="text-xs font-bold px-2.5 py-1 bg-surface border border-border text-foreground">
                    ⭐ {avgRating} ({feedbacks.length} reviews)
                  </span>
                )}
              </div>
              <h1 className="text-[#C4F249] text-5xl md:text-6xl font-normal leading-[1.1] tracking-tight mb-4">
                {event.name}
              </h1>
              <p className="text-muted text-base leading-relaxed max-w-2xl">
                {event.description}
              </p>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Start Date", value: formatDate(event.startDate), icon: <Calendar size={18} /> },
                { label: "End Date",   value: formatDate(event.endDate),   icon: <Calendar size={18} /> },
                { label: "Time",       value: event.time,                  icon: <Clock    size={18} /> },
                { label: "Duration",   value: `${event.duration} hours`,   icon: <Tag      size={18} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-surface border border-border p-4">
                  <div className="text-muted mb-2">{icon}</div>
                  <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">
                    {label}
                  </p>
                  <p className="text-sm font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {/* Organiser */}
            <div className="bg-surface border border-border p-5">
              <p className="text-xs text-muted font-semibold uppercase tracking-wide mb-1">
                Organised by
              </p>
              <p className="text-xl font-bold text-foreground">{event.organiserName}</p>
            </div>

            {/* Programmes */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-1">Programmes</h2>
              <p className="text-sm text-muted mb-6">
                {isUpcoming && !isFree && "Select programmes to add to your ticket."}
                {isUpcoming &&  isFree && "Select programmes you want to attend — it's free!"}
                {isOngoing             && "Programmes currently in progress at these venues."}
                {isCompleted           && "Programmes that were part of this event."}
              </p>
              {(event.programmes || []).length === 0 ? (
                <div className="bg-surface border border-dashed border-border p-10 text-center">
                  <p className="text-muted text-sm">
                    No approved programmes yet — check back soon.
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

            {/* Feedback section */}
            {isCompleted && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-6">Feedback</h2>
                {!fbSent ? (
                  <div className="bg-surface border border-border p-6 mb-6">
                    <h3 className="font-bold text-foreground mb-4">Leave Your Feedback</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted font-semibold uppercase mb-2">
                          Your Rating
                        </p>
                        <StarRating value={fbRating} onChange={setFbRating} />
                      </div>
                      <div>
                        <p className="text-xs text-muted font-semibold uppercase mb-2">
                          Your Comment
                        </p>
                        <textarea
                          rows={4}
                          placeholder="How was your experience at this event?"
                          value={fbComment}
                          onChange={(e) => setFbComment(e.target.value)}
                          className="w-full border border-border bg-background text-foreground p-3 text-sm resize-none focus:outline-none focus:border-foreground transition placeholder:text-muted"
                        />
                      </div>
                      {fbError && (
                        <div className="flex items-center gap-2 text-red-600 text-xs">
                          <AlertCircle size={13} /> {fbError}
                        </div>
                      )}
                      <button
                        onClick={handleSubmitFeedback}
                        className="bg-foreground text-[#C4F249] px-8 py-3 font-bold text-sm hover:opacity-80 transition active:scale-95"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#C4F249] border border-foreground p-5 mb-6 flex items-center gap-3">
                    <Check size={20} className="text-black" />
                    <p className="font-bold text-black">
                      Thank you! Your feedback has been submitted.
                    </p>
                  </div>
                )}
                {feedbacks.length > 0 ? (
                  <div className="space-y-3">
                    {feedbacks.map((fb, i) => (
                      <FeedbackCard key={i} fb={fb} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-sm">
                    No feedback yet — be the first to review!
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT sidebar ── */}
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="bg-surface border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {isOngoing   && "Event Info"}
                {isUpcoming  && "Your Selection"}
                {isCompleted && "Event Summary"}
              </h3>

              {/* Ongoing info */}
              {isOngoing && (
                <div className="space-y-3 mb-4">
                  <div className="bg-[#C4F249] p-4 text-center">
                    <span className="w-2 h-2 rounded-full bg-black inline-block mr-2 animate-pulse" />
                    <span className="font-bold text-black text-sm">Currently Live</span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    This event is in progress. You cannot purchase tickets for ongoing
                    events. Visit the venue directly to check availability.
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Organiser</span>
                      <span className="font-bold text-foreground">{event.organiserName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Programmes</span>
                      <span className="font-bold text-foreground">
                        {event.programmes?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Upcoming selection */}
              {isUpcoming && (
                <>
                  {selectedProgrammes.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border mb-4">
                      <p className="text-sm text-muted">No programmes selected</p>
                      <p className="text-xs text-muted mt-1 opacity-60">
                        Select from the list on the left
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {selectedProgrammes.map((p) => (
                        <div
                          key={p.id}
                          className="flex justify-between items-center text-sm py-2 border-b border-border"
                        >
                          <span className="text-muted font-medium">{p.name}</span>
                          <span className="font-bold text-foreground">
                            {isFree ? "Free" : `₹${p.price}`}
                          </span>
                        </div>
                      ))}
                      {!isFree && (
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-bold text-foreground">Total</span>
                          <span className="text-xl font-bold text-foreground">
                            ₹{totalPrice}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedProgrammes.some((p) => p.seatsLeft < 20 && p.seatsLeft > 0) && (
                    <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 p-3 mb-4 text-xs text-yellow-700">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      Almost full — book quickly!
                    </div>
                  )}
                  <button
                    onClick={handleProceed}
                    disabled={selectedProgs.length === 0}
                    className={`w-full py-4 font-bold text-base transition active:scale-95 flex items-center justify-center gap-2.5 ${
                      selectedProgs.length === 0
                        ? "bg-surface border-2 border-border text-muted cursor-not-allowed"
                        : isFree
                          ? "bg-[#C4F249] text-black border-2 border-[#C4F249] hover:bg-transparent hover:text-[#C4F249]"
                          : "bg-foreground text-[#C4F249] border-2 border-foreground hover:bg-transparent hover:text-foreground"
                    }`}
                  >
                    {selectedProgs.length === 0 ? (
                      <>
                        <Tag size={16} />
                        Select a Programme
                      </>
                    ) : isFree ? (
                      <>
                        <Check size={16} />
                        {`Join Now (${selectedProgs.length} programme${selectedProgs.length > 1 ? "s" : ""})`}
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                          <path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>
                        </svg>
                        {`Buy Ticket — ₹${totalPrice}`}
                      </>
                    )}
                  </button>
                  {selectedProgs.length > 0 && (
                    <p className="text-xs text-muted text-center mt-3">
                      {isFree ? "Free entry — show ticket at gate" : "Secure payment on next page"}
                    </p>
                  )}
                </>
              )}

              {/* Completed summary */}
              {isCompleted && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Organiser</span>
                    <span className="font-bold text-foreground">{event.organiserName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Programmes</span>
                    <span className="font-bold text-foreground">
                      {event.programmes?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Total Reviews</span>
                    <span className="font-bold text-foreground">{feedbacks.length}</span>
                  </div>
                  {avgRating && (
                    <div className="flex justify-between">
                      <span className="text-muted">Avg. Rating</span>
                      <span className="font-bold text-foreground">⭐ {avgRating} / 5</span>
                    </div>
                  )}
                  <div className="bg-surface border border-border text-muted text-center py-3 text-xs font-bold uppercase tracking-wide">
                    Event Completed
                  </div>
                </div>
              )}
            </div>

            {/* Event ID */}
            <p className="text-xs text-muted text-center font-mono">{event.id}</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;