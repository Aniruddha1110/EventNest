import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Trash2, Edit2, Check, X, Plus, User,
  Building2, Calendar, BookOpen, Users, Mail,
  AlertCircle, ShieldOff, LogOut,
} from "lucide-react";
import { ThemeToggle } from "./ThemeContext";

const API = "http://localhost:9090";
const PROTECTED_ADMIN_IDS = ["A-0001", "A-0002", "A-0003"];

// =============================================================================
//  SHARED SUB-COMPONENTS
// =============================================================================

const StatusBadge = ({ status }) => {
  const map = {
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    completed:"bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    ongoing:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    upcoming: "bg-themeAccent/20 text-green-800 dark:text-themeAccent",
  };
  const dotMap = {
    approved: "bg-green-500", pending: "bg-yellow-400", rejected: "bg-red-500",
    completed: "bg-gray-400", ongoing: "bg-blue-500", upcoming: "bg-themeAccent",
  };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || map.pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotMap[status] || dotMap.pending}`} />
      {label}
    </span>
  );
};

const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 flex items-center justify-center z-[200] bg-black/40 backdrop-blur-sm">
    <div className="bg-cardBg border border-themeBorder rounded-2xl p-8 w-full max-w-sm shadow-2xl text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100 dark:bg-red-900/30">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <h3 className="text-lg font-bold mb-2 text-textMain">Are you sure?</h3>
      <p className="text-sm mb-6 text-textMuted">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-themeBorder bg-cardBg text-textMain hover:opacity-80 transition">
          Cancel
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:opacity-90 transition">
          Confirm
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, message, sub }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-textMuted">
    <Icon size={36} strokeWidth={1.2} />
    <p className="text-sm font-semibold text-textMain">{message}</p>
    {sub && <p className="text-xs text-center max-w-xs leading-relaxed">{sub}</p>}
  </div>
);

// ── Shared input/table styles ─────────────────────────────────────────────────
const inputCls = "w-full rounded-xl px-4 py-2.5 text-sm outline-none bg-inputBg border border-themeBorder text-textMain focus:border-themeAccent transition";
const smallInputCls = "rounded-lg px-2 py-1 text-sm outline-none bg-inputBg border border-themeBorder text-textMain";
const thCls = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-left text-textMuted";
const tdCls = "px-4 py-3 text-textMuted";

// =============================================================================
//  TAB: USERS
// =============================================================================
const UsersTab = ({ backendOnline }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
  if (!backendOnline) return;

  // 1. Retrieve your JWT (assuming it's stored in localStorage for this example)
  const token = localStorage.getItem('token'); 

  setFetching(true);

  fetch(`${API}/api/admin/users`, {
    method: 'GET', // GET is default, but good to be explicit
    headers: {
      // 2. Attach the JWT to the Authorization header
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json'
    }
  })
    .then(r => {
      // 3. fetch doesn't automatically throw errors on 401/403/500 statuses. 
      // You must check if the response is ok before parsing JSON.
      if (!r.ok) {
        if (r.status === 401) {
           throw new Error("Unauthorized: Token may be expired or invalid.");
        }
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      return r.json();
    })
    .then(j => setUsers(j.data || j))
    .catch((error) => {
      // 4. Don't swallow errors silently! Log them or set an error state 
      // so you know if your JWT authentication is failing.
      console.error("Failed to fetch users:", error.message);
    })
    .finally(() => setFetching(false));
}, [backendOnline]);

  const filtered = users.filter(u =>
    `${u.userFirstName} ${u.userLastName} ${u.userEmail} ${u.userUsername}`.toLowerCase().includes(search.toLowerCase())
  );

const startEdit = (u) => { setEditingId(u.userId); setEditForm({ ...u }); };
  // ✅ FIXED
const saveEdit = async () => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API}/api/admin/users/${editingId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userFirstName: editForm.userFirstName,
    userLastName:  editForm.userLastName,
    userEmail:     editForm.userEmail,
    userPhoneNo:   editForm.userPhoneNo,
    userUsername:  editForm.userUsername,
  })
});
if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
const j = await res.json();
setUsers(prev => prev.map(u => u.userId === editingId ? { ...u, ...(j.data || editForm) } : u));
setEditingId(null);
  } catch (error) {
    console.error("Failed to update User:", error.message);
  }
};
  const deleteUser = async (id) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setUsers(prev => prev.filter(u => u.userId !== id));
    } catch (error) {
      console.error("Failed to delete user:", error.message);
    } finally {
      setConfirmId(null);
    }
  };

  if (!backendOnline) return <EmptyState icon={Users} message="Backend not connected" sub="User data will appear here once the backend is running at localhost:9090" />;
  if (fetching) return <div className="py-12 text-center text-sm text-textMuted">Loading users...</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input type="text" placeholder="Search name, email or username..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none bg-inputBg border border-themeBorder text-textMain focus:border-themeAccent transition" />
        </div>
        <span className="text-sm text-textMuted">{filtered.length} of {users.length}</span>
      </div>

      <div className="rounded-xl overflow-x-auto border border-themeBorder">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-pageBg border-b border-themeBorder">
              {["ID", "Name", "Email", "Phone", "Username", "Actions"].map((h, i) => (
                <th key={h} className={`${thCls} ${i === 5 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
  {filtered.map((user, idx) => (
    <tr
      key={user.userId}
      className={`bg-cardBg hover:brightness-95 transition ${
        idx < filtered.length - 1 ? "border-b border-themeBorder" : ""
      }`}
    >
      <td className="px-4 py-3 font-mono text-xs text-textMuted">
        {user.userId}
      </td>

      {editingId === user.userId ? (
        <>
          {/* First + Last Name */}
          <td className="px-4 py-2">
            <div className="flex gap-1">
              <input
                value={editForm.userFirstName || ""}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    userFirstName: e.target.value,
                  }))
                }
                className={`w-24 ${smallInputCls}`}
              />
              <input
                value={editForm.userLastName || ""}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    userLastName: e.target.value,
                  }))
                }
                className={`w-24 ${smallInputCls}`}
              />
            </div>
          </td>

          {/* Email */}
          <td className="px-4 py-2">
            <input
              value={editForm.userEmail || ""}
              onChange={(e) =>
                setEditForm((p) => ({
                  ...p,
                  userEmail: e.target.value,
                }))
              }
              className={`w-full ${smallInputCls}`}
            />
          </td>

          {/* Phone */}
          <td className="px-4 py-2">
            <input
              value={editForm.userPhoneNo || ""}
              onChange={(e) =>
                setEditForm((p) => ({
                  ...p,
                  userPhoneNo: e.target.value,
                }))
              }
              className={`w-28 ${smallInputCls}`}
            />
          </td>

          {/* Username */}
          <td className="px-4 py-2">
            <input
              value={editForm.userUsername || ""}
              onChange={(e) =>
                setEditForm((p) => ({
                  ...p,
                  userUsername: e.target.value,
                }))
              }
              className={`w-full ${smallInputCls}`}
            />
          </td>

          {/* Actions */}
          <td className="px-4 py-2">
            <div className="flex justify-end gap-2">
              <button
                onClick={saveEdit}
                className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:opacity-80"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="p-1.5 rounded-lg bg-pageBg text-textMuted hover:opacity-80"
              >
                <X size={14} />
              </button>
            </div>
          </td>
        </>
      ) : (
        <>
          {/* Name */}
          <td className="px-4 py-3 font-medium text-textMain">
            {user.userFirstName} {user.userLastName}
          </td>

          {/* Email */}
          <td className={tdCls}>{user.userEmail}</td>

          {/* Phone */}
          <td className={tdCls}>{user.userPhoneNo}</td>

          {/* Username */}
          <td className={tdCls}>{user.userUsername}</td>

          {/* Actions */}
          <td className="px-4 py-3">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => startEdit(user)}
                className="p-1.5 rounded-lg text-textMuted hover:text-themeAccent transition"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => setConfirmId(user.userId)}
                className="p-1.5 rounded-lg text-textMuted hover:text-red-500 transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </td>
        </>
      )}
    </tr>
  ))}
