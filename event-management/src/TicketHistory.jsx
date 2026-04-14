import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Loader, AlertCircle } from "lucide-react";

const API = "http://localhost:9090";

const TicketHistory = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch transactions + events list in parallel
        const [txnRes, evtRes] = await Promise.all([
          fetch(`${API}/api/bank/transactions`, { headers }),
          fetch(`${API}/api/events`, { headers }),
        ]);

        if (!txnRes.ok) throw new Error(`Transactions: ${txnRes.status}`);
        if (!evtRes.ok) throw new Error(`Events: ${evtRes.status}`);

        const txnJson = await txnRes.json();
        const evtJson = await evtRes.json();

        const transactions = txnJson.data || [];
        const events = evtJson.data || [];

        // Build a quick lookup map: eventId → event object
        const eventMap = {};
        events.forEach((e) => { eventMap[e.eventId] = e; });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Enrich each transaction with event info + derived status
        const enriched = transactions.map((txn) => {
          const event = eventMap[txn.eventId] || null;
          let ticketStatus = "unknown";
          if (event) {
            const endDate = new Date(event.eventEndDate);
            ticketStatus = endDate >= today ? "upcoming" : "attended";
          }
          return { ...txn, event, ticketStatus };
        });

        setTickets(enriched);
      } catch (err) {
        console.error("TicketHistory load error:", err);
        setError("Could not load ticket history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    if (amount == null) return "₹0";
    return `₹${parseFloat(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    })}`;
  };

  const methodLabel = (method) =>
    ({ CARD: "Card", NETBANKING: "Net Banking", UPI: "UPI" }[method] || method || "Online");

  if (loading) {
    return (
      <div className="bg-cardBg border border-border rounded-2xl p-8 min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader size={28} className="animate-spin text-themeAccent" />
          <p className="text-sm text-textMuted">Loading your ticket history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-cardBg border border-border rounded-2xl p-8 min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-textMuted">{error}</p>
        </div>
      </div>
    );
  }

  // Only show SUCCESS transactions in the ticket list
  // (FAILED ones are payment attempts, not tickets)
  const successTickets = tickets.filter((t) => t.status === "SUCCESS");

  return (
    <div className="bg-cardBg border border-border rounded-2xl p-8 min-h-full">
      <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-main">
          Your Tickets <span className="text-themeAccent">&amp;</span> History
        </h2>
        <span className="text-xs text-textMuted bg-pageBg border border-border px-3 py-1.5 rounded-xl">
          {successTickets.length} Total
        </span>
      </div>

      {successTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CreditCard size={40} className="text-textMuted mb-4" />
          <p className="text-sm text-textMuted font-medium">No tickets yet.</p>
          <p className="text-xs text-textMuted mt-1">
            Book a ticket to see your history here.
          </p>
          <button
            onClick={() => navigate("/events")}
            className="mt-5 px-5 py-2 bg-themeAccent text-[#0c0c0f] text-sm font-bold rounded-xl hover:opacity-90 transition"
          >
            Browse Events
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {successTickets.map((txn, index) => (
            <div
              key={txn.txnId || index}
              className={`bg-cardBg border rounded-2xl p-5 flex items-center gap-5 transition-all hover:-translate-y-0.5 ${
                txn.ticketStatus === "upcoming"
                  ? "border-[#a3e635]/20 hover:border-[#a3e635]/40"
                  : "border-border hover:border-[#a3e635]/20"
              }`}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-pageBg border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-extrabold text-themeAccent tracking-wider">TKT</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-main text-base mb-1 truncate">
                  {txn.event ? (
                    <button
                      onClick={() => navigate(`/events/${txn.eventId}`)}
                      className="hover:text-themeAccent transition-colors text-left"
                    >
                      {txn.event.eventName}
                    </button>
                  ) : (
                    txn.eventId || "Event"
                  )}
                </h3>
                <p className="text-xs text-textMuted">
                  {formatDate(txn.createdAt)} · <span className="font-mono">{txn.txnId}</span>
                </p>
                <p className="text-xs text-textMuted mt-0.5">
                  via {methodLabel(txn.method)}
                </p>
              </div>

              {/* Right — badge + amount */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    txn.ticketStatus === "upcoming"
                      ? "bg-themeAccent text-[#0c0c0f]"
                      : txn.ticketStatus === "attended"
                      ? "bg-[#1e1e22] text-textMuted border border-themeBorder"
                      : "bg-[#1e1e22] text-textMuted border border-themeBorder"
                  }`}
                >
                  {txn.ticketStatus === "upcoming"
                    ? "Upcoming"
                    : txn.ticketStatus === "attended"
                    ? "Attended"
                    : "—"}
                </span>
                <div className="text-right">
                  <p className="text-base font-extrabold text-main">
                    {formatAmount(txn.amount)}
                  </p>
                  <p className="text-[10px] text-textMuted uppercase tracking-wider">
                    {parseFloat(txn.amount) === 0 ? "FREE" : "PAID"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketHistory;