import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";


// Client ID (OAuth) = 564476414065-vln380j3vp2n4g25f899q98pomedptcj.apps.googleusercontent.com

// ─── Auth pages are intentionally always dark ─────────────────────────────────
const API = "http://localhost:9090";

// ─── Role config ──────────────────────────────────────────────────────────────
// Backend AuthResponse: { token, role, userId, name, email, photoUrl }
const ROLES = {
  user: {
    label:     "User",
    color:     "text-[#a3e635]",
    border:    "border-[#a3e635]",
    badge:     "bg-[#a3e635]/10 border-[#a3e635]/20 text-[#a3e635]",
    dashboard: "/user",
    mockId:    "U-0001",
  },
  organiser: {
    label:     "Organiser",
    color:     "text-[#818cf8]",
    border:    "border-[#818cf8]",
    badge:     "bg-[#818cf8]/10 border-[#818cf8]/20 text-[#818cf8]",
    dashboard: "/organiser",
    mockId:    "O-0001",
  },
  admin: {
    label:     "Admin",
    color:     "text-[#34d399]",
    border:    "border-[#34d399]",
    badge:     "bg-[#34d399]/10 border-[#34d399]/20 text-[#34d399]",
    dashboard: "/admin",
    mockId:    "A-0001",
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
  </svg>
);

const EyeOpen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

// ─── Persist auth session helper ─────────────────────────────────────────────
function saveSession(data) {
  // Backend AuthResponse: { token, role, userId, name, email, photoUrl }
  localStorage.setItem("token",    data.token    || "");
  localStorage.setItem("role",     data.role     || "");
  localStorage.setItem("userId",   data.userId   || "");
  localStorage.setItem("name",     data.name     || "");   // AuthResponse has 'name'
  localStorage.setItem("email",    data.email    || "");
  localStorage.setItem("photoUrl", data.photoUrl || "");
}

// =============================================================================
export default function LoginPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultRole = searchParams.get("role") || "user";
  const [role,       setRole]       = useState(defaultRole);
  const [loginMode,  setLoginMode]  = useState("username"); // "username" | "email"
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  const cfg = ROLES[role] || ROLES.user;

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!identifier.trim()) { setError("Please enter your username or email."); return; }
    if (!password.trim())   { setError("Please enter your password."); return; }
    setError("");
    setLoading(true);

    try {
      // Backend: POST /api/auth/login
      const res  = await fetch(`${API}/api/auth/login`, {
        method:  "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body:    JSON.stringify({ role, loginMode, identifier: identifier.trim(), password }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      saveSession(data);
      navigate(ROLES[data.role]?.dashboard || cfg.dashboard);
    } catch (err) {
      // 🛑 The real error is caught here now instead of hiding behind a mock session
      console.error("Backend Request Failed:", err);
      setError("Connection failed. Check browser console (F12) for CORS or Network errors.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const handleGoogleLogin = () => {
    // `${API}/oauth2/authorization/google?role=${role}`
    window.location.href ="http://localhost:9090/oauth2/authorization/google" ;
    // setError("Google OAuth requires the backend to be running. Use username/email login instead.");
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-12 h-16 border-b border-[#1e1e22]">
        <Link to="/" className="font-bold text-xl tracking-tight text-white no-underline">
          Event<span className="text-[#a3e635]">Sphere</span>
        </Link>
        <p className="text-sm text-[#5a5a62]">
          Don't have an account?{" "}
          <Link to="/roleselect" className="text-[#a3e635] font-semibold hover:underline">Sign Up</Link>
        </p>
      </header>

      {/* ── MAIN ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Welcome back</h1>
            <p className="text-[#5a5a62] text-sm">Sign in to your EventSphere account</p>
          </div>

          {/* Role selector */}
          <div className="flex gap-2 mb-6 p-1 bg-[#111115] border border-[#1e1e22] rounded-xl">
            {Object.entries(ROLES).map(([key, r]) => (
              <button key={key}
                onClick={() => { setRole(key); setError(""); setIdentifier(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                  ${role === key
                    ? `bg-[#0c0c0f] ${r.color} border ${r.border} shadow-sm`
                    : "text-[#5a5a62] hover:text-[#a0a0ab]"}`}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Card */}
          <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl p-8">

            {/* Google — only for users (OAuth is user-only by design) */}
            {role === "user" && (
              <>
                <button onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white text-[#1a1a1a] font-semibold text-sm py-3.5 rounded-xl hover:bg-gray-100 transition-all mb-5">
                  <GoogleIcon />
                  Continue with Google
                </button>
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex-1 h-px bg-[#1e1e22]" />
                  <span className="text-xs text-[#3a3a42] font-semibold uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-[#1e1e22]" />
                </div>
              </>
            )}

            {/* Login mode toggle */}
            <div className="flex gap-1 mb-5 p-1 bg-[#0c0c0f] border border-[#1e1e22] rounded-xl">
              {["username", "email"].map((m) => (
                <button key={m}
                  onClick={() => { setLoginMode(m); setIdentifier(""); setError(""); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all
                    ${loginMode === m ? "bg-[#1e1e22] text-white" : "text-[#5a5a62] hover:text-[#a0a0ab]"}`}>
                  {m === "username" ? "Username" : "Email"}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] px-4 py-3 rounded-xl text-sm mb-5 text-center">
                {error}
              </div>
            )}

            {/* Identifier */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#5a5a62] uppercase tracking-wider mb-2">
                {loginMode === "username" ? "Username" : "Email Address"}
              </label>
              <input
                type={loginMode === "email" ? "email" : "text"}
                placeholder={loginMode === "username" ? "your_username" : "you@example.com"}
                value={identifier}
                onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#a3e635] transition-colors placeholder:text-[#3a3a42]"
              />
            </div>

            {/* Password */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[#5a5a62] uppercase tracking-wider">Password</label>
                <Link to={`/forgot-password?role=${role}`}
                  className="text-xs text-[#a3e635] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-3.5 text-sm text-white outline-none focus:border-[#a3e635] transition-colors placeholder:text-[#3a3a42] pr-12"
                />
                <button type="button" onClick={() => setShowPw((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5a5a62] hover:text-[#a0a0ab] transition-colors">
                  {showPw ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleLogin} disabled={loading}
              className="w-full mt-6 bg-[#a3e635] text-[#0c0c0f] font-bold text-sm py-3.5 rounded-xl hover:bg-[#b8f056] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0c0c0f]/30 border-t-[#0c0c0f] rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                `Sign In as ${cfg.label} →`
              )}
            </button>

            <p className="text-xs text-[#3a3a42] text-center mt-5">
              Signing in as{" "}
              <span className={`font-bold px-2 py-0.5 rounded-full border text-xs uppercase tracking-wider ${cfg.badge}`}>
                {cfg.label}
              </span>
            </p>
          </div>

          <p className="text-center text-sm text-[#5a5a62] mt-6">
            New to EventSphere?{" "}
            <Link to="/roleselect" className="text-[#a3e635] font-semibold hover:underline">Create an account</Link>
          </p>
        </div>
      </main>
    </div>
  );
}