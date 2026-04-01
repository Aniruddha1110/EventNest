import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Trash2, Check, AlertCircle, Calendar, Clock, FileText, MapPin } from "lucide-react";

const API = "http://localhost:9090";

// ─── MOCK VENUES (replace with GET /api/venues when backend ready) ────────────
const MOCK_VENUES = [
    { venueId: "V-0001", venueName: "Auditorium-1", venueCapacity: 5000 },
    { venueId: "V-0002", venueName: "Cricket Stadium", venueCapacity: 10000 },
    { venueId: "V-0003", venueName: "Campus-3 OAT1", venueCapacity: 2000 },
    { venueId: "V-0004", venueName: "Campus-15 OAT", venueCapacity: 500 },
    { venueId: "V-0005", venueName: "KIMS Auditorium", venueCapacity: 800 },
    { venueId: "V-0006", venueName: "KISS Athletics Stadium", venueCapacity: 12000 },
    { venueId: "V-0007", venueName: "Campus-8 Tennis Court", venueCapacity: 300 },
    { venueId: "V-0008", venueName: "MBA Auditorium", venueCapacity: 1000 },
    { venueId: "V-0009", venueName: "MBA Garden", venueCapacity: 3000 },
    { venueId: "V-0010", venueName: "Campus-6 OAT", venueCapacity: 800 },
];

// ─── MOCK LOGGED-IN ORGANISER (replace with auth context when ready) ──────────
// Backend: GET /api/organisers/profile (JWT from localStorage)
const MOCK_ORGANISER = {
    organiserId: "O-0001",
    organiserName: "KIIT University",
    organiserEmail: "kiit@kiit.in",
};

// ─── Empty programme template ────────────────────────────────────────────────
const emptyProgramme = () => ({
    _key: Date.now() + Math.random(),
    name: "",
    description: "",
    venueId: "",
});

// ─── Field wrapper ─────────────────────────────────────────────────────────────
const Field = ({ label, required, error, children, hint }) => (
    <div>
        <label className="block text-xs font-semibold text-[#5a5a62] uppercase tracking-wider mb-2">
            {label} {required && <span className="text-[#ef4444]">*</span>}
        </label>
        {hint && <p className="text-[10px] text-[#3a3a42] mb-1.5">{hint}</p>}
        {children}
        {error && (
            <p className="flex items-center gap-1 text-xs text-[#ef4444] mt-1">
                <AlertCircle size={11} /> {error}
            </p>
        )}
    </div>
);

// ─── Input styles ─────────────────────────────────────────────────────────────
const inputCls = (err) =>
    `w-full bg-[#0c0c0f] border ${err ? "border-[#ef4444]" : "border-[#1e1e22]"} rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#a3e635] transition-colors placeholder-[#3a3a42]`;

const selectCls = (err) =>
    `w-full bg-[#0c0c0f] border ${err ? "border-[#ef4444]" : "border-[#1e1e22]"} rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#a3e635] transition-colors`;

