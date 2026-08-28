// FILE: src/pages/ForgotPassword.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader } from "lucide-react";
import logo from "../assets/logo.png";

const API = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header */}
        <div className="bg-[#3d6b35] px-8 py-6 text-center">
          <img src={logo} alt="TierHome" className="h-10 w-auto object-contain mx-auto mb-1 brightness-0 invert" />
          <p className="text-green-200 text-xs">Angeles City · Verified Rentals</p>
        </div>

        <div className="px-8 py-8">
          {!sent ? (
            <>
              <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
                <ArrowLeft size={16} /> Back to login
              </button>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password</h1>
              <p className="text-sm text-gray-500 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="juan@example.com"
                      className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{
                    background: loading ? "#86a886" : "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)",
                    boxShadow:  loading ? "none" : "0 4px 15px rgba(61,107,53,0.3)",
                    cursor:     loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? <><Loader size={16} className="animate-spin" /> Sending...</> : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-[#3d6b35]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email!</h2>
              <p className="text-sm text-gray-500 mb-1">
                We sent a password reset link to
              </p>
              <p className="text-sm font-semibold text-[#3d6b35] mb-6">{email}</p>
              <p className="text-xs text-gray-400 mb-6">
                The link expires in 60 minutes. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full h-12 rounded-xl text-white font-bold text-sm transition-all"
                style={{ background: "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)" }}
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}