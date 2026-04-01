import ProfilePageLayout from "./ProfilePageLayout";

// ─── USER DATA ───────────────────────────────────────────────────────────────
// Replace with real backend data when integrating
const currentUser = {
  name: "Alex Johnson",
  username: "@alexj_events",
  role: "user", // ← always "user" here
  phone: "+91 98765 43210",
  email: "alex.johnson@example.com",
};

const TICKETS = [
  {
    id: "TKT-001",
    event: "Tech Innovators Conference",
    date: "Feb 20, 2026",
    price: "₹1,499",
    priceType: "PAID",
    status: "upcoming",
  },
  {
    id: "TKT-002",
    event: "Global Culture Fest - Day 1",
    date: "Feb 10, 2026",
    price: "₹0",
    priceType: "FREE",
    status: "attended",
  },
];

const UserProfilePage = () => (
  <ProfilePageLayout user={currentUser}>
    {/* ── TICKETS & HISTORY ─────────────────────────────────────── */}
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-main">
        Your Tickets <span className="text-themeAccent">&</span> History
      </h1>
      <span className="text-xs text-muted bg-cardBg border border-border px-3 py-1.5 rounded-xl">
        {TICKETS.length} Total
      </span>
    </div>

    <div className="space-y-4">
      {TICKETS.map((ticket) => (
        <div
          key={ticket.id}
          className={`bg-cardBg border rounded-2xl p-5 flex items-center gap-5 transition-all hover:-translate-y-0.5 ${
            ticket.status === "upcoming"
              ? "border-[#a3e635]/20 hover:border-[#a3e635]/40"
              : "border-border hover:border-[#a3e635]/20"
          }`}
        >
          <div className="w-14 h-14 rounded-xl bg-[#1e1e22] border border-themeBorder flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-extrabold text-themeAccent tracking-wider">
              TKT
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-main text-base mb-1">
              {ticket.event}
            </h3>
            <p className="text-xs text-muted">
              {ticket.date} · ID: {ticket.id}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                ticket.status === "upcoming"
                  ? "bg-themeAccent text-[#0c0c0f]"
                  : "bg-[#1e1e22] text-muted border border-themeBorder"
              }`}
            >
              {ticket.status === "upcoming" ? "Upcoming" : "Attended"}
            </span>
            <div className="text-right">
              <p className="text-base font-extrabold text-main">
                {ticket.price}
              </p>
              <p className="text-[10px] text-[#3a3a42] uppercase tracking-wider">
                {ticket.priceType}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </ProfilePageLayout>
);

export default UserProfilePage;
