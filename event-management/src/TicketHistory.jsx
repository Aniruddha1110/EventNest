import React from "react";

const TicketHistory = () => {
  // MOCK DATA: Zomato-style ticket history
  const ticketHistory = [
    {
      id: "TKT-001",
      eventName: "Tech Innovators Conference",
      date: "Feb 20, 2026",
      type: "Paid",
      price: "₹1,499",
      status: "Upcoming",
    },
    {
      id: "TKT-002",
      eventName: "Global Culture Fest - Day 1",
      date: "Feb 10, 2026",
      type: "Free",
      price: "₹0",
      status: "Attended",
    },
  ];

  return (
    <div className="bg-cardBg p-8 rounded-2xl shadow-sm border border-gray-100 min-h-full">
      <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold">Your Tickets & History</h2>
        <span className="text-sm text-textMuted">
          {ticketHistory.length} Total
        </span>
      </div>

      <div className="space-y-4">
        {ticketHistory.map((ticket, index) => (
          <div
            key={index}
            className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 rounded-xl border border-themeBorder hover:border-themeAccent hover:shadow-md transition bg-cardBg"
          >
            <div className="flex gap-4 items-center">
              <div className="hidden sm:flex w-12 h-12 bg-black text-themeAccent rounded items-center justify-center flex-col">
                <span className="text-[10px] uppercase font-bold">TKT</span>
              </div>
              <div>
                <h4 className="font-bold text-lg">{ticket.eventName}</h4>
                <p className="text-sm text-textMuted mt-0.5">
                  {ticket.date} •{" "}
                  <span className="text-textMuted">ID: {ticket.id}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 md:mt-0 flex flex-row md:flex-col items-center md:items-end w-full md:w-auto justify-between gap-2">
              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${ticket.status === "Upcoming" ? "bg-themeAccent text-pageBg" : "bg-textMuted/20 text-textMuted border border-themeBorder"}`}
              >
                {ticket.status}
              </span>
              <div className="text-right">
                <span className="font-bold block">{ticket.price}</span>
                <span className="text-xs text-textMuted uppercase tracking-wide">
                  {ticket.type}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketHistory;
