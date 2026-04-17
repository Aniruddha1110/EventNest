import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:9090";

// ── States ────────────────────────────────────────────────────────────────────
// idle        → camera not started yet
// loading     → requesting camera permission
// countdown   → camera live, counting down 3-2-1
// capturing   → snapshot taken, sending to backend
// success     → face matched, navigating to dashboard
// failed      → face did not match (can retry)
// error       → camera denied or service error

const COUNTDOWN_SEC = 3;

export default function FaceAuthPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const timerRef = useRef(null);

    const [phase, setPhase] = useState("idle");
    const [countdown, setCountdown] = useState(COUNTDOWN_SEC);
    const [message, setMessage] = useState("");
    const [attempts, setAttempts] = useState(0);
    const [adminName, setAdminName] = useState("");

    const MAX_ATTEMPTS = 3;

    // ── On mount: load admin name from sessionStorage + start camera ──────────
    useEffect(() => {
        const name = sessionStorage.getItem("pendingAdminName") || "Admin";
        const tempTok = sessionStorage.getItem("pendingTempToken");
        setAdminName(name);

        // Guard: if no temp token, they shouldn't be here
        if (!tempTok) {
            navigate("/login?role=admin");
            return;
        }

        startCamera();
        return () => stopCamera();
    }, []);

    // ── Start webcam ──────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        setPhase("loading");
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: "user" },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            // Begin countdown
            setPhase("countdown");
            startCountdown();
        } catch (err) {
            setPhase("error");
            setMessage(
                err.name === "NotAllowedError"
                    ? "Camera access denied. Please allow camera access in your browser settings and refresh."
                    : "Could not access your camera. Please check your device settings."
            );
        }
    }, []);

    // ── Stop webcam ───────────────────────────────────────────────────────────
    const stopCamera = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    // ── Countdown: 3 → 2 → 1 → capture ───────────────────────────────────────
    const startCountdown = () => {
        let remaining = COUNTDOWN_SEC;
        setCountdown(remaining);

        timerRef.current = setInterval(() => {
            remaining -= 1;
            setCountdown(remaining);
            if (remaining <= 0) {
                clearInterval(timerRef.current);
                captureAndVerify();
            }
        }, 1000);
    };

    // ── Capture frame from webcam → base64 → POST to backend ─────────────────
    const captureAndVerify = useCallback(async () => {
        setPhase("capturing");

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // Draw current video frame to canvas
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");

        // Mirror horizontally (webcam is typically mirrored — match reference photo orientation)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);

        // Convert to base64 JPEG
        const capturedImageB64 = canvas.toDataURL("image/jpeg", 0.92);

        const tempToken = sessionStorage.getItem("pendingTempToken");

        try {
            const res = await fetch(`${API}/api/auth/face-verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${tempToken}`,
                },
                body: JSON.stringify({ capturedImageB64 }),
            });

            const json = await res.json();

            if (res.ok && json.data?.token) {
                // Phase 2 passed — save real JWT and navigate to dashboard
                const data = json.data;
                localStorage.setItem("token", data.token);
                localStorage.setItem("role", "admin");
                localStorage.setItem("userId", data.userId);
                localStorage.setItem("name", data.name);
                localStorage.setItem("email", data.email);
                localStorage.setItem("photoUrl", data.photoUrl || "");

                // Clear temp data
                sessionStorage.removeItem("pendingTempToken");
                sessionStorage.removeItem("pendingAdminName");

                stopCamera();
                setPhase("success");

                // Brief success pause then navigate
                setTimeout(() => navigate("/admin"), 1200);

            } else {
                // Face did not match or session expired
                const errMsg = json.message || "Face verification failed.";
                const newAttempts = attempts + 1;
                setAttempts(newAttempts);

                if (newAttempts >= MAX_ATTEMPTS) {
                    stopCamera();
                    setPhase("error");
                    setMessage(
                        "Maximum verification attempts reached. "
                        + "Please log in again from the beginning."
                    );
                    sessionStorage.removeItem("pendingTempToken");
                    sessionStorage.removeItem("pendingAdminName");
                } else {
                    setPhase("failed");
                    setMessage(errMsg);
                }
            }

        } catch {
            setPhase("error");
            setMessage(
                "Could not reach the face verification service. "
                + "Ensure the Python service is running on port 5001."
            );
        }
    }, [attempts, navigate]);

    // ── Retry ─────────────────────────────────────────────────────────────────
    const handleRetry = () => {
        setMessage("");
        setPhase("countdown");
        setCountdown(COUNTDOWN_SEC);
        startCountdown();
    };

    // ── Cancel → back to login ─────────────────────────────────────────────────
    const handleCancel = () => {
        stopCamera();
        sessionStorage.removeItem("pendingTempToken");
        sessionStorage.removeItem("pendingAdminName");
        navigate("/login?role=admin");
    };

    // ── UI helpers ─────────────────────────────────────────────────────────────
    const statusColor = {
        idle: "#5a5a62",
        loading: "#818cf8",
        countdown: "#a3e635",
        capturing: "#fb923c",
        success: "#34d399",
        failed: "#f87171",
        error: "#f87171",
    };

    const statusLabel = {
        idle: "Initializing…",
        loading: "Requesting camera access…",
        countdown: `Auto-capturing in ${countdown}s — look at the camera`,
        capturing: "Analyzing your face…",
        success: "Identity verified! Redirecting…",
        failed: "Verification failed — retrying…",
        error: "Error",
    };

    const showVideo = ["loading", "countdown", "capturing", "failed"].includes(phase);
    const showOverlay = phase === "countdown";
    const showSuccess = phase === "success";
    const showError = phase === "error";
    const showFailed = phase === "failed";

    // Scanning frame CSS animation (pulsing green border when in countdown)
    const scannerBorder =
        phase === "countdown" ? "2px solid #a3e635" :
            phase === "capturing" ? "2px solid #fb923c" :
                phase === "success" ? "2px solid #34d399" :
                    phase === "failed" ? "2px solid #f87171" :
                        "2px solid #2a2a2e";

    return (
        <div className="min-h-screen bg-[#0c0c0f] text-white flex flex-col font-sans">

            {/* HEADER */}
            <header className="flex items-center justify-between px-10 h-16 border-b border-[#1e1e22]">
                <span className="font-bold text-xl tracking-tight">
                    Event<span className="text-[#a3e635]">Sphere</span>
                </span>
                <span className="text-xs text-[#5a5a62] bg-[#111115] border border-[#1e1e22] px-3 py-1 rounded-full font-semibold uppercase tracking-widest">
                    Admin Face Verification
                </span>
            </header>

            {/* MAIN */}
            <main className="flex-1 flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-md">

                    {/* Title */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 rounded-full bg-[#34d399]/10 border border-[#34d399]/30 flex items-center justify-center mx-auto mb-4">
                            {/* Face scan icon */}
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-extrabold text-white mb-2">
                            Identity Verification
                        </h1>
                        <p className="text-[#5a5a62] text-sm">
                            Step 2 of 2 — Face Recognition
                        </p>
                        {adminName && (
                            <p className="text-[#a0a0ab] text-sm mt-1">
                                Verifying <span className="text-white font-semibold">{adminName}</span>
                            </p>
                        )}
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#34d399] flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="2 6 5 9 10 3" />
                                </svg>
                            </div>
                            <span className="text-xs text-[#34d399] font-semibold">Password verified</span>
                        </div>
                        <div className="w-8 h-px bg-[#2a2a2e]" />
                        <div className="flex items-center gap-1.5">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${showSuccess
                                    ? "bg-[#34d399] border-[#34d399] text-black"
                                    : "border-[#a3e635] text-[#a3e635]"
                                }`}>
                                {showSuccess ? (
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round">
                                        <polyline points="2 6 5 9 10 3" />
                                    </svg>
                                ) : "2"}
                            </div>
                            <span className="text-xs text-[#a3e635] font-semibold">Face recognition</span>
                        </div>
                    </div>

                    {/* Webcam card */}
                    <div className="bg-[#111115] border border-[#1e1e22] rounded-2xl p-5">

                        {/* Video preview */}
                        <div className="relative rounded-xl overflow-hidden mb-4"
                            style={{ aspectRatio: "4/3", background: "#0c0c0f", border: scannerBorder, transition: "border-color 0.4s" }}>

                            {/* Actual video element */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{
                                    display: showVideo ? "block" : "none",
                                    transform: "scaleX(-1)",  // mirror for natural feel
                                }}
                            />

                            {/* Hidden canvas used for capture */}
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Countdown overlay */}
                            {showOverlay && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    {/* Corner scan brackets */}
                                    <div className="absolute inset-6 pointer-events-none">
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#a3e635] rounded-tl" />
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#a3e635] rounded-tr" />
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#a3e635] rounded-bl" />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#a3e635] rounded-br" />
                                    </div>
                                    {/* Countdown number */}
                                    <span className="text-7xl font-extrabold text-[#a3e635] drop-shadow-lg"
                                        style={{ textShadow: "0 0 30px rgba(163,230,53,0.5)" }}>
                                        {countdown}
                                    </span>
                                </div>
                            )}

                            {/* Capturing overlay */}
                            {phase === "capturing" && (
                                <div className="absolute inset-0 bg-[#fb923c]/10 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-10 h-10 border-2 border-[#fb923c] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-xs text-[#fb923c] font-semibold">Analyzing…</p>
                                    </div>
                                </div>
                            )}

                            {/* Success overlay */}
                            {showSuccess && (
                                <div className="absolute inset-0 bg-[#34d399]/10 flex items-center justify-center rounded-xl">
                                    <div className="text-center">
                                        <div className="w-16 h-16 rounded-full bg-[#34d399]/20 border-2 border-[#34d399] flex items-center justify-center mx-auto mb-3">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-bold text-[#34d399]">Identity Confirmed</p>
                                    </div>
                                </div>
                            )}

                            {/* Idle/loading placeholder */}
                            {(phase === "idle" || phase === "loading") && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2a2a2e" strokeWidth="1" className="mx-auto mb-3">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                        <p className="text-xs text-[#2a2a2e]">
                                            {phase === "loading" ? "Starting camera…" : "Camera preview"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status bar */}
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <div className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: statusColor[phase] }} />
                            <p className="text-xs font-medium" style={{ color: statusColor[phase] }}>
                                {statusLabel[phase]}
                            </p>
                        </div>

                        {/* Attempt indicator */}
                        {attempts > 0 && !showError && (
                            <div className="flex items-center gap-1.5 px-1 mb-3">
                                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                                    <div key={i} className="w-2 h-2 rounded-full"
                                        style={{ background: i < attempts ? "#f87171" : "#2a2a2e" }} />
                                ))}
                                <span className="text-[10px] text-[#5a5a62] ml-1">
                                    {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? "s" : ""} remaining
                                </span>
                            </div>
                        )}

                        {/* Error / failed message */}
                        {(showFailed || showError) && message && (
                            <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-xl px-4 py-3 mb-4">
                                <p className="text-xs text-[#f87171] leading-relaxed">{message}</p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="space-y-2">
                            {showFailed && attempts < MAX_ATTEMPTS && (
                                <button onClick={handleRetry}
                                    className="w-full py-3 bg-[#a3e635] text-[#0c0c0f] font-extrabold text-sm rounded-xl hover:bg-[#b8f056] transition-all">
                                    Try Again
                                </button>
                            )}
                            {showError && (
                                <button onClick={() => navigate("/login?role=admin")}
                                    className="w-full py-3 bg-[#a3e635] text-[#0c0c0f] font-extrabold text-sm rounded-xl hover:bg-[#b8f056] transition-all">
                                    Back to Login
                                </button>
                            )}
                            {!showSuccess && !showError && (
                                <button onClick={handleCancel}
                                    className="w-full py-2.5 border border-[#2a2a2e] text-[#5a5a62] text-sm font-semibold rounded-xl hover:border-[#f87171] hover:text-[#f87171] transition-all">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Instructions card */}
                    {(phase === "countdown" || phase === "idle" || phase === "loading") && (
                        <div className="bg-[#111115] border border-[#1e1e22] rounded-xl px-5 py-4 mt-4">
                            <p className="text-xs font-semibold text-[#a0a0ab] mb-2">For best results</p>
                            <ul className="space-y-1.5 text-xs text-[#5a5a62]">
                                <li className="flex items-center gap-2">
                                    <span className="text-[#a3e635]">·</span>
                                    Face the camera directly — don't tilt your head
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#a3e635]">·</span>
                                    Ensure your face is well-lit from the front
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#a3e635]">·</span>
                                    Remove sunglasses or face coverings
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="text-[#a3e635]">·</span>
                                    You have 3 minutes to complete this step
                                </li>
                            </ul>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}