</tbody>
        </table>
        {filtered.length === 0 && !fetching && <div className="text-center py-10 text-sm text-textMuted">No users found</div>}
      </div>
      {confirmId && <ConfirmDialog message="This will permanently delete the user and all their data." onConfirm={() => deleteUser(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  );
};

// =============================================================================
//  TAB: VENUES
// =============================================================================
const VenuesTab = ({ backendOnline }) => {
  const [venues, setVenues] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmId, setConfirmId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", capacity: "", availability: "Y" });
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
  if (!backendOnline) return;

  // Retrieve your JWT
  const token = localStorage.getItem('token'); 

  setFetching(true);

  fetch(`${API}/api/admin/venues`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json'
    }
  })
    .then(r => {
      // Catch HTTP errors like 401 Unauthorized or 403 Forbidden
      if (!r.ok) {
        if (r.status === 401) {
           throw new Error("Unauthorized: Token may be expired or invalid.");
        }
        throw new Error(`HTTP error! status: ${r.status}`);
      }
      return r.json();
    })
    .then(j => setVenues(j.data || j))
    .catch((error) => {
      // Log the error so you aren't failing silently
      console.error("Failed to fetch venues:", error.message);
    })
    .finally(() => setFetching(false));
}, [backendOnline]);

  const startEdit = (v) => { setEditingId(v.venueId); setEditForm({ ...v }); };
  const saveEdit = () => {
    setVenues(prev => prev.map(v => v.venueId === editingId ? { ...editForm, capacity: Number(editForm.capacity) } : v));
    setEditingId(null);
  };
  // ✅ FIXED
const deleteVenue = async (id) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API}/api/admin/venues/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    setVenues(prev => prev.filter(v => v.venueId !== id));
    setConfirmId(null);
  } catch (error) {
    console.error("Failed to delete venue:", error.message);
  }
};
  // ✅ FIXED
