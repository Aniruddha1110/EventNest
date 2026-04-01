// import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
// import { Search, ChevronDown, Calendar, Clock, Tag, ArrowUpDown } from "lucide-react";

// // ─── API base ─────────────────────────────────────────────────────────────────
// const API = "http://localhost:9090";

// // ─── Mock data — replace with API call when backend is ready ──────────────────
// const MOCK_EVENTS = [
//   { id: "E-001", name: "Tech Fest",            startDate: "2026-01-11", endDate: "2026-01-15", time: "10:00", duration: 5,  type: "Free",  status: "completed", description: "Annual technology festival featuring coding competitions, hackathons, and robotics challenges." },
//   { id: "E-002", name: "Rangoli Making",        startDate: "2026-01-16", endDate: "2026-01-16", time: "12:00", duration: 8,  type: "Free",  status: "completed", description: "Inter-college rangoli competition celebrating traditional art forms with modern themes." },
//   { id: "E-003", name: "Debate",                startDate: "2026-01-18", endDate: "2026-01-18", time: "08:00", duration: 12, type: "Free",  status: "completed", description: "Parliamentary-style inter-college debate competition on contemporary issues." },
//   { id: "E-004", name: "Saraswati Puja",        startDate: "2026-01-23", endDate: "2026-01-23", time: "07:00", duration: 10, type: "Free",  status: "completed", description: "Traditional Saraswati Puja celebrations across campus with cultural performances." },
//   { id: "E-005", name: "Republic Day",          startDate: "2026-01-26", endDate: "2026-01-26", time: "07:30", duration: 5,  type: "Free",  status: "completed", description: "National Republic Day celebrations with parade, flag hoisting, and cultural performances." },
//   { id: "E-006", name: "Flower Show",           startDate: "2026-01-31", endDate: "2026-01-31", time: "08:00", duration: 8,  type: "Free",  status: "completed", description: "Annual flower exhibition and competition open to all departments." },
//   { id: "E-007", name: "KIIT Fest School Wise", startDate: "2026-02-01", endDate: "2026-02-13", time: "08:00", duration: 12, type: "Free",  status: "completed", description: "School-wise inter-department cultural and technical competitions across all KIIT schools." },
//   { id: "E-008", name: "KIIT Fest",             startDate: "2026-02-14", endDate: "2026-02-16", time: "18:00", duration: 4,  type: "Paid",  status: "completed", description: "Flagship annual cultural festival of KIIT University with celebrity performances." },
//   { id: "E-009", name: "Manpasand",             startDate: "2026-02-19", endDate: "2026-02-19", time: "14:00", duration: 2,  type: "Free",  status: "completed", description: "A special showcase event where students perform their personal passion projects." },
//   { id: "E-010", name: "Rang-e-Bahar",          startDate: "2026-03-04", endDate: "2026-03-04", time: "07:00", duration: 15, type: "Paid",  status: "ongoing",   description: "Spring celebration festival with Holi-themed events, cultural programs, and outdoor activities." },
//   { id: "E-011", name: "Spring Hackathon",      startDate: "2026-04-10", endDate: "2026-04-12", time: "09:00", duration: 48, type: "Free",  status: "upcoming",  description: "A 48-hour coding marathon open to all students. Build, innovate, and win exciting prizes." },
//   { id: "E-012", name: "Cultural Carnival",     startDate: "2026-04-20", endDate: "2026-04-22", time: "10:00", duration: 6,  type: "Paid",  status: "upcoming",  description: "A grand cultural carnival celebrating diversity with music, dance, food, and art from across India." },
// ];

// const EVENTS_PER_PAGE = 10;

// // ─── Status badge ─────────────────────────────────────────────────────────────
// const StatusBadge = ({ status }) => {
//   const map = {
//     upcoming:  { bg: "bg-[#C4F249]", text: "text-black" },
//     ongoing:   { bg: "bg-black",     text: "text-[#C4F249]" },
//     completed: { bg: "bg-gray-200",  text: "text-gray-600" },
//   };
//   const s = map[status] || map.completed;
//   return (
//     <span className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wide ${s.bg} ${s.text}`}>
//       {status}
//     </span>
//   );
// };

// // ─── Event Card ───────────────────────────────────────────────────────────────
// const EventCard = ({ event, onClick }) => (
//   <div
//     onClick={onClick}
//     className="bg-white cursor-pointer group border border-gray-100 hover:border-[#C4F249] hover:shadow-xl transition-all duration-200 overflow-hidden"
//   >
//     {/* Top accent bar */}
//     <div className={`h-1 w-full ${event.type === "Paid" ? "bg-black" : "bg-[#C4F249]"}`} />

