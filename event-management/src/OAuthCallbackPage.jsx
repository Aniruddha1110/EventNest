import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * OAuthCallbackPage
 *
 * The backend (OAuth2SuccessHandler) redirects here after a successful
 * Google or GitHub login with all session params in the URL:
 *
 *   /oauth/callback?token=JWT&userId=OAU-0001&role=user&name=John+Doe&email=...&photoUrl=...
 *
 * This page:
 *   1. Reads all params from the URL
 *   2. Saves them to localStorage (same keys as LoginPage.saveSession)
 *   3. Redirects to /user dashboard
 *   4. Shows an error screen if any required param is missing
 *
 * Route in App.jsx:
 *   <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
 */
export default function OAuthCallbackPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  

  useEffect(() => {
    // Check for backend error redirect first
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const messages = {
        oauth_no_email: "Could not retrieve your email from the OAuth provider. Make sure your email is set to public, or use email/password login instead.",
      };
      setError(messages[errorParam] || "OAuth login failed. Please try again.");
      return;
    }

    const token    = searchParams.get("token");
    const userId   = searchParams.get("userId");
    const role     = searchParams.get("role")     || "user";
    const name     = searchParams.get("userName")     || "";
    const email    = searchParams.get("userEmail")    || "";
    const photoUrl = searchParams.get("photoUrl") || "";

    if (!token || !userId) {
      setError("OAuth login failed — missing session data. Please try again.");
      return;
    }

    // Persist session — same localStorage keys as LoginPage.saveSession()
    localStorage.setItem("token",    token);
    localStorage.setItem("role",     role);
    localStorage.setItem("userId",   userId);   // OAU-0001
    localStorage.setItem("userName",     name);
    localStorage.setItem("userEmail",    email);
    localStorage.setItem("photoUrl", photoUrl);

    // Navigate to user dashboard
    navigate("/user", { replace: true });
  }, []);

  // ── Error screen ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#0c0c0f] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3">Sign-in Failed</h2>
          <p className="text-[#a0a0ab] text-sm leading-relaxed mb-8">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 bg-[#a3e635] text-[#0c0c0f] font-bold text-sm rounded-xl hover:bg-[#b8f056] transition-all"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Loading screen (shown for < 500ms normally) ───────────────────────────
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="w-12 h-12 border-2 border-[#a3e635]/20 border-t-[#a3e635] rounded-full animate-spin" />
        <p className="text-[#5a5a62] text-sm font-medium animate-pulse">
          Completing sign-in...
        </p>
      </div>
    </div>
  );
}