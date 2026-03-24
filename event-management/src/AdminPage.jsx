import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Trash2, Edit2, Check, X, Plus,
  User, Building2, Calendar, BookOpen, Users,
  Mail, AlertCircle, ShieldOff, LogOut
} from "lucide-react";

// ─── API base ──────────────────────
const API = "http://localhost:9090";

// ─── Protected admin IDs — these 3 can NEVER be removed ──────────────────────
// A-0001: Aniruddha Dutta, A-0002: Anuskaa Parida, A-0003: Abhishek Payra
const PROTECTED_ADMIN_IDS = ["A-0001", "A-0002", "A-0003"];

// =============================================================================
//  SHARED SUB-COMPONENTS
// =============================================================================

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    approved:  { bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
    pending:   { bg: "#fef9c3", color: "#854d0e", dot: "#eab308" },
    rejected:  { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
    completed: { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" },
    ongoing:   { bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
    upcoming:  { bg: "#ecfccb", color: "#365314", dot: "#84cc16" },
  };
  const s = map[status] || map.pending;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span style={{ background: s.bg, color: s.color }}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full">
      <span style={{ background: s.dot, width: 6, height: 6, borderRadius: "50%", display: "inline-block" }} />
      {label}
    </span>
  );
};

// ─── Confirm dialog ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 flex items-center justify-center z-[200]"
    style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}>
    <div className="rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center" style={{ background: "#fff" }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
        style={{ background: "#fee2e2" }}>
        <AlertCircle size={24} style={{ color: "#dc2626" }} />
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: "#1a1a1a" }}>Are you sure?</h3>
      <p className="text-sm mb-6" style={{ color: "#555" }}>{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition hover:opacity-80"
          style={{ border: "1px solid #e5e5e5", background: "#fff", color: "#1a1a1a" }}>
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90"
          style={{ background: "#dc2626", color: "#fff" }}>
          Confirm
        </button>
      </div>
    </div>
  </div>
);

// ─── Empty state (shown when backend is offline) ──────────────────────────────
const EmptyState = ({ icon: Icon, message, sub }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3"
    style={{ color: "#9ca3af" }}>
    <Icon size={36} strokeWidth={1.2} />
    <p className="text-sm font-semibold" style={{ color: "#555" }}>{message}</p>
    {sub && <p className="text-xs text-center max-w-xs leading-relaxed">{sub}</p>}
  </div>
);

