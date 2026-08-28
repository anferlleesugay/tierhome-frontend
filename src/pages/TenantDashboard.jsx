// FILE: src/pages/TenantDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, RefreshCw, Heart, Calendar, MessageCircle,
  Calculator, MapPin, Home, ArrowRight, ChevronRight,
  Clock, AlertCircle, ShieldAlert, BadgeCheck, User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;

const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 0 });

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function SectionHeader({ title }) {
  return <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2">{title}</p>;
}

function Card({ children }) {
  return <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm h-full">{children}</div>;
}

function QuickStatCard({ icon: Icon, label, value, sublabel, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl p-5 text-left w-full h-full transition hover:brightness-105 active:scale-[0.98]"
      style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon size={18} className="text-white" />
        </div>
        {onClick && <ArrowRight size={16} className="text-white/70" />}
      </div>
      <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wide">{label}</p>
      <p className="text-[26px] font-bold text-white leading-tight">{value}</p>
      {sublabel && <p className="text-[11px] text-white/70 mt-0.5">{sublabel}</p>}
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
  const { user, token, isVerified } = useAuth();

  const [stats, setStats] = useState({ saved: 0, reservations: 0, conversations: 0, ranking: null });
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    if (!token) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      axios.get(`${API}/saved`, { headers }),
      axios.get(`${API}/reservations`, { headers }),
      axios.get(`${API}/conversations`, { headers }),
      axios.get(`${API}/my-ranking`, { headers }),
    ]).then(([saved, reservations, conversations, ranking]) => {
      const savedData = saved.value?.data?.data || [];
      const resData    = reservations.value?.data?.data || [];
      const convData   = conversations.value?.data?.data || [];
      setStats({
        saved:         Array.isArray(savedData) ? savedData.length : 0,
        reservations:  Array.isArray(resData)   ? resData.length   : 0,
        conversations: Array.isArray(convData)  ? convData.length  : 0,
        ranking:       ranking.value?.data?.data ?? null,
      });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, [token]);

  const verStatus = user?.verification_status || "unverified";

  return (
    <div className="min-h-full bg-[#f5f7f5] pb-16 w-full">
      {/* HERO BANNER */}
      <div
        className="w-full px-6 md:px-10 py-8"
        style={{ background: "linear-gradient(135deg, #3d6b35 0%, #2d5a27 55%, #1c3818 100%)" }}
      >
        <div className="w-full flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-[13px] font-medium">
              {timeGreeting()}, {user?.first_name || "there"}!
            </p>
            <h1 className="text-white text-[28px] font-bold mt-1 flex items-center gap-2.5">
              <LayoutDashboard size={26} className="text-white/90" /> Dashboard
            </h1>
            <p className="text-white/60 text-[13px] mt-1 flex items-center gap-1.5">
              {isVerified ? (
                <><BadgeCheck size={14} /> Verified Tenant</>
              ) : (
                <><Clock size={14} /> {verStatus === "pending" ? "Pending Verification" : "Unverified"}</>
              )}
            </p>
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition text-white text-sm font-semibold"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-6">

        {/* VERIFICATION BANNER */}
        <VerificationBanner status={verStatus} navigate={navigate} />

        {/* ── QUICK STATS ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <QuickStatCard icon={Heart} label="Saved Listings" value={stats.saved}
              color="#ef4444" onClick={() => navigate("/tenant/saved")} />
            <QuickStatCard icon={Calendar} label="Reservations" value={stats.reservations}
              color="#3d6b35" onClick={() => navigate("/tenant/reservations")} />
            <QuickStatCard icon={MessageCircle} label="Conversations" value={stats.conversations}
              color="#2563eb" onClick={() => navigate("/tenant/messages")} />
          </div>
        )}

        {/* ── ACCOUNT INFO + AFFORDABILITY RANKING ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <SectionHeader title="Account Info" />
            <div className="mt-3">
              <Card>
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
              </Card>
            </div>
          </div>

          <div>
            <SectionHeader title="Last Affordability Ranking" />
            <div className="mt-3">
              <Card>
                {stats.ranking ? (
                  <>
                    <div className="flex items-center justify-end mb-3">
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
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-4">
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
              </Card>
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <SectionHeader title="Quick Actions" />
        <Card>
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
        </Card>
      </div>
    </div>
  );
}