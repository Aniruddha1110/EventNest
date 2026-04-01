import React, { useState } from "react";
import ProfilePageLayout from "./ProfilePageLayout";

// ─── ORGANISER DATA ──────────────────────────────────────────────────────────
// Replace with real backend data when integrating
const currentOrganiser = {
  name: "Rahul Mehta",
  username: "@rahul_organises",
  role: "organiser", // ← always "organiser" here
  phone: "+91 91234 56789",
  email: "rahul.mehta@example.com",
};

const MY_EVENTS = [
  {
    id: "EVT-001",
    title: "TechConf 2026",
    date: "Mar 23, 2026",
    status: "approved",
    attendees: 249,
    capacity: 320,
  },
  {
    id: "EVT-002",
    title: "AI & Future Summit",
    date: "Apr 5, 2026",
    status: "pending",
    attendees: 0,
    capacity: 200,
  },
  {
    id: "EVT-003",
    title: "Indie Music Night",
    date: "Apr 12, 2026",
    status: "approved",
    attendees: 321,
    capacity: 500,
  },
];

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
  // 1. STATE FOR TABS
  const [activeTab, setActiveTab] = useState("all");

  // 2. CALCULATE COUNTS
  const tabs = [
    { id: "all", label: "All Events", count: MY_EVENTS.length },
    {
      id: "approved",
      label: "Approved",
      count: MY_EVENTS.filter((e) => e.status === "approved").length,
    },
    {
      id: "pending",
      label: "Pending",
      count: MY_EVENTS.filter((e) => e.status === "pending").length,
    },
    {
      id: "rejected",
      label: "Rejected",
      count: MY_EVENTS.filter((e) => e.status === "rejected").length,
    },
  ];

  // 3. FILTER THE EVENTS ARRAY
  const filteredEvents = MY_EVENTS.filter((evt) => {
    if (activeTab === "all") return true;
    return evt.status === activeTab;
  });

  // Notice the explicit return here!
  return (
    <ProfilePageLayout user={currentOrganiser}>
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-main">
          My <span className="text-themeAccent">Events</span>
        </h1>
        <span className="text-xs text-muted bg-cardBg border border-border px-3 py-1.5 rounded-xl">
          {filteredEvents.length} Total
        </span>
      </div>

      {/* ── TABS ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#1e1e22] text-main border border-[#3a3a42]" // Active state
                : "text-muted hover:text-gray-300 hover:bg-cardBg border border-transparent" // Inactive state
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? "bg-cardBg text-gray-300"
                  : "bg-[#1e1e22] text-muted"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── MY EVENTS LIST ───────────────────────────────────────── */}
      <div className="space-y-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((evt) => {
            const sc = STATUS_CONFIG[evt.status];
            const pct = Math.round((evt.attendees / evt.capacity) * 100);
            return (
              <div
                key={evt.id}
                className="bg-cardBg border border-border rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-[#a3e635]/20"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-[10px] font-mono text-[#3a3a42] mb-1">
                      {evt.id}
                    </p>
                    <h3 className="font-bold text-main text-base">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-muted mt-1">📅 {evt.date}</p>
                  </div>
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex-shrink-0 ${sc.color}`}
                  >
                    {sc.label}
                  </span>
                </div>

                {/* Capacity bar — only for approved */}
                {evt.status === "approved" && (
                  <div>
                    <div className="flex justify-between text-xs text-muted mb-1.5">
                      <span>Attendees</span>
                      <span className="text-main font-semibold">
                        {evt.attendees} / {evt.capacity}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#1e1e22] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-[#ef4444]" : pct >= 70 ? "bg-[#fb923c]" : "bg-themeAccent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted mt-1">{pct}% full</p>
                  </div>
                )}

                {/* Pending message */}
                {evt.status === "pending" && (
                  <p className="text-xs text-[#fb923c] mt-2">
                    ⏳ Awaiting admin approval.
                  </p>
                )}

                {/* Rejected message */}
                {evt.status === "rejected" && (
                  <p className="text-xs text-[#ef4444] mt-2">
                    ❌ This event was not approved.
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted border border-dashed border-border rounded-2xl">
            No events found for this category.
          </div>
        )}
      </div>
    </ProfilePageLayout>
  ); // <--- Notice the closing return parenthesis
};

export default OrganiserProfilePage;
