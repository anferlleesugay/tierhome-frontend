// FILE: src/pages/TenantDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User, BadgeCheck, AlertCircle, Clock,
  Heart, Calculator, MapPin, MessageCircle,
  Calendar, ChevronRight, RefreshCw, LogOut,
  ShieldAlert, Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
const STORAGE = `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/`;

const formatPeso = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 0 });

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left w-full h-full"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + "18" }}
      >
        <Icon size={20} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-[20px] font-bold text-gray-800 leading-tight">{value}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </button>
  );
}

function VerificationBanner({ status, navigate }) {
  if (status === "verified") return null;

  const config = {
    pending: {
      bg: "bg-amber-50 border-amber-200",
      icon: <Clock size={18} className="text-amber-600 shrink-0" />,
      text: "Your identity verification is pending review.",
      btn: null,
    },
    unverified: {
      bg: "bg-blue-50 border-blue-200",
      icon: <ShieldAlert size={18} className="text-blue-600 shrink-0" />,
      text: "Complete identity verification to unlock all features.",
      btn: { label: "Verify Now", action: () => navigate("/verify") },
    },
    rejected: {
      bg: "bg-red-50 border-red-200",
      icon: <AlertCircle size={18} className="text-red-600 shrink-0" />,
      text: "Your verification was rejected. Please re-submit.",
      btn: { label: "Re-submit", action: () => navigate("/verify") },
    },
  };

  const c = config[status] || config.unverified;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${c.bg}`}>
      {c.icon}
      <p className="text-sm text-gray-700 flex-1">{c.text}</p>
      {c.btn && (
        <button
          onClick={c.btn.action}
          className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shrink-0"
        >
          {c.btn.label}
        </button>
      )}
    </div>
  );
}

export default function TenantDashboard() {
  const navigate = useNavigate();
  const { user, token, logout, isVerified } = useAuth();

  const [stats, setStats] = useState({ saved: 0, reservations: 0, conversations: 0, ranking: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      axios.get(`${API}/saved`, { headers }),
      axios.get(`${API}/reservations`, { headers }),
      axios.get(`${API}/conversations`, { headers }),
      axios.get(`${API}/my-ranking`, { headers }),
    ]).then(([saved, reservations, conversations, ranking]) => {
      const savedData  = saved.value?.data?.data || [];
      const resData    = reservations.value?.data?.data || [];
      const convData   = conversations.value?.data?.data || [];
      setStats({
        saved:         Array.isArray(savedData) ? savedData.length : 0,
        reservations:  Array.isArray(resData)   ? resData.length   : 0,
        conversations: Array.isArray(convData)  ? convData.length  : 0,
        ranking:       ranking.value?.data?.data ?? null,
      });
    }).finally(() => setLoading(false));
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const verStatus = user?.verification_status || "unverified";

  const avatarUrl = user?.profile_picture
    ? STORAGE + user.profile_picture
    : null;

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean).join("").toUpperCase() || "T";

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-28 w-full">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 pt-6 pb-5">
        <div className="w-full flex items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#3d6b35]/10 flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-[#3d6b35]">{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-gray-400 font-medium">Welcome back,</p>
            <h1 className="text-[20px] font-bold text-gray-900 truncate">
              {user?.first_name} {user?.last_name}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600">
                  <BadgeCheck size={13} /> Verified Tenant
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                  <Clock size={13} /> {verStatus === "pending" ? "Pending Verification" : "Unverified"}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition shrink-0"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-4">
        {/* VERIFICATION BANNER — full width */}
        <VerificationBanner status={verStatus} navigate={navigate} />

        {/* STATS GRID — horizontal on tablet+ instead of stacked */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[68px] bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              icon={Heart}
              label="Saved Listings"
              value={stats.saved}
              color="#ef4444"
              onClick={() => navigate("/tenant/saved")}
            />
            <StatCard
              icon={Calendar}
              label="Reservations"
              value={stats.reservations}
              color="#3d6b35"
              onClick={() => navigate("/tenant/reservations")}
            />
            <StatCard
              icon={MessageCircle}
              label="Conversations"
              value={stats.conversations}
              color="#2563eb"
              onClick={() => navigate("/tenant/messages")}
            />
          </div>
        )}

        {/* SECOND ROW — Account Info + Ranking, side by side on desktop */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* ACCOUNT INFO */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm h-full">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Account Info</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <User size={15} className="text-gray-400 shrink-0" />
                <span className="text-[13px] text-gray-600">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Home size={15} className="text-gray-400 shrink-0" />
                <span className="text-[13px] text-gray-600 capitalize">Role: {user?.role}</span>
              </div>
              {user?.phone_number && (
                <div className="flex items-center gap-3">
                  <MapPin size={15} className="text-gray-400 shrink-0" />
                  <span className="text-[13px] text-gray-600">{user.phone_number}</span>
                </div>
              )}
            </div>
          </div>

          {/* RANKING SUMMARY */}
          {stats.ranking ? (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm h-full">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                  Last Affordability Ranking
                </p>
                <button
                  onClick={() => navigate("/tenant/ranking")}
                  className="text-[11px] font-semibold text-[#3d6b35] flex items-center gap-1"
                >
                  Recalculate <ChevronRight size={12} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Gross Income", val: stats.ranking.gross_income },
                  { label: "Disposable", val: stats.ranking.disposable_income },
                  { label: "Max Rent (30%)", val: stats.ranking.recommended_max_rent },
                  { label: "Savings", val: stats.ranking.available_savings },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-[#f5f7f5] rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                    <p className="text-[15px] font-bold text-gray-800">{formatPeso(val)}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm h-full flex flex-col items-center justify-center text-center">
              <Calculator size={24} className="text-gray-300 mb-2" />
              <p className="text-[12px] text-gray-400 mb-2">No affordability ranking yet.</p>
              <button
                onClick={() => navigate("/tenant/ranking")}
                className="text-[11px] font-semibold text-[#3d6b35] flex items-center gap-1"
              >
                Calculate now <ChevronRight size={12} />
              </button>
            </div>
          )}
        </div>

        {/* QUICK ACTIONS — 4 across on desktop */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Browse Listings", icon: Home, path: "/browse", color: "#3d6b35" },
              { label: "Affordability Rank", icon: Calculator, path: "/tenant/ranking", color: "#7c3aed" },
              { label: "Map Search", icon: MapPin, path: "/tenant/map", color: "#2563eb" },
              { label: "Verify Identity", icon: BadgeCheck, path: "/verify", color: "#d97706", hide: isVerified },
            ]
              .filter((a) => !a.hide)
              .map(({ label, icon: Icon, path, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:bg-[#f5f7f5] transition text-left"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: color + "18" }}
                  >
                    <Icon size={16} color={color} />
                  </div>
                  <span className="text-[12px] font-semibold text-gray-700">{label}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}