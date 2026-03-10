import React, { useState } from 'react';
import ProfilePageLayout from './ProfilePageLayout';


const ORGANISER_DATA = {
  name: "Priya Mehta",
  username: "@priya_events",
  role: "organiser",
  phone: "+91 98765 00000",
  email: "priya.mehta@example.com",
};

const MY_EVENTS = [
  { id: 1, title: "Tech Innovators Conference", date: "2026-03-18", venue: "Campus - 6, Auditorium", attendees: 240, capacity: 300, status: "approved" },
  { id: 2, title: "Global Culture Fest",        date: "2026-03-20", venue: "Campus - 13, Cricket Stadium",    attendees: 180, capacity: 200, status: "approved" },
  { id: 3, title: "Summer Music Jam",            date: "2026-04-05", venue: "Campus - 15, OAT",     attendees: 0,   capacity: 500, status: "pending" },
  { id: 4, title: "Startup Pitch Night",         date: "2026-04-12", venue: "Campus - 6 Auditorium",             attendees: 0,   capacity: 80,  status: "pending" },
  { id: 5, title: "Sci-Fi VR Experience",        date: "2026-04-22", venue: "Campus - 13, Electronics Hall",          attendees: 0,   capacity: 150, status: "rejected" },
];


const STATUS = {
  approved: { label: "Approved",  bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  pending:  { label: "Pending",   bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
  rejected: { label: "Rejected",  bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
};


const EmergencyMailModal = ({ onClose, events }) => {
  const [selectedEvent, setSelectedEvent] = useState("");
  const [reason, setReason] = useState("cancelled");
  const [details, setDetails] = useState("");
  const [sent, setSent] = useState(false);

  const approvedEvents = events.filter(e => e.status === "approved");

  const handleSend = () => {
    if (!selectedEvent || !details.trim()) return;
    // Replace with actual API call: POST /api/events/:id/emergency-mail
    console.log("Sending emergency mail:", { selectedEvent, reason, details });
    setSent(true);
    setTimeout(() => { setSent(false); onClose(); }, 2000);
  };

  const reasonLabels = {
    cancelled: "Event Cancelled",
    venue:     "Venue Changed",
    time:      "Time Changed",
    other:     "Other Update",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold">
          &times;
        </button>

        {sent ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-700">Mail Sent!</h3>
            <p className="text-gray-500 text-sm mt-2">All registered attendees have been notified.</p>
          </div>
        ) : (
          <>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl">🚨</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Send Emergency Notice</h3>
                <p className="text-xs text-gray-400">This will email ALL registered attendees immediately.</p>
              </div>
            </div>

            <div className="space-y-4">
              
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Select Event</label>
                <select
                  value={selectedEvent}
                  onChange={e => setSelectedEvent(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                >
                  <option value="">— Choose an event —</option>
                  {approvedEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Reason</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(reasonLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setReason(key)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                        reason === key
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              
              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase mb-1 block">Message to Attendees</label>
                <textarea
                  rows={4}
                  placeholder="Explain what changed and any important instructions for attendees..."
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-black"
                />
              </div>

              
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 text-xs text-red-600 flex gap-2 items-start">
                <span className="text-base leading-none">⚠️</span>
                <span>This action is <strong>irreversible</strong>. Use only in genuine emergencies.</span>
              </div>

              
              <button
                onClick={handleSend}
                disabled={!selectedEvent || !details.trim()}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                🚨 Send Emergency Notice Now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


const OrganiserProfilePage = () => {
  const [activeTab, setActiveTab]           = useState("all");    // "all" | "pending" | "approved"
  const [mailModalOpen, setMailModalOpen]   = useState(false);

  const tabs = [
    { key: "all",      label: "All Events",  count: MY_EVENTS.length },
    { key: "approved", label: "Approved",    count: MY_EVENTS.filter(e => e.status === "approved").length },
    { key: "pending",  label: "Pending",     count: MY_EVENTS.filter(e => e.status === "pending").length },
  ];

  const filtered = activeTab === "all"
    ? MY_EVENTS
    : MY_EVENTS.filter(e => e.status === activeTab);

  const pendingCount = MY_EVENTS.filter(e => e.status === "pending").length;

  return (
    <>
      <ProfilePageLayout user={ORGANISER_DATA}>

        {/* ── SECTION: Emergency Mail Button ─────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Events</h2>
          <button
            onClick={() => setMailModalOpen(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-sm"
          >
            🚨 Emergency Notice
          </button>
        </div>

        
        {pendingCount > 0 && (
          <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-yellow-500 text-xl">⏳</span>
            <div>
              <p className="text-sm font-semibold text-yellow-800">
                {pendingCount} event{pendingCount > 1 ? "s" : ""} awaiting admin approval
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                These won't be visible to users until approved.
              </p>
            </div>
          </div>
        )}

        
        <div className="flex gap-2 mb-5 border-b border-gray-100 pb-3">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? "bg-white text-black" : "bg-gray-100 text-gray-600"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm">No events in this category.</p>
            </div>
          ) : filtered.map(event => {
            const s = STATUS[event.status];
            const fillPercent = event.capacity > 0 ? Math.round((event.attendees / event.capacity) * 100) : 0;
            return (
              <div key={event.id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 truncate">{event.title}</h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">📍 {event.venue}</p>
                    <p className="text-xs text-gray-400">
                      📅 {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>

                  
                  <span className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: s.bg, color: s.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
                    {s.label}
                  </span>
                </div>

                
                {event.status === "approved" && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>Attendees</span>
                      <span className="font-semibold text-gray-700">{event.attendees} / {event.capacity}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${fillPercent}%`,
                          background: fillPercent > 80 ? "#ef4444" : "#a3e635"
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{fillPercent}% capacity filled</p>
                  </div>
                )}

                
                {event.status === "pending" && (
                  <p className="mt-3 pt-3 border-t border-gray-50 text-xs text-yellow-600">
                    🕐 Waiting for admin to review and approve this event.
                  </p>
                )}

                
                {event.status === "rejected" && (
                  <p className="mt-3 pt-3 border-t border-gray-50 text-xs text-red-500">
                    ❌ This event was rejected by admin. Contact support for more information.
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </ProfilePageLayout>

      
      {mailModalOpen && (
        <EmergencyMailModal
          onClose={() => setMailModalOpen(false)}
          events={MY_EVENTS}
        />
      )}
    </>
  );
};

export default OrganiserProfilePage;