//     <div className="p-6">
//       {/* Header row */}
//       <div className="flex items-start justify-between gap-3 mb-4">
//         <div className="flex-1 min-w-0">
//           <h3 className="text-xl font-bold text-black group-hover:text-gray-700 transition leading-tight truncate">
//             {event.name}
//           </h3>
//         </div>
//         <div className="flex flex-col items-end gap-1.5 shrink-0">
//           <StatusBadge status={event.status} />
//           <span className={`text-xs font-bold px-2 py-0.5 ${event.type === "Paid" ? "bg-black text-[#C4F249]" : "bg-[#C4F249] text-black"}`}>
//             {event.type}
//           </span>
//         </div>
//       </div>

//       {/* Description */}
//       <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-2">
//         {event.description}
//       </p>

//       {/* Meta row */}
//       <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
//         <span className="flex items-center gap-1.5">
//           <Calendar size={13} />
//           {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
//           {event.startDate !== event.endDate && (
//             <> → {new Date(event.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>
//           )}
//         </span>
//         <span className="flex items-center gap-1.5">
//           <Clock size={13} />
//           {event.time}
//         </span>
//         <span className="flex items-center gap-1.5">
//           <Tag size={13} />
//           {event.duration}h duration
//         </span>
//       </div>

//       {/* CTA */}
//       <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
//         <span className="text-xs text-gray-400 font-mono">{event.id}</span>
//         <span className="text-xs font-bold text-black group-hover:text-gray-600 transition">
//           View Details →
//         </span>
//       </div>
//     </div>
//   </div>
// );

// // ─── Main Page ────────────────────────────────────────────────────────────────
// const EventsPage = () => {
//   const navigate = useNavigate();

//   // ── Auth guard ───────────────────────────────────────────────────────────────
//   // When backend is ready replace with real token check
//   // const token = localStorage.getItem("token");
//   // useEffect(() => { if (!token) navigate("/login"); }, []);

//   // ── State ─────────────────────────────────────────────────────────────────────
//   const [events, setEvents]         = useState([]);
//   const [backendOnline, setBackendOnline] = useState(false);
//   const [search, setSearch]         = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [sortOrder, setSortOrder]   = useState("asc");   // asc = earliest first
//   const [currentPage, setCurrentPage] = useState(1);

//   // ── Fetch events ──────────────────────────────────────────────────────────────
//   useEffect(() => {
//     const fetchEvents = async () => {
//       try {
//         const res = await fetch(`${API}/api/events`);
//         if (!res.ok) throw new Error("offline");
//         const data = await res.json();
//         setEvents(data);
//         setBackendOnline(true);
//       } catch {
//         setEvents(MOCK_EVENTS);
//         setBackendOnline(false);
//       }
//     };
//     fetchEvents();
//   }, []);

//   // ── Filter + search + sort ────────────────────────────────────────────────────
//   const filtered = useMemo(() => {
//     let result = [...events];

//     if (statusFilter !== "all")
//       result = result.filter(e => e.status === statusFilter);

//     if (search.trim())
//       result = result.filter(e =>
//         e.name.toLowerCase().includes(search.toLowerCase())
//       );

//     result.sort((a, b) => {
//       const diff = new Date(a.startDate) - new Date(b.startDate);
//       return sortOrder === "asc" ? diff : -diff;
//     });

//     return result;
//   }, [events, statusFilter, search, sortOrder]);

//   // ── Pagination ────────────────────────────────────────────────────────────────
//   const totalPages  = Math.max(1, Math.ceil(filtered.length / EVENTS_PER_PAGE));
//   const pageStart   = (currentPage - 1) * EVENTS_PER_PAGE;
//   const pageEvents  = filtered.slice(pageStart, pageStart + EVENTS_PER_PAGE);

//   // Reset to page 1 whenever filters change
//   useEffect(() => setCurrentPage(1), [search, statusFilter, sortOrder]);

//   // ── Handlers ──────────────────────────────────────────────────────────────────
//   const handleCardClick = (eventId) => navigate(`/events/${eventId}`);

//   const statusCounts = {
//     all:       events.length,
//     upcoming:  events.filter(e => e.status === "upcoming").length,
//     ongoing:   events.filter(e => e.status === "ongoing").length,
//     completed: events.filter(e => e.status === "completed").length,
//   };

//   // ── Render ────────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-[#F9F9F9] font-sans selection:bg-lime-200">

