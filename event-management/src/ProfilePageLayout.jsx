import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfilePageLayout = ({ user, sidebarRoleContent, children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  const handleFeedback = () => {
    window.location.href =
      "mailto: abhishekpayra7@gmail.com?subject=EventSphere User Feedback";
  };

  const handleBacktoDashboard = () => {
    if (user?.role === "user") {
      window.location.href = "/user";
    } else if (user?.role === "organiser" || user?.role === "organizer") {
      window.location.href = "/organiser";
    } else {
      window.location.href = "/admin";
    }
  };

  // FIXED: Changed False to false, and renamed to isModalOpen
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // FIXED: Capitalized OTP to match the button
  const handleVerifyOTP = () => {
    if (otp === "1234") {
      setErrorMessage("");
      setModalStep(2);
    } else {
      setErrorMessage("Incorrect OTP, please try again with 1234.");
    }
  };

  const handleSaveNewPassword = () => {
    if (newPassword.length < 6) {
      // FIXED: Changed errorMessage to setErrorMessage
      setErrorMessage("Password strength must be greater than 6 characters!");
      return;
    }

    if (newPassword !== confirmPassword) {
      // FIXED: Changed errorMessage to setErrorMessage
      setErrorMessage("Passwords do not match!");
      return;
    }

    setErrorMessage("");
    alert("Password has been successfully changed! ");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setModalStep(1);
    // FIXED: Changed False to false
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-sans text-gray-900 selection:bg-lime-200 relative">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="bg-black text-white text-sm font-bold px-3 py-1.5 tracking-wide cursor-pointer hover:opacity-90">
          EventSphere
        </div>
        <button>
          <div className="flex items-center gap-4 text-sm font-medium">
            <a href="#" onClick={handleBacktoDashboard}>
              ← Back to Dashboard
            </a>
          </div>
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 space-y-6">
          {/* chnaged the border colot */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-lime-600">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500 text-sm">
                    {user?.username}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      user?.role === "organizer" || user?.role === "organiser"
                        ? "bg-[#C4F249] text-black"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">
                  Phone Number
                </p>
                <p className="font-medium text-gray-800">{user?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase">
                  Email
                </p>
                <p className="font-medium text-gray-800">{user?.email}</p>
              </div>
            </div>
          </div>

          {sidebarRoleContent}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-3">
            <button
              onClick={handleFeedback}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition border border-gray-200"
            >
              💡 Provide Feedback
            </button>
            <button
              // FIXED: Added onClick to actually open the modal!
              onClick={() => setIsModalOpen(true)}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition border border-gray-200"
            >
              🔒 Forgot Password?
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition border border-red-100"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2">{children}</div>
      </main>

      {/* MODAL SECTION */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setModalStep(1);
                setErrorMessage("");
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-black text-xl font-bold"
            >
              &times;
            </button>

            {errorMessage && (
              <div className="bg-red-50 text-red-600 p-2 rounded text-sm mb-4 text-center border border-red-100">
                {errorMessage}
              </div>
            )}

            {modalStep === 1 && (
              <div>
                <h3 className="text-xl font-bold mb-2">
                  Security Verification
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  We've sent a 4-digit OTP to your registered number: <br />
                  <span className="font-bold text-gray-800">{user?.phone}</span>
                </p>
                <input
                  type="text"
                  placeholder="Enter OTP (e.g. 1234)"
                  className="w-full border border-gray-300 p-3 rounded-lg text-center text-xl font-bold tracking-widest mb-4 focus:outline-none focus:border-black"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <button
                  onClick={handleVerifyOTP}
                  className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition"
                >
                  Verify OTP
                </button>
              </div>
            )}

            {modalStep === 2 && (
              <div>
                <h3 className="text-xl font-bold mb-2">Create New Password</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Your identity has been verified. Please set your new password
                  below.
                </p>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="New Password"
                    className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:outline-none focus:border-black"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    className="w-full border border-gray-300 p-3 rounded-lg text-sm focus:outline-none focus:border-black"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    onClick={handleSaveNewPassword}
                    className="w-full bg-[#C4F249] text-black font-bold py-3 rounded-lg mt-2 hover:bg-[#b0d942] transition"
                  >
                    Save New Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePageLayout;
