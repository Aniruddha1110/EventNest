import React, { useState, useEffect } from "react";

/**
 * AdminPage Component
 * Designed to match the EventSphere Admin UI.
 * Integrates with SpringBoot/Django backend for dynamic profile data.
 */
export default function AdminPage() {
  // --- State Management ---
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Users");
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [mailModal, setMailModal] = useState({ show: false, type: "" });
  const [showMailPad, setShowMailPad] = useState(false);

  const tabs = ["Users", "Venues", "Events", "Programmes", "Organisers"];

  // --- Data Fetching ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Replace with your Django or SpringBoot endpoint
        // e.g., http://localhost:8080/api/admin/me
        const response = await fetch("http://localhost:8080/api/admin/profile"); 
        const data = await response.json();
        setAdmin(data);
      } catch (error) {
        console.error("Error connecting to backend:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // --- Handlers ---
  const handleMailClick = (type) => {
    if (type === "All") {
      setShowMailPad(true);
    } else {
      setMailModal({ show: true, type });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8]">
        <div className="animate-pulse text-xl font-semibold text-gray-400">Loading EventSphere Admin...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8] p-4 md:p-10 font-sans text-gray-800">
      
      {/* --- Header --- */}
      <div className="max-w-6xl mx-auto flex items-center justify-between bg-white rounded-xl shadow-sm px-6 py-3 mb-8">
        <h1 className="text-xl font-bold">EventSphere Admin</h1>
        <button
          onClick={() => setShowAdminModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm text-sm font-medium"
        >
          <span className="text-xl">👤</span> Switch Admin Account
        </button>
      </div>

      {/* --- Navigation Tabs --- */}
      <div className="flex justify-center gap-4 mb-8">
        {tabs.map((tab) => (
          <div key={tab} className="relative group">
            <button
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab 
                ? "bg-white shadow-sm border-b-2 border-black" 
                : "bg-[#E5E5E5] text-gray-600 hover:bg-gray-300"
              }`}
            >
              {tab}
            </button>

            {/* Dropdown Logic for Venues & Organisers */}
            {(tab === "Venues" || tab === "Organisers") && (
              <div className="absolute hidden group-hover:block top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-xl z-10 overflow-hidden">
                {tab === "Venues" ? (
                  <>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">See all venues</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Add new venue</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Remove existing venues</button>
                  </>
                ) : (
                  <>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">See all organisers</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Add organisers</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm">Remove organisers</button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-t">Accept events from organisers</button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- Main Admin Info Card --- */}
      <div className="max-w-5xl mx-auto bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12">
        <div className="flex flex-col md:flex-row items-center justify-center gap-16 mb-16">
          
          {/* Dynamic Profile Photo */}
          <div className="w-56 h-56 rounded-full bg-[#E5E5E5] flex-shrink-0 overflow-hidden border-4 border-white shadow-md">
            {admin?.photoUrl ? (
              <img src={admin.photoUrl} alt="Admin" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">👤</div>
            )}
          </div>
          
          {/* Dynamic Details Section */}
          <div className="space-y-3 text-xl">
            <p><span className="font-medium">Name:</span> {admin?.name || "Jane Doe"}</p>
            <p><span className="font-medium">Email:</span> {admin?.email || "jane.doe@eventsphere.com"}</p>
            <p><span className="font-medium">Phone No:</span> {admin?.phone || "+1-555-123-667"}</p>
            <p><span className="font-medium">Username:</span> {admin?.username || "janedoe_admin"}</p>
          </div>
        </div>

        {/* --- Action Buttons (Lime Green) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => handleMailClick("All")}
            className="py-3 bg-[#C5E86C] hover:bg-[#b5d65c] rounded-xl font-medium text-lg shadow-sm transition-transform active:scale-95">
            Mail to All
          </button>
          <button 
            onClick={() => handleMailClick("Users")}
            className="py-3 bg-[#C5E86C] hover:bg-[#b5d65c] rounded-xl font-medium text-lg shadow-sm transition-transform active:scale-95">
            Mail to Users
          </button>
          <button 
            onClick={() => handleMailClick("Organisers")}
            className="py-3 bg-[#C5E86C] hover:bg-[#b5d65c] rounded-xl font-medium text-lg shadow-sm transition-transform active:scale-95">
            Mail to Organisers
          </button>
        </div>
      </div>

      {/* --- Popups & Modals --- */}

      {/* Admin Management Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">Manage Admin Accounts</h2>
            <div className="space-y-3">
              <button className="w-full py-3 bg-gray-100 rounded-xl font-medium hover:bg-gray-200">Add New Admin</button>
              <button className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100">Remove Old Admin</button>
            </div>
            <button onClick={() => setShowAdminModal(false)} className="mt-6 w-full text-gray-500 text-sm">Close</button>
          </div>
        </div>
      )}

      {/* Mail Selection Modal */}
      {mailModal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-80 text-center shadow-xl">
            <h2 className="text-lg font-bold mb-6">Contact {mailModal.type}</h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setMailModal({show:false}); setShowMailPad(true); }} className="py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Mail All {mailModal.type}</button>
              <button onClick={() => { setMailModal({show:false}); setShowMailPad(true); }} className="py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium">Mail Particular {mailModal.type.slice(0,-1)}</button>
              <button onClick={() => setMailModal({show:false})} className="text-sm text-gray-400 mt-2">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Mail Pad (Email Editor Window) */}
      {showMailPad && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center md:justify-end z-50 p-4">
          <div className="bg-white w-full max-w-lg h-3/4 rounded-2xl shadow-2xl flex flex-col">
            <div className="bg-gray-900 text-white p-4 rounded-t-2xl flex justify-between">
              <span className="font-semibold">New Message</span>
              <button onClick={() => setShowMailPad(false)} className="hover:text-gray-400">✕</button>
            </div>
            <div className="p-4 flex-1 space-y-4">
              <input type="text" placeholder="To" className="w-full border-b py-2 outline-none focus:border-lime-500" />
              <input type="text" placeholder="Subject" className="w-full border-b py-2 outline-none focus:border-lime-500" />
              <textarea placeholder="Message content..." className="w-full h-64 resize-none outline-none" />
            </div>
            <div className="p-4 border-t flex justify-end">
              <button className="bg-[#C5E86C] px-8 py-2 rounded-lg font-bold shadow-sm">Send Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}