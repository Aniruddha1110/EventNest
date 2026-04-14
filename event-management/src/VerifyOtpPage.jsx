import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const API = "http://localhost:9090";

const ROLE_LABELS = {
  user:      { label: "User",      badge: "bg-[#a3e635]/10 border-[#a3e635]/20 text-[#a3e635]" },
  organiser: { label: "Organiser", badge: "bg-[#818cf8]/10 border-[#818cf8]/20 text-[#818cf8]" },
  admin:     { label: "Admin",     badge: "bg-[#34d399]/10 border-[#34d399]/20 text-[#34d399]" },
};

// =============================================================================
export default function VerifyOtpPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const email = searchParams.get("email") || "";
  const role  = searchParams.get("role")  || "user";
  const mode  = searchParams.get("mode")  || "signup"; // "signup" | "forgot"

  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.user;

  // 6 individual digit boxes
  const [digits, setDigits]     = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [resendCd, setResendCd] = useState(30); // countdown seconds
  const [resending, setResending] = useState(false);
  const [resendOk, setResendOk]   = useState(false);
  const inputRefs               = useRef([]);

  // ── Countdown for resend ─────────────────────────────────────────────────
  useEffect(() => {
    if (resendCd <= 0) return;
    const t = setTimeout(() => setResendCd((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCd]);

  // ── Digit input handlers ─────────────────────────────────────────────────
  const handleDigitChange = (val, idx) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const next  = [...digits];
    next[idx]   = clean;
    setDigits(next);
    setError("");
    if (clean && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "Enter") handleVerify();
  };

  // Handle paste — fill all 6 boxes
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next   = [...digits];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const otp = digits.join("");

  // ── Verify ───────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (otp.length < 6) { setError("Please enter the complete 6-digit OTP."); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Incorrect OTP. Please try again.");
        setLoading(false);
        return;
      }

      // Navigate based on mode
      if (mode === "signup") {
        // Go to registration form with email + role pre-filled
        const dest = role === "organiser" ? "/register/organiser" : "/register/user";
        navigate(`${dest}?email=${encodeURIComponent(email)}&role=${role}`);
      } else {
        // Forgot password — go to reset page
        navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}&role=${role}`);
      }
    } catch {
      // Backend offline — mock flow for demo
      if (otp === "123456") {
        if (mode === "signup") {
          const dest = role === "organiser" ? "/register/organiser" : "/register/user";
          navigate(`${dest}?email=${encodeURIComponent(email)}&role=${role}`);
        } else {
          navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}&role=${role}`);
        }
      } else {
        setError("Backend offline. Use OTP 123456 for demo.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCd > 0) return;
    setResending(true);
    setResendOk(false);
    setError("");

    try {
      const endpoint = mode === "signup"
        ? `${API}/api/auth/send-otp`
        : `${API}/api/auth/forgot-password`;
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
    } catch { /* silent */ }

    setResending(false);
    setResendOk(true);
    setResendCd(30);
    setDigits(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
    setTimeout(() => setResendOk(false), 3000);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(b.length) + c)
    : "your email";

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-12 h-16 border-b border-[#1e1e22]">
        <Link to="/" className="font-bold text-xl tracking-tight text-white no-underline">
          Event<span className="text-[#a3e635]">Sphere</span>
        </Link>
        <p className="text-sm text-[#5a5a62]">
          <Link to="/login" className="text-[#a3e635] font-semibold hover:underline">
            ← Back to Login
          </Link>
        </p>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">

          {/* Step badge */}
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#a3e635] mb-3">
              {mode === "signup" ? "Step 2 of 3" : "Step 2 of 3"}
            </p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              {mode === "signup" ? "Verify your email" : "Enter OTP"}
            </h1>
            <p className="text-[#5a5a62] text-sm leading-relaxed max-w-sm mx-auto">
              We sent a 6-digit code to{" "}
              <span className="text-white font-semibold">{maskedEmail}</span>.
              {" "}It expires in 10 minutes.
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl p-8">

            {/* Role badge */}
            <div className="flex justify-center mb-6">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border ${roleInfo.badge}`}>
                {roleInfo.label}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] px-4 py-3 rounded-xl text-sm mb-5 text-center">
                {error}
              </div>
            )}

            {/* Resend success */}
            {resendOk && (
              <div className="bg-[#a3e635]/10 border border-[#a3e635]/20 text-[#a3e635] px-4 py-3 rounded-xl text-sm mb-5 text-center">
                ✓ New OTP sent to your email!
              </div>
            )}

            {/* 6-digit input boxes */}
            <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className={`w-12 h-14 text-center text-xl font-extrabold tracking-wider rounded-xl border bg-[#0c0c0f] text-white outline-none transition-all ${
                    d
                      ? "border-[#a3e635] bg-[#a3e635]/5"
                      : "border-[#1e1e22] focus:border-[#a3e635]"
                  }`}
                />
              ))}
            </div>

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={loading || otp.length < 6}
              className="w-full bg-[#a3e635] text-[#0c0c0f] font-bold text-sm py-3.5 rounded-xl hover:bg-[#b8f056] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-5"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0c0c0f]/30 border-t-[#0c0c0f] rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP →"
              )}
            </button>

            {/* Resend */}
            <div className="text-center">
              <p className="text-sm text-[#5a5a62]">
                Didn't receive the code?{" "}
                {resendCd > 0 ? (
                  <span className="text-[#3a3a42] font-medium">
                    Resend in {resendCd}s
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-[#a3e635] font-semibold hover:underline disabled:opacity-60"
                  >
                    {resending ? "Sending..." : "Resend OTP"}
                  </button>
                )}
              </p>
            </div>
          </div>

          {/* Wrong email? */}
          <p className="text-center text-sm text-[#5a5a62] mt-5">
            Wrong email?{" "}
            <Link
              to={mode === "signup" ? `/signup?role=${role}` : `/forgot-password?role=${role}`}
              className="text-[#a3e635] font-semibold hover:underline"
            >
              Go back
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