// ─── Main Component ───────────────────────────────────────────────────────────
const CreateEventPage = () => {
    const navigate = useNavigate();

    // ── Organiser info (fetched from backend, not filled by user) ────────────────
    const [organiser, setOrganiser] = useState(MOCK_ORGANISER);

    // ── Venues list ──────────────────────────────────────────────────────────────
    const [venues, setVenues] = useState([]);

    // ── Form state ────────────────────────────────────────────────────────────────
    const [form, setForm] = useState({
        eventName: "",
        eventStartDate: "",
        eventEndDate: "",
        eventTime: "",
        eventDuration: "",
        eventDescription: "",
    });

    // ── Programmes list ───────────────────────────────────────────────────────────
    const [programmes, setProgrammes] = useState([emptyProgramme()]);

    // ── UI state ──────────────────────────────────────────────────────────────────
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [step, setStep] = useState(1); // 1 = event details, 2 = programmes

    // ── Fetch organiser profile + venues on mount ─────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem("token");

        // GET /api/organisers/profile — autofills organiser info
        fetch(`${API}/api/organisers/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => { if (d.data) setOrganiser(d.data); })
            .catch(() => setOrganiser(MOCK_ORGANISER));

        // GET /api/admin/venues — loads available venues for programme dropdowns
        fetch(`${API}/api/admin/venues`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(d => setVenues(Array.isArray(d) ? d : (d.data || MOCK_VENUES)))
            .catch(() => setVenues(MOCK_VENUES));
    }, []);

    // ── Form field change ─────────────────────────────────────────────────────────
    const setField = (key) => (e) => {
        setForm(p => ({ ...p, [key]: e.target.value }));
        setErrors(p => ({ ...p, [key]: "" }));
    };

    // ── Programme change ──────────────────────────────────────────────────────────
    const setProg = (key, val, idx) => {
        setProgrammes(prev =>
            prev.map((p, i) => i === idx ? { ...p, [key]: val } : p)
        );
        setErrors(p => ({ ...p, [`prog_${idx}_${key}`]: "" }));
    };

    const addProgramme = () => {
        if (programmes.length >= 10) return;
        setProgrammes(prev => [...prev, emptyProgramme()]);
    };

    const removeProgramme = (idx) => {
        if (programmes.length === 1) return;
        setProgrammes(prev => prev.filter((_, i) => i !== idx));
    };

    // ── Validation ────────────────────────────────────────────────────────────────
    const validateStep1 = () => {
        const e = {};
        if (!form.eventName.trim()) e.eventName = "Event name is required.";
        if (form.eventName.length > 50) e.eventName = "Event name must be 50 characters or less.";
        if (!form.eventStartDate) e.eventStartDate = "Start date is required.";
        if (!form.eventEndDate) e.eventEndDate = "End date is required.";
        if (form.eventStartDate && form.eventEndDate &&
            form.eventEndDate < form.eventStartDate) e.eventEndDate = "End date cannot be before start date.";
        if (!form.eventTime) e.eventTime = "Event time is required.";
        if (!form.eventDuration || Number(form.eventDuration) < 1)
            e.eventDuration = "Duration must be at least 1 hour.";
        if (form.eventDescription.length > 500) e.eventDescription = "Description must be 500 characters or less.";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e = {};
        programmes.forEach((p, i) => {
            if (!p.name.trim()) e[`prog_${i}_name`] = "Programme name is required.";
            if (p.name.length > 50) e[`prog_${i}_name`] = "Name must be 50 characters or less.";
            if (!p.venueId) e[`prog_${i}_venueId`] = "Please select a venue.";
            if (p.description.length > 500) e[`prog_${i}_description`] = "Description max 500 characters.";
        });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) setStep(2);
    };

    // ── Submit ────────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validateStep2()) return;
        setLoading(true);

        const payload = {
            // Event fields
            eventName: form.eventName.trim(),
            eventStartDate: form.eventStartDate,
            eventEndDate: form.eventEndDate,
            eventTime: form.eventTime,
            eventDuration: Number(form.eventDuration),
            eventDescription: form.eventDescription.trim(),
            eventStatus: "upcoming",

            // Organiser auto-filled from JWT/profile — not typed by user
            organiserId: organiser.organiserId,

            // Programmes
            programmes: programmes.map(p => ({
                programmeName: p.name.trim(),
                programmeDescription: p.description.trim(),
                venueId: p.venueId,
                // organiserId comes from the event's organiser — same person
                programmeStatus: "pending",  // admin must approve
            })),
        };

        try {
            // POST /api/organisers/events
            // Backend creates the event + all programmes in one transaction.
            // All programmes start with status = 'pending' — admin must approve.
            // Returns: ApiResponse { success, message, data: EventResponse }
            const res = await fetch(`${API}/api/organisers/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                setErrors({ submit: data.message || "Submission failed. Please try again." });
                setLoading(false);
                return;
            }

            setSubmitted(true);
        } catch {
            // Dev fallback — simulate success
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    // ── Success screen ─────────────────────────────────────────────────────────────
    if (submitted) {
        return (
            <div className="min-h-screen bg-[#0c0c0f] flex items-center justify-center px-6 font-sans">
                <div className="text-center max-w-md w-full">
                    <div className="w-20 h-20 rounded-full bg-[#a3e635]/10 border-2 border-[#a3e635] flex items-center justify-center mx-auto mb-6">
                        <Check size={36} className="text-[#a3e635]" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-3">Submitted!</h2>
                    <p className="text-[#a0a0ab] text-sm leading-relaxed mb-2">
                        Your event <span className="text-white font-bold">{form.eventName}</span> has been submitted successfully.
                    </p>
                    <p className="text-[#5a5a62] text-xs mb-8">
                        All {programmes.length} programme{programmes.length > 1 ? "s" : ""} are pending admin approval.
                        You'll be notified by email once approved.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => navigate("/organiser")}
                            className="w-full py-3.5 bg-[#a3e635] text-[#0c0c0f] font-bold text-sm rounded-xl hover:bg-[#b8f056] transition-all"
                        >
                            Back to Dashboard
                        </button>
                        <button
                            onClick={() => { setSubmitted(false); setStep(1); setForm({ eventName: "", eventStartDate: "", eventEndDate: "", eventTime: "", eventDuration: "", eventDescription: "" }); setProgrammes([emptyProgramme()]); setErrors({}); }}
                            className="w-full py-3 border border-[#2a2a2e] text-[#a0a0ab] font-semibold text-sm rounded-xl hover:border-[#a3e635] hover:text-[#a3e635] transition-all"
                        >
                            Create Another Event
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Venue lookup helper ───────────────────────────────────────────────────────
    const getVenueName = (vid) => {
        const v = venues.find(x => x.venueId === vid);
        return v ? v.venueName : "";
    };

    // ── Render ────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0c0c0f] text-white font-sans">

            {/* ── HEADER ─────────────────────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 flex justify-between items-center px-8 h-16 bg-[#0c0c0f]/90 backdrop-blur-md border-b border-[#1e1e22]">
                <button
                    onClick={() => step === 2 ? setStep(1) : navigate("/organiser")}
                    className="flex items-center gap-2 text-[#a0a0ab] hover:text-white transition-colors"
                >
                    <ChevronLeft size={18} />
                    <span className="text-sm font-medium">{step === 2 ? "Back to Event Details" : "Back to Dashboard"}</span>
                </button>

                <span className="font-bold text-xl tracking-tight">
                    Event<span className="text-[#a3e635]">Sphere</span>
                </span>

                {/* Step indicator */}
                <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 1 ? "bg-[#a3e635] text-[#0c0c0f]" : "bg-[#1e1e22] text-[#a3e635] border border-[#a3e635]"}`}>
                        {step > 1 ? <Check size={14} /> : "1"}
                    </div>
                    <div className="w-8 h-px bg-[#1e1e22]" />
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step === 2 ? "bg-[#a3e635] text-[#0c0c0f]" : "bg-[#1e1e22] text-[#5a5a62]"}`}>
                        2
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-6 py-10">

                {/* ── ORGANISER INFO CARD (auto-fetched, read only) ──────────────────── */}
                <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl px-6 py-4 mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635] font-bold text-sm shrink-0">
                        {organiser.organiserName?.charAt(0) || "O"}
                    </div>
                    <div>
                        <p className="text-xs text-[#5a5a62] uppercase tracking-wider font-semibold mb-0.5">Creating as</p>
                        <p className="font-bold text-white">{organiser.organiserName}</p>
                        <p className="text-xs text-[#5a5a62]">{organiser.organiserEmail}</p>
                    </div>
                    <div className="ml-auto">
                        <span className="text-[10px] font-bold bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/20 px-2 py-1 rounded-full uppercase tracking-wider">
                            Auto-filled from profile
                        </span>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════════════════════════ */}
                {/* STEP 1 — EVENT DETAILS                                              */}
                {/* ════════════════════════════════════════════════════════════════════ */}
                {step === 1 && (
                    <div>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#a3e635] mb-1">Step 1 of 2</p>
                            <h1 className="text-2xl font-extrabold text-white">Event Details</h1>
                            <p className="text-[#5a5a62] text-sm mt-1">Fill in the core information for your event.</p>
                        </div>

                        <div className="space-y-5">

                            {/* Event Name */}
                            <Field label="Event Name" required error={errors.eventName}>
                                <input
                                    type="text"
                                    value={form.eventName}
                                    onChange={setField("eventName")}
                                    placeholder="e.g. KIIT Fest 2026"
                                    maxLength={50}
                                    className={inputCls(errors.eventName)}
                                />
                                <p className="text-[10px] text-[#3a3a42] mt-1 text-right">{form.eventName.length}/50</p>
                            </Field>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Start Date" required error={errors.eventStartDate}>
                                    <div className="relative">
                                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a62]" />
                                        <input
                                            type="date"
                                            value={form.eventStartDate}
                                            onChange={setField("eventStartDate")}
                                            min={new Date().toISOString().split("T")[0]}
                                            className={`${inputCls(errors.eventStartDate)} pl-9`}
                                        />
                                    </div>
                                </Field>
                                <Field label="End Date" required error={errors.eventEndDate}>
                                    <div className="relative">
                                        <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a62]" />
                                        <input
                                            type="date"
                                            value={form.eventEndDate}
                                            onChange={setField("eventEndDate")}
                                            min={form.eventStartDate || new Date().toISOString().split("T")[0]}
                                            className={`${inputCls(errors.eventEndDate)} pl-9`}
                                        />
                                    </div>
                                </Field>
                            </div>

                            {/* Time + Duration */}
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Event Time" required error={errors.eventTime}>
                                    <div className="relative">
                                        <Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a62]" />
                                        <input
                                            type="time"
                                            value={form.eventTime}
                                            onChange={setField("eventTime")}
                                            className={`${inputCls(errors.eventTime)} pl-9`}
                                        />
                                    </div>
                                </Field>
                                <Field label="Duration (hours)" required error={errors.eventDuration}
                                    hint="Total duration of the full event in hours">
                                    <input
                                        type="number"
                                        value={form.eventDuration}
                                        onChange={setField("eventDuration")}
                                        placeholder="e.g. 8"
                                        min={1}
                                        max={720}
                                        className={inputCls(errors.eventDuration)}
                                    />
                                </Field>
                            </div>

                            {/* Description */}
                            <Field label="Event Description" error={errors.eventDescription}
                                hint="Tell attendees what this event is about (max 500 characters)">
                                <div className="relative">
                                    <FileText size={15} className="absolute left-3 top-3.5 text-[#5a5a62]" />
                                    <textarea
                                        value={form.eventDescription}
                                        onChange={setField("eventDescription")}
                                        placeholder="Describe your event — what's it about, who should attend, what to expect..."
                                        rows={4}
                                        maxLength={500}
                                        className={`${inputCls(errors.eventDescription)} pl-9 resize-none`}
                                    />
                                </div>
                                <p className="text-[10px] text-[#3a3a42] mt-1 text-right">{form.eventDescription.length}/500</p>
                            </Field>

                            {/* Info box */}
                            <div className="bg-[#1a2c0a] border border-[#a3e635]/20 rounded-xl px-4 py-3 text-xs text-[#a3e635] leading-relaxed">
                                <p className="font-bold mb-1">ℹ What happens next?</p>
                                <p className="text-[#6a8a3a]">
                                    After submitting, all programmes you add will be sent for admin review.
                                    Your event will appear on the platform once at least one programme is approved.
                                    Event status starts as <strong className="text-[#a3e635]">upcoming</strong> by default.
                                </p>
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full py-4 bg-[#a3e635] text-[#0c0c0f] font-extrabold text-sm rounded-xl hover:bg-[#b8f056] transition-all active:scale-[0.98]"
                            >
                                Continue to Programmes →
                            </button>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════════ */}
                {/* STEP 2 — PROGRAMMES                                                 */}
                {/* ════════════════════════════════════════════════════════════════════ */}
                {step === 2 && (
                    <div>
                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#a3e635] mb-1">Step 2 of 2</p>
                            <h1 className="text-2xl font-extrabold text-white">Add Programmes</h1>
                            <p className="text-[#5a5a62] text-sm mt-1">
                                Add the individual programmes for <span className="text-white font-semibold">{form.eventName}</span>.
                                Each programme has its own venue.
                            </p>
                        </div>

                        {/* Event summary pill */}
                        <div className="bg-[#111115] border border-[#1e1e22] rounded-xl px-5 py-3 mb-6 flex flex-wrap gap-4 text-xs text-[#5a5a62]">
                            <span className="flex items-center gap-1.5"><Calendar size={12} className="text-[#a3e635]" />{form.eventStartDate} → {form.eventEndDate}</span>
                            <span className="flex items-center gap-1.5"><Clock size={12} className="text-[#a3e635]" />{form.eventTime} · {form.eventDuration}h</span>
                            <span className="text-[#a0a0ab] font-semibold">{form.eventName}</span>
                        </div>

                        {/* Programmes */}
                        <div className="space-y-5 mb-6">
                            {programmes.map((prog, idx) => (
                                <div key={prog._key} className="bg-[#111115] border border-[#1e1e22] rounded-2xl p-6">

                                    <div className="flex items-center justify-between mb-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#a3e635] text-[#0c0c0f] text-xs font-extrabold flex items-center justify-center">
                                                {idx + 1}
                                            </div>
                                            <span className="font-bold text-white text-sm">Programme {idx + 1}</span>
                                        </div>
                                        {programmes.length > 1 && (
                                            <button
                                                onClick={() => removeProgramme(idx)}
                                                className="flex items-center gap-1.5 text-xs text-[#5a5a62] hover:text-[#ef4444] transition-colors"
                                            >
                                                <Trash2 size={13} /> Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        {/* Programme Name */}
                                        <Field label="Programme Name" required error={errors[`prog_${idx}_name`]}>
                                            <input
                                                type="text"
                                                value={prog.name}
                                                onChange={e => setProg("name", e.target.value, idx)}
                                                placeholder="e.g. Cultural Night, DJ Night, Hackathon"
                                                maxLength={50}
                                                className={inputCls(errors[`prog_${idx}_name`])}
                                            />
                                        </Field>

                                        {/* Venue */}
                                        <Field label="Venue" required error={errors[`prog_${idx}_venueId`]}>
                                            <div className="relative">
                                                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a62]" />
                                                <select
                                                    value={prog.venueId}
                                                    onChange={e => setProg("venueId", e.target.value, idx)}
                                                    className={`${selectCls(errors[`prog_${idx}_venueId`])} pl-9 appearance-none`}
                                                >
                                                    <option value="">Select a venue</option>
                                                    {(venues.length > 0 ? venues : MOCK_VENUES).map(v => (
                                                        <option key={v.venueId} value={v.venueId}>
                                                            {v.venueName} — Capacity: {v.venueCapacity.toLocaleString()}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {prog.venueId && (
                                                <p className="text-[10px] text-[#5a5a62] mt-1">
                                                    Selected: {getVenueName(prog.venueId)} ·{" "}
                                                    Capacity: {(venues.length > 0 ? venues : MOCK_VENUES).find(v => v.venueId === prog.venueId)?.venueCapacity?.toLocaleString()}
                                                </p>
                                            )}
                                        </Field>

                                        {/* Description */}
                                        <Field label="Programme Description" error={errors[`prog_${idx}_description`]}>
                                            <textarea
                                                value={prog.description}
                                                onChange={e => setProg("description", e.target.value, idx)}
                                                placeholder="Briefly describe this programme..."
                                                rows={2}
                                                maxLength={500}
                                                className={`${inputCls(errors[`prog_${idx}_description`])} resize-none`}
                                            />
                                            <p className="text-[10px] text-[#3a3a42] mt-1 text-right">{prog.description.length}/500</p>
                                        </Field>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add programme button */}
                        {programmes.length < 10 && (
                            <button
                                onClick={addProgramme}
                                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#2a2a2e] rounded-xl text-[#5a5a62] hover:border-[#a3e635] hover:text-[#a3e635] transition-all text-sm font-semibold mb-6"
                            >
                                <Plus size={16} /> Add Another Programme
                            </button>
                        )}

                        {/* Submit error */}
                        {errors.submit && (
                            <div className="flex items-center gap-2 bg-[#ef4444]/10 border border-[#ef4444]/30 rounded-xl px-4 py-3 text-sm text-[#ef4444] mb-5">
                                <AlertCircle size={14} className="shrink-0" /> {errors.submit}
                            </div>
                        )}

                        {/* Approval notice */}
                        <div className="bg-[#1e1e22] border border-[#2a2a2e] rounded-xl px-4 py-3 text-xs text-[#5a5a62] leading-relaxed mb-6">
                            <p className="text-[#a0a0ab] font-semibold mb-0.5">Admin approval required</p>
                            All {programmes.length} programme{programmes.length > 1 ? "s" : ""} will be reviewed by an admin before going live.
                            You'll receive an email notification on approval or rejection.
                        </div>

                        {/* Submit button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`w-full py-4 font-extrabold text-sm rounded-xl transition-all active:scale-[0.98] ${loading
                                    ? "bg-[#1e1e22] text-[#5a5a62] cursor-wait"
                                    : "bg-[#a3e635] text-[#0c0c0f] hover:bg-[#b8f056]"
                                }`}
                        >
                            {loading ? "Submitting..." : `Submit Event for Review →`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateEventPage;