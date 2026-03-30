import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme, ThemeToggle } from "./ThemeContext";

// ─── CALENDAR HELPERS ────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildEventDates() {
  const today = new Date();
  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const add = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return fmt(d);
  };
  return new Set([
    fmt(today),
    add(2),
    add(5),
    add(8),
    add(12),
    add(15),
    add(18),
  ]);
}

const EVENT_DATES = buildEventDates();
const TODAY_STR = getTodayStr();

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function LandingPage() {
  const { t } = useTheme();
  // ── Navbar scroll state ───────────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Calendar state ────────────────────────────────────────────────────────
  const today = new Date();

  const [calDate, setCalDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selected, setSelected] = useState(TODAY_STR);

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const fmtDay = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const prevMonth = () => setCalDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalDate(new Date(year, month + 1, 1));

  const eventsOnSelected = EVENT_DATES.has(selected)
    ? selected === TODAY_STR
      ? 3
      : 1
    : 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white">
      {/* ── NAVBAR ────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-12 h-16 transition-all duration-300 ${
          scrolled
            ? "bg-[#0c0c0f]/90 backdrop-blur-md border-b border-[#1e1e22]"
            : "bg-transparent"
        }`}
      >
        {/* Logo */}
        <div className="font-bold text-xl tracking-tight">
          Event<span className="text-[#a3e635]">Sphere</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-[#6a6a72] hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-[#6a6a72] hover:text-white transition-colors"
          >
            How It Works
          </a>
          <a
            href="#roles"
            className="text-sm text-[#6a6a72] hover:text-white transition-colors"
          >
            Roles
          </a>
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            to="/login"
            className="text-sm text-[#a0a0ab] hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            to="/roleselect"
            className="bg-[#a3e635] text-[#0c0c0f] font-bold text-sm px-4 py-2 rounded-lg hover:bg-[#b8f056] transition-all"
          >
            Sign Up →
          </Link>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center px-12 pt-24 pb-16 overflow-hidden">
        {/* Glow orbs */}
        <div className="absolute top-[10%] right-[5%] w-96 h-96 rounded-full bg-[#a3e635]/5 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-0 w-64 h-64 rounded-full bg-[#a3e635]/5 blur-[80px] pointer-events-none" />

        <div
          className="max-w-6xl mx-auto w-full grid gap-20 items-center"
          style={{ gridTemplateColumns: "1fr 320px" }}
        >
          {/* Left — Headline & CTA */}
          <div>
            {/* Heading */}
            <h1
              className="font-extrabold leading-none tracking-tighter text-white mb-6"
              style={{ fontSize: "clamp(44px, 5.5vw, 72px)" }}
            >
              Your Complete
              <br />
              <span className="text-[#a3e635]">Event</span> Ecosystem
            </h1>

            {/* Description */}
            <p className="text-[#6a6a72] text-lg leading-relaxed max-w-md mb-10 font-light">
              EventSphere is a centralised platform where organisers create
              events, admins oversee approvals, and users discover and book —
              simple, structured, and seamless.
            </p>

            {/* CTA button */}
            <Link
              to="/roleselect"
              className="inline-flex items-center gap-2 bg-[#a3e635] text-[#0c0c0f] font-bold text-base px-8 py-4 rounded-xl hover:bg-[#b8f056] hover:shadow-lg transition-all"
            >
              Get Started — It's Free →
            </Link>
          </div>

          {/* Right — Interactive Calendar (compact, like UserPage) */}
          <div className="bg-[#131317] border border-[#1e1e22] rounded-2xl p-5 shadow-2xl">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1e1e22] border border-[#2a2a2e] text-[#a0a0ab] hover:border-[#a3e635] transition-colors"
              >
                ‹
              </button>
              <span className="font-bold text-[15px] text-white">
                {MONTHS[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#1e1e22] border border-[#2a2a2e] text-[#a0a0ab] hover:border-[#a3e635] transition-colors"
              >
                ›
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-1 text-center">
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="text-[10px] font-semibold text-[#3a3a42] py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array(firstDay)
                .fill(null)
                .map((_, i) => (
                  <div key={`blank-${i}`} />
                ))}
              {Array.from({ length: totalDays }, (_, i) => {
                const day = i + 1;
                const ds = fmtDay(day);
                const isSelected = ds === selected;
                const isToday = ds === TODAY_STR;
                const hasEvent = EVENT_DATES.has(ds);

                return (
                  <button
                    key={day}
                    onClick={() => setSelected(ds)}
                    className={`
                      relative w-full aspect-square rounded-lg text-[12px] transition-all
                      ${
                        isSelected
                          ? "bg-[#a3e635] text-[#0c0c0f] font-bold"
                          : isToday
                            ? "bg-[#1a2c0a] text-[#a3e635] ring-1 ring-[#a3e635]/40"
                            : "text-[#c0c0c8] hover:bg-[#1e1e22]"
                      }
                    `}
                  >
                    {day}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#a3e635]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1e1e22]">
              <span className="text-xs text-[#5a5a62]">
                {eventsOnSelected} event{eventsOnSelected !== 1 ? "s" : ""}{" "}
                found
              </span>
              <Link
                to="/roleselect"
                className="text-xs font-bold bg-[#a3e635] text-[#0c0c0f] px-3 py-1.5 rounded-lg hover:bg-[#b8f056] transition-all"
              >
                View Events →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-12 pb-20">
        <div className="grid grid-cols-4 gap-4">
          {[
            { value: "1,200+", label: "Events Managed" },
            { value: "8,400+", label: "Registered Users" },
            { value: "320+", label: "Organisers" },
            { value: "98%", label: "Satisfaction Rate" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="bg-[#111115] border border-[#1e1e22] rounded-2xl p-8 text-center hover:border-[#a3e635]/20 transition-colors"
            >
              <p className="text-4xl font-extrabold text-[#a3e635] tracking-tight">
                {value}
              </p>
              <p className="text-sm text-[#5a5a62] mt-2">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-12 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#a3e635] mb-3">
            Platform Features
          </p>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">
            Everything you need
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {[
            {
              emoji: "📅",
              title: "Interactive Calendar",
              desc: "Browse events by date. Ongoing events anchored to today, upcoming events filtered by your selected date.",
            },
            {
              emoji: "🎟️",
              title: "Ticket Management",
              desc: "Register for events and track all your tickets in one place. Full history visible from your profile.",
            },
            {
              emoji: "🛡️",
              title: "Admin Control Panel",
              desc: "Admins review and approve events before going live. Full visibility into organisers, events, and venues.",
            },
            {
              emoji: "👥",
              title: "Role-Based Access",
              desc: "Three distinct roles — User, Organiser, Admin — each with a tailored dashboard and permission set.",
            },
            {
              emoji: "🚨",
              title: "Emergency Notices",
              desc: "Send instant alerts to all attendees for cancellations, venue changes, or time updates.",
            },
            {
              emoji: "✅",
              title: "Approval Workflow",
              desc: "Submit events for admin review. Track Pending, Approved, and Rejected status with live capacity bars.",
            },
          ].map(({ emoji, title, desc }) => (
            <div
              key={title}
              className="bg-[#111115] border border-[#1e1e22] rounded-2xl p-8 hover:-translate-y-1 hover:border-[#a3e635]/30 transition-all"
            >
              <div className="text-3xl mb-5">{emoji}</div>
              <h3 className="font-bold text-white text-base mb-2">{title}</h3>
              <p className="text-sm text-[#5a5a62] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-12 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#a3e635] mb-3">
            How It Works
          </p>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">
            Up and running in 3 steps
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2 relative">
          {/* Connector line */}
          <div className="absolute top-11 left-[33%] right-[33%] h-px bg-gradient-to-r from-[#1e1e22] via-[#a3e635]/40 to-[#1e1e22]" />

          {[
            {
              step: "01",
              icon: "🎭",
              title: "Choose Your Role",
              desc: "Sign up as a User to discover events, an Organiser to create them, or an Admin to manage the platform.",
            },
            {
              step: "02",
              icon: "📅",
              title: "Join or Create",
              desc: "Users browse and register. Organisers submit events. Admins review and publish them for everyone.",
            },
            {
              step: "03",
              icon: "📊",
              title: "Track Everything",
              desc: "Manage tickets, check capacity, send emergency notices, and stay on top of your event lifecycle.",
            },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="px-8 py-10 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-[#111115] border border-[#1e1e22] flex items-center justify-center text-2xl flex-shrink-0">
                  {icon}
                </div>
                <span className="text-7xl font-extrabold text-[#1e1e22] leading-none">
                  {step}
                </span>
              </div>
              <h3 className="font-bold text-white text-lg mb-3">{title}</h3>
              <p className="text-sm text-[#5a5a62] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLES ─────────────────────────────────────────────────────── */}
      <section id="roles" className="max-w-6xl mx-auto px-12 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#a3e635] mb-3">
            Built for Everyone
          </p>
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-3">
            Pick a role, start now.
          </h2>
          <p className="text-[#5a5a62]">
            After signing up, you'll be directed to your personalised dashboard.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5  max-w-3xl mx-auto">
          {[
            {
              role: "User",
              emoji: "👤",
              tagColor: "text-[#a3e635]",
              borderClass: "border-[#1e1e22] hover:border-[#a3e635]/40",

              link: "",
              featured: false,
              perks: [
                "Browse ongoing & upcoming events",
                "Interactive date calendar",
                "Register and get tickets",
                "Full ticket history in profile",
                "OTP password recovery",
              ],
            },
            {
              role: "Organiser",
              emoji: "🎪",
              tagColor: "text-[#818cf8]",
              borderClass: "border-[#818cf8]/40",
              tagline: "Create & Manage",
              link: "",
              featured: true,
              perks: [
                "Submit events for approval",
                "Track attendee capacity live",
                "Approved / Pending / Rejected tabs",
                "Send emergency notices",
                "Email all attendees instantly",
              ],
            },
            // {
            //   role: "Admin",
            //   emoji: "🛡️",
            //   tagColor: "text-[#34d399]",
            //   borderClass: "border-[#1e1e22] hover:border-[#34d399]/40",
            //   tagline: "Oversee & Control",
            //   link: "/admin",
            //   featured: false,
            //   perks: [
            //     "Review & approve events",
            //     "Manage organisers & users",
            //     "Full platform visibility",
            //     "Venue & capacity management",
            //     "Analytics & reporting",
            //   ],
            // },
          ].map(
            ({
              role,
              emoji,
              tagColor,
              borderClass,
              tagline,
              link,
              featured,
              perks,
            }) => (
              <Link
                key={role}
                to={link}
                className={`bg-[#111115] border ${borderClass} rounded-2xl p-9 hover:-translate-y-2 hover:shadow-2xl transition-all text-white no-underline block`}
              >
                {/* Featured badge */}
                {featured && (
                  <div className="inline-flex items-center gap-1.5 bg-[#818cf8]/20 border border-[#818cf8]/40 rounded-full px-3 py-1 mb-5 text-[11px] font-bold text-[#818cf8] uppercase tracking-wider">
                    ⭐ Most Popular
                  </div>
                )}

                <div className="text-3xl mb-5">{emoji}</div>

                <h3 className="text-xl font-extrabold text-white mb-1">
                  {role}
                </h3>
                <p className={`text-sm font-semibold mb-6 ${tagColor}`}>
                  {tagline}
                </p>

                <ul className="space-y-3">
                  {perks.map((perk) => (
                    <li
                      key={perk}
                      className="flex items-center gap-3 text-sm text-[#a0a0ab]"
                    >
                      <span className="text-[#a3e635] font-bold text-base">
                        ✓
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </Link>
            ),
          )}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-12 pb-28">
        <div className="bg-[#111115] border border-[#1e1e22] rounded-3xl px-16 py-20 flex items-center justify-between gap-12 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#a3e635]/5 blur-[80px] pointer-events-none" />

          {/* Text */}
          <div className="relative z-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#a3e635] mb-4">
              Ready to get started?
            </p>
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
              Join EventSphere today.
              <br />
              It's completely free.
            </h2>
            <p className="text-[#5a5a62] text-base max-w-sm">
              Whether you're here to attend, organise, or manage — your
              dashboard is waiting.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 flex-shrink-0 relative z-10">
            <Link
              to="/roleselect"
              className="bg-[#a3e635] text-[#0c0c0f] font-bold text-base px-10 py-4 rounded-xl hover:bg-[#b8f056] transition-all text-center"
            >
              Create Free Account →
            </Link>
            <Link
              to="/login"
              className="border border-[#2a2a2e] text-white font-semibold text-base px-10 py-4 rounded-xl hover:border-[#a3e635] hover:text-[#a3e635] transition-all text-center"
            >
              Already have an account?
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e1e22] max-w-6xl mx-auto px-12 py-9 flex items-center justify-between">
        <div className="font-bold text-base">
          Event<span className="text-[#a3e635]">Sphere</span>
        </div>

        <div className="flex items-center gap-6">
          <Link
            to="/user"
            className="text-sm text-[#3a3a42] hover:text-[#a3e635] transition-colors"
          >
            User
          </Link>
          <Link
            to="/organiser"
            className="text-sm text-[#3a3a42] hover:text-[#a3e635] transition-colors"
          >
            Organiser
          </Link>
          <Link
            to="/admin"
            className="text-sm text-[#3a3a42] hover:text-[#a3e635] transition-colors"
          >
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
