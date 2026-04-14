import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const ROLES = [
  {
    key: "user",
    emoji: "👤",
    title: "User",
    tagline: "Discover & Attend",
    color: "text-themeAccent",
    borderHover: "hover:border-[#a3e635]/60",
    selectedBorder: "border-[#a3e635]",
    selectedBg: "bg-themeAccent/5",
    perks: [
      "Browse ongoing & upcoming events",
      "Interactive date calendar",
      "Register and get tickets",
      "Full ticket history in profile",
      "OTP password recovery",
    ],
  },
  {
    key: "organiser",
    emoji: "🎪",
    title: "Organiser",
    tagline: "Create & Manage",
    color: "text-[#818cf8]",
    borderHover: "hover:border-[#818cf8]/60",
    selectedBorder: "border-[#818cf8]",
    selectedBg: "bg-[#818cf8]/5",
    badge: "Most Popular",
    perks: [
      "Submit events for approval",
      "Track attendee capacity live",
      "Approved / Pending / Rejected tabs",
      "Send emergency notices",
      "Email all attendees instantly",
    ],
  },
  // {
  //   key: "admin",
  //   emoji: "🛡️",
  //   title: "Admin",
  //   tagline: "Oversee & Control",
  //   color: "text-[#34d399]",
  //   borderHover: "hover:border-[#34d399]/60",
  //   selectedBorder: "border-[#34d399]",
  //   selectedBg: "bg-[#34d399]/5",
  //   perks: [
  //     "Review & approve events",
  //     "Manage organisers & users",
  //     "Full platform visibility",
  //     "Venue & capacity management",
  //     "Analytics & reporting",
  //   ],
  // },
];

export default function RoleSelectPage() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;
    // Pass role to signup page via URL param
    navigate(`/signup?role=${selected}`);
  };

  return (
    <div className="min-h-screen bg-pageBg text-main flex flex-col">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-12 h-16 border-b border-border">
        <Link
          to="/"
          className="font-bold text-xl tracking-tight text-main no-underline"
        >
          Event<span className="text-themeAccent">Sphere</span>
        </Link>
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-themeAccent font-semibold hover:underline"
          >
            Log In
          </Link>
        </p>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-themeAccent mb-3">
            Step 1 of 2
          </p>
          <h1 className="text-4xl font-extrabold text-main tracking-tight mb-3">
            Choose your role
          </h1>
          <p className="text-muted text-base max-w-md">
            Select how you'll use EventSphere. You can only have one role per
            account.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-2   md:grid-cols-2 gap-5 w-full max-w-3xl mb-auto">
          {ROLES.map((role) => {
            const isSelected = selected === role.key;
            return (
              <button
                key={role.key}
                onClick={() => setSelected(role.key)}
                className={`bg-cardBg border-2 rounded-2xl p-7 text-left transition-all hover:-translate-y-1 ${
                  isSelected
                    ? `${role.selectedBorder} ${role.selectedBg}`
                    : `border-border ${role.borderHover}`
                }`}
              >
                {/* Badge */}
                {role.badge && (
                  <div className="inline-flex items-center gap-1.5 bg-[#818cf8]/20 border border-[#818cf8]/40 rounded-full px-3 py-1 mb-4 text-[11px] font-bold text-[#818cf8] uppercase tracking-wider">
                    ⭐ {role.badge}
                  </div>
                )}

                {/* Icon + radio */}
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{role.emoji}</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? `${role.selectedBorder} bg-current`
                        : "border-themeBorder"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-pageBg" />
                    )}
                  </div>
                </div>

                <h3 className="text-xl font-extrabold text-main mb-1">
                  {role.title}
                </h3>
                <p className={`text-sm font-semibold mb-5 ${role.color}`}>
                  {role.tagline}
                </p>

                <ul className="space-y-2">
                  {role.perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-center gap-2.5 text-sm text-textMuted"
                    >
                      <span className={`font-bold text-base ${role.color}`}>
                        ✓
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`px-12 py-4 rounded-xl font-bold text-base transition-all ${
            selected
              ? "bg-themeAccent text-[#0c0c0f] hover:bg-[#b8f056] hover:shadow-lg"
              : "bg-[#1e1e22] text-textMuted cursor-not-allowed"
          }`}
        >
          Continue as{" "}
          {selected ? ROLES.find((r) => r.key === selected)?.title : "..."} →
        </button>
      </main>
    </div>
  );
}
