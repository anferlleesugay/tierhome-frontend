// FILE: src/pages/ResetPassword.jsx

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader } from "lucide-react";
import logo from "../assets/logo.png";

const API = import.meta.env.VITE_API_URL;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password,             setPassword]             = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPass,             setShowPass]             = useState(false);
  const [showConfirm,          setShowConfirm]          = useState(false);
  const [loading,              setLoading]              = useState(false);
  const [error,                setError]                = useState("");
  const [done,                 setDone]                 = useState(false);

  const passwordsMatch = password === passwordConfirmation && passwordConfirmation !== "";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordsMatch) { setError("Passwords do not match"); return; }
    if (!token || !email) { setError("Invalid reset link. Please request a new one."); return; }

    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-12 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="bg-[#3d6b35] px-8 py-6 text-center">
          <img src={logo} alt="TierHome" className="h-10 w-auto object-contain mx-auto mb-1 brightness-0 invert" />
          <p className="text-green-200 text-xs">Angeles City · Verified Rentals</p>
        </div>

        <div className="px-8 py-8">
          {!done ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Set New Password</h1>
              <p className="text-sm text-gray-500 mb-6">
                Resetting password for <span className="font-semibold text-gray-700">{email}</span>
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pl-10 pr-10`}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-1.5">
                      <div className="flex gap-1">
                        {[1,2,3,4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${strength >= i ? strengthColors[strength] : "bg-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">Strength: <span className="font-semibold">{strengthText[strength]}</span></p>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      required
                      placeholder="Re-enter new password"
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className={`w-full h-12 bg-gray-50 rounded-xl text-sm text-gray-800 outline-none transition-all pl-10 pr-10 border focus:bg-white ${
                        passwordConfirmation === "" ? "border-gray-200 focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10"
                        : passwordsMatch ? "border-green-500 focus:ring-2 focus:ring-green-200"
                        : "border-red-400 focus:ring-2 focus:ring-red-200"
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {passwordConfirmation && !passwordsMatch && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !passwordsMatch}
                  className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{
                    background: loading || !passwordsMatch ? "#86a886" : "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)",
                    boxShadow:  loading || !passwordsMatch ? "none" : "0 4px 15px rgba(61,107,53,0.3)",
                    cursor:     loading || !passwordsMatch ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? <><Loader size={16} className="animate-spin" /> Resetting...</> : "Reset Password"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-[#3d6b35]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full h-12 rounded-xl text-white font-bold text-sm transition-all"
                style={{ background: "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)" }}
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}