const addVenue = async () => {
  if (!addForm.name.trim() || !addForm.capacity) return;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`${API}/api/admin/venues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        venueName: addForm.name,
        venueCapacity: Number(addForm.capacity),
        venueAvailability: addForm.availability
      })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const j = await res.json();
    setVenues(prev => [...prev, j.data || j]);
    setAddForm({ name: "", capacity: "", availability: "Y" });
    setShowAddForm(false);
  } catch (error) {
    console.error("Failed to add venue:", error.message);
  }
};

  if (!backendOnline) return <EmptyState icon={Building2} message="Backend not connected" sub="Venue data will appear here once the backend is running at localhost:9090" />;
  if (fetching) return <div className="py-12 text-center text-sm text-textMuted">Loading venues...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-textMuted">{venues.length} venues</span>
        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-themeAccent text-pageBg transition active:scale-95">
          <Plus size={14} /> Add Venue
        </button>
      </div>

      <div className="rounded-xl overflow-x-auto border border-themeBorder">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-pageBg border-b border-themeBorder">
              {["ID", "Venue Name", "Capacity", "Availability", "Actions"].map((h, i) => (
                <th key={h} className={`${thCls} ${i === 4 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {venues.map((venue, idx) => (
              <tr key={venue.venueId} className={`bg-cardBg hover:brightness-95 transition ${idx < venues.length - 1 ? "border-b border-themeBorder" : ""}`}>
                <td className="px-4 py-3 font-mono text-xs text-textMuted">{venue.venueId}</td>
                {editingId === venue.venueId ? (
                  <>
                    <td className="px-4 py-2"><input value={editForm.venueName} onChange={e => setEditForm(p => ({ ...p, venueName: e.target.value }))} className={`w-full ${smallInputCls}`} /></td>
                    <td className="px-4 py-2"><input type="number" value={editForm.venueCapacity} onChange={e => setEditForm(p => ({ ...p, venueCapacity: e.target.value }))} className={`w-24 ${smallInputCls}`} /></td>
                    <td className="px-4 py-2">
                      <select value={editForm.venueAvailability} onChange={e => setEditForm(p => ({ ...p, venueAvailability: e.target.value }))} className={smallInputCls}>
                        <option value="Y">Available</option>
                        <option value="N">Unavailable</option>
                      </select>
                    </td>
                    <td className="px-4 py-2"><div className="flex justify-end gap-2">
                      <button onClick={saveEdit} className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"><Check size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-pageBg text-textMuted"><X size={14} /></button>
                    </div></td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-textMain">{venue.venueName}</td>
                    <td className={tdCls}>{venue.venueCapacity?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${venue.venueAvailability === "Y" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"}`}>
                        {venue.venueAvailability === "Y" ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(venue)} className="p-1.5 rounded-lg text-textMuted hover:text-themeAccent transition"><Edit2 size={14} /></button>
                      <button onClick={() => setConfirmId(venue.venueId)} className="p-1.5 rounded-lg text-textMuted hover:text-red-500 transition"><Trash2 size={14} /></button>
                    </div></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {venues.length === 0 && !fetching && <div className="text-center py-10 text-sm text-textMuted">No venues found</div>}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] bg-black/40 backdrop-blur-sm">
          <div className="bg-cardBg border border-themeBorder rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-6 text-textMain">Add New Venue</h3>
            <div className="space-y-4">
              {[{ label: "Venue Name", key: "name", placeholder: "e.g. Campus-7 Seminar Hall", type: "text" },
                { label: "Capacity", key: "capacity", placeholder: "e.g. 500", type: "number" }].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase mb-1 block text-textMuted">{label}</label>
                  <input type={type} value={addForm[key]} onChange={e => setAddForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className={inputCls} />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold uppercase mb-1 block text-textMuted">Availability</label>
                <select value={addForm.availability} onChange={e => setAddForm(p => ({ ...p, availability: e.target.value }))} className={inputCls}>
                  <option value="Y">Available</option>
                  <option value="N">Unavailable</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-themeBorder text-textMain hover:opacity-80">Cancel</button>
              <button onClick={addVenue} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-themeAccent text-pageBg transition active:scale-95">Add Venue</button>
            </div>
          </div>
        </div>
      )}
      {confirmId && <ConfirmDialog message="This will permanently remove the venue." onConfirm={() => deleteVenue(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  );
};

// =============================================================================
//  TAB: EVENTS
// =============================================================================
const EventsTab = ({ backendOnline }) => {
  const [events, setEvents] = useState([]);
  const [confirmAction, setConfirmAction] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
  if (!backendOnline) return;

  // 1. Get the token from storage
  const token = localStorage.getItem('token'); 
  
  setFetching(true);

  // 2. Add the headers object to your fetch call
  fetch(`${API}/api/admin/events`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`, // <-- CRITICAL FIX
      'Content-Type': 'application/json'
    }
  })
    .then(r => {
      if (!r.ok) throw new Error(`Error: ${r.status}`);
      return r.json();
    })
    .then(j => {
      const list = j.data || j;
      setEvents(Array.isArray(list) ? list.map(e => ({
        ...e,
        id:     e.id     || e.eventId,
        name:   e.name   || e.eventName,
        status: e.status || e.eventStatus,
        startDate: e.startDate || e.eventStartDate,
      })) : []);
    })
    .catch(err => console.error("Event fetch failed:", err)) // Added logging
    .finally(() => setFetching(false));
}, [backendOnline]);

  const handleAction = (id, action) => {
    if (action === "delete") setEvents(prev => prev.filter(e => e.id !== id));
    else setEvents(prev => prev.map(e => e.id === id ? { ...e, status: action === "approve" ? "upcoming" : "rejected" } : e));
    setConfirmAction(null);
  };

  if (!backendOnline) return <EmptyState icon={Calendar} message="Backend not connected" sub="Event data will appear here once the backend is running at localhost:9090" />;
  if (fetching) return <div className="py-12 text-center text-sm text-textMuted">Loading events...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-textMuted">{events.length} events</span>
      </div>
      {events.length === 0 ? (
        <div className="text-center py-10 text-sm text-textMuted">No events found</div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.eventId} className="bg-cardBg border border-themeBorder rounded-xl p-4 hover:border-themeAccent/30 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-textMuted">{event.eventId}</span>
                    <StatusBadge status={event.eventStatus} />
                  </div>
                  <h4 className="font-bold text-textMain">{event.eventName}</h4>
                  <p className="text-xs mt-0.5 leading-relaxed text-textMuted">{event.eventDescription}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs flex-wrap text-textMuted">
                    <span>📅 {event.eventStartDate} → {event.eventEndDate}</span>
                    <span>⏰ {event.eventTime}</span>
                    <span>⏱ {event.eventDuration}h</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {event.eventStatus === "pending" && (
                    <>
                      <button onClick={() => setConfirmAction({ id: event.eventId, action: "approve" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:opacity-80 transition">
                        <Check size={13} /> Approve
                      </button>
                      <button onClick={() => setConfirmAction({ id: event.eventId, action: "reject" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:opacity-80 transition">
                        <X size={13} /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => setConfirmAction({ id: event.eventId, action: "delete" })} className="p-1.5 rounded-lg text-textMuted hover:text-red-500 transition"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.action === "delete" ? "This will permanently delete the event." : confirmAction.action === "approve" ? "This will approve the event and make it visible to all users." : "This will reject the event."}
          onConfirm={() => handleAction(confirmAction.id, confirmAction.action)}
          onCancel={() => setConfirmAction(null)} />
      )}
    </div>
  );
};

// =============================================================================
//  TAB: PROGRAMMES
// =============================================================================
const ProgrammesTab = ({ backendOnline }) => {
  const [programmes, setProgrammes] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [confirmAction, setConfirmAction] = useState(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!backendOnline) return;

    // 1. Get the JWT token from storage
    const token = localStorage.getItem('token'); 
    
    setFetching(true);

    // 2. Add Authorization headers to the fetch call
    fetch(`${API}/api/admin/programmes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(r => {
        if (!r.ok) throw new Error(`Server responded with ${r.status}`);
        return r.json();
      })
      .then(j => {
        // Handle both { data: [...] } and direct array formats
        const list = j.data || j;
        setProgrammes(Array.isArray(list) ? list : []);
      })
      .catch(err => {
        console.error("Failed to fetch programmes:", err);
      })
      .finally(() => setFetching(false));
  }, [backendOnline]);

  const counts = { all: programmes.length, pending: programmes.filter(p => p.programmeStatus === "pending").length, approved: programmes.filter(p => p.programmeStatus === "approved").length, rejected: programmes.filter(p => p.programmeStatus === "rejected").length };
  const filtered = filterStatus === "all" ? programmes : programmes.filter(p => p.programmeStatus === filterStatus);

  const handleAction = async (id, action) => {
    const token = localStorage.getItem("token");
    try {
      if (action === "delete") {
        const res = await fetch(`${API}/api/admin/programmes/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
        setProgrammes(prev => prev.filter(p => p.programmeId !== id));
      } else {
        const status = action === "approve" ? "approved" : "rejected";
        const res = await fetch(`${API}/api/admin/programmes/${id}/status`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error(`Status update failed: ${res.status}`);
        setProgrammes(prev =>
          prev.map(p => p.programmeId === id ? { ...p, programmeStatus: status } : p)
        );
      }
    } catch (err) {
      console.error("Programme action failed:", err.message);
      alert(err.message);
    } finally {
      setConfirmAction(null);
    }
  };

  if (!backendOnline) return <EmptyState icon={BookOpen} message="Backend not connected" sub="Programme data will appear here once the backend is running at localhost:9090" />;
  if (fetching) return <div className="py-12 text-center text-sm text-textMuted">Loading programmes...</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {["all", "pending", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition capitalize ${filterStatus === f ? "bg-textMain text-pageBg" : "bg-pageBg text-textMuted border border-themeBorder"}`}>
            {f}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filterStatus === f ? "bg-pageBg/20 text-pageBg" : "bg-themeBorder text-textMuted"}`}>{counts[f]}</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-textMuted">No programmes in this category</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prog => (
            <div key={prog.programmeId} className="bg-cardBg border border-themeBorder rounded-xl p-4 hover:border-themeAccent/30 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-textMuted">{prog.programmeId}</span>
                    <StatusBadge status={prog.programmeStatus} />
                  </div>
                  <h4 className="font-bold text-textMain">{prog.programmeName}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs flex-wrap text-textMuted">
                    <span>📅 {prog.eventName}</span>
                    <span>🏢 {prog.organiserName}</span>
                    <span>📍 {prog.venueName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {prog.programmeStatus === "pending" && (
                    <>
                      <button onClick={() => setConfirmAction({ id: prog.programmeId, action: "approve" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:opacity-80 transition">
                        <Check size={13} /> Approve
                      </button>
                      <button onClick={() => setConfirmAction({ id: prog.programmeId, action: "reject" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:opacity-80 transition">
                        <X size={13} /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => setConfirmAction({ id: prog.programmeId, action: "delete" })} className="p-1.5 rounded-lg text-textMuted hover:text-red-500 transition"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.action === "delete" ? "This will permanently delete the programme." : confirmAction.action === "approve" ? "This will approve the programme." : "This will reject the programme."}
          onConfirm={() => handleAction(confirmAction.id, confirmAction.action)}
          onCancel={() => setConfirmAction(null)} />
      )}
    </div>
  );
};

// =============================================================================
//  TAB: ORGANISERS
// =============================================================================
const OrganisersTab = ({ backendOnline }) => {
  const [organisers, setOrganisers] = useState([]);
  const [confirmId, setConfirmId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [pendingProgs, setPendingProgs] = useState([]);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", username: "", password: "" });
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
  if (!backendOnline) return;
  
  const token = localStorage.getItem('token'); 
  setFetching(true);

  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  Promise.all([
    fetch(`${API}/api/admin/organisers`, { headers: authHeaders }).then(r => r.json()),
    fetch(`${API}/api/admin/programmes?status=pending`, { headers: authHeaders }).then(r => r.json()),
  ])
    .then(([orgs, progs]) => {
      // Map OrganiserResponse.java fields to your Table fields
      const orgList = (orgs.data || orgs).map(o => ({
        id: o.organiserId,
        name: o.organiserName,
        email: o.organiserEmail,
        phone: o.organiserPhoneNo,
        username: o.organiserUsername
      }));

      // Map ProgrammeResponse.java fields for the Modal
      const progList = (progs.data || progs).map(p => ({
        id: p.programmeId,
        name: p.programmeName,
        eventName: p.eventName,
        organiser: p.organiserName,
        venue: p.venueName
      }));

      setOrganisers(orgList);
      setPendingProgs(progList);
    })
    .catch(err => console.error("Fetch failed:", err))
    .finally(() => setFetching(false));
}, [backendOnline]);

  const removeOrganiser = (id) => {
  const token = localStorage.getItem('token');

  fetch(`${API}/api/admin/organisers/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => {
      if (!r.ok) throw new Error("Could not delete organiser");
      // Only remove from screen if DB deletion was successful
      setOrganisers(prev => prev.filter(o => o.id !== id));
      setConfirmId(null);
    })
    .catch(err => alert(err.message));
};
 const addOrganiser = () => {
  if (!addForm.name.trim() || !addForm.email.trim() || !addForm.username.trim()) return;
  
  const token = localStorage.getItem('token');

  fetch(`${API}/api/admin/organisers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(addForm) // Matches your AddOrganiserRequest.java exactly
  })
    .then(r => {
      if (!r.ok) throw new Error("Validation failed (Check phone length or email)");
      return r.json();
    })
    .then(newOrg => {
      // Add the new organiser returned from DB to your table
      setOrganisers(prev => [...prev, {
        id: newOrg.organiserId,
        name: newOrg.organiserName,
        email: newOrg.organiserEmail,
        phone: newOrg.organiserPhoneNo,
        username: newOrg.organiserUsername
      }]);
      setShowAddForm(false);
      setAddForm({ name: "", email: "", phone: "", username: "", password: "" });
    })
    .catch(err => alert(err.message));
};
  const handleProgAction = (id, action) => {
  const token = localStorage.getItem('token');
  const status = action === "approve" ? "approved" : "rejected";

  fetch(`${API}/api/admin/programmes/${id}/status`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ status: status }) 
  })
    .then(r => {
      if (!r.ok) throw new Error("Failed to update programme status");
      // Remove from the pending list on screen
      setPendingProgs(prev => prev.filter(p => p.id !== id));
    })
    .catch(err => alert(err.message));
};

  if (!backendOnline) return <EmptyState icon={User} message="Backend not connected" sub="Organiser data will appear here once the backend is running at localhost:9090" />;
  if (fetching) return <div className="py-12 text-center text-sm text-textMuted">Loading organisers...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-textMuted">{organisers.length} organisers</span>
        <div className="flex gap-3">
          <button onClick={() => setShowAcceptModal(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-themeBorder bg-cardBg text-textMain hover:border-themeAccent transition">
            <Check size={14} className="text-green-500" /> Accept Events
            {pendingProgs.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-yellow-400 text-black">{pendingProgs.length}</span>
            )}
          </button>
          <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-themeAccent text-pageBg transition active:scale-95">
            <Plus size={14} /> Add Organiser
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-x-auto border border-themeBorder">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-pageBg border-b border-themeBorder">
              {["ID", "Name", "Email", "Phone", "Username", "Actions"].map((h, i) => (
                <th key={h} className={`${thCls} ${i === 5 ? "text-right" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {organisers.map((org, idx) => (
              <tr key={org.id} className={`bg-cardBg hover:brightness-95 transition ${idx < organisers.length - 1 ? "border-b border-themeBorder" : ""}`}>
                <td className="px-4 py-3 font-mono text-xs text-textMuted">{org.id}</td>
                <td className="px-4 py-3 font-medium text-textMain">{org.name}</td>
                <td className={tdCls}>{org.email}</td>
                <td className={tdCls}>{org.phone}</td>
                <td className={tdCls}>{org.username}</td>
                <td className="px-4 py-3"><div className="flex justify-end">
                  <button onClick={() => setConfirmId(org.id)} className="p-1.5 rounded-lg text-textMuted hover:text-red-500 transition"><Trash2 size={14} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {organisers.length === 0 && !fetching && <div className="text-center py-10 text-sm text-textMuted">No organisers found</div>}
      </div>

      {/* Accept Events Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] bg-black/40 backdrop-blur-sm">
          <div className="bg-cardBg border border-themeBorder rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-textMain">Pending Event Approvals</h3>
                <p className="text-xs mt-0.5 text-textMuted">Review and approve or reject programme submissions.</p>
              </div>
              <button onClick={() => setShowAcceptModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold bg-pageBg text-textMuted hover:brightness-95">×</button>
            </div>
            {pendingProgs.length === 0 ? (
              <div className="text-center py-10 text-textMuted">
                <Check size={32} className="mx-auto mb-2 text-green-400" />
                <p className="text-sm font-medium">All caught up — no pending approvals.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {pendingProgs.map(prog => (
                  <div key={prog.id} className="flex items-center justify-between bg-pageBg border border-themeBorder rounded-xl p-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-textMain">{prog.name}</p>
                      <p className="text-xs mt-0.5 truncate text-textMuted">{prog.eventName} · {prog.organiser} · {prog.venue}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleProgAction(prog.id, "approve")} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:opacity-80"><Check size={12} /> Accept</button>
                      <button onClick={() => handleProgAction(prog.id, "reject")} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:opacity-80"><X size={12} /> Reject</button>
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
        <div className="fixed inset-0 flex items-center justify-center z-[200] bg-black/40 backdrop-blur-sm">
          <div className="bg-cardBg border border-themeBorder rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-1 text-textMain">Add New Organiser</h3>
            <p className="text-xs mb-6 text-textMuted">Password will be SHA-256 hashed by the backend before storing.</p>
            <div className="space-y-4">
              {[
                { label: "Organisation Name", key: "name", placeholder: "e.g. KIIT-DU", type: "text" },
                { label: "Email", key: "email", placeholder: "e.g. org@kiit.in", type: "email" },
                { label: "Phone", key: "phone", placeholder: "e.g. 9876543210", type: "text" },
                { label: "Username", key: "username", placeholder: "e.g. kalinga.org", type: "text" },
                { label: "Password", key: "password", placeholder: "Temporary password", type: "password" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold uppercase mb-1 block text-textMuted">{label}</label>
                  <input type={type} value={addForm[key]} onChange={e => setAddForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className={inputCls} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-themeBorder text-textMain hover:opacity-80">Cancel</button>
              <button onClick={addOrganiser} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-themeAccent text-pageBg transition active:scale-95">Add Organiser</button>
            </div>
          </div>
        </div>
      )}
      {confirmId && <ConfirmDialog message="This will permanently remove the organiser and unlink all their events and programmes." onConfirm={() => removeOrganiser(confirmId)} onCancel={() => setConfirmId(null)} />}
    </div>
  );
};

// =============================================================================
//  MAIN ADMIN PAGE
// =============================================================================
export default function AdminPage() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [showManageAdmin, setShowManageAdmin] = useState(false);
  const [mailStep, setMailStep] = useState(null);
  const [mailTarget, setMailTarget] = useState("All");
  const [mailMode, setMailMode] = useState("all");
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailSent, setMailSent] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [allOrganisers, setAllOrganisers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({ firstName: "", lastName: "", email: "", phone: "", username: "", password: "" });
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [loadingPool, setLoadingPool] = useState(false);

  const tabs = [
    { key: "Users", icon: <Users size={15} /> },
    { key: "Venues", icon: <Building2 size={15} /> },
    { key: "Events", icon: <Calendar size={15} /> },
    { key: "Programmes", icon: <BookOpen size={15} /> },
    { key: "Organisers", icon: <User size={15} /> },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
        const [profileRes, adminsRes] = await Promise.all([
          fetch(`${API}/api/admin/profile`, { headers: authHeader }),
          fetch(`${API}/api/admin/all`,     { headers: authHeader }),
        ]);
        if (!profileRes.ok) throw new Error("Backend offline");
        const profileJson = await profileRes.json();
        const adminsJson  = await adminsRes.json();
        const rawAdmin = profileJson.data || profileJson;
        setAdmin({
          ...rawAdmin,
          // normalise field names: backend uses ADMIN_FIRST_NAME mapped to adminFirstName
          name:  rawAdmin.name || (rawAdmin.adminFirstName ? rawAdmin.adminFirstName + " " + (rawAdmin.adminLastName || "") : "Admin"),
          email: rawAdmin.email || rawAdmin.adminEmail || "",
          phone: rawAdmin.phone || rawAdmin.adminPhoneNumber || "",
          username: rawAdmin.username || rawAdmin.adminUsername || "",
          id:    rawAdmin.id   || rawAdmin.adminId     || "",
        });
        setAdmins(adminsJson.data  || adminsJson);
        setBackendOnline(true);
      } catch { setAdmin(null); setAdmins([]); setBackendOnline(false); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!backendOnline) return;
    
    const token = localStorage.getItem("token");
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API}/api/admin/users`, { headers: authHeader })
      .then(r => r.json())
      .then(j => setAllUsers(j.data || j))
      .catch(err => console.error("User fetch error:", err));

    fetch(`${API}/api/admin/organisers`, { headers: authHeader })
      .then(r => r.json())
      .then(j => setAllOrganisers(j.data || j))
      .catch(err => console.error("Organiser fetch error:", err));
  }, [backendOnline]);

  const handleTabClick = (key) => setActiveTab(prev => prev === key ? null : key);

  const openMail = (target) => {
    setMailTarget(target); setMailMode("all"); setSelectedRecipients([]); setRecipientSearch(""); setManualEmail(""); setMailSubject(""); setMailBody(""); setMailSent(false);
    setMailStep(target === "All" ? "compose" : "select");
  };
  const closeMail = () => setMailStep(null);

  const recipientPool = mailTarget === "Users"
    ? allUsers.map(u => ({ 
        id: u.id || u.userId, 
        name: `${u.firstName || u.userFirstName || ""} ${u.lastName || u.userLastName || ""}`.trim(), 
        email: u.email || u.userEmail 
      }))
    : allOrganisers.map(o => ({ 
        id: o.id || o.organiserId, 
        name: o.name || o.organiserName, 
        email: o.email || o.organiserEmail 
      }));

  const filteredPool = recipientPool.filter(r => r.name.toLowerCase().includes(recipientSearch.toLowerCase()) || r.email.toLowerCase().includes(recipientSearch.toLowerCase()));

  const toggleRecipient = (person) => setSelectedRecipients(prev => prev.find(p => p.id === person.id) ? prev.filter(p => p.id !== person.id) : [...prev, person]);
  const addManualEmail = () => {
  const email = manualEmail.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address");
    return;
  }
  
  if (!selectedRecipients.find(p => p.email === email)) {
    setSelectedRecipients(prev => [...prev, { id: email, name: email, email }]);
  }
  setManualEmail("");
};
  const removeRecipient = (id) => setSelectedRecipients(prev => prev.filter(p => p.id !== id));
  const proceedToCompose = () => { if (mailMode === "particular" && selectedRecipients.length === 0) return; setMailStep("compose"); };
  const handleSendMail = async () => {
  if (!mailSubject.trim() || !mailBody.trim()) return;

  const token = localStorage.getItem("token");
  
  // Prepare the payload to match your MailRequest DTO
  const payload = {
    target: mailTarget, // "All" | "Users" | "Organisers"
    mode: mailMode,     // "all" | "particular"
    recipients: mailMode === "particular" ? selectedRecipients.map(r => r.email) : [],
    subject: mailSubject,
    body: mailBody
  };

  try {
    const response = await fetch(`${API}/api/mail/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      setMailSent(true);
      setTimeout(() => closeMail(), 2500);
    } else {
      alert("Failed to dispatch mail. Ensure you have admin privileges.");
    }
  } catch (error) {
    console.error("Mail Error:", error);
    alert("Connection error. Is the backend running?");
  }
};

  const addNewAdmin = () => {
  if (!newAdminForm.firstName.trim() || !newAdminForm.email.trim() || !newAdminForm.username.trim()) return;
  
  const token = localStorage.getItem("token");

  fetch(`${API}/api/admin/add`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(newAdminForm)
  })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(data => {
      // data.data should contain the new Admin object from Spring Boot
      setAdmins(prev => [...prev, data.data || data]);
      setShowAddAdminForm(false);
      setNewAdminForm({ firstName: "", lastName: "", email: "", phone: "", username: "", password: "" });
    })
    .catch(() => alert("Failed to add admin. Check if email/username already exists."));
};
  const removeAdmin = (id) => {
  if (PROTECTED_ADMIN_IDS.includes(id)) return;
  const token = localStorage.getItem("token");

  fetch(`${API}/api/admin/remove/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(r => {
      if (r.ok) {
        setAdmins(prev => prev.filter(a => a.adminId !== id)); // Note: Check if field is id or adminId
        setConfirmRemoveId(null);
      }
    });
};

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-pageBg">
      <div className="text-xl font-semibold animate-pulse text-textMuted">Loading EventSphere Admin...</div>
    </div>
  );

  return (
    <div className="min-h-screen font-sans bg-pageBg">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between bg-cardBg border border-themeBorder rounded-2xl px-6 py-4 shadow-sm">
          <h1 className="text-xl font-bold text-textMain">
            Event<span className="text-themeAccent">Sphere</span> Admin
          </h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button onClick={() => setShowManageAdmin(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-themeBorder bg-cardBg text-textMain hover:border-themeAccent transition">
              <span className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-themeBorder"><User size={14} /></span>
              Manage Admin
            </button>
            <button onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-red-500/30 bg-cardBg text-red-500 hover:bg-red-500/10 transition">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex justify-center gap-3 flex-wrap">
          {tabs.map(({ key, icon }) => {
            const isActive = activeTab === key;
            return (
              <button key={key} onClick={() => handleTabClick(key)}
                className={`flex items-center gap-2 px-7 py-2 rounded-xl text-sm font-medium transition border-b-2 ${
                  isActive ? "bg-cardBg text-textMain border-themeAccent shadow-sm" : "bg-pageBg text-textMuted border-transparent hover:text-textMain"
                }`}>
                {icon} {key}
              </button>
            );
          })}
        </div>

        {/* ── Main card ── */}
        <div className="bg-cardBg border border-themeBorder rounded-2xl shadow-sm">
          <div className="p-10">
            {/* Backend offline banner */}
            {!backendOnline && (
              <div className="mb-6 px-4 py-3 rounded-xl flex items-center gap-2 text-sm bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400">
                <AlertCircle size={15} className="shrink-0" />
                Backend not connected — admin profile cannot be loaded. Start your server at {API}.
              </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-center gap-16">
              {/* Avatar */}
              <div className="w-48 h-48 rounded-full flex-shrink-0 overflow-hidden bg-pageBg border border-themeBorder">
                {admin?.photoUrl ? (
                  <img src={admin.photoUrl} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {!backendOnline
                      ? <span className="text-xs text-center px-4 text-textMuted">Photo loads from backend</span>
                      : <User size={48} className="text-textMuted" />}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-3 text-xl text-textMain">
                {[["Name", admin?.name], ["Email", admin?.email], ["Phone No", admin?.phone], ["Username", admin?.username]].map(([label, val]) => (
                  <p key={label}>
                    <span className="font-medium">{label}: </span>
                    <span className={backendOnline ? "text-textMain" : "text-textMuted"}>{val || (backendOnline ? "—" : "Loads from backend")}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* Mail buttons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              {["All", "Users", "Organisers"].map(target => (
                <button key={target} onClick={() => openMail(target)}
                  className="py-3 rounded-xl font-semibold text-base bg-themeAccent text-pageBg transition active:scale-95 hover:brightness-95">
                  Mail to {target}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab && (
            <div className="border-t border-themeBorder p-6">
              <h2 className="text-lg font-bold mb-5 text-textMain">{activeTab}</h2>
              {activeTab === "Users" && <UsersTab backendOnline={backendOnline} />}
              {activeTab === "Venues" && <VenuesTab backendOnline={backendOnline} />}
              {activeTab === "Events" && <EventsTab backendOnline={backendOnline} />}
              {activeTab === "Programmes" && <ProgrammesTab backendOnline={backendOnline} />}
              {activeTab === "Organisers" && <OrganisersTab backendOnline={backendOnline} />}
            </div>
          )}
        </div>
      </div>

      {/* ── Manage Admin Modal ── */}
      {showManageAdmin && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-cardBg border border-themeBorder rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-themeBorder">
              <div>
                <h2 className="text-xl font-bold text-textMain">Manage Admin</h2>
                <p className="text-xs mt-0.5 text-textMuted">Founders (A-0001, A-0002, A-0003) are protected and cannot be removed.</p>
              </div>
              <button onClick={() => { setShowManageAdmin(false); setShowAddAdminForm(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-lg font-bold bg-pageBg text-textMuted hover:brightness-95">×</button>
            </div>

            <div className="px-6 py-4 max-h-72 overflow-y-auto">
              {!backendOnline ? (
                <div className="text-center py-8 text-sm text-textMuted">Admin list loads from backend</div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-sm text-textMuted">No admins found</div>
              ) : (
                <div className="space-y-2">
                  {admins.map(a => {
                    const isProtected = PROTECTED_ADMIN_IDS.includes(a.adminId);
                    return (
                      <div key={a.adminId} className="flex items-center justify-between bg-pageBg border border-themeBorder rounded-xl px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-textMain">{a.adminFirstName} {a.adminLastName}</p>
                            {isProtected && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">Founder</span>}
                          </div>
                          <p className="text-xs mt-0.5 text-textMuted">{a.adminId} · {a.adminUsername}</p>
                        </div>
                        {isProtected ? (
                          <span className="flex items-center gap-1 text-xs text-textMuted"><ShieldOff size={13} /> Protected</span>
                        ) : (
                          <button onClick={() => setConfirmRemoveId(a.adminId)} className="p-1.5 rounded-lg text-textMuted hover:text-red-500 transition"><Trash2 size={14} /></button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {showAddAdminForm ? (
              <div className="px-6 pb-6 border-t border-themeBorder pt-4 space-y-3">
                <p className="text-sm font-semibold text-textMain">New Admin Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "First Name", key: "firstName", placeholder: "e.g. Rohan", type: "text" },
                    { label: "Last Name", key: "lastName", placeholder: "e.g. Sharma", type: "text" },
                    { label: "Email", key: "email", placeholder: "admin@kiit.in", type: "email" },
                    { label: "Phone", key: "phone", placeholder: "9876543210", type: "text" },
                    { label: "Username", key: "username", placeholder: "rohan.sharma", type: "text" },
                    { label: "Password", key: "password", placeholder: "Temp password", type: "password" },
                  ].map(({ label, key, placeholder, type }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold uppercase mb-1 block text-textMuted">{label}</label>
                      <input type={type} value={newAdminForm[key]} onChange={e => setNewAdminForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
                        className="w-full rounded-xl px-3 py-2 text-sm outline-none bg-inputBg border border-themeBorder text-textMain focus:border-themeAccent transition" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-textMuted">Password will be SHA-256 hashed by the backend.</p>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setShowAddAdminForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-themeBorder text-textMain hover:opacity-80">Cancel</button>
                  <button onClick={addNewAdmin} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-themeAccent text-pageBg transition active:scale-95">Add Admin</button>
                </div>
              </div>
            ) : (
              <div className="px-6 pb-6 border-t border-themeBorder pt-4">
                <button onClick={() => setShowAddAdminForm(true)}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-themeAccent text-pageBg transition active:scale-95">
                  <Plus size={15} /> Add New Admin
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {confirmRemoveId && <ConfirmDialog message="This will permanently remove this admin account." onConfirm={() => removeAdmin(confirmRemoveId)} onCancel={() => setConfirmRemoveId(null)} />}

      {/* ── Mail Modal ── */}
      {mailStep && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40">
          <div className="w-full max-w-lg bg-cardBg border border-themeBorder rounded-2xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: "90vh" }}>
            {/* Modal header */}
            <div className="px-5 py-4 flex justify-between items-center shrink-0 bg-textMain">
              <div>
                <span className="font-semibold text-sm text-pageBg">
                  {mailStep === "select" ? `Mail to ${mailTarget}` : "New Message"}
                </span>
                {mailStep === "compose" && (
                  <span className="ml-2 text-xs text-pageBg/60">
                    → {mailMode === "all" ? (mailTarget === "All" ? "All Users & Organisers" : `All ${mailTarget}`) : `${selectedRecipients.length} recipient${selectedRecipients.length !== 1 ? "s" : ""}`}
                  </span>
                )}
              </div>
              <button onClick={closeMail} className="w-7 h-7 flex items-center justify-center rounded-lg text-lg font-bold text-pageBg/60 hover:text-pageBg">✕</button>
            </div>

            {/* Step 1: Select */}
            {mailStep === "select" && (
              <div className="p-6 flex-1 overflow-y-auto">
                <p className="text-sm font-semibold mb-4 text-textMain">Who do you want to mail?</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button onClick={() => { setMailMode("all"); setMailStep("compose"); }}
                    className="py-4 rounded-xl font-semibold text-sm bg-themeAccent text-pageBg transition active:scale-95 hover:brightness-95">
                    All {mailTarget}
                  </button>
                  <button onClick={() => setMailMode("particular")}
                    className={`py-4 rounded-xl font-semibold text-sm transition active:scale-95 ${mailMode === "particular" ? "bg-textMain text-pageBg" : "bg-pageBg border border-themeBorder text-textMain"}`}>
                    Particular {mailTarget === "Users" ? "User" : "Organiser"}
                  </button>
                </div>

                {mailMode === "particular" && (
                  <div>
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                        <input type="text" placeholder={`Search ${mailTarget.toLowerCase()}...`} value={recipientSearch} onChange={e => setRecipientSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none bg-inputBg border border-themeBorder text-textMain focus:border-themeAccent transition" />
                      </div>
                    </div>
                    {filteredPool.length > 0 && (
                      <div className="border border-themeBorder rounded-xl overflow-hidden mb-3" style={{ maxHeight: 180, overflowY: "auto" }}>
                        {filteredPool.map(person => {
                          const isSelected = !!selectedRecipients.find(p => p.id === person.id);
                          return (
                            <div key={person.id} onClick={() => toggleRecipient(person)}
                              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer border-b border-themeBorder transition ${isSelected ? "bg-themeAccent/10" : "bg-cardBg hover:bg-pageBg"}`}>
                              <div>
                                <p className="text-sm font-medium text-textMain">{person.name}</p>
                                <p className="text-xs text-textMuted">{person.email}</p>
                              </div>
                              {isSelected && <Check size={15} className="text-themeAccent" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex gap-2 mb-4">
                      <input type="email" placeholder="Or type an email address manually..." value={manualEmail} onChange={e => setManualEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && addManualEmail()}
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none bg-inputBg border border-themeBorder text-textMain focus:border-themeAccent transition" />
                      <button onClick={addManualEmail} className="px-4 py-2 rounded-xl text-sm font-semibold bg-pageBg border border-themeBorder text-textMain hover:border-themeAccent transition">Add</button>
                    </div>
                    {selectedRecipients.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase mb-2 text-textMuted">Selected ({selectedRecipients.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRecipients.map(r => (
                            <span key={r.id} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-pageBg border border-themeBorder text-textMain">
                              {r.name}
                              <button onClick={() => removeRecipient(r.id)} className="text-textMuted hover:text-red-500">×</button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-6">
                  <button onClick={proceedToCompose} disabled={mailMode === "particular" && selectedRecipients.length === 0}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition active:scale-95 ${mailMode === "particular" && selectedRecipients.length === 0 ? "bg-pageBg border border-themeBorder text-textMuted cursor-not-allowed" : "bg-themeAccent text-pageBg hover:brightness-95"}`}>
                    Continue to Compose →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Compose */}
            {mailStep === "compose" && (
              <>
                {mailSent ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3">
                    <div className="text-5xl">✅</div>
                    <h3 className="text-xl font-bold text-green-500">Mail Sent!</h3>
                    <p className="text-sm text-textMuted">All recipients have been notified.</p>
                  </div>
                ) : (
                  <>
                    <div className="p-5 flex-1 overflow-y-auto space-y-4">
                      {mailMode === "particular" && (
                        <button onClick={() => setMailStep("select")} className="text-xs font-medium flex items-center gap-1 text-textMuted hover:text-themeAccent transition">← Back to recipients</button>
                      )}
                      <div className="pb-3 border-b border-themeBorder">
                        <p className="text-xs font-semibold uppercase mb-1 text-textMuted">To</p>
                        {mailMode === "all" ? (
                          <p className="text-sm font-medium text-textMain">{mailTarget === "All" ? "All Users & All Organisers" : `All ${mailTarget}`}</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {selectedRecipients.map(r => (
                              <span key={r.id} className="px-2.5 py-1 rounded-full text-xs font-medium bg-pageBg border border-themeBorder text-textMain">{r.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase mb-1 text-textMuted">Subject</p>
                        <input type="text" placeholder="Enter subject..." value={mailSubject} onChange={e => setMailSubject(e.target.value)}
                          className="w-full py-2 text-sm outline-none border-b border-themeBorder bg-transparent text-textMain" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase mb-1 text-textMuted">Message</p>
                        <textarea placeholder="Write your message here..." value={mailBody} onChange={e => setMailBody(e.target.value)}
                          className="w-full h-40 resize-none outline-none text-sm leading-relaxed bg-transparent text-textMain" />
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between shrink-0 border-t border-themeBorder">
                      <p className="text-xs text-textMuted">From: eventsphere.noreply@gmail.com</p>
                      <button onClick={handleSendMail} disabled={!mailSubject.trim() || !mailBody.trim()}
                        className={`px-8 py-2 rounded-xl font-bold text-sm transition active:scale-95 ${!mailSubject.trim() || !mailBody.trim() ? "bg-pageBg border border-themeBorder text-textMuted cursor-not-allowed" : "bg-themeAccent text-pageBg hover:brightness-95"}`}>
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