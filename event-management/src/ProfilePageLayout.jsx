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
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [modalStep, setModalStep]             = useState(1);
  const [otp, setOtp]                         = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage]       = useState("");

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleLogout = () => navigate("/");

  const handleFeedback = () => {
    window.location.href =
      "mailto:abhishekpayra7@gmail.com?subject=EventSphere User Feedback";
  };

  const handleBacktoDashboard = () => {
    if (user?.role === "user") navigate("/user");
    else if (user?.role === "organiser" || user?.role === "organizer") navigate("/organiser");
    else navigate("/admin");
  };

  const handleVerifyOTP = () => {
    if (otp === "1234") {
      setErrorMessage("");
      setModalStep(2);
    } else {
      setErrorMessage("Incorrect OTP. Please try again with 1234.");
    }
  };

  const handleSaveNewPassword = () => {
    if (newPassword.length < 6) {
      setErrorMessage("Password must be greater than 6 characters!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }
    setErrorMessage("");
    alert("Password has been successfully changed!");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setModalStep(1);
    setIsModalOpen(false);
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
      : "bg-[#a3e635]/10 border-[#a3e635]/20 text-[#a3e635]";

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white font-sans">

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 h-16 bg-[#0c0c0f]/90 backdrop-blur-md border-b border-[#1e1e22]">
        <button onClick={() => navigate("/")}>
          <span className="font-bold text-xl tracking-tight">
            Event<span className="text-[#a3e635]">Sphere</span>
          </span>
        </button>
        <div className="flex items-center gap-5">
          <ThemeToggle />
          <button
            onClick={handleBacktoDashboard}
            className="text-sm text-[#a0a0ab] hover:text-[#a3e635] transition-colors"
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
          <div className="bg-[#111115] border border-[#a3e635]/20 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#1e1e22] border border-[#2a2a2e] flex items-center justify-center text-2xl font-extrabold text-[#a3e635]">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="font-extrabold text-white text-lg leading-tight">{user?.name}</h2>
                <p className="text-sm text-[#5a5a62]">{user?.username}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${roleBadge}`}>
                  {user?.role}
                </span>
              </div>
            </div>

            <div className="space-y-4 border-t border-[#1e1e22] pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#3a3a42] mb-1">Phone Number</p>
                <p className="text-sm text-white font-medium">{user?.phone}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#3a3a42] mb-1">Email</p>
                <p className="text-sm text-white font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl overflow-hidden">
            <button
              onClick={handleFeedback}
              className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-[#a0a0ab] hover:text-[#fbbf24] hover:bg-[#1e1e22] border-b border-[#1e1e22] transition-all text-left"
            >
              💡 Provide Feedback
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-[#a0a0ab] hover:text-[#818cf8] hover:bg-[#1e1e22] border-b border-[#1e1e22] transition-all text-left"
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
        <div className="lg:col-span-2">
          {children}
        </div>
      </main>

      {/* ── FORGOT PASSWORD MODAL ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl w-full max-w-md p-8 shadow-2xl relative">

            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-[#1e1e22] text-[#6a6a72] hover:text-white transition-colors text-lg font-bold"
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
                <p className="text-xs font-bold uppercase tracking-widest text-[#a3e635] mb-2">Security Verification</p>
                <h3 className="text-xl font-extrabold text-white mb-2">Enter OTP</h3>
                <p className="text-sm text-[#5a5a62] mb-6">
                  We've sent a 4-digit OTP to your registered number:{" "}
                  <span className="font-bold text-white">{user?.phone}</span>
                </p>
                <input
                  type="text"
                  placeholder="- - - -"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-4 text-center text-2xl font-extrabold tracking-widest text-white outline-none focus:border-[#a3e635] transition-colors mb-5"
                />
                <button
                  onClick={handleVerifyOTP}
                  className="w-full bg-[#a3e635] text-[#0c0c0f] font-bold py-3 rounded-xl hover:bg-[#b8f056] transition-all"
                >
                  Verify OTP
                </button>
              </div>
            )}

            {/* Step 2 — New Password */}
            {modalStep === 2 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#a3e635] mb-2">New Password</p>
                <h3 className="text-xl font-extrabold text-white mb-2">Create New Password</h3>
                <p className="text-sm text-[#5a5a62] mb-6">
                  Identity verified. Set your new password below.
                </p>
                <div className="space-y-4 mb-5">
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#a3e635] transition-colors"
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0c0c0f] border border-[#1e1e22] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#a3e635] transition-colors"
                  />
                </div>
                <button
                  onClick={handleSaveNewPassword}
                  className="w-full bg-[#a3e635] text-[#0c0c0f] font-bold py-3 rounded-xl hover:bg-[#b8f056] transition-all"
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