// =============================================================================
//  TAB: USERS
// =============================================================================
const UsersTab = ({ backendOnline }) => {
  const [users, setUsers]         = useState([]);
  const [search, setSearch]       = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [fetching, setFetching]   = useState(false);

  useEffect(() => {
    if (!backendOnline) return;
    setFetching(true);
    fetch(`${API}/api/admin/users`)
      .then(r => r.json())
      .then(data => setUsers(data))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [backendOnline]);

  const filtered = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email} ${u.username}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (u) => { setEditingId(u.id); setEditForm({ ...u }); };

  const saveEdit = () => {
    // Backend: PUT /api/admin/users/:id  body: editForm
    setUsers(prev => prev.map(u => u.id === editingId ? { ...editForm } : u));
    setEditingId(null);
  };

  const deleteUser = (id) => {
    // Backend: DELETE /api/admin/users/:id
    setUsers(prev => prev.filter(u => u.id !== id));
    setConfirmId(null);
  };

  if (!backendOnline) return (
    <EmptyState icon={Users}
      message="Backend not connected"
      sub="User data will appear here once the backend is running at localhost:9090" />
  );

  if (fetching) return (
    <div className="py-12 text-center text-sm" style={{ color: "#9ca3af" }}>Loading users...</div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9ca3af" }} />
          <input type="text" placeholder="Search name, email or username..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition"
            style={{ border: "1px solid #e5e5e5", background: "#fff", color: "#1a1a1a" }} />
        </div>
        <span className="text-sm" style={{ color: "#9ca3af" }}>{filtered.length} of {users.length}</span>
      </div>

      <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #e5e5e5" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #e5e5e5" }}>
              {["ID", "Name", "Email", "Phone", "Username", "Actions"].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${i === 5 ? "text-right" : "text-left"}`}
                  style={{ color: "#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, idx) => (
              <tr key={user.id} style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #f3f3f3" : "none", background: "#fff" }}
                className="transition hover:brightness-95">
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "#9ca3af" }}>{user.id}</td>

                {editingId === user.id ? (
                  <>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <input value={editForm.firstName} onChange={e => setEditForm(p => ({...p, firstName: e.target.value}))}
                          className="w-24 rounded-lg px-2 py-1 text-sm outline-none"
                          style={{ border: "1px solid #e5e5e5" }} />
                        <input value={editForm.lastName} onChange={e => setEditForm(p => ({...p, lastName: e.target.value}))}
                          className="w-24 rounded-lg px-2 py-1 text-sm outline-none"
                          style={{ border: "1px solid #e5e5e5" }} />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input value={editForm.email} onChange={e => setEditForm(p => ({...p, email: e.target.value}))}
                        className="w-full rounded-lg px-2 py-1 text-sm outline-none"
                        style={{ border: "1px solid #e5e5e5" }} />
                    </td>
                    <td className="px-4 py-2">
                      <input value={editForm.phone} onChange={e => setEditForm(p => ({...p, phone: e.target.value}))}
                        className="w-28 rounded-lg px-2 py-1 text-sm outline-none"
                        style={{ border: "1px solid #e5e5e5" }} />
                    </td>
                    <td className="px-4 py-2">
                      <input value={editForm.username} onChange={e => setEditForm(p => ({...p, username: e.target.value}))}
                        className="w-full rounded-lg px-2 py-1 text-sm outline-none"
                        style={{ border: "1px solid #e5e5e5" }} />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <button onClick={saveEdit} className="p-1.5 rounded-lg transition hover:opacity-80"
                          style={{ background: "#d1fae5", color: "#065f46" }}><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg transition hover:opacity-80"
                          style={{ background: "#f3f4f6", color: "#374151" }}><X size={14} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium" style={{ color: "#1a1a1a" }}>{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-3" style={{ color: "#555" }}>{user.email}</td>
                    <td className="px-4 py-3" style={{ color: "#555" }}>{user.phone}</td>
                    <td className="px-4 py-3" style={{ color: "#555" }}>{user.username}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(user)} className="p-1.5 rounded-lg transition hover:opacity-70"
                          style={{ color: "#9ca3af" }}><Edit2 size={14} /></button>
                        <button onClick={() => setConfirmId(user.id)} className="p-1.5 rounded-lg transition hover:opacity-70"
                          style={{ color: "#9ca3af" }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !fetching && (
          <div className="text-center py-10 text-sm" style={{ color: "#9ca3af" }}>No users found</div>
        )}
      </div>

      {confirmId && (
        <ConfirmDialog
          message="This will permanently delete the user and all their data."
          onConfirm={() => deleteUser(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
};

// =============================================================================
//  TAB: VENUES
// =============================================================================
const VenuesTab = ({ backendOnline }) => {
  const [venues, setVenues]           = useState([]);
  const [editingId, setEditingId]     = useState(null);
  const [editForm, setEditForm]       = useState({});
  const [confirmId, setConfirmId]     = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm]         = useState({ name: "", capacity: "", availability: "Y" });
  const [fetching, setFetching]       = useState(false);

  useEffect(() => {
    if (!backendOnline) return;
    setFetching(true);
    fetch(`${API}/api/admin/venues`)
      .then(r => r.json())
      .then(setVenues)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [backendOnline]);

  const startEdit = (v) => { setEditingId(v.id); setEditForm({ ...v }); };

  const saveEdit = () => {
    // Backend: PUT /api/admin/venues/:id
    setVenues(prev => prev.map(v => v.id === editingId ? { ...editForm, capacity: Number(editForm.capacity) } : v));
    setEditingId(null);
  };

  const deleteVenue = (id) => {
    // Backend: DELETE /api/admin/venues/:id
    setVenues(prev => prev.filter(v => v.id !== id));
    setConfirmId(null);
  };

  const addVenue = () => {
    if (!addForm.name.trim() || !addForm.capacity) return;
    // Backend: POST /api/admin/venues
    const newId = `V-${String(venues.length + 1).padStart(4, "0")}`;
    setVenues(prev => [...prev, { id: newId, name: addForm.name, capacity: Number(addForm.capacity), availability: addForm.availability }]);
    setAddForm({ name: "", capacity: "", availability: "Y" });
    setShowAddForm(false);
  };

  if (!backendOnline) return (
    <EmptyState icon={Building2}
      message="Backend not connected"
      sub="Venue data will appear here once the backend is running at localhost:9090" />
  );

  if (fetching) return (
    <div className="py-12 text-center text-sm" style={{ color: "#9ca3af" }}>Loading venues...</div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm" style={{ color: "#9ca3af" }}>{venues.length} venues</span>
        <button onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-95"
          style={{ background: "#C5E86C", color: "#1a1a1a" }}>
          <Plus size={14} /> Add Venue
        </button>
      </div>

      <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #e5e5e5" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #e5e5e5" }}>
              {["ID", "Venue Name", "Capacity", "Availability", "Actions"].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${i === 4 ? "text-right" : "text-left"}`}
                  style={{ color: "#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {venues.map((venue, idx) => (
              <tr key={venue.id} style={{ borderBottom: idx < venues.length - 1 ? "1px solid #f3f3f3" : "none", background: "#fff" }}
                className="transition hover:brightness-95">
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "#9ca3af" }}>{venue.id}</td>

                {editingId === venue.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))}
                        className="w-full rounded-lg px-2 py-1 text-sm outline-none"
                        style={{ border: "1px solid #e5e5e5" }} />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={editForm.capacity} onChange={e => setEditForm(p => ({...p, capacity: e.target.value}))}
                        className="w-24 rounded-lg px-2 py-1 text-sm outline-none"
                        style={{ border: "1px solid #e5e5e5" }} />
                    </td>
                    <td className="px-4 py-2">
                      <select value={editForm.availability} onChange={e => setEditForm(p => ({...p, availability: e.target.value}))}
                        className="rounded-lg px-2 py-1 text-sm outline-none"
                        style={{ border: "1px solid #e5e5e5" }}>
                        <option value="Y">Available</option>
                        <option value="N">Unavailable</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <button onClick={saveEdit} className="p-1.5 rounded-lg" style={{ background: "#d1fae5", color: "#065f46" }}><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg" style={{ background: "#f3f4f6", color: "#374151" }}><X size={14} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium" style={{ color: "#1a1a1a" }}>{venue.name}</td>
                    <td className="px-4 py-3" style={{ color: "#555" }}>{venue.capacity?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: venue.availability === "Y" ? "#d1fae5" : "#fee2e2", color: venue.availability === "Y" ? "#065f46" : "#991b1b" }}>
                        {venue.availability === "Y" ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(venue)} className="p-1.5 rounded-lg" style={{ color: "#9ca3af" }}><Edit2 size={14} /></button>
                        <button onClick={() => setConfirmId(venue.id)} className="p-1.5 rounded-lg" style={{ color: "#9ca3af" }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {venues.length === 0 && !fetching && (
          <div className="text-center py-10 text-sm" style={{ color: "#9ca3af" }}>No venues found</div>
        )}
      </div>

      {/* Add Venue Modal */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}>
          <div className="rounded-2xl p-8 w-full max-w-md shadow-2xl" style={{ background: "#fff" }}>
            <h3 className="text-lg font-bold mb-6" style={{ color: "#1a1a1a" }}>Add New Venue</h3>
            <div className="space-y-4">
              {[
                { label: "Venue Name", key: "name",     placeholder: "e.g. Campus-7 Seminar Hall", type: "text"   },
                { label: "Capacity",   key: "capacity", placeholder: "e.g. 500",                   type: "number" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase mb-1 block" style={{ color: "#9ca3af" }}>{label}</label>
                  <input type={type} value={addForm[key]}
                    onChange={e => setAddForm(p => ({...p, [key]: e.target.value}))}
                    placeholder={placeholder}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: "1px solid #e5e5e5", color: "#1a1a1a" }} />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold uppercase mb-1 block" style={{ color: "#9ca3af" }}>Availability</label>
                <select value={addForm.availability} onChange={e => setAddForm(p => ({...p, availability: e.target.value}))}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{ border: "1px solid #e5e5e5", color: "#1a1a1a" }}>
                  <option value="Y">Available</option>
                  <option value="N">Unavailable</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid #e5e5e5", color: "#1a1a1a" }}>Cancel</button>
              <button onClick={addVenue}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95"
                style={{ background: "#C5E86C", color: "#1a1a1a" }}>Add Venue</button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          message="This will permanently remove the venue. Programmes linked to it may be affected."
          onConfirm={() => deleteVenue(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
};

// =============================================================================
//  TAB: EVENTS
// =============================================================================
const EventsTab = ({ backendOnline }) => {
  const [events, setEvents]           = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [fetching, setFetching]       = useState(false);

  useEffect(() => {
    if (!backendOnline) return;
    setFetching(true);
    fetch(`${API}/api/admin/events`)
      .then(r => r.json())
      .then(setEvents)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [backendOnline]);

  const handleAction = (id, action) => {
    if (action === "delete") {
      // Backend: DELETE /api/admin/events/:id
      setEvents(prev => prev.filter(e => e.id !== id));
    } else {
      // Backend: PATCH /api/admin/events/:id/status
      setEvents(prev => prev.map(e =>
        e.id === id ? { ...e, status: action === "approve" ? "upcoming" : "rejected" } : e
      ));
    }
    setConfirmAction(null);
  };

  if (!backendOnline) return (
    <EmptyState icon={Calendar}
      message="Backend not connected"
      sub="Event data will appear here once the backend is running at localhost:9090" />
  );

  if (fetching) return (
    <div className="py-12 text-center text-sm" style={{ color: "#9ca3af" }}>Loading events...</div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm" style={{ color: "#9ca3af" }}>{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-10 text-sm" style={{ color: "#9ca3af" }}>No events found</div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="rounded-xl p-4 transition hover:shadow-md"
              style={{ background: "#fff", border: "1px solid #e5e5e5" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs" style={{ color: "#9ca3af" }}>{event.id}</span>
                    <StatusBadge status={event.status} />
                  </div>
                  <h4 className="font-bold" style={{ color: "#1a1a1a" }}>{event.name}</h4>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#9ca3af" }}>{event.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs flex-wrap" style={{ color: "#9ca3af" }}>
                    <span>📅 {event.startDate} → {event.endDate}</span>
                    <span>⏰ {event.time}</span>
                    <span>⏱ {event.duration}h</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {event.status === "pending" && (
                    <>
                      <button onClick={() => setConfirmAction({ id: event.id, action: "approve" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition hover:opacity-80"
                        style={{ background: "#d1fae5", color: "#065f46" }}>
                        <Check size={13} /> Approve
                      </button>
                      <button onClick={() => setConfirmAction({ id: event.id, action: "reject" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition hover:opacity-80"
                        style={{ background: "#fee2e2", color: "#991b1b" }}>
                        <X size={13} /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => setConfirmAction({ id: event.id, action: "delete" })}
                    className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: "#9ca3af" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          message={
            confirmAction.action === "delete"  ? "This will permanently delete the event and all linked programmes." :
            confirmAction.action === "approve" ? "This will approve the event and make it visible to all users." :
                                                 "This will reject the event. The organiser will be notified."
          }
          onConfirm={() => handleAction(confirmAction.id, confirmAction.action)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

// =============================================================================
//  TAB: PROGRAMMES
// =============================================================================
const ProgrammesTab = ({ backendOnline }) => {
  const [programmes, setProgrammes]       = useState([]);
  const [filterStatus, setFilterStatus]   = useState("all");
  const [confirmAction, setConfirmAction] = useState(null);
  const [fetching, setFetching]           = useState(false);

  useEffect(() => {
    if (!backendOnline) return;
    setFetching(true);
    fetch(`${API}/api/admin/programmes`)
      .then(r => r.json())
      .then(setProgrammes)
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [backendOnline]);

  const counts = {
    all:      programmes.length,
    pending:  programmes.filter(p => p.status === "pending").length,
    approved: programmes.filter(p => p.status === "approved").length,
    rejected: programmes.filter(p => p.status === "rejected").length,
  };

  const filtered = filterStatus === "all"
    ? programmes
    : programmes.filter(p => p.status === filterStatus);

  const handleAction = (id, action) => {
    if (action === "delete") {
      // Backend: DELETE /api/admin/programmes/:id
      setProgrammes(prev => prev.filter(p => p.id !== id));
    } else {
      // Backend: PATCH /api/admin/programmes/:id/status
      setProgrammes(prev => prev.map(p =>
        p.id === id ? { ...p, status: action === "approve" ? "approved" : "rejected" } : p
      ));
    }
    setConfirmAction(null);
  };

  if (!backendOnline) return (
    <EmptyState icon={BookOpen}
      message="Backend not connected"
      sub="Programme data will appear here once the backend is running at localhost:9090" />
  );

  if (fetching) return (
    <div className="py-12 text-center text-sm" style={{ color: "#9ca3af" }}>Loading programmes...</div>
  );

  return (
    <div>
      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition capitalize"
            style={{
              background: filterStatus === f ? "#1a1a1a" : "#e0e0e0",
              color:      filterStatus === f ? "#fff"    : "#555",
            }}>
            {f}
            <span className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background: filterStatus === f ? "#fff" : "#c8c8c8",
                color:      filterStatus === f ? "#1a1a1a" : "#555",
              }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-sm" style={{ color: "#9ca3af" }}>No programmes in this category</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prog => (
            <div key={prog.id} className="rounded-xl p-4 transition hover:shadow-md"
              style={{ background: "#fff", border: "1px solid #e5e5e5" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs" style={{ color: "#9ca3af" }}>{prog.id}</span>
                    <StatusBadge status={prog.status} />
                  </div>
                  <h4 className="font-bold" style={{ color: "#1a1a1a" }}>{prog.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: "#9ca3af" }}>
                    <span>📅 {prog.eventName}</span>
                    <span>🏢 {prog.organiser}</span>
                    <span>📍 {prog.venue}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {prog.status === "pending" && (
                    <>
                      <button onClick={() => setConfirmAction({ id: prog.id, action: "approve" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition hover:opacity-80"
                        style={{ background: "#d1fae5", color: "#065f46" }}>
                        <Check size={13} /> Approve
                      </button>
                      <button onClick={() => setConfirmAction({ id: prog.id, action: "reject" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition hover:opacity-80"
                        style={{ background: "#fee2e2", color: "#991b1b" }}>
                        <X size={13} /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => setConfirmAction({ id: prog.id, action: "delete" })}
                    className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: "#9ca3af" }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          message={
            confirmAction.action === "delete"  ? "This will permanently delete the programme." :
            confirmAction.action === "approve" ? "This will approve the programme and make it visible to users." :
                                                 "This will reject the programme. The organiser will be notified."
          }
          onConfirm={() => handleAction(confirmAction.id, confirmAction.action)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

// =============================================================================
//  TAB: ORGANISERS
// =============================================================================
const OrganisersTab = ({ backendOnline }) => {
  const [organisers, setOrganisers]       = useState([]);
  const [confirmId, setConfirmId]         = useState(null);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [pendingProgs, setPendingProgs]   = useState([]);
  const [addForm, setAddForm]             = useState({ name: "", email: "", phone: "", username: "", password: "" });
  const [fetching, setFetching]           = useState(false);

  useEffect(() => {
    if (!backendOnline) return;
    setFetching(true);
    Promise.all([
      fetch(`${API}/api/admin/organisers`).then(r => r.json()),
      fetch(`${API}/api/admin/programmes?status=pending`).then(r => r.json()),
    ])
      .then(([orgs, progs]) => { setOrganisers(orgs); setPendingProgs(progs); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [backendOnline]);

  const removeOrganiser = (id) => {
    // Backend: DELETE /api/admin/organisers/:id
    setOrganisers(prev => prev.filter(o => o.id !== id));
    setConfirmId(null);
  };

  const addOrganiser = () => {
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.username.trim()) return;
    // Backend: POST /api/admin/organisers  (backend hashes password with SHA-256 UTF-8)
    const newId = `O-${String(organisers.length + 1).padStart(4, "0")}`;
    setOrganisers(prev => [...prev, { id: newId, ...addForm }]);
    setAddForm({ name: "", email: "", phone: "", username: "", password: "" });
    setShowAddForm(false);
  };

  const handleProgAction = (id) => {
    // Backend: PATCH /api/admin/programmes/:id/status
    setPendingProgs(prev => prev.filter(p => p.id !== id));
  };

  if (!backendOnline) return (
    <EmptyState icon={User}
      message="Backend not connected"
      sub="Organiser data will appear here once the backend is running at localhost:9090" />
  );

  if (fetching) return (
    <div className="py-12 text-center text-sm" style={{ color: "#9ca3af" }}>Loading organisers...</div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm" style={{ color: "#9ca3af" }}>{organisers.length} organisers</span>
        <div className="flex gap-3">
          <button onClick={() => setShowAcceptModal(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition"
            style={{ border: "1px solid #e5e5e5", background: "#fff", color: "#1a1a1a" }}>
            <Check size={14} style={{ color: "#16a34a" }} /> Accept Events
            {pendingProgs.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "#eab308", color: "#1a1a1a" }}>
                {pendingProgs.length}
              </span>
            )}
          </button>
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-95"
            style={{ background: "#C5E86C", color: "#1a1a1a" }}>
            <Plus size={14} /> Add Organiser
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-x-auto" style={{ border: "1px solid #e5e5e5" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#f9f9f9", borderBottom: "1px solid #e5e5e5" }}>
              {["ID", "Name", "Email", "Phone", "Username", "Actions"].map((h, i) => (
                <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${i === 5 ? "text-right" : "text-left"}`}
                  style={{ color: "#555" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {organisers.map((org, idx) => (
              <tr key={org.id} style={{ borderBottom: idx < organisers.length - 1 ? "1px solid #f3f3f3" : "none", background: "#fff" }}
                className="transition hover:brightness-95">
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "#9ca3af" }}>{org.id}</td>
                <td className="px-4 py-3 font-medium" style={{ color: "#1a1a1a" }}>{org.name}</td>
                <td className="px-4 py-3" style={{ color: "#555" }}>{org.email}</td>
                <td className="px-4 py-3" style={{ color: "#555" }}>{org.phone}</td>
                <td className="px-4 py-3" style={{ color: "#555" }}>{org.username}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button onClick={() => setConfirmId(org.id)}
                      className="p-1.5 rounded-lg transition hover:opacity-70" style={{ color: "#9ca3af" }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {organisers.length === 0 && !fetching && (
          <div className="text-center py-10 text-sm" style={{ color: "#9ca3af" }}>No organisers found</div>
        )}
      </div>

      {/* Accept Events Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}>
          <div className="rounded-2xl w-full max-w-lg p-6 shadow-2xl" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold" style={{ color: "#1a1a1a" }}>Pending Event Approvals</h3>
                <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>Review and approve or reject programme submissions.</p>
              </div>
              <button onClick={() => setShowAcceptModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold transition hover:brightness-95"
                style={{ color: "#9ca3af", background: "#f3f4f6" }}>×</button>
            </div>
            {pendingProgs.length === 0 ? (
              <div className="text-center py-10" style={{ color: "#9ca3af" }}>
                <Check size={32} className="mx-auto mb-2" style={{ color: "#4ade80" }} />
                <p className="text-sm font-medium">All caught up — no pending approvals.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {pendingProgs.map(prog => (
                  <div key={prog.id} className="flex items-center justify-between rounded-xl p-3 gap-3"
                    style={{ background: "#f9f9f9", border: "1px solid #e5e5e5" }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "#1a1a1a" }}>{prog.name}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "#9ca3af" }}>
                        {prog.eventName} · {prog.organiser} · {prog.venue}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleProgAction(prog.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition hover:opacity-80"
                        style={{ background: "#d1fae5", color: "#065f46" }}>
                        <Check size={12} /> Accept
                      </button>
                      <button onClick={() => handleProgAction(prog.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition hover:opacity-80"
                        style={{ background: "#fee2e2", color: "#991b1b" }}>
                        <X size={12} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Organiser Modal */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center z-[200]"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}>
          <div className="rounded-2xl p-8 w-full max-w-md shadow-2xl" style={{ background: "#fff" }}>
            <h3 className="text-lg font-bold mb-1" style={{ color: "#1a1a1a" }}>Add New Organiser</h3>
            <p className="text-xs mb-6" style={{ color: "#9ca3af" }}>Password will be SHA-256 hashed by the backend before storing.</p>
            <div className="space-y-4">
              {[
                { label: "Organisation Name", key: "name",     placeholder: "e.g. KIIT-DU",         type: "text"     },
                { label: "Email",             key: "email",    placeholder: "e.g. org@kiit.in",      type: "email"    },
                { label: "Phone",             key: "phone",    placeholder: "e.g. 9876543210",       type: "text"     },
                { label: "Username",          key: "username", placeholder: "e.g. kalinga.org",      type: "text"     },
                { label: "Password",          key: "password", placeholder: "Temporary password",    type: "password" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase mb-1 block" style={{ color: "#9ca3af" }}>{label}</label>
                  <input type={type} value={addForm[key]}
                    onChange={e => setAddForm(p => ({...p, [key]: e.target.value}))}
                    placeholder={placeholder}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                    style={{ border: "1px solid #e5e5e5", color: "#1a1a1a" }} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ border: "1px solid #e5e5e5", color: "#1a1a1a" }}>Cancel</button>
              <button onClick={addOrganiser}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95"
                style={{ background: "#C5E86C", color: "#1a1a1a" }}>Add Organiser</button>
            </div>
          </div>
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          message="This will permanently remove the organiser and unlink all their events and programmes."
          onConfirm={() => removeOrganiser(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
};

// =============================================================================
//  MAIN ADMIN PAGE
// =============================================================================
export default function AdminPage() {

  const navigate = useNavigate();

  // ─── State ──────────────────────────────────────────────────────────────────
  const [admin, setAdmin]                   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [backendOnline, setBackendOnline]   = useState(false);

  // activeTab: null means no tab selected (default on load)
  const [activeTab, setActiveTab]           = useState(null);

  const [showManageAdmin, setShowManageAdmin] = useState(false);

  // ── Mail state ─────────────────────────────────────────────────────────────
  // mailStep: null | "select" | "compose"
  // mailTarget: "All" | "Users" | "Organisers"
  // mailMode: "all" | "particular"
  // selectedRecipients: array of { name, email } chosen by admin
  const [mailStep, setMailStep]               = useState(null);
  const [mailTarget, setMailTarget]           = useState("All");
  const [mailMode, setMailMode]               = useState("all");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [manualEmail, setManualEmail]         = useState("");
  const [mailSubject, setMailSubject]         = useState("");
  const [mailBody, setMailBody]               = useState("");
  const [mailSent, setMailSent]               = useState(false);

  // Full lists fetched from backend for recipient selection
  const [allUsers, setAllUsers]               = useState([]);
  const [allOrganisers, setAllOrganisers]     = useState([]);

  // Fetch users + organisers for mail recipient picker
  useEffect(() => {
    if (!backendOnline) return;
    fetch(`${API}/api/admin/users`).then(r => r.json()).then(setAllUsers).catch(() => {});
    fetch(`${API}/api/admin/organisers`).then(r => r.json()).then(setAllOrganisers).catch(() => {});
  }, [backendOnline]);

  // For Manage Admin modal
  const [admins, setAdmins]               = useState([]);
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdminForm, setNewAdminForm]    = useState({ firstName: "", lastName: "", email: "", phone: "", username: "", password: "" });
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  const tabs = [
    { key: "Users",      icon: <Users size={15} />     },
    { key: "Venues",     icon: <Building2 size={15} /> },
    { key: "Events",     icon: <Calendar size={15} />  },
    { key: "Programmes", icon: <BookOpen size={15} />  },
    { key: "Organisers", icon: <User size={15} />      },
  ];

  // ─── Fetch admin profile + admins list ────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, adminsRes] = await Promise.all([
          fetch(`${API}/api/admin/profile`),
          fetch(`${API}/api/admin/all`),
        ]);
        if (!profileRes.ok) throw new Error("Backend offline");
        const profileData = await profileRes.json();
        const adminsData  = await adminsRes.json();
        setAdmin(profileData);
        setAdmins(adminsData);
        setBackendOnline(true);
      } catch (err) {
        console.warn("Backend not connected:", err.message);
        setAdmin(null);
        setAdmins([]);
        setBackendOnline(false);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Tab toggle: click active tab → deselect it ───────────────────────────
  const handleTabClick = (key) => {
    setActiveTab(prev => prev === key ? null : key);
  };

  // ─── Mail handlers ─────────────────────────────────────────────────────────

  const openMail = (target) => {
    setMailTarget(target);
    setMailMode("all");
    setSelectedRecipients([]);
    setRecipientSearch("");
    setManualEmail("");
    setMailSubject("");
    setMailBody("");
    setMailSent(false);
    // "All" skips the selection step and goes straight to compose
    setMailStep(target === "All" ? "compose" : "select");
  };

  const closeMail = () => setMailStep(null);

  // The list shown in the recipient picker dropdown
  const recipientPool = mailTarget === "Users"
    ? allUsers.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email }))
    : allOrganisers.map(o => ({ id: o.id, name: o.name, email: o.email }));

  const filteredPool = recipientPool.filter(r =>
    r.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
    r.email.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const toggleRecipient = (person) => {
    setSelectedRecipients(prev =>
      prev.find(p => p.id === person.id)
        ? prev.filter(p => p.id !== person.id)
        : [...prev, person]
    );
  };

  const addManualEmail = () => {
    const email = manualEmail.trim();
    if (!email || !email.includes("@")) return;
    // Avoid duplicates
    if (selectedRecipients.find(p => p.email === email)) { setManualEmail(""); return; }
    setSelectedRecipients(prev => [...prev, { id: email, name: email, email }]);
    setManualEmail("");
  };

  const removeRecipient = (id) => {
    setSelectedRecipients(prev => prev.filter(p => p.id !== id));
  };

  const proceedToCompose = () => {
    if (mailMode === "particular" && selectedRecipients.length === 0) return;
    setMailStep("compose");
  };

  const handleSendMail = () => {
    if (!mailSubject.trim() || !mailBody.trim()) return;
    const recipients = mailMode === "all"
      ? (mailTarget === "Users" ? allUsers.map(u => u.email) : allOrganisers.map(o => o.email))
      : selectedRecipients.map(r => r.email);
    // Backend: POST /api/admin/mail  body: { target, mode, recipients, subject, body }
    console.log("Sending mail:", { target: mailTarget, mode: mailMode, recipients, subject: mailSubject, body: mailBody });
    setMailSent(true);
    setTimeout(() => closeMail(), 2500);
  };

  // ─── Manage Admin handlers ─────────────────────────────────────────────────
  const addNewAdmin = () => {
    if (!newAdminForm.firstName.trim() || !newAdminForm.email.trim() || !newAdminForm.username.trim()) return;
    // Backend: POST /api/admin/add  body: newAdminForm (backend hashes password)
    const newId = `A-${String(admins.length + 1).padStart(4, "0")}`;
    setAdmins(prev => [...prev, { id: newId, isProtected: false, ...newAdminForm }]);
    setNewAdminForm({ firstName: "", lastName: "", email: "", phone: "", username: "", password: "" });
    setShowAddAdminForm(false);
  };

  const removeAdmin = (id) => {
    // Safety check — protected admins can never be removed
    if (PROTECTED_ADMIN_IDS.includes(id)) return;
    // Backend: DELETE /api/admin/:id
    setAdmins(prev => prev.filter(a => a.id !== id));
    setConfirmRemoveId(null);
  };

  // ─── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F0F0F0" }}>
        <div className="text-xl font-semibold animate-pulse" style={{ color: "#9ca3af" }}>
          Loading EventSphere Admin...
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen font-sans" style={{ background: "#F0F0F0" }}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header bar ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-2xl px-6 py-4 shadow-sm"
          style={{ background: "#fff" }}>
          <h1 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>EventSphere Admin</h1>

          <div className="flex items-center gap-3">
            {/* Manage Admin button */}
            <button onClick={() => setShowManageAdmin(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition hover:brightness-95"
              style={{ border: "1px solid #e5e5e5", background: "#fff", color: "#1a1a1a" }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ border: "1.5px solid #1a1a1a" }}>
                <User size={14} />
              </span>
              Manage Admin
            </button>

            {/* Logout button */}
            <button onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition hover:brightness-95"
              style={{ border: "1px solid #fee2e2", background: "#fff", color: "#dc2626" }}>
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ─────────────────────────────────────────────────── */}
        <div className="flex justify-center gap-3 flex-wrap">
          {tabs.map(({ key, icon }) => {
            const isActive = activeTab === key;
            return (
              <button key={key} onClick={() => handleTabClick(key)}
                className="flex items-center gap-2 px-7 py-2 rounded-xl text-sm font-medium transition"
                style={{
                  background:   isActive ? "#fff"    : "#E0E0E0",
                  color:        isActive ? "#1a1a1a" : "#555555",
                  borderBottom: isActive ? "2px solid #1a1a1a" : "2px solid transparent",
                  boxShadow:    isActive ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>
                {icon} {key}
              </button>
            );
          })}
        </div>

        {/* ── Main card ───────────────────────────────────────────────────────── */}
        <div className="rounded-2xl shadow-sm" style={{ background: "#fff" }}>

          {/* Admin profile section — always visible */}
          <div className="p-10">

            {/* Backend offline message */}
            {!backendOnline && (
              <div className="mb-6 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
                style={{ background: "#fef9c3", border: "1px solid #fde68a", color: "#854d0e" }}>
                <AlertCircle size={15} className="shrink-0" />
                Backend not connected — admin profile cannot be loaded. Start your server at {API}.
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-center gap-16">

              {/* Avatar */}
              <div className="w-48 h-48 rounded-full flex-shrink-0 overflow-hidden"
                style={{ background: "#D9D9D9" }}>
                {admin?.photoUrl
                  ? <img src={admin.photoUrl} alt="Admin" className="w-full h-full object-cover" />
                  : (
                    // Empty avatar — no fake icon when backend is offline
                    <div className="w-full h-full flex items-center justify-center">
                      {!backendOnline
                        ? <span className="text-xs text-center px-4" style={{ color: "#9ca3af" }}>Photo loads from backend</span>
                        : <User size={48} style={{ color: "#9ca3af" }} />
                      }
                    </div>
                  )
                }
              </div>

              {/* Details */}
              <div className="space-y-3 text-xl" style={{ color: "#1a1a1a" }}>
                <p>
                  <span className="font-medium">Name: </span>
                  <span style={{ color: backendOnline ? "#1a1a1a" : "#9ca3af" }}>
                    {admin?.name || (backendOnline ? "—" : "Loads from backend")}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Email: </span>
                  <span style={{ color: backendOnline ? "#1a1a1a" : "#9ca3af" }}>
                    {admin?.email || (backendOnline ? "—" : "Loads from backend")}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Phone No: </span>
                  <span style={{ color: backendOnline ? "#1a1a1a" : "#9ca3af" }}>
                    {admin?.phone || (backendOnline ? "—" : "Loads from backend")}
                  </span>
                </p>
                <p>
                  <span className="font-medium">Username: </span>
                  <span style={{ color: backendOnline ? "#1a1a1a" : "#9ca3af" }}>
                    {admin?.username || (backendOnline ? "—" : "Loads from backend")}
                  </span>
                </p>
              </div>
            </div>

            {/* Mail buttons — exactly matching the screenshot layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              {["All", "Users", "Organisers"].map(target => (
                <button key={target} onClick={() => openMail(target)}
                  className="py-3 rounded-xl font-semibold text-base transition active:scale-95 hover:brightness-95"
                  style={{ background: "#C5E86C", color: "#1a1a1a" }}>
                  Mail to {target}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content panel — only shown when a tab is selected */}
          {activeTab && (
            <div style={{ borderTop: "1px solid #f0f0f0" }} className="p-6">
              <h2 className="text-lg font-bold mb-5" style={{ color: "#1a1a1a" }}>{activeTab}</h2>
              {activeTab === "Users"      && <UsersTab      backendOnline={backendOnline} />}
              {activeTab === "Venues"     && <VenuesTab     backendOnline={backendOnline} />}
              {activeTab === "Events"     && <EventsTab     backendOnline={backendOnline} />}
              {activeTab === "Programmes" && <ProgrammesTab backendOnline={backendOnline} />}
              {activeTab === "Organisers" && <OrganisersTab backendOnline={backendOnline} />}
            </div>
          )}
        </div>

      </div>

      {/* ── Manage Admin Modal ─────────────────────────────────────────────── */}
      {showManageAdmin && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}>
          <div className="rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" style={{ background: "#fff" }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f0f0f0" }}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#1a1a1a" }}>Manage Admin</h2>
                <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                  Founders (A-0001, A-0002, A-0003) are protected and cannot be removed.
                </p>
              </div>
              <button onClick={() => { setShowManageAdmin(false); setShowAddAdminForm(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold transition hover:brightness-95"
                style={{ color: "#9ca3af", background: "#f3f4f6" }}>×</button>
            </div>

            {/* Admin list */}
            <div className="px-6 py-4 max-h-72 overflow-y-auto">
              {!backendOnline ? (
                <div className="text-center py-8 text-sm" style={{ color: "#9ca3af" }}>
                  Admin list loads from backend
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: "#9ca3af" }}>No admins found</div>
              ) : (
                <div className="space-y-2">
                  {admins.map(a => {
                    const isProtected = PROTECTED_ADMIN_IDS.includes(a.id);
                    return (
                      <div key={a.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{ background: "#f9f9f9", border: "1px solid #e5e5e5" }}>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm" style={{ color: "#1a1a1a" }}>
                              {a.firstName} {a.lastName}
                            </p>
                            {/* Protected badge */}
                            {isProtected && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: "#fef9c3", color: "#854d0e" }}>
                                Founder
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                            {a.id} · {a.username}
                          </p>
                        </div>
                        {/* Remove button — disabled for protected admins */}
                        {isProtected ? (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "#d1d5db" }}>
                            <ShieldOff size={13} /> Protected
                          </span>
                        ) : (
                          <button onClick={() => setConfirmRemoveId(a.id)}
                            className="p-1.5 rounded-lg transition hover:opacity-70"
                            style={{ color: "#9ca3af" }}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add new admin form (toggle) */}
            {showAddAdminForm ? (
              <div className="px-6 pb-6 space-y-3" style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px" }}>
                <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>New Admin Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "First Name", key: "firstName", placeholder: "e.g. Rohan",      type: "text"     },
                    { label: "Last Name",  key: "lastName",  placeholder: "e.g. Sharma",     type: "text"     },
                    { label: "Email",      key: "email",     placeholder: "admin@kiit.in",   type: "email"    },
                    { label: "Phone",      key: "phone",     placeholder: "9876543210",      type: "text"     },
                    { label: "Username",   key: "username",  placeholder: "rohan.sharma",    type: "text"     },
                    { label: "Password",   key: "password",  placeholder: "Temp password",   type: "password" },
                  ].map(({ label, key, placeholder, type }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold uppercase mb-1 block" style={{ color: "#9ca3af" }}>{label}</label>
                      <input type={type} value={newAdminForm[key]}
                        onChange={e => setNewAdminForm(p => ({...p, [key]: e.target.value}))}
                        placeholder={placeholder}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none"
                        style={{ border: "1px solid #e5e5e5", color: "#1a1a1a" }} />
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: "#9ca3af" }}>Password will be SHA-256 hashed by the backend.</p>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setShowAddAdminForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ border: "1px solid #e5e5e5", color: "#1a1a1a" }}>Cancel</button>
                  <button onClick={addNewAdmin}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition active:scale-95"
                    style={{ background: "#C5E86C", color: "#1a1a1a" }}>Add Admin</button>
                </div>
              </div>
            ) : (
              <div className="px-6 pb-6" style={{ borderTop: "1px solid #f0f0f0", paddingTop: "16px" }}>
                <button onClick={() => setShowAddAdminForm(true)}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-95"
                  style={{ background: "#C5E86C", color: "#1a1a1a" }}>
                  <Plus size={15} /> Add New Admin
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm remove admin */}
      {confirmRemoveId && (
        <ConfirmDialog
          message="This will permanently remove this admin account. This action cannot be undone."
          onConfirm={() => removeAdmin(confirmRemoveId)}
          onCancel={() => setConfirmRemoveId(null)}
        />
      )}

      {/* ── Mail Modal (multi-step) ────────────────────────────────────────── */}
      {mailStep && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ background: "#fff", maxHeight: "90vh" }}>

            {/* Modal header */}
            <div className="px-5 py-4 flex justify-between items-center shrink-0"
              style={{ background: "#1a1a1a" }}>
              <div>
                <span className="font-semibold text-sm text-white">
                  {mailStep === "select" ? `Mail to ${mailTarget}` : "New Message"}
                </span>
                {mailStep === "compose" && (
                  <span className="ml-2 text-xs" style={{ color: "#9ca3af" }}>
                    → {mailMode === "all"
                      ? (mailTarget === "All" ? "All Users & Organisers" : `All ${mailTarget}`)
                      : `${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? "s" : ""}`
                    }
                  </span>
                )}
              </div>
              <button onClick={closeMail}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-lg font-bold"
                style={{ color: "#9ca3af" }}>✕</button>
            </div>

            {/* ── STEP 1: Select mode (only for Users / Organisers) ── */}
            {mailStep === "select" && (
              <div className="p-6 flex-1 overflow-y-auto">

                {/* Two big option buttons */}
                <p className="text-sm font-semibold mb-4" style={{ color: "#1a1a1a" }}>
                  Who do you want to mail?
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => { setMailMode("all"); setMailStep("compose"); }}
                    className="py-4 rounded-xl font-semibold text-sm transition active:scale-95 hover:brightness-95"
                    style={{ background: "#C5E86C", color: "#1a1a1a" }}>
                    All {mailTarget}
                  </button>
                  <button
                    onClick={() => setMailMode("particular")}
                    className="py-4 rounded-xl font-semibold text-sm transition active:scale-95"
                    style={{
                      background: mailMode === "particular" ? "#1a1a1a" : "#f0f0f0",
                      color:      mailMode === "particular" ? "#fff"    : "#1a1a1a",
                    }}>
                    Particular {mailTarget === "Users" ? "User" : "Organiser"}
                  </button>
                </div>

                {/* Recipient picker — shown when "Particular" is selected */}
                {mailMode === "particular" && (
                  <div>
                    {/* Search / type email */}
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                          style={{ color: "#9ca3af" }} />
                        <input
                          type="text"
                          placeholder={`Search ${mailTarget.toLowerCase()} by name or email...`}
                          value={recipientSearch}
                          onChange={e => setRecipientSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
                          style={{ border: "1px solid #e5e5e5", color: "#1a1a1a" }}
                        />
                      </div>
                    </div>

                    {/* Dropdown list */}
                    {filteredPool.length > 0 && (
                      <div className="rounded-xl overflow-hidden mb-3"
                        style={{ border: "1px solid #e5e5e5", maxHeight: 180, overflowY: "auto" }}>
                        {filteredPool.map(person => {
                          const isSelected = !!selectedRecipients.find(p => p.id === person.id);
                          return (
                            <div key={person.id}
                              onClick={() => toggleRecipient(person)}
                              className="flex items-center justify-between px-4 py-2.5 cursor-pointer transition"
                              style={{
                                background: isSelected ? "#f0fdf4" : "#fff",
                                borderBottom: "1px solid #f3f3f3",
                              }}>
                              <div>
                                <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>{person.name}</p>
                                <p className="text-xs" style={{ color: "#9ca3af" }}>{person.email}</p>
                              </div>
                              {isSelected && <Check size={15} style={{ color: "#16a34a" }} />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Manual email entry */}
                    <div className="flex gap-2 mb-4">
                      <input
                        type="email"
                        placeholder="Or type an email address manually..."
                        value={manualEmail}
                        onChange={e => setManualEmail(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addManualEmail()}
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ border: "1px solid #e5e5e5", color: "#1a1a1a" }}
                      />
                      <button onClick={addManualEmail}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-95"
                        style={{ background: "#e5e5e5", color: "#1a1a1a" }}>
                        Add
                      </button>
                    </div>

                    {/* Selected recipients chips */}
                    {selectedRecipients.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase mb-2" style={{ color: "#9ca3af" }}>
                          Selected ({selectedRecipients.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecipients.map(r => (
                            <span key={r.id}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                              style={{ background: "#e5e5e5", color: "#1a1a1a" }}>
                              {r.name}
                              <button onClick={() => removeRecipient(r.id)}
                                style={{ color: "#9ca3af", lineHeight: 1 }}>×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Proceed button */}
                <div className="mt-6">
                  <button
                    onClick={proceedToCompose}
                    disabled={mailMode === "particular" && selectedRecipients.length === 0}
                    className="w-full py-3 rounded-xl font-bold text-sm transition active:scale-95"
                    style={{
                      background: mailMode === "particular" && selectedRecipients.length === 0 ? "#e5e5e5" : "#C5E86C",
                      color:      mailMode === "particular" && selectedRecipients.length === 0 ? "#9ca3af" : "#1a1a1a",
                      cursor:     mailMode === "particular" && selectedRecipients.length === 0 ? "not-allowed" : "pointer",
                    }}>
                    Continue to Compose →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Compose ── */}
            {mailStep === "compose" && (
              <>
                {mailSent ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
                    <div className="text-5xl">✅</div>
                    <h3 className="text-xl font-bold" style={{ color: "#16a34a" }}>Mail Sent!</h3>
                    <p className="text-sm" style={{ color: "#555" }}>All recipients have been notified.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-5 flex-1 overflow-y-auto space-y-4">

                      {/* Back button for particular mode */}
                      {mailMode === "particular" && (
                        <button onClick={() => setMailStep("select")}
                          className="text-xs font-medium flex items-center gap-1 transition hover:opacity-70"
                          style={{ color: "#9ca3af" }}>
                          ← Back to recipients
                        </button>
                      )}

                      {/* To field */}
                      <div className="pb-3" style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <p className="text-xs font-semibold uppercase mb-1" style={{ color: "#9ca3af" }}>To</p>
                        {mailMode === "all" ? (
                          <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                            {mailTarget === "All" ? "All Users & All Organisers" : `All ${mailTarget}`}
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {selectedRecipients.map(r => (
                              <span key={r.id} className="px-2.5 py-1 rounded-full text-xs font-medium"
                                style={{ background: "#e5e5e5", color: "#1a1a1a" }}>
                                {r.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Subject */}
                      <div>
                        <p className="text-xs font-semibold uppercase mb-1" style={{ color: "#9ca3af" }}>Subject</p>
                        <input type="text" placeholder="Enter subject..."
                          value={mailSubject} onChange={e => setMailSubject(e.target.value)}
                          className="w-full py-2 text-sm outline-none"
                          style={{ borderBottom: "1px solid #e5e5e5", color: "#1a1a1a" }} />
                      </div>

                      {/* Body */}
                      <div>
                        <p className="text-xs font-semibold uppercase mb-1" style={{ color: "#9ca3af" }}>Message</p>
                        <textarea placeholder="Write your message here..."
                          value={mailBody} onChange={e => setMailBody(e.target.value)}
                          className="w-full h-40 resize-none outline-none text-sm leading-relaxed"
                          style={{ color: "#1a1a1a" }} />
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between shrink-0"
                      style={{ borderTop: "1px solid #f0f0f0" }}>
                      <p className="text-xs" style={{ color: "#9ca3af" }}>From: eventsphere.noreply@gmail.com</p>
                      <button onClick={handleSendMail}
                        disabled={!mailSubject.trim() || !mailBody.trim()}
                        className="px-8 py-2 rounded-xl font-bold text-sm transition active:scale-95"
                        style={{
                          background: !mailSubject.trim() || !mailBody.trim() ? "#e5e5e5" : "#C5E86C",
                          color:      !mailSubject.trim() || !mailBody.trim() ? "#9ca3af" : "#1a1a1a",
                          cursor:     !mailSubject.trim() || !mailBody.trim() ? "not-allowed" : "pointer",
                        }}>
                        Send Email
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}