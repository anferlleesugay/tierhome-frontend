// FILE: src/pages/Login.jsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Mail, Lock, Eye, EyeOff, AlertCircle, X, UserX, CheckCircle, Loader } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const API = import.meta.env.VITE_API_URL;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const background = location.state?.background;
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Deactivation popup — triggered by a failed login OR by the global
  // interceptor redirecting a mid-session user here after a 403.
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [reactivationMsg, setReactivationMsg] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("deactivated") === "1") {
      setShowDeactivated(true);
    }
  }, [location.search]);

  const handleClose = () => {
    navigate(background?.pathname || "/");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setShowDeactivated(false);
    setReactivationMsg(null);
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });
      const token = res.data?.data?.token;
      const user = res.data?.data?.user;
      if (!token || !user) throw new Error("Invalid response");
      login(token, user);
      if (user.role === "admin") {
        navigate("/admin/analytics");
      } else if (user.role === "landlord") {
        user.verification_status === "verified"
          ? navigate("/landlord/analytics")
          : navigate("/verify");
      } else {
        user.verification_status === "verified"
          ? navigate("/browse")
          : navigate("/verify");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.deactivated) {
        setShowDeactivated(true);
      } else {
        const backendMessage = err.response?.data?.message;
        setError(backendMessage || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReactivation = async () => {
    if (!email || !password) return;
    setReactivating(true);
    setReactivationMsg(null);
    try {
      const res = await axios.post(`${API}/auth/request-reactivation`, { email, password });
      setReactivationMsg({ type: "success", text: res.data?.message || "Request sent to our admin team." });
    } catch (err) {
      setReactivationMsg({ type: "error", text: err.response?.data?.message || "Failed to send request." });
    } finally {
      setReactivating(false);
    }
  };

  // =============================================
  // SHARED FORM — not a sub-component
  // =============================================
  const formContent = (
    <div className="px-8 py-6">
      {/* LOGO */}
      <div className="text-center mb-5">
        <img
          src={logo}
          alt="TierHome"
          className="mx-auto h-10 w-auto object-contain mb-2"
        />
        <span
          className="inline-block text-[10px] font-semibold px-3 py-1 rounded-full"
          style={{ background: "#dcfce7", color: "#3d6b35" }}
        >
          Angeles City Housing Platform
        </span>
      </div>

      <h2 className="text-[22px] font-bold text-gray-900 mb-1">
        Welcome back
      </h2>
      <p className="text-[13px] text-gray-500 mb-5">
        Sign in to your TierHome account
      </p>

      {/* DEACTIVATED ACCOUNT PANEL */}
      {showDeactivated && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2.5">
            <UserX size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700">It looks like your account is deactivated</p>
              <p className="text-xs text-red-600 mt-1">
                Please contact support if you believe this is an error, or request reactivation below.
              </p>

              {reactivationMsg ? (
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg mt-3 ${
                  reactivationMsg.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {reactivationMsg.type === "success" ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {reactivationMsg.text}
                </div>
              ) : (
                <>
                  {(!email || !password) && (
                    <p className="text-[11px] text-red-500 mt-2">Enter your email and password above, then tap the button below.</p>
                  )}
                  <button
                    type="button"
                    onClick={handleRequestReactivation}
                    disabled={reactivating || !email || !password}
                    className="mt-2.5 text-xs font-bold px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {reactivating ? <Loader size={13} className="animate-spin" /> : null}
                    {reactivating ? "Sending..." : "Request Reactivation"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && !showDeactivated && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* EMAIL */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              required
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[50px] pl-11 pr-4 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10"
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-[50px] pl-11 pr-12 bg-[#f8fafc] border border-gray-200 rounded-xl text-sm text-gray-800 outline-none transition-all focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <div className="text-right mt-1.5">
            <span
              onClick={() => navigate("/forgot-password")}
              className="text-[12px] font-medium cursor-pointer hover:underline"
              style={{ color: "#3d6b35" }}
            >
              Forgot password?
            </span>
          </div>
        </div>

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[50px] rounded-xl text-white font-bold text-[14px] transition-all active:scale-[0.98]"
          style={{
            background: loading
              ? "#86a886"
              : "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)",
            boxShadow: loading ? "none" : "0 4px 15px rgba(61,107,53,0.35)",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* SOCIAL PROOF */}
      <p className="text-center text-[11px] text-gray-400 mt-4">
        Trusted by tenants and landlords in Angeles City
      </p>
      <div className="flex justify-center gap-3 text-[11px] text-gray-500 font-medium mt-1">
        <span>500+ Listings</span>
        <span>•</span>
        <span>100% Verified</span>
        <span>•</span>
        <span>Free to Use</span>
      </div>

      {/* REGISTER LINK */}
      <div className="border-t border-gray-100 mt-5 pt-4 text-center text-[13px] text-gray-500">
        New to TierHome?{" "}
        <span
          onClick={() =>
            navigate("/register", { state: { background } })
          }
          className="font-semibold cursor-pointer hover:underline"
          style={{ color: "#3d6b35" }}
        >
          Create an account
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP + TABLET — Modal on top of landing page */}
      <div
        className="hidden sm:flex fixed inset-0 z-50 items-center justify-center px-4"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      >
        <div
          className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              <X size={18} className="text-gray-700" />
            </button>
            <span className="text-[14px] font-bold text-gray-800">
              Log in
            </span>
            <div className="w-9" />
          </div>
          {formContent}
        </div>
      </div>

      {/* MOBILE — Full screen */}
      <div className="sm:hidden fixed inset-0 z-50 bg-white flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X size={20} className="text-gray-700" />
          </button>
          <span className="text-[15px] font-bold text-gray-800">Log in</span>
          <div className="w-9" />
        </div>
        <div className="flex-1 overflow-y-auto">{formContent}</div>
      </div>
    </>
  );
}