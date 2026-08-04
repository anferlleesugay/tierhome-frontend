// FILE: src/pages/Register.jsx

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Mail, Lock, Eye, EyeOff,
  Phone, Home, Key, AlertCircle, X,
  CheckCircle2, FileText, ShieldCheck,
  ArrowLeft, Loader, RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import EulaModal from "../components/modals/EulaModal";
import logo from "../assets/logo.png";

const API = import.meta.env.VITE_API_URL;

export default function Register() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const background = location.state?.background;
  const { login } = useAuth();

  // ── Steps: "form" → "otp" → "done" ─────────────────────
  const [step, setStep] = useState("form");

  // ── Form fields ──────────────────────────────────────────
  const [lastName,             setLastName]             = useState("");
  const [firstName,            setFirstName]            = useState("");
  const [middleInitial,        setMiddleInitial]        = useState("");
  const [phoneNumber,          setPhoneNumber]          = useState("");
  const [email,                setEmail]                = useState("");
  const [password,             setPassword]             = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [role,                 setRole]                 = useState("tenant");

  // ── Consent ──────────────────────────────────────────────
  const [termsAccepted,       setTermsAccepted]       = useState(false);
  const [privacyAccepted,     setPrivacyAccepted]     = useState(false);
  const [dataPrivacyAccepted, setDataPrivacyAccepted] = useState(false);
  const [ageConfirmed,        setAgeConfirmed]        = useState(false);
  const [eulaModalOpen,       setEulaModalOpen]       = useState(false);
  const [modalType,           setModalType]           = useState(null);

  // ── OTP ──────────────────────────────────────────────────
  const [otpCode,    setOtpCode]    = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending,  setResending]  = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── UI ───────────────────────────────────────────────────
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  const isPhoneValid   = /^09\d{9}$/.test(phoneNumber);
  const passwordsMatch = password === passwordConfirmation && passwordConfirmation !== "";
  const allConsents    = termsAccepted && privacyAccepted && dataPrivacyAccepted && ageConfirmed;

  const getStrength = () => {
    let s = 0;
    if (password.length >= 8)          s++;
    if (/[A-Z]/.test(password))        s++;
    if (/[0-9]/.test(password))        s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  };
  const strength       = getStrength();
  const strengthText   = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  const handleClose = () => navigate(background?.pathname || "/");

  // ── Step 1: Send OTP ─────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!isPhoneValid)   { setError("Phone number must start with 09 and be 11 digits"); return; }
    if (!passwordsMatch) { setError("Passwords do not match"); return; }
    if (!allConsents)    { setError("Please accept all agreements before registering"); return; }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/send-otp`, { email, first_name: firstName });
      setStep("otp");
      startCooldown();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP & Register ───────────────────────
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (otpCode.length !== 6) { setError("Please enter the 6-digit code"); return; }

    setOtpLoading(true);
    try {
      const res = await axios.post(`${API}/auth/register`, {
        last_name:      lastName,
        first_name:     firstName,
        middle_initial: middleInitial,
        phone_number:   phoneNumber,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role,
        otp_code: otpCode,
      });

      const token = res.data?.data?.token;
      const user  = res.data?.data?.user;
      if (token && user) login(token, user);
      navigate("/verify");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────
  const startCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError("");
    try {
      await axios.post(`${API}/auth/send-otp`, { email, first_name: firstName });
      startCooldown();
      setOtpCode("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  const inputClass = "w-full bg-[#f8fafc] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10";

  // ── OTP STEP UI ──────────────────────────────────────────
  const otpContent = (
    <div className="px-7 py-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={32} className="text-[#3d6b35]" />
        </div>
        <h2 className="text-[20px] font-bold text-gray-900 mb-1">Check your email</h2>
        <p className="text-[13px] text-gray-500">
          We sent a 6-digit code to
        </p>
        <p className="text-[13px] font-semibold text-[#3d6b35]">{email}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl mb-4">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleVerifyAndRegister} className="space-y-4">
        {/* OTP Input */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Verification Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="w-full h-[60px] bg-[#f8fafc] border-2 border-gray-200 rounded-xl text-center text-[28px] font-bold tracking-[12px] text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10"
          />
          <p className="text-[11px] text-gray-400 text-center mt-1">
            Code expires in 10 minutes
          </p>
        </div>

        <button
          type="submit"
          disabled={otpLoading || otpCode.length !== 6}
          className="w-full h-[48px] rounded-xl text-white font-bold text-[14px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            background: otpLoading || otpCode.length !== 6 ? "#86a886" : "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)",
            cursor: otpLoading || otpCode.length !== 6 ? "not-allowed" : "pointer",
          }}
        >
          {otpLoading ? <><Loader size={16} className="animate-spin" /> Verifying...</> : "Verify & Create Account"}
        </button>

        {/* Resend */}
        <div className="text-center">
          <p className="text-[12px] text-gray-500 mb-1">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || resending}
            className="text-[12px] font-semibold flex items-center gap-1 mx-auto"
            style={{ color: resendCooldown > 0 ? "#9ca3af" : "#3d6b35" }}
          >
            <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </button>
        </div>

        {/* Back */}
        <button
          type="button"
          onClick={() => { setStep("form"); setOtpCode(""); setError(""); }}
          className="w-full flex items-center justify-center gap-2 text-[13px] text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={14} /> Back to registration
        </button>
      </form>
    </div>
  );

  // ── FORM STEP UI ─────────────────────────────────────────
  const formContent = (
    <div className="px-7 py-5">
      <div className="text-center mb-4">
        <img src={logo} alt="TierHome" className="mx-auto h-9 w-auto object-contain mb-2" />
        <span className="inline-block text-[10px] font-semibold px-3 py-1 rounded-full mb-2" style={{ background: "#dcfce7", color: "#3d6b35" }}>
          Angeles City Housing Platform
        </span>
        <h2 className="text-[20px] font-bold text-gray-900 mb-0.5">Create Account</h2>
        <p className="text-[13px] text-gray-500">Join TierHome to find your perfect home</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl mb-3">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSendOtp} className="space-y-3">
        {/* LAST + FIRST NAME */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Last Name</label>
            <input required placeholder="Dela Cruz" value={lastName} onChange={(e) => setLastName(e.target.value)} className={`${inputClass} h-[44px] px-3`} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">First Name</label>
            <input required placeholder="Juan" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={`${inputClass} h-[44px] px-3`} />
          </div>
        </div>

        {/* MI + PHONE */}
        <div className="grid grid-cols-[28%_1fr] gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">M.I.</label>
            <input maxLength={2} placeholder="A" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value)} className={`${inputClass} h-[44px] px-3 text-center`} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Phone Number</label>
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input required placeholder="09XXXXXXXXX" maxLength={11} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={`${inputClass} h-[44px] pl-8 pr-3`} />
            </div>
          </div>
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Email Address</label>
          <div className="relative">
            <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" required placeholder="juan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} h-[44px] pl-8 pr-3`} />
          </div>
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Password</label>
          <div className="relative">
            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPass ? "text" : "password"} required placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} h-[44px] pl-8 pr-9`} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          {password && (
            <div className="mt-1">
              <div className="flex gap-1">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${strength >= i ? strengthColors[strength] : "bg-gray-200"}`} />
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Strength: <span className="font-semibold">{strengthText[strength]}</span></p>
            </div>
          )}
        </div>

        {/* CONFIRM PASSWORD */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Confirm Password</label>
          <div className="relative">
            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showConfirm ? "text" : "password"} required placeholder="Re-enter password"
              value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
              className={`w-full h-[44px] bg-[#f8fafc] rounded-xl text-sm text-gray-800 outline-none transition-all pl-8 pr-9 border focus:bg-white ${
                passwordConfirmation === "" ? "border-gray-200 focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10"
                : passwordsMatch ? "border-green-500 focus:ring-2 focus:ring-green-200"
                : "border-red-400 focus:ring-2 focus:ring-red-200"
              }`}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          {passwordConfirmation && !passwordsMatch && (
            <p className="text-[10px] text-red-500 mt-0.5">Passwords do not match</p>
          )}
        </div>

        {/* ROLE */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">I am registering as...</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "tenant",   Icon: Home, title: "Tenant",   sub: "Find affordable housing" },
              { value: "landlord", Icon: Key,  title: "Property Owner", sub: "List your property" },
            ].map(({ value, Icon, title, sub }) => {
              const active = role === value;
              return (
                <button key={value} type="button" onClick={() => setRole(value)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left"
                  style={{ borderColor: active ? "#3d6b35" : "#e5e7eb", background: active ? "#3d6b35" : "white" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: active ? "rgba(255,255,255,0.2)" : "#f0fdf4" }}>
                    <Icon size={15} color={active ? "white" : "#3d6b35"} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold" style={{ color: active ? "white" : "#111827" }}>{title}</p>
                    <p className="text-[10px]" style={{ color: active ? "rgba(255,255,255,0.75)" : "#6b7280" }}>{sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONSENTS */}
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Agreements & Consent</p>
          <ConsentCheckbox checked={termsAccepted}       onChange={setTermsAccepted}       label="I agree to the"  linkText="Terms of Service"                      onReadMore={() => { setModalType("terms");       setEulaModalOpen(true); }} />
          <ConsentCheckbox checked={privacyAccepted}     onChange={setPrivacyAccepted}     label="I agree to the"  linkText="Privacy Policy"                        onReadMore={() => { setModalType("privacy");     setEulaModalOpen(true); }} />
          <ConsentCheckbox checked={dataPrivacyAccepted} onChange={setDataPrivacyAccepted} label="I consent to collection and processing of my personal data under the" linkText="Data Privacy Act of 2012 (RA 10173)" onReadMore={() => { setModalType("dataPrivacy"); setEulaModalOpen(true); }} />
          <ConsentCheckbox checked={ageConfirmed}        onChange={setAgeConfirmed}        label="I confirm that I am" linkText="at least 18 years of age"           onReadMore={null} />
        </div>

        {/* SUBMIT */}
        <button type="submit" disabled={loading || !allConsents}
          className="w-full h-[48px] rounded-xl text-white font-bold text-[14px] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{
            background: loading || !allConsents ? "#86a886" : "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)",
            boxShadow:  loading || !allConsents ? "none" : "0 4px 15px rgba(61,107,53,0.35)",
            cursor:     loading || !allConsents ? "not-allowed" : "pointer",
          }}>
          {loading ? <><Loader size={16} className="animate-spin" /> Sending code...</> : "Continue →"}
        </button>
      </form>

      <p className="text-center text-[13px] text-gray-500 mt-3">
        Already have an account?{" "}
        <span onClick={() => navigate("/login", { state: { background } })} className="font-semibold cursor-pointer hover:underline" style={{ color: "#3d6b35" }}>
          Sign in
        </span>
      </p>
    </div>
  );

  const content = step === "otp" ? otpContent : formContent;

  return (
    <>
      <EulaModal open={eulaModalOpen} onClose={() => setEulaModalOpen(false)} modalType={modalType} />

      {/* DESKTOP */}
      <div className="hidden sm:flex fixed inset-0 z-50 items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={handleClose}>
        <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl"
          style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
              <X size={18} className="text-gray-700" />
            </button>
            <span className="text-[14px] font-bold text-gray-800">
              {step === "otp" ? "Verify Email" : "Create account"}
            </span>
            <div className="w-9" />
          </div>
          <div className="overflow-y-auto flex-1">{content}</div>
        </div>
      </div>

      {/* MOBILE */}
      <div className="sm:hidden fixed inset-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
            <X size={20} className="text-gray-700" />
          </button>
          <span className="text-[15px] font-bold text-gray-800">
            {step === "otp" ? "Verify Email" : "Create account"}
          </span>
          <div className="w-9" />
        </div>
        <div className="flex-1 overflow-y-auto">{content}</div>
      </div>
    </>
  );
}

function ConsentCheckbox({ checked, onChange, label, linkText, onReadMore }) {
  return (
    <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 mt-1 rounded accent-[#3d6b35] cursor-pointer shrink-0" />
      <div className="flex-1 text-[12px] text-gray-700 leading-relaxed">
        {label}{" "}
        {onReadMore ? (
          <button type="button" onClick={(e) => { e.preventDefault(); onReadMore(); }} className="font-semibold text-[#3d6b35] hover:underline inline-flex items-center gap-1">
            {linkText} <FileText size={12} className="opacity-60" />
          </button>
        ) : (
          <span className="font-semibold text-[#3d6b35]">{linkText}</span>
        )}
      </div>
      {checked && <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" strokeWidth={2.5} />}
    </label>
  );
}