//       {/* ── Nav ──────────────────────────────────────────────────────────────── */}
//       <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
//         <button
//           onClick={() => navigate("/user")}
//           className="bg-black text-main text-sm font-bold px-3 py-1.5 tracking-wide hover:opacity-90 transition"
//         >
//           EventSphere
//         </button>
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => navigate("/userprofile")}
//             className="text-sm font-medium text-gray-600 hover:text-black transition"
//           >
//             My Profile
//           </button>
//           <button
//             onClick={() => navigate("/")}
//             className="bg-black text-main text-sm font-semibold px-4 py-1.5 hover:opacity-80 transition"
//           >
//             Logout
//           </button>
//         </div>
//       </nav>

//       {/* ── Hero header ──────────────────────────────────────────────────────── */}
//       <div className="max-w-7xl mx-auto px-6 pt-6 pb-10">
//         <h1 className="text-[#C4F249] text-6xl md:text-7xl font-normal leading-[1.1] tracking-tight mb-2">
//           All Events
//         </h1>
//         <p className="text-gray-500 text-sm">
//           {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
//           {!backendOnline && (
//             <span className="ml-3 text-yellow-600 text-xs font-medium">
//               ⚠ Showing mock data — backend offline
//             </span>
//           )}
//         </p>
//       </div>

//       {/* ── Controls bar ─────────────────────────────────────────────────────── */}
//       <div className="max-w-7xl mx-auto px-6 mb-8">
//         <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">

//           {/* Search */}
//           <div className="relative flex-1 max-w-md">
//             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search events by name..."
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black transition"
//             />
//           </div>

//           {/* Status filter pills */}
//           <div className="flex gap-2 flex-wrap">
//             {["all", "upcoming", "ongoing", "completed"].map(s => (
//               <button
//                 key={s}
//                 onClick={() => setStatusFilter(s)}
//                 className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
//                   statusFilter === s
//                     ? "bg-black text-[#C4F249]"
//                     : "bg-white border border-gray-200 text-gray-500 hover:border-black"
//                 }`}
//               >
//                 {s} {statusCounts[s] !== undefined && `(${statusCounts[s]})`}
//               </button>
//             ))}
//           </div>

//           {/* Sort */}
//           <button
//             onClick={() => setSortOrder(p => p === "asc" ? "desc" : "asc")}
//             className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-black transition"
//           >
//             <ArrowUpDown size={14} />
//             Date {sortOrder === "asc" ? "↑ Earliest" : "↓ Latest"}
//           </button>
//         </div>
//       </div>

//       {/* ── Events grid ──────────────────────────────────────────────────────── */}
//       <div className="max-w-7xl mx-auto px-6 pb-16">
//         {pageEvents.length === 0 ? (
//           <div className="text-center py-24">
//             <p className="text-4xl font-bold text-gray-200 mb-3">No events found</p>
//             <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
//             {pageEvents.map(event => (
//               <EventCard
//                 key={event.id}
//                 event={event}
//                 onClick={() => handleCardClick(event.id)}
//               />
//             ))}
//           </div>
//         )}

//         {/* Pagination */}
//         {totalPages > 1 && (
//           <div className="flex justify-center items-center gap-2 mt-12">
//             <button
//               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
//               disabled={currentPage === 1}
//               className="px-4 py-2 border border-gray-200 text-sm font-medium disabled:opacity-30 hover:border-black transition"
//             >
//               ← Prev
//             </button>

//             {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
//               <button
//                 key={page}
//                 onClick={() => setCurrentPage(page)}
//                 className={`w-9 h-9 text-sm font-bold transition ${
//                   currentPage === page
//                     ? "bg-black text-[#C4F249]"
//                     : "border border-gray-200 text-gray-600 hover:border-black"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}

//             <button
//               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
//               disabled={currentPage === totalPages}
//               className="px-4 py-2 border border-gray-200 text-sm font-medium disabled:opacity-30 hover:border-black transition"
//             >
//               Next →
//             </button>
//           </div>
//         )}
//       </div>

//     </div>
//   );
// };

// export default EventsPage;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, Clock, Tag, ArrowRight } from "lucide-react";
import { MOCK_EVENTS } from "./mockData";

const API = "http://localhost:9090";

