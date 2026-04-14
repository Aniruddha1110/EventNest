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
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { MOCK_BANK_ACCOUNTS } from "./mockData";
import { ThemeToggle } from "./ThemeContext";

const API = "http://localhost:9090";

const CURRENT_USER_ID = localStorage.getItem("userId") || "U-0001";

const STEPS = [
  "Initiating payment",
  "Verifying details",
  "Processing transaction",
  "Finalising",
];

const formatCard = (val) =>
  val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

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

  if (!event) {
    navigate("/events");
    return null;
  }

  const [method,     setMethod]     = useState("card");
  const [processing, setProcessing] = useState(false);
  const [step,       setStep]       = useState(0);
  const [result,     setResult]     = useState(null);
  const [failReason, setFailReason] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardName,   setCardName]   = useState("");
  const [expiry,     setExpiry]     = useState("");
  const [cvv,        setCvv]        = useState("");

  const [bankName,    setBankName]   = useState("axis");
  const [nbUserId,    setNbUserId]   = useState("");
  const [nbPassword,  setNbPassword] = useState("");

  const [upiId, setUpiId] = useState("");

  const [userAccount, setUserAccount] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${API}/api/bank/account?userId=${CURRENT_USER_ID}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (!res.ok) throw new Error();
        const json = await res.json();
        setUserAccount(json.data || json);
      } catch {
        setUserAccount(
          MOCK_BANK_ACCOUNTS.find((a) => a.userId === CURRENT_USER_ID) ||
            MOCK_BANK_ACCOUNTS[0],
        );
      }
    })();
  }, []);

  const validatePayment = () => {
    if (!userAccount) return { ok: false, reason: "Bank account not found." };

    if (method === "card") {
      const cleanInput  = cardNumber.replace(/\s/g, "");
      const cleanStored = (userAccount.cardNumber || "").replace(/\s/g, "");
      if (cleanInput !== cleanStored)
        return { ok: false, reason: "Card number does not match our records." };
      if (cvv !== userAccount.cvv)
        return { ok: false, reason: "Incorrect CVV." };
      if (expiry !== userAccount.expiry)
        return { ok: false, reason: "Card expiry does not match." };
      if (userAccount.balance < totalPrice)
        return { ok: false, reason: `Insufficient balance. Available: ₹${userAccount.balance.toFixed(2)}` };
      return { ok: true };
    }

    if (method === "netbanking") {
      if (nbUserId !== userAccount.netBankingId)
        return { ok: false, reason: "Incorrect net banking user ID." };
      if (nbPassword !== userAccount.netBankingPw)
        return { ok: false, reason: "Incorrect net banking password." };
      if (userAccount.balance < totalPrice)
        return { ok: false, reason: `Insufficient balance. Available: ₹${userAccount.balance.toFixed(2)}` };
      return { ok: true };
    }

    if (method === "upi") {
      if (!upiId.includes("@"))
        return { ok: false, reason: "Please enter a valid UPI ID (e.g. name@bank)." };
      if (Math.random() < 0.2)
        return { ok: false, reason: "UPI transaction failed — network timeout. Please try again." };
      if (userAccount.balance < totalPrice)
        return { ok: false, reason: `Insufficient balance. Available: ₹${userAccount.balance.toFixed(2)}` };
      return { ok: true };
    }

    return { ok: false, reason: "Unknown payment method." };
  };

  const handlePay = async () => {
    setProcessing(true);
    setStep(0);
    setResult(null);
    setFailReason("");

    for (let i = 0; i < STEPS.length; i++) {
      setStep(i);
      await new Promise((r) => setTimeout(r, 900));
    }

    const { ok, reason } = validatePayment();

    if (ok) {
      try {
        const token = localStorage.getItem("token");
        const credFields =
          method === "card"
            ? { cardNumber: cardNumber.replace(/\s/g, ""), cvv, expiry }
            : method === "netbanking"
            ? { netBankingId: nbUserId, netBankingPw: nbPassword }
            : { upiId };

        const res = await fetch(`${API}/api/bank/deduct`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId:               CURRENT_USER_ID,
            amount:               totalPrice,
            eventId:              event.eventId,
            method:               method.toUpperCase(),
            selectedProgrammeIds: selectedProgrammes.map((p) => p.id),
            ...credFields,
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setResult("failure");
          setFailReason(json.message || "Payment was declined by the server.");
          setProcessing(false);
          return;
        }
      } catch {
        // Network error — local validation passed, proceed optimistically
      }

      setResult("success");
      setProcessing(false);

      setTimeout(() => {
        navigate(`/events/${event.eventId}/ticket`, {
          state: { event, selectedProgrammes, totalPrice, isFree: false, paymentMethod: method },
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

  const methods = [
    { key: "card",       label: "Card",        icon: <CreditCard size={16} /> },
    { key: "netbanking", label: "Net Banking",  icon: <Building2  size={16} /> },
    { key: "upi",        label: "UPI",          icon: <Smartphone size={16} /> },
  ];

  // shared input class
  // The [&:-webkit-autofill] overrides stop the browser from painting its own
  // yellow/green autofill background — which was making typed text invisible.
  const inputCls = [
    "w-full border border-border bg-background text-foreground",
    "px-4 py-3 text-sm focus:outline-none focus:border-foreground transition placeholder:text-muted",
    "[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_var(--color-background)]",
    "[&:-webkit-autofill]:[-webkit-text-fill-color:var(--color-foreground)]",
    "[&:-webkit-autofill:focus]:shadow-[inset_0_0_0_1000px_var(--color-background)]",
  ].join(" ");

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-lime-200">

      {/* ── Nav ── */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
        <button
          onClick={() => navigate("/events")}
          className="text-lg font-bold tracking-tight hover:opacity-80 transition"
        >
          <span className="text-foreground">Event</span>
          <span className="text-[#C4F249]">Sphere</span>
        </button>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {!processing && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition"
            >
              <ChevronLeft size={15} /> Back
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

          {/* ── LEFT: Payment form ── */}
          <div className="lg:col-span-3">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Secure Checkout
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted mb-8">
              <Lock size={12} /> 256-bit SSL encrypted · EventSphere Payments
            </div>

            {/* Processing overlay */}
            {processing && (
              <div className="bg-surface border border-border p-10 text-center mb-6">
                <Loader size={40} className="mx-auto text-[#C4F249] animate-spin mb-6" />
                <h3 className="text-xl font-bold text-foreground mb-6">
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
                            ? "bg-foreground w-8 animate-pulse"
                            : "bg-border w-4"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted mt-4">
                  Please do not close this window
                </p>
              </div>
            )}

            {/* Success screen */}
            {result === "success" && !processing && (
              <div className="bg-surface border-2 border-[#C4F249] p-10 text-center mb-6">
                <div className="w-16 h-16 bg-[#C4F249] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-black" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Payment Successful!
                </h3>
                <p className="text-muted text-sm">
                  ₹{totalPrice} debited. Redirecting to your ticket...
                </p>
              </div>
            )}

            {/* Failure screen */}
            {result === "failure" && !processing && (
              <div className="bg-surface border-2 border-red-400 p-8 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 flex items-center justify-center">
                    <X size={20} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Payment Failed</h3>
                    <p className="text-sm text-red-500">{failReason}</p>
                  </div>
                </div>
                <button
                  onClick={() => setResult(null)}
                  className="w-full py-3 bg-foreground text-[#C4F249] font-bold text-sm hover:opacity-80 transition"
                >
                  Try Again
                </button>
                {method === "upi" && (
                  <p className="text-xs text-muted text-center mt-3">
                    UPI transactions may fail due to network issues. Please retry.
                  </p>
                )}
              </div>
            )}

            {/* Payment form */}
            {!processing && !result && (
              <>
                {/* Method tabs */}
                <div className="flex border-b border-border mb-6">
                  {methods.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMethod(m.key)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition border-b-2 -mb-px ${
                        method === m.key
                          ? "border-foreground text-foreground"
                          : "border-transparent text-muted hover:text-foreground"
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
                      <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        autoComplete="cc-number"        
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCard(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={`${inputCls} font-mono tracking-widest`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">
                        Name on Card
                      </label>
                      <input
                        type="text"
                        autoComplete="cc-name" 
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="ANIRUDDHA DUTTA"
                        className={`${inputCls} uppercase`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">
                          Expiry
                        </label>
                        <input
                          type="text"
                          autoComplete="cc-exp"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className={`${inputCls} font-mono`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">
                          CVV
                        </label>
                        <input
                          type="password"
                          autoComplete="cc-csc" 
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="•••"
                          maxLength={4}
                          className={`${inputCls} font-mono`}
                        />
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-3 text-xs text-blue-600 flex gap-2">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>
                        Test card:{" "}
                        <strong className="font-mono">4111 1111 1111 1111</strong>
                        {" "}· Expiry: <strong>12/28</strong> · CVV: <strong>737</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Net Banking form ── */}
                {method === "netbanking" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">
                        Select Bank
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { key: "axis",  label: "Axis Bank" },
                          { key: "hdfc",  label: "HDFC Bank" },
                          { key: "sbi",   label: "SBI" },
                          { key: "icici", label: "ICICI" },
                          { key: "kotak", label: "Kotak" },
                          { key: "pnb",   label: "PNB" },
                        ].map((b) => (
                          <button
                            key={b.key}
                            onClick={() => setBankName(b.key)}
                            className={`py-2.5 px-3 text-xs font-bold border-2 transition ${
                              bankName === b.key
                                ? "border-foreground bg-foreground text-[#C4F249]"
                                : "border-border text-muted hover:border-foreground hover:text-foreground"
                            }`}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">
                        Net Banking User ID
                      </label>
                      <input
                        type="text"
                        value={nbUserId}
                        onChange={(e) => setNbUserId(e.target.value)}
                        placeholder="e.g. dutta.aniruddha"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={nbPassword}
                        onChange={(e) => setNbPassword(e.target.value)}
                        placeholder="Your net banking password"
                        className={inputCls}
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-100 p-3 text-xs text-blue-600 flex gap-2">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>
                        Test credentials: User ID: <strong>dutta.aniruddha</strong>
                        {" "}· Password: <strong>Bank@1234</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* ── UPI form ── */}
                {method === "upi" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-muted uppercase tracking-wide block mb-1">
                        UPI ID
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@bank"
                        className={inputCls}
                      />
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-700 flex gap-2">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>
                        UPI transactions have an 80% success rate. Failures simulate
                        real network timeouts. Test ID: <strong>ishaaaaan@okaxis</strong>
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-2">Or pay using</p>
                      <div className="flex gap-2">
                        {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                          <button
                            key={app}
                            onClick={() => setUpiId(`${app.toLowerCase()}@upi`)}
                            className="flex-1 py-2 border border-border text-xs font-bold text-muted hover:border-foreground hover:text-foreground transition"
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
                  className={`w-full mt-6 py-4 font-bold text-base transition active:scale-95 flex items-center justify-center gap-2 border-2 ${
                    canPay()
                      ? "bg-foreground text-[#C4F249] border-foreground hover:bg-transparent hover:text-foreground"
                      : "bg-surface border-border text-muted cursor-not-allowed"
                  }`}
                >
                  <Lock size={16} />
                  Pay ₹{totalPrice}
                </button>
              </>
            )}
          </div>

          {/* ── RIGHT: Order summary ── */}
          <div className="lg:col-span-2 lg:sticky lg:top-8 space-y-3">

            {/* Top accent bar card */}
            <div className="bg-surface border border-border overflow-hidden">

              {/* Lime accent top bar */}
              <div className="h-1 bg-[#C4F249]" />

              <div className="p-6">
                {/* Event name + ID */}
                <div className="mb-5">
                  <h3 className="font-bold text-foreground text-base leading-snug mb-1">
                    {event.name}
                  </h3>
                  <span className="text-xs text-muted font-mono bg-background border border-border px-2 py-0.5 inline-block">
                    {event.eventId}
                  </span>
                </div>

                {/* Programmes list */}
                <div className="space-y-3 mb-5 pb-5 border-b border-border">
                  {selectedProgrammes.map((p) => (
                    <div key={p.id} className="flex justify-between items-start text-sm gap-3">
                      <div>
                        <p className="font-semibold text-foreground leading-tight">{p.name}</p>
                        <p className="text-xs text-muted mt-0.5">{p.venueName}</p>
                      </div>
                      <span className="font-bold text-foreground shrink-0 bg-background border border-border px-2 py-0.5 text-xs">
                        ₹{p.price}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 text-sm mb-5">
                  <div className="flex justify-between text-muted">
                    <span>Subtotal</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Convenience fee</span>
                    <span className="text-[#C4F249] font-semibold">₹0</span>
                  </div>
                  <div className="flex justify-between font-bold text-foreground text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span>₹{totalPrice}</span>
                  </div>
                </div>

                {/* Linked account */}
                {userAccount && (
                  <div className="bg-background border border-border p-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-[#C4F249] flex items-center justify-center shrink-0 mt-0.5">
                      <Wallet size={15} className="text-black" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-xs mb-0.5">
                        Linked Account
                      </p>
                      <p className="text-xs text-muted truncate">
                        {userAccount.bankName} · ····
                        {(userAccount.maskedCardNumber || "").slice(-4)}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        Available:{" "}
                        <span className="font-bold text-foreground">
                          ₹{userAccount.balance.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted py-2">
              <ShieldCheck size={13} className="text-[#C4F249]" />
              Payments secured by EventSphere
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;