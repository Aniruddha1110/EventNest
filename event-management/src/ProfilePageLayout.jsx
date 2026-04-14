import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeContext";

// ─── SHARED LAYOUT FOR ALL PROFILE PAGES ─────────────────────────────────────
// Usage:
//   <ProfilePageLayout user={currentUser}>
//     {/* right column content goes here */}
//   </ProfilePageLayout>
//
// user prop shape: { name, username, role, phone, email }

const ProfilePageLayout = ({ user, children }) => {
  const navigate = useNavigate();

  // ── Modal state ─────────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleLogout = () => {
  localStorage.removeItem("token");
  navigate("/");
};

  const handleFeedback = () => {
    window.location.href =
      "mailto:abhishekpayra7@gmail.com?subject=EventSphere User Feedback";
  };

  const handleBacktoDashboard = () => {
    if (user?.role === "user") navigate("/user");
    else if (user?.role === "organiser" || user?.role === "organizer")
      navigate("/organiser");
    else navigate("/admin");
  };

  // const handleVerifyOTP = () => {
  //   if (otp === "1234") {
  //     setErrorMessage("");
  //     setModalStep(2);
  //   } else {
  //     setErrorMessage("Incorrect OTP. Please try again with 1234.");
  //   }
  // };

  const handleVerifyOTP = async () => {
  if (otp.length < 6) {
    setErrorMessage("Please enter the complete 6-digit OTP.");
    return;
  }
  setErrorMessage("");
  try {
    const res = await fetch("http://localhost:9090/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user?.email, otp, role: user?.role || "user" }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.message || "Incorrect OTP. Please try again.");
      return;
    }
    setModalStep(2);
  } catch {
    setErrorMessage("Backend offline. Cannot verify OTP.");
  }
};

  // const handleSaveNewPassword = () => {
  //   if (newPassword.length < 6) {
  //     setErrorMessage("Password must be greater than 6 characters!");
  //     return;
  //   }
  //   if (newPassword !== confirmPassword) {
  //     setErrorMessage("Passwords do not match!");
  //     return;
  //   }
  //   setErrorMessage("");
  //   alert("Password has been successfully changed!");
  //   setOtp("");
  //   setNewPassword("");
  //   setConfirmPassword("");
  //   setModalStep(1);
  //   setIsModalOpen(false);
  // };

  const handleSaveNewPassword = async () => {
  if (newPassword.length < 8) {
    setErrorMessage("Password must be at least 8 characters!");
    return;
  }
  if (newPassword !== confirmPassword) {
    setErrorMessage("Passwords do not match!");
    return;
  }
  setErrorMessage("");
  try {
    const res = await fetch("http://localhost:9090/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:       user?.email,
        otp,
        newPassword,
        role:        user?.role || "user",
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.message || "Failed to reset password.");
      return;
    }
    alert("Password changed successfully! Please log in again.");
    localStorage.removeItem("token");
    closeModal();
    navigate("/login");
  } catch {
    setErrorMessage("Backend offline. Cannot reset password.");
  }
};

  const closeModal = () => {
    setIsModalOpen(false);
    setModalStep(1);
    setErrorMessage("");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // ── Role badge color ─────────────────────────────────────────────────────
  const roleBadge =
    user?.role === "organiser" || user?.role === "organizer"
      ? "bg-[#818cf8]/10 border-[#818cf8]/20 text-[#818cf8]"
      : user?.role === "admin"
        ? "bg-[#34d399]/10 border-[#34d399]/20 text-[#34d399]"
        : "bg-themeAccent/10 border-[#a3e635]/20 text-themeAccent";

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-pageBg text-main font-sans">
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 h-16 bg-pageBg/90 backdrop-blur-md border-b border-border">
        <button onClick={() => navigate("/")}>
          <span className="font-bold text-xl tracking-tight">
            Event<span className="text-themeAccent">Sphere</span>
          </span>
        </button>
        <div className="flex items-center gap-5">
          <ThemeToggle />
          <button
            onClick={handleBacktoDashboard}
            className="text-sm text-textMuted hover:text-themeAccent transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      {/* ── MAIN ──────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT SIDEBAR ────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Profile info card */}
          <div className="bg-cardBg border border-[#a3e635]/20 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-pageBg border border-border flex items-center justify-center text-2xl font-extrabold text-themeAccent">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="font-extrabold text-main text-lg leading-tight">
                  {user?.name}
                </h2>
                <p className="text-sm text-muted">{user?.username}</p>
                <span
                  className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleBadge}`}
                >
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-textMuted mb-1">
                  Phone Number
                </p>
                <p className="text-sm text-main font-medium">{user?.phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-textMuted mb-1">
                  Email
                </p>
                <p className="text-sm text-main font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-cardBg border border-border rounded-2xl overflow-hidden">
            <button
              onClick={handleFeedback}
              className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-textMuted hover:text-[#fbbf24] hover:bg-[#1e1e22] border-b border-border transition-all text-left"
            >
              💡 Provide Feedback
            </button>
            <button
              onClick={async () => {
                setIsModalOpen(true);
                  // Send OTP to backend as soon as modal opens
                  try {
                    await fetch("http://localhost:9090/api/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: user?.email, role: user?.role || "user" }),
                    });
                  } catch { /* silent — user sees the modal, OTP sending attempted */ }
                }}
              className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-textMuted hover:text-[#818cf8] hover:bg-[#1e1e22] border-b border-border transition-all text-left"
            >
              🔒 Forgot Password?
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-[#ef4444] hover:bg-[#ef4444]/10 transition-all text-left"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN — injected by each profile page ─────────── */}
        <div className="lg:col-span-2">{children}</div>
      </main>

      {/* ── FORGOT PASSWORD MODAL ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-cardBg border border-border rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e1e22] text-textMuted hover:text-main transition-colors text-lg font-bold"
            >
              ✕
            </button>

            {errorMessage && (
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] px-4 py-3 rounded-xl text-sm mb-5 text-center">
                {errorMessage}
              </div>
            )}

            {/* Step 1 — OTP */}
            {modalStep === 1 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-themeAccent mb-2">
                  Security Verification
                </p>
                <h3 className="text-xl font-extrabold text-main mb-2">
                  Enter OTP
                </h3>
                <p className="text-sm text-muted mb-6">
                  We've sent a 6-digit OTP to your registered email:{" "}
                  <span className="font-bold text-main">{user?.email}</span>
                  </p>
                  <input
                  type="text"
                  placeholder="- - - - - -"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-pageBg border border-border rounded-xl px-4 py-4 text-center text-2xl font-extrabold tracking-widest text-main outline-none focus:border-[#a3e635] transition-colors mb-5"
                />
                <button
                  onClick={handleVerifyOTP}
                  className="w-full bg-themeAccent text-[#0c0c0f] font-bold py-3 rounded-xl hover:bg-[#b8f056] transition-all"
                >
                  Verify OTP
                </button>
              </div>
            )}

            {/* Step 2 — New Password */}
            {modalStep === 2 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-themeAccent mb-2">
                  New Password
                </p>
                <h3 className="text-xl font-extrabold text-main mb-2">
                  Create New Password
                </h3>
                <p className="text-sm text-muted mb-6">
                  Identity verified. Set your new password below.
                </p>
                <div className="space-y-4 mb-5">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-pageBg border border-border rounded-xl px-4 py-3 text-sm text-main outline-none focus:border-[#a3e635] transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-pageBg border border-border rounded-xl px-4 py-3 text-sm text-main outline-none focus:border-[#a3e635] transition-colors"
                  />
                </div>
                <button
                  onClick={handleSaveNewPassword}
                  className="w-full bg-themeAccent text-[#0c0c0f] font-bold py-3 rounded-xl hover:bg-[#b8f056] transition-all"
                >
                  Save New Password
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePageLayout;
