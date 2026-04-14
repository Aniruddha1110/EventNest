import React, { useState, useEffect } from "react";
import axios from "axios";
import ProfilePageLayout from "./ProfilePageLayout";

// ─── ORGANISER DATA ──────────────────────────────────────────────────────────
// Replace with real backend data when integrating
// currentOrganiser loaded from localStorage (set on login)
// const _lsOName  = localStorage.getItem("name")  || "Rahul Mehta";
// const _lsOEmail = localStorage.getItem("email") || "rahul.mehta@example.com";
// const currentOrganiser = {
//   name:     _lsOName,
//   username: "@" + (_lsOName.toLowerCase().replace(/\s+/g, "_")),
//   role:     localStorage.getItem("role") || "organiser",
//   phone:    "",
//   email:    _lsOEmail,
// };



// const MY_EVENTS = [
//   {
//     id: "EVT-001",
//     title: "TechConf 2026",
//     date: "Mar 23, 2026",
//     status: "approved",
//     attendees: 249,
//     capacity: 320,
//   },
//   {
//     id: "EVT-002",
//     title: "AI & Future Summit",
//     date: "Apr 5, 2026",
//     status: "pending",
//     attendees: 0,
//     capacity: 200,
//   },
//   {
//     id: "EVT-003",
//     title: "Indie Music Night",
//     date: "Apr 12, 2026",
//     status: "approved",
//     attendees: 321,
//     capacity: 500,
//   },
// ];

const STATUS_CONFIG = {
  approved: { label: "Approved", color: "bg-themeAccent text-[#0c0c0f]" },
  pending: {
    label: "Pending",
    color: "bg-[#fb923c]/20 text-[#fb923c] border border-[#fb923c]/30",
  },
  rejected: {
    label: "Rejected",
    color: "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30",
  },
};

// Notice the curly brace { here instead of parenthesis!
const OrganiserProfilePage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentOrganiser, setCurrentOrganiser] = useState({
    name:     localStorage.getItem("name") || "Loading...",
    username: "@loading",
    role:     localStorage.getItem("role") || "organiser",
    phone:    "",
    email:    localStorage.getItem("email") || "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch profile + events in parallel
    Promise.all([
      fetch("http://localhost:9090/api/organisers/profile", { headers }).then(r => r.json()),
      fetch("http://localhost:9090/api/organisers/events",  { headers }).then(r => r.json()),
    ]).then(([profileJson, eventsJson]) => {
      // Profile
      const p = profileJson.data;
      if (p) {
        setCurrentOrganiser({
          name:     p.organiserName || "",
          username: "@" + (p.organiserUsername || "").toLowerCase(),
          role:     localStorage.getItem("role") || "organiser",
          phone:    p.organiserPhoneNo || "",
          email:    p.organiserEmail || "",
        });
      }

      // Events — backend returns List<ProgrammeResponse>
      // Each programme has: programmeId, programmeName, programmeStatus,
      // eventId, eventName, eventStartDate (on EventResponse via join),
      // venueCapacity, seatsLeft
      // We deduplicate by eventId and take the worst status per event:
      // if any programme is pending → pending, all approved → approved, any rejected → rejected
      const programmes = eventsJson.data || [];

      // Group programmes by eventId
      const eventMap = {};
      programmes.forEach(prog => {
        if (!eventMap[prog.eventId]) {
          eventMap[prog.eventId] = {
            id:         prog.eventId,
            title:      prog.eventName,
            date:       prog.eventStartDate
                          ? new Date(prog.eventStartDate).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric"
                            })
                          : "—",
            programmes: [],
          };
        }
        eventMap[prog.eventId].programmes.push(prog);
      });

      // Derive status per event from programme statuses
      const derived = Object.values(eventMap).map(evt => {
        const statuses = evt.programmes.map(p => p.programmeStatus?.toLowerCase());
        let status = "approved";
        if (statuses.some(s => s === "rejected")) status = "rejected";
        else if (statuses.some(s => s === "pending"))  status = "pending";

        // Capacity = sum of all venue capacities across programmes
        const capacity  = evt.programmes.reduce((sum, p) => sum + (p.venueCapacity || 0), 0);
        const attendees = evt.programmes.reduce((sum, p) => sum + ((p.venueCapacity || 0) - (p.seatsLeft ?? p.venueCapacity ?? 0)), 0);

        return { ...evt, status, capacity, attendees };
      });

      setEvents(derived);
    }).catch(err => {
      console.error("OrganiserProfilePage fetch error:", err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const tabs = [
    { id: "all",      label: "All Events", count: events.length },
    { id: "approved", label: "Approved",   count: events.filter(e => e.status === "approved").length },
    { id: "pending",  label: "Pending",    count: events.filter(e => e.status === "pending").length },
    { id: "rejected", label: "Rejected",   count: events.filter(e => e.status === "rejected").length },
  ];

  const filteredEvents = events.filter(evt =>
    activeTab === "all" ? true : evt.status === activeTab
  );

  return (
    <ProfilePageLayout user={currentOrganiser}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-main">
          My <span className="text-themeAccent">Events</span>
        </h1>
        <span className="text-xs text-muted bg-cardBg border border-border px-3 py-1.5 rounded-xl">
          {filteredEvents.length} Total
        </span>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                /* FIX 1: Replaced hardcoded hex with dynamic theme classes */
                ? "bg-cardBg text-main border border-border shadow-sm"
                /* FIX 2: Replaced hover:text-gray-300 with hover:text-main */
                : "text-muted hover:text-main hover:bg-cardBg border border-transparent"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              /* FIX 3: Removed hardcoded text-gray-300 from the badge */
              activeTab === tab.id ? "bg-pageBg text-main font-semibold" : "bg-pageBg text-muted"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Loading your events...</div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((evt) => {
            const sc  = STATUS_CONFIG[evt.status] || STATUS_CONFIG.pending;
            const pct = evt.capacity > 0 ? Math.round((evt.attendees / evt.capacity) * 100) : 0;
            return (
              <div
                key={evt.id}
                className="bg-cardBg border border-border rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-[#a3e635]/20"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-[10px] font-mono text-textMuted mb-1">{evt.id}</p>
                    <h3 className="font-bold text-main text-base">{evt.title}</h3>
                    <p className="text-xs text-muted mt-1">📅 {evt.date}</p>
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex-shrink-0 ${sc.color}`}>
                    {sc.label}
                  </span>
                </div>

                {evt.status === "approved" && evt.capacity > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-muted mb-1.5">
                      <span>Attendees</span>
                      <span className="text-main font-semibold">{evt.attendees} / {evt.capacity}</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-[#ef4444]" : pct >= 70 ? "bg-[#fb923c]" : "bg-themeAccent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted mt-1">{pct}% full</p>
                  </div>
                )}

                {evt.status === "pending" && (
                  <p className="text-xs text-[#fb923c] mt-2">⏳ Awaiting admin approval.</p>
                )}
                {evt.status === "rejected" && (
                  <p className="text-xs text-[#ef4444] mt-2">❌ This event was not approved.</p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted border border-dashed border-border rounded-2xl">
          No events found for this category.
        </div>
      )}
    </ProfilePageLayout>
  );
};

export default OrganiserProfilePage;