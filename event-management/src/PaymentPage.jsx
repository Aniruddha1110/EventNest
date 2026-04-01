import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CreditCard,
  Building2,
  Smartphone,
  ChevronLeft,
  Lock,
  Check,
  X,
  AlertCircle,
  Loader,
} from "lucide-react";
import { MOCK_BANK_ACCOUNTS } from "./mockData";

const API = "http://localhost:9090";

// ─── Logged-in user mock — replace with real auth context ────────────────────
const CURRENT_USER_ID = "U-0001";

// ─── Processing steps for animation ─────────────────────────────────────────
const STEPS = [
  "Initiating payment",
  "Verifying details",
  "Processing transaction",
  "Finalising",
];

// ─── Card number formatter ────────────────────────────────────────────────────
const formatCard = (val) =>
  val
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

// ─── Expiry formatter ─────────────────────────────────────────────────────────
const formatExpiry = (val) => {
  const clean = val.replace(/\D/g, "").slice(0, 4);
  return clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
};

// ─── Main PaymentPage ─────────────────────────────────────────────────────────
const PaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    event,
    selectedProgrammes = [],
    totalPrice = 0,
  } = location.state || {};

  // If no state, redirect back
  if (!event) {
    navigate("/events");
    return null;
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const [method, setMethod] = useState("card"); // "card" | "netbanking" | "upi"
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null); // null | "success" | "failure"
  const [failReason, setFailReason] = useState("");

  // Card fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Net banking fields
  const [bankName, setBankName] = useState("axis");
  const [nbUserId, setNbUserId] = useState("");
  const [nbPassword, setNbPassword] = useState("");

  // UPI
  const [upiId, setUpiId] = useState("");

  // ── Fetch fake bank account from H2 ───────────────────────────────────────
  // Backend: GET /api/bank/account?userId=U-0001
  // Returns: { accountNo, cardHolder, expiry, cvv, balance, upiId, netBankingId, netBankingPw, bankName }
  const [userAccount, setUserAccount] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API}/api/bank/account?userId=${CURRENT_USER_ID}`,
        );
        if (!res.ok) throw new Error();
        setUserAccount(await res.json());
      } catch {
        // Fallback to mock H2 data
        setUserAccount(
          MOCK_BANK_ACCOUNTS.find((a) => a.userId === CURRENT_USER_ID) ||
            MOCK_BANK_ACCOUNTS[0],
        );
      }
    })();
  }, []);

  // ── Payment validation against H2 data ────────────────────────────────────
  const validatePayment = () => {
    if (!userAccount) return { ok: false, reason: "Bank account not found." };

    if (method === "card") {
      const cleanInput = cardNumber.replace(/\s/g, "");
      const cleanStored = userAccount.accountNo.replace(/\s/g, "");
      if (cleanInput !== cleanStored)
        return { ok: false, reason: "Card number does not match our records." };
      if (cvv !== userAccount.cvv)
        return { ok: false, reason: "Incorrect CVV." };
      if (expiry !== userAccount.expiry)
        return { ok: false, reason: "Card expiry does not match." };
      if (userAccount.balance < totalPrice)
        return {
          ok: false,
          reason: `Insufficient balance. Available: ₹${userAccount.balance.toFixed(2)}`,
        };
      return { ok: true };
    }

    if (method === "netbanking") {
      if (nbUserId !== userAccount.netBankingId)
        return { ok: false, reason: "Incorrect net banking user ID." };
      if (nbPassword !== userAccount.netBankingPw)
        return { ok: false, reason: "Incorrect net banking password." };
      if (userAccount.balance < totalPrice)
        return {
          ok: false,
          reason: `Insufficient balance. Available: ₹${userAccount.balance.toFixed(2)}`,
        };
      return { ok: true };
    }

    if (method === "upi") {
      if (!upiId.includes("@"))
        return {
          ok: false,
          reason: "Please enter a valid UPI ID (e.g. name@bank).",
        };
      // UPI: random 80% success / 20% failure
      const roll = Math.random();
      if (roll < 0.2)
        return {
          ok: false,
          reason: "UPI transaction failed — network timeout. Please try again.",
        };
      if (userAccount.balance < totalPrice)
        return {
          ok: false,
          reason: `Insufficient balance. Available: ₹${userAccount.balance.toFixed(2)}`,
        };
      return { ok: true };
    }

    return { ok: false, reason: "Unknown payment method." };
  };

  // ── Run payment ────────────────────────────────────────────────────────────
  const handlePay = async () => {
    setProcessing(true);
    setStep(0);
    setResult(null);
    setFailReason("");

    // Simulate step-by-step processing animation
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 900));
    }

    const { ok, reason } = validatePayment();

    if (ok) {
      // Backend: POST /api/bank/deduct  { userId, amount: totalPrice, eventId: event.id }
      // This deducts from H2 in-memory balance and logs transaction
      try {
        await fetch(`${API}/api/bank/deduct`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: CURRENT_USER_ID,
            amount: totalPrice,
            eventId: event.id,
          }),
        });
      } catch {
        /* silent — mock data handles it */
      }

      setResult("success");
      setProcessing(false);

      // Navigate to ticket after short delay
      setTimeout(() => {
        navigate(`/events/${event.id}/ticket`, {
          state: {
            event,
            selectedProgrammes,
            totalPrice,
            isFree: false,
            paymentMethod: method,
          },
        });
      }, 2000);
    } else {
      setResult("failure");
      setFailReason(reason);
      setProcessing(false);
    }
  };

  const canPay = () => {
    if (method === "card")
      return (
        cardNumber.replace(/\s/g, "").length === 16 &&
        cvv.length >= 3 &&
        expiry.length === 5 &&
        cardName.trim().length > 0
      );
    if (method === "netbanking")
      return nbUserId.trim().length > 0 && nbPassword.trim().length > 0;
    if (method === "upi") return upiId.includes("@");
    return false;
  };

  // ── Payment method tabs ────────────────────────────────────────────────────
  const methods = [
    { key: "card", label: "Card", icon: <CreditCard size={16} /> },
    { key: "netbanking", label: "Net Banking", icon: <Building2 size={16} /> },
    { key: "upi", label: "UPI", icon: <Smartphone size={16} /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9F9F9] font-sans selection:bg-lime-200">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <button
          onClick={() => navigate("/events")}
          className="bg-black text-main text-sm font-bold px-3 py-1.5 tracking-wide hover:opacity-90 transition"
        >
          EventSphere
        </button>
        {!processing && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-black transition"
          >
            <ChevronLeft size={15} /> Back
          </button>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          {/* ── LEFT: Payment form ─────────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <h1 className="text-4xl font-bold text-black mb-2">
              Secure Checkout
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-8">
              <Lock size={12} /> 256-bit SSL encrypted · EventSphere Payments
            </div>

            {/* Processing overlay */}
            {processing && (
              <div className="bg-white border border-gray-100 p-10 text-center mb-6">
                <Loader
                  size={40}
                  className="mx-auto text-[#C4F249] animate-spin mb-6"
                />
                <h3 className="text-xl font-bold text-black mb-6">
                  {STEPS[step]}...
                </h3>
                <div className="flex justify-center gap-2">
                  {STEPS.map((s, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        i < step
                          ? "bg-[#C4F249] w-8"
                          : i === step
                            ? "bg-black w-8 animate-pulse"
                            : "bg-gray-200 w-4"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  Please do not close this window
                </p>
              </div>
            )}

            {/* Result screens */}
            {result === "success" && !processing && (
              <div className="bg-white border-2 border-[#C4F249] p-10 text-center mb-6">
                <div className="w-16 h-16 bg-[#C4F249] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-black" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-500 text-sm">
                  ₹{totalPrice} debited. Redirecting to your ticket...
                </p>
              </div>
            )}

            {result === "failure" && !processing && (
              <div className="bg-white border-2 border-red-400 p-8 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 flex items-center justify-center">
                    <X size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black">Payment Failed</h3>
                    <p className="text-sm text-red-600">{failReason}</p>
                  </div>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="w-full py-3 bg-black text-[#C4F249] font-bold text-sm hover:opacity-80 transition"
                >
                  Try Again
                </button>
                {method === "upi" && (
                  <p className="text-xs text-gray-400 text-center mt-3">
                    UPI transactions may fail due to network issues. Please
                    retry.
                  </p>
                )}
              </div>
            )}

            {/* Payment form — hidden during processing/result */}
            {!processing && !result && (
              <>
                {/* Method tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                  {methods.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMethod(m.key)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition border-b-2 -mb-px ${
                        method === m.key
                          ? "border-black text-black"
                          : "border-transparent text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>

                {/* ── Card form ── */}
                {method === "card" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) =>
                          setCardNumber(formatCard(e.target.value))
                        }
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full border border-gray-200 px-4 py-3 text-sm font-mono focus:outline-none focus:border-black transition tracking-widest"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) =>
                          setCardName(e.target.value.toUpperCase())
                        }
                        placeholder="ANIRUDDHA DUTTA"
                        className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          value={expiry}
                          onChange={(e) =>
                            setExpiry(formatExpiry(e.target.value))
                          }
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full border border-gray-200 px-4 py-3 text-sm font-mono focus:outline-none focus:border-black transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          value={cvv}
                          onChange={(e) =>
                            setCvv(
                              e.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          placeholder="•••"
                          maxLength={4}
                          className="w-full border border-gray-200 px-4 py-3 text-sm font-mono focus:outline-none focus:border-black transition"
                        />
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-3 text-xs text-blue-600 flex gap-2">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>
                        Test card:{" "}
                        <strong className="font-mono">
                          4111 1111 1111 1111
                        </strong>{" "}
                        · Expiry: <strong>12/28</strong> · CVV:{" "}
                        <strong>737</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Net Banking form ── */}
                {method === "netbanking" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                        Select Bank
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { key: "axis", label: "Axis Bank" },
                          { key: "hdfc", label: "HDFC Bank" },
                          { key: "sbi", label: "SBI" },
                          { key: "icici", label: "ICICI" },
                          { key: "kotak", label: "Kotak" },
                          { key: "pnb", label: "PNB" },
                        ].map((b) => (
                          <button
                            key={b.key}
                            onClick={() => setBankName(b.key)}
                            className={`py-2.5 px-3 text-xs font-bold border-2 transition ${bankName === b.key ? "border-black bg-black text-[#C4F249]" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                        Net Banking User ID
                      </label>
                      <input
                        type="text"
                        value={nbUserId}
                        onChange={(e) => setNbUserId(e.target.value)}
                        placeholder="e.g. dutta.aniruddha"
                        className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={nbPassword}
                        onChange={(e) => setNbPassword(e.target.value)}
                        placeholder="Your net banking password"
                        className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-3 text-xs text-blue-600 flex gap-2">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>
                        Test credentials: User ID:{" "}
                        <strong>dutta.aniruddha</strong> · Password:{" "}
                        <strong>Bank@1234</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* ── UPI form ── */}
                {method === "upi" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@bank"
                        className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black transition"
                      />
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-700 flex gap-2">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>
                        UPI transactions have an 80% success rate. Failures
                        simulate real network timeouts. Test ID:{" "}
                        <strong>ishaaaaan@okaxis</strong>
                      </span>
                    </div>
                    {/* UPI app shortcuts (cosmetic) */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Or pay using</p>
                      <div className="flex gap-2">
                        {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                          <button
                            key={app}
                            onClick={() => setUpiId(`${app.toLowerCase()}@upi`)}
                            className="flex-1 py-2 border border-gray-200 text-xs font-bold text-gray-600 hover:border-black transition"
                          >
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pay button */}
                <button
                  onClick={handlePay}
                  disabled={!canPay()}
                  className={`w-full mt-6 py-4 font-bold text-base transition active:scale-95 flex items-center justify-center gap-2 ${
                    canPay()
                      ? "bg-black text-[#C4F249] hover:opacity-80"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Lock size={16} />
                  Pay ₹{totalPrice}
                </button>
              </>
            )}
          </div>

          {/* ── RIGHT: Order summary ──────────────────────────────────────── */}
          <div className="lg:col-span-2 lg:sticky lg:top-8">
            <div className="bg-white border border-gray-100 p-6">
              <h3 className="font-bold text-black mb-1">{event.name}</h3>
              <p className="text-xs text-gray-400 font-mono mb-4">{event.id}</p>

              <div className="space-y-2 mb-4 border-t border-gray-100 pt-4">
                {selectedProgrammes.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-start text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.venueName}</p>
                    </div>
                    <span className="font-bold text-black ml-3 shrink-0">
                      ₹{p.price}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>₹{totalPrice}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Convenience fee</span>
                  <span>₹0</span>
                </div>
                <div className="flex justify-between font-bold text-black text-base pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>

              {/* Account balance hint */}
              {userAccount && (
                <div className="mt-4 bg-gray-50 p-3 text-xs text-gray-500">
                  <p className="font-semibold text-gray-700 mb-0.5">
                    Linked Account
                  </p>
                  <p>
                    {userAccount.bankName} · ····
                    {userAccount.accountNo.slice(-4)}
                  </p>
                  <p>
                    Available:{" "}
                    <span className="font-bold text-black">
                      ₹{userAccount.balance.toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
              <Lock size={11} /> Payments secured by EventSphere
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
