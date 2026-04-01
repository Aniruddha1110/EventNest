import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const ROLE_LABELS = {
  user: {
    label: "User",
    badge: "bg-themeAccent/10 border-[#a3e635]/20 text-themeAccent",
  },
  organiser: {
    label: "Organiser",
    badge: "bg-[#818cf8]/10 border-[#818cf8]/20 text-[#818cf8]",
  },
  admin: {
    label: "Admin",
    badge: "bg-[#34d399]/10 border-[#34d399]/20 text-[#34d399]",
  },
};

// ── Password strength checker ─────────────────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1)
    return {
      label: "Weak",
      color: "bg-[#ef4444]",
      text: "text-[#ef4444]",
      bars: 1,
    };
  if (score <= 2)
    return {
      label: "Fair",
      color: "bg-[#fb923c]",
      text: "text-[#fb923c]",
      bars: 2,
    };
  if (score <= 3)
    return {
      label: "Good",
      color: "bg-[#fbbf24]",
      text: "text-[#fbbf24]",
      bars: 3,
    };
  if (score <= 4)
    return {
      label: "Strong",
      color: "bg-themeAccent",
      text: "text-themeAccent",
      bars: 4,
    };
  return {
    label: "Very Strong",
    color: "bg-themeAccent",
    text: "text-themeAccent",
    bars: 5,
  };
}

// ── Input component ───────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-xs font-semibold text-muted uppercase tracking-wider mb-2">
        {label}
        {required && <span className="text-[#ef4444]">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-[#ef4444] mt-1.5">{error}</p>}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function SignUpPage() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "user";
  const roleInfo = ROLE_LABELS[role] || ROLE_LABELS.user;
  const isOrganiser = role === "organiser";

  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};

    if (!form.fullName.trim()) e.fullName = "Full name is required.";

    if (!form.username.trim()) e.username = "Username is required.";
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username))
      e.username = "3–20 characters, letters, numbers and _ only.";

    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address.";

    if (isOrganiser && !form.phone.trim())
      e.phone = "Phone number is mandatory for organisers.";
    else if (form.phone && !/^\+?[0-9\s\-]{7,15}$/.test(form.phone))
      e.phone = "Enter a valid phone number.";

    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8)
      e.password = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(form.password))
      e.password = "Must contain at least one uppercase letter.";
    else if (!/[0-9]/.test(form.password))
      e.password = "Must contain at least one number.";
    else if (!/[^A-Za-z0-9]/.test(form.password))
      e.password = "Must contain at least one special character (!@#$...).";

    if (!form.confirm) e.confirm = "Please confirm your password.";
    else if (form.password !== form.confirm)
      e.confirm = "Passwords do not match.";

    return e;
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);
    // TODO: Call backend POST /api/auth/send-otp { email, role }
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    navigate(
      `/verify-otp?email=${encodeURIComponent(form.email)}&role=${role}&mode=signup`,
    );
  };

  const handleGoogleSignup = () => {
    // TODO: window.location.href = `http://localhost:9090/oauth2/authorization/google?role=${role}`;
    alert("Google OAuth — connect Spring Boot backend first.");
  };

  const inputClass = (field) =>
    `w-full bg-pageBg border rounded-xl px-4 py-3 text-sm text-main outline-none transition-colors placeholder:text-[#3a3a42] ${
      errors[field]
        ? "border-[#ef4444]"
        : "border-border focus:border-[#a3e635]"
    }`;

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-pageBg text-main flex flex-col">
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-12 h-16 border-b border-border sticky top-0 z-50 bg-pageBg/90 backdrop-blur-md">
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
      <main className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Title */}
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-themeAccent mb-3">
              Step 2 of 2
            </p>
            <h1 className="text-3xl font-extrabold text-main tracking-tight mb-2">
              Create your account
            </h1>
            <p className="text-muted text-sm">
              Signing up as{" "}
              <span
                className={`font-bold px-2 py-0.5 rounded-full border text-xs uppercase tracking-wider ${roleInfo.badge}`}
              >
                {roleInfo.label}
              </span>
              {" · "}
              <Link
                to="/roleselect"
                className="text-themeAccent hover:underline text-xs"
              >
                Change role
              </Link>
            </p>
          </div>

          {/* Card */}
          <div className="bg-cardBg border border-border rounded-2xl p-8">
            {/* Google button */}
            <button
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-3 bg-white text-[#1a1a1a] font-semibold text-sm py-3.5 rounded-xl hover:bg-gray-100 transition-all mb-6"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                />
                <path
                  fill="#34A853"
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
                />
                <path
                  fill="#EA4335"
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-[#1e1e22]" />
              <span className="text-xs text-[#3a3a42] font-semibold uppercase tracking-wider">
                or fill in details
              </span>
              <div className="flex-1 h-px bg-[#1e1e22]" />
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              {/* Full name + Username — side by side */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" required error={errors.fullName}>
                  <input
                    type="text"
                    placeholder="Alex Johnson"
                    value={form.fullName}
                    onChange={set("fullName")}
                    className={inputClass("fullName")}
                  />
                </Field>
                <Field label="Username" required error={errors.username}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#3a3a42] text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      placeholder="alexj"
                      value={form.username}
                      onChange={set("username")}
                      className={`${inputClass("username")} pl-8`}
                    />
                  </div>
                </Field>
              </div>

              {/* Email */}
              <Field label="Email Address" required error={errors.email}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set("email")}
                  className={inputClass("email")}
                />
              </Field>

              {/* Phone */}
              <Field
                label="Phone Number"
                required={isOrganiser}
                error={errors.phone}
              >
                <input
                  type="tel"
                  placeholder={
                    isOrganiser
                      ? "+91 98765 43210 (required)"
                      : "+91 98765 43210 (optional)"
                  }
                  value={form.phone}
                  onChange={set("phone")}
                  className={inputClass("phone")}
                />
                {isOrganiser && !errors.phone && (
                  <p className="text-xs text-[#818cf8] mt-1">
                    Required for organisers — attendees may contact you.
                  </p>
                )}
              </Field>

              {/* Password */}
              <Field label="Password" required error={errors.password}>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="Min 8 chars, uppercase, number, symbol"
                    value={form.password}
                    onChange={set("password")}
                    className={`${inputClass("password")} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-main transition-colors text-xs font-bold"
                  >
                    {showPw ? "HIDE" : "SHOW"}
                  </button>
                </div>

                {/* Strength bars */}
                {form.password && strength && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            n <= strength.bars ? strength.color : "bg-[#1e1e22]"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-semibold ${strength.text}`}>
                      {strength.label}
                    </p>
                  </div>
                )}

                {/* Requirements hint */}
                {!errors.password && (
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
                    {[
                      {
                        rule: form.password.length >= 8,
                        label: "8+ characters",
                      },
                      {
                        rule: /[A-Z]/.test(form.password),
                        label: "Uppercase letter",
                      },
                      { rule: /[0-9]/.test(form.password), label: "Number" },
                      {
                        rule: /[^A-Za-z0-9]/.test(form.password),
                        label: "Special character",
                      },
                    ].map(({ rule, label }) => (
                      <p
                        key={label}
                        className={`text-xs flex items-center gap-1 ${rule ? "text-themeAccent" : "text-[#3a3a42]"}`}
                      >
                        <span>{rule ? "✓" : "○"}</span> {label}
                      </p>
                    ))}
                  </div>
                )}
              </Field>

              {/* Confirm password */}
              <Field label="Confirm Password" required error={errors.confirm}>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={form.confirm}
                    onChange={set("confirm")}
                    className={`${inputClass("confirm")} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-main transition-colors text-xs font-bold"
                  >
                    {showConfirm ? "HIDE" : "SHOW"}
                  </button>
                </div>
                {/* Match indicator */}
                {form.confirm && form.password && !errors.confirm && (
                  <p
                    className={`text-xs mt-1 flex items-center gap-1 ${form.password === form.confirm ? "text-themeAccent" : "text-[#ef4444]"}`}
                  >
                    {form.password === form.confirm
                      ? "✓ Passwords match"
                      : "✕ Passwords do not match"}
                  </p>
                )}
              </Field>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-6 bg-themeAccent text-[#0c0c0f] font-bold text-sm py-3.5 rounded-xl hover:bg-[#b8f056] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <p className="text-xs text-[#3a3a42] text-center mt-4 leading-relaxed">
              By continuing, you agree to our{" "}
              <span className="text-themeAccent cursor-pointer hover:underline">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-themeAccent cursor-pointer hover:underline">
                Privacy Policy
              </span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