// ─── Event Card ───────────────────────────────────────────────────────────────
const EventCard = ({ event, onClick }) => {
  const statusStyle = {
    ongoing: { badge: "bg-black text-[#C4F249]", bar: "bg-[#C4F249]" },
    upcoming: { badge: "bg-[#C4F249] text-black", bar: "bg-black" },
    completed: { badge: "bg-gray-200 text-gray-600", bar: "bg-gray-300" },
  }[event.status] || { badge: "bg-gray-200 text-gray-600", bar: "bg-gray-300" };

  const avgRating = event.feedbacks?.length
    ? (
        event.feedbacks.reduce((s, f) => s + f.rating, 0) /
        event.feedbacks.length
      ).toFixed(1)
    : null;

  const ctaLabel =
    {
      ongoing: "View Details →",
      upcoming: event.type === "Paid" ? "Buy Ticket →" : "Register →",
      completed: "Feedback →",
    }[event.status] || "View →";

  return (
    <div
      onClick={onClick}
      className="bg-white cursor-pointer group border border-gray-100 hover:border-black hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className={`h-1 w-full ${statusStyle.bar}`} />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-xl font-bold text-black group-hover:opacity-70 transition leading-tight">
            {event.name}
          </h3>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wide ${statusStyle.badge}`}
            >
              {event.status}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 ${event.type === "Paid" ? "bg-black text-[#C4F249]" : "bg-[#C4F249] text-black"}`}
            >
              {event.type}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2 flex-1">
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
          {avgRating && <span>⭐ {avgRating}</span>}
        </div>
        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-300 font-mono">{event.id}</span>
          <span className="text-xs font-bold text-black group-hover:opacity-60 transition">
            {ctaLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = ({
  title,
  subtitle,
  events,
  accentColor,
  onCardClick,
  viewAllPath,
  navigate,
}) => (
  <section className="mb-16">
    <div className="flex items-end justify-between mb-6">
      <div>
        <h2 className="text-4xl font-bold" style={{ color: accentColor }}>
          {title}
        </h2>
        <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
      </div>
      {viewAllPath && events.length >= 3 && (
        <button
          onClick={() => navigate(viewAllPath)}
          className="flex items-center gap-1.5 text-sm font-bold border-b-2 border-black text-black hover:opacity-60 transition pb-0.5"
        >
          View All <ArrowRight size={14} />
        </button>
      )}
    </div>
    {events.length === 0 ? (
      <div className="bg-white border border-dashed border-gray-200 py-12 text-center">
        <p className="text-sm text-gray-400">
          No {title.toLowerCase()} right now
        </p>
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
  const [allEvents, setAllEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [backendOnline, setBackendOnline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/events`);
        if (!res.ok) throw new Error();
        setAllEvents(await res.json());
        setBackendOnline(true);
      } catch {
        setAllEvents(MOCK_EVENTS);
      }
    })();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const filtered = search.trim()
    ? allEvents.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allEvents;

  const ongoing = filtered.filter((e) => e.status === "ongoing");
  const upcoming = filtered.filter(
    (e) => e.status === "upcoming" && new Date(e.startDate) > today,
  );
  const completed = filtered.filter((e) => e.status === "completed");

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
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate("/events/ongoing")}
            className="text-sm font-medium text-gray-500 hover:text-black transition"
          >
            Ongoing
          </button>
          <button
            onClick={() => navigate("/events/upcoming")}
            className="text-sm font-medium text-gray-500 hover:text-black transition"
          >
            Upcoming
          </button>
          <button
            onClick={() => navigate("/userprofile")}
            className="text-sm font-medium text-gray-500 hover:text-black transition"
          >
            My Profile
          </button>
          <button
            onClick={() => navigate("/")}
            className="bg-black text-main text-sm font-semibold px-4 py-1.5 hover:opacity-80 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-10">
        <h1 className="text-[#C4F249] text-6xl md:text-7xl font-normal leading-[1.1] tracking-tight mb-4">
          Events
        </h1>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            {ongoing.length} ongoing · {upcoming.length} upcoming ·{" "}
            {completed.length} completed
            {!backendOnline && (
              <span className="ml-3 text-yellow-600 text-xs">
                ⚠ Mock data — backend offline
              </span>
            )}
          </p>
          <div className="relative max-w-sm w-full">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-white text-sm focus:outline-none focus:border-black transition"
            />
          </div>
        </div>
      </div>

      {/* Three sections */}
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
          accentColor="#1a1a1a"
          onCardClick={(id) => navigate(`/events/${id}`)}
          viewAllPath="/events/upcoming"
          navigate={navigate}
        />
        <Section
          title="Completed Events"
          subtitle="Past events — leave your feedback"
          events={completed}
          accentColor="#9ca3af"
          onCardClick={(id) => navigate(`/events/${id}`)}
          viewAllPath="/events/completed"
          navigate={navigate}
        />
      </div>
    </div>
  );
};

export default EventsPage;
