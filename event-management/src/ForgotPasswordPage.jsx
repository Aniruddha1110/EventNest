import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const API = "http://localhost:9090";

const ROLES = {
  user:      { label: "User",      color: "text-[#a3e635]", badge: "bg-[#a3e635]/10 border-[#a3e635]/20 text-[#a3e635]" },
  organiser: { label: "Organiser", color: "text-[#818cf8]", badge: "bg-[#818cf8]/10 border-[#818cf8]/20 text-[#818cf8]" },
  admin:     { label: "Admin",     color: "text-[#34d399]", badge: "bg-[#34d399]/10 border-[#34d399]/20 text-[#34d399]" },
};

// =============================================================================
export default function ForgotPasswordPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultRole = searchParams.get("role") || "user";
  const [role,  setRole]    = useState(defaultRole);
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const cfg = ROLES[role] || ROLES.user;

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSendOtp = async () => {
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Could not find an account with that email.");
        setLoading(false);
        return;
      }

      navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}&role=${role}&mode=forgot`);
    } catch {
      // Backend offline — proceed for demo
      navigate(`/verify-otp?email=${encodeURIComponent(email.trim())}&role=${role}&mode=forgot`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">

      {/* HEADER */}
      <header className="flex items-center justify-between px-12 h-16 border-b border-[#1e1e22]">
        <Link to="/" className="font-bold text-xl tracking-tight text-white no-underline">
          Event<span className="text-[#a3e635]">Sphere</span>
        </Link>
        <Link to="/login" className="text-sm text-[#5a5a62] hover:text-white transition-colors">
          ← Back to Login
        </Link>
      </header>

      {/* MAIN */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#111115] border border-[#1e1e22] flex items-center justify-center text-3xl mx-auto mb-5">
              🔒
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Forgot password?
            </h1>
            <p className="text-[#5a5a62] text-sm leading-relaxed max-w-sm mx-auto">
              No worries. Enter your registered email and we'll send you a 6-digit OTP to reset your password.
            </p>
          </div>

          <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl p-8">

            {/* Role selector */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#5a5a62] uppercase tracking-wider mb-2">
                I am a
              </label>
              <div className="flex gap-2 p-1 bg-[#0c0c0f] border border-[#1e1e22] rounded-xl">
                {Object.entries(ROLES).map(([key, r]) => (
                  <button
                    key={key}
                    onClick={() => { setRole(key); setError(""); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      role === key
                        ? `bg-[#1e1e22] ${r.color}`
                        : "text-[#5a5a62] hover:text-[#a0a0ab]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#5a5a62] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#a3e635] transition-colors placeholder:text-[#3a3a42]"
              />
              {error && <p className="text-xs text-[#ef4444] mt-2">{error}</p>}
            </div>

            {/* Signed in as badge */}
            <div className="flex items-center gap-2 mb-5 px-1">
              <span className="text-xs text-[#3a3a42]">Searching in</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className="text-xs text-[#3a3a42]">accounts</span>
            </div>

            {/* Send OTP */}
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-[#a3e635] text-[#0c0c0f] font-bold text-sm py-3.5 rounded-xl hover:bg-[#b8f056] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0c0c0f]/30 border-t-[#0c0c0f] rounded-full animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP →"
              )}
            </button>
          </div>

          <p className="text-center text-sm text-[#5a5a62] mt-6">
            Remembered it?{" "}
            <Link to={`/login?role=${role}`} className="text-[#a3e635] font-semibold hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
