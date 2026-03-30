import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const ROLE_LABELS = {
  user: { label: "User", color: "text-[#a3e635]", badge: "bg-[#a3e635]/10 border-[#a3e635]/20 text-[#a3e635]" },
  organiser: { label: "Organiser", color: "text-[#818cf8]", badge: "bg-[#818cf8]/10 border-[#818cf8]/20 text-[#818cf8]" },
  admin: { label: "Admin", color: "text-[#34d399]", badge: "bg-[#34d399]/10 border-[#34d399]/20 text-[#34d399]" },
};

export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "user";
  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.user;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleEmailSignup = async () => {
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);

    // TODO: Call backend POST /api/auth/send-otp { email, role }
    // Simulating API delay for now
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    // Navigate to OTP verification page, carry email + role + mode
    navigate(`/verify-otp?email=${encodeURIComponent(email)}&role=${role}&mode=signup`);
  };

  const handleGoogleSignup = () => {
    // TODO: Redirect to Spring Boot Google OAuth endpoint
    // window.location.href = `http://localhost:9090/oauth2/authorization/google?role=${role}`;
    alert("Google OAuth — connect Spring Boot backend first.");
  };

  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-12 h-16 border-b border-[#1e1e22]">
        <Link to="/" className="font-bold text-xl tracking-tight text-white no-underline">
          Event<span className="text-[#a3e635]">Sphere</span>
        </Link>
        <p className="text-sm text-[#5a5a62]">
          Already have an account?{" "}
          <Link to="/login" className="text-[#a3e635] font-semibold hover:underline">
            Log In
          </Link>
        </p>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">

          {/* Step indicator */}
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#a3e635] mb-3">
              Step 2 of 2
            </p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-[#5a5a62] text-sm">
              Signing up as{" "}
              <span className={`font-bold px-2 py-0.5 rounded-full border text-xs uppercase tracking-wider ${roleInfo.badge}`}>
                {roleInfo.label}
              </span>
              {" "}·{" "}
              <Link to="/roleselect" className="text-[#a3e635] hover:underline text-xs">
                Change role
              </Link>
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl p-8">

            {/* Google OAuth button */}
            <button
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-3 bg-white text-[#1a1a1a] font-semibold text-sm py-3.5 rounded-xl hover:bg-gray-100 transition-all mb-6"
            >
              {/* Google G icon */}
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-[#1e1e22]" />
              <span className="text-xs text-[#3a3a42] font-semibold uppercase tracking-wider">or continue with email</span>
              <div className="flex-1 h-px bg-[#1e1e22]" />
            </div>

            {/* Email input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#5a5a62] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleEmailSignup()}
                className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#a3e635] transition-colors placeholder:text-[#3a3a42]"
              />
              {error && (
                <p className="text-xs text-[#ef4444] mt-2">{error}</p>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={handleEmailSignup}
              disabled={loading}
              className="w-full bg-[#a3e635] text-[#0c0c0f] font-bold text-sm py-3.5 rounded-xl hover:bg-[#b8f056] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0c0c0f]/30 border-t-[#0c0c0f] rounded-full animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Create Account →"
              )}
            </button>

            {/* Terms */}
            <p className="text-xs text-[#3a3a42] text-center mt-5 leading-relaxed">
              By continuing, you agree to our{" "}
              <span className="text-[#a3e635] cursor-pointer hover:underline">Terms of Service</span>{" "}
              and{" "}
              <span className="text-[#a3e635] cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}