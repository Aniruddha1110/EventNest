import React, { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Download, Calendar, Clock, MapPin, Users, Tag, ArrowLeft, CreditCard } from "lucide-react";

const generateTicketId = (eventId) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const rand  = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `TKT-${eventId}-${rand}`;
};

const BOOKING_DATE = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const BOOKING_TIME = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const QRPlaceholder = ({ value }) => (
  <div className="w-20 h-20 bg-black p-1.5 flex-shrink-0">
    <svg viewBox="0 0 10 10" className="w-full h-full">
      {Array.from({ length: 100 }, (_, i) => ({
        x: i % 10, y: Math.floor(i / 10),
        fill: Math.random() > 0.45 ? "white" : "black"
      })).map((cell, i) => (
        <rect key={i} x={cell.x} y={cell.y} width={1} height={1} fill={cell.fill} />
      ))}
    </svg>
    <p className="text-[5px] text-white text-center font-mono truncate mt-0.5">{value.slice(-8)}</p>
  </div>
);

const TicketPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    event,
    selectedProgrammes = [],
    totalPrice = 0,
    isFree = false,
    paymentMethod = null,
  } = location.state || {};

  if (!event) { navigate("/events"); return null; }

  const ticketId  = generateTicketId(event.id);
  const userName  = "Aniruddha Dutta";
  const userEmail = "ishaananiruddha10@gmail.com";

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const handleDownload = () => {
    const style = document.createElement("style");
    style.textContent = `@media print { body * { visibility: hidden; } #ticket-print-area, #ticket-print-area * { visibility: visible; } #ticket-print-area { position: fixed; top: 0; left: 0; width: 100%; } .no-print { display: none !important; } }`;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const methodLabel = {
    card:        "Credit / Debit Card",
    netbanking:  "Net Banking",
    upi:         "UPI",
  }[paymentMethod] || (isFree ? "Free Entry" : "Online Payment");

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-sans selection:bg-lime-200">

      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center no-print">
        <button onClick={() => navigate("/events")} className="bg-black text-white text-sm font-bold px-3 py-1.5 tracking-wide hover:opacity-90 transition">EventSphere</button>
        <button onClick={() => navigate(`/events/${event.id}`)} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition">
          <ArrowLeft size={16} /> Back to Event
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pb-20">

        {/* Success header */}
        <div className="text-center py-10 no-print">
          <CheckCircle size={56} className="mx-auto text-[#C4F249] mb-4" />
          <h1 className="text-4xl font-bold text-black mb-2">
            {isFree ? "You're Registered!" : "Booking Confirmed!"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isFree
              ? "Your free ticket is ready. Show it at the entrance."
              : `₹${totalPrice} paid via ${methodLabel}. Your ticket is ready.`
            }
          </p>
        </div>

        {/* Ticket */}
        <div id="ticket-print-area">
          <div className="bg-white border-2 border-black overflow-hidden">

            {/* Header */}
            <div className="bg-black text-white px-8 py-6 flex justify-between items-start gap-4">
              <div>
                <p className="text-xs font-bold tracking-widest text-[#C4F249] uppercase mb-1">EventSphere · Official Ticket</p>
                <h2 className="text-3xl font-bold leading-tight">{event.name}</h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 ${isFree ? "bg-[#C4F249] text-black" : "bg-white text-black"}`}>
                    {isFree ? "FREE" : "PAID"}
                  </span>
                  <span className="text-gray-400 text-xs font-mono">{ticketId}</span>
                </div>
              </div>
              <QRPlaceholder value={ticketId} />
            </div>

            {/* Tear line */}
            <div className="flex items-center px-4">
              <div className="w-6 h-6 rounded-full bg-[#F9F9F9] border-2 border-black -ml-7" />
              <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-2" />
              <div className="w-6 h-6 rounded-full bg-[#F9F9F9] border-2 border-black -mr-7" />
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-6">

              {/* Attendee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Attendee</p>
                  <p className="font-bold text-black">{userName}</p>
                  <p className="text-sm text-gray-500">{userEmail}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Booked on</p>
                  <p className="font-bold text-black">{BOOKING_DATE}</p>
                  <p className="text-sm text-gray-500">{BOOKING_TIME}</p>
                </div>
              </div>

              {/* Event info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Start",     value: formatDate(event.startDate), icon: <Calendar size={13} /> },
                  { label: "End",       value: formatDate(event.endDate),   icon: <Calendar size={13} /> },
                  { label: "Time",      value: event.time,                  icon: <Clock size={13} />    },
                  { label: "Organiser", value: event.organiserName,         icon: <Tag size={13} />      },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="bg-gray-50 p-3">
                    <div className="flex items-center gap-1 text-gray-400 mb-1">{icon}
                      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                    </div>
                    <p className="text-sm font-bold text-black">{value}</p>
                  </div>
                ))}
              </div>

              {/* Programmes */}
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
                  Programmes Booked ({selectedProgrammes.length})
                </p>
                <div className="space-y-2">
                  {selectedProgrammes.map((prog, idx) => (
                    <div key={prog.id} className="flex items-center justify-between border border-gray-100 p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-black text-[#C4F249] flex items-center justify-center text-xs font-bold shrink-0">{idx+1}</div>
                        <div>
                          <p className="font-bold text-black text-sm">{prog.name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                            <span className="flex items-center gap-1"><MapPin size={11} />{prog.venueName}</span>
                            <span className="flex items-center gap-1"><Users size={11} />Cap. {prog.venueCapacity.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-black">{isFree ? "Free" : `₹${prog.price}`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tear line */}
            <div className="flex items-center px-4">
              <div className="w-6 h-6 rounded-full bg-[#F9F9F9] border-2 border-black -ml-7" />
              <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-2" />
              <div className="w-6 h-6 rounded-full bg-[#F9F9F9] border-2 border-black -mr-7" />
            </div>

            {/* Receipt */}
            <div className="px-8 py-5 bg-gray-50">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Receipt</p>
              <div className="space-y-1">
                {selectedProgrammes.map(p => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{p.name}</span>
                    <span className="font-medium text-black">{isFree ? "₹0.00" : `₹${p.price}.00`}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Convenience fee</span>
                  <span>₹0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-bold text-black">Total Paid</span>
                  <span className="font-bold text-black text-lg">{isFree ? "₹0.00 (Free)" : `₹${totalPrice}.00`}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Ticket ID</p>
                  <p className="font-mono font-bold text-black text-sm">{ticketId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Payment Method</p>
                  <p className="font-bold text-black text-sm flex items-center gap-1.5">
                    <CreditCard size={13} /> {methodLabel}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Show this ticket (digital or printed) at the entrance of each programme venue.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 no-print">
          <button onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-black text-[#C4F249] py-4 font-bold text-base hover:opacity-80 transition active:scale-95">
            <Download size={18} /> Download / Print Ticket
          </button>
          <button onClick={() => navigate("/events")}
            className="flex-1 py-4 font-bold text-base border-2 border-black text-black hover:bg-black hover:text-[#C4F249] transition active:scale-95">
            Browse More Events
          </button>
        </div>

        {/* Steps */}
        <div className="mt-8 bg-white border border-gray-100 p-6 no-print">
          <h3 className="font-bold text-black mb-4">What happens next?</h3>
          <div className="space-y-3">
            {[
              "Save or print your ticket using the button above.",
              "Arrive at the venue before the programme starts.",
              "Show your ticket ID or QR code at the entrance.",
              "Your ticket is valid for all programmes you selected.",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#C4F249] text-black text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketPage;