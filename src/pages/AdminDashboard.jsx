// FILE: src/pages/AdminDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, Users, Building, Calendar, RefreshCw,
  Wallet, BadgeCheck, FileCheck, Star, UserX, Clock,
  ArrowRight, CheckCircle2, TrendingUp, TrendingDown, ScrollText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH");

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function SectionHeader({ title }) {
  return <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2">{title}</p>;
}

function Card({ children }) {
  return <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm h-full">{children}</div>;
}

// delta = month-over-month % change — Client 2 (Q16) specifically asked for this comparison
// on the platform-operator's "healthy at a glance" numbers
function QuickStatCard({ icon: Icon, label, value, sublabel, delta, color, onClick }) {
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
      <div className="flex items-center gap-2 mt-0.5 h-4">
        {sublabel && <p className="text-[11px] text-white/70">{sublabel}</p>}
        {delta !== null && delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${delta >= 0 ? "text-green-200" : "text-red-200"}`}>
            {delta >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(delta)}% vs last month
          </span>
        )}
      </div>
    </button>
  );
}

const ACTIVITY_ICON = {
  user:          { icon: Users,      bg: "bg-blue-50",   color: "text-blue-600" },
  listing:       { icon: Building,   bg: "bg-amber-50",  color: "text-amber-600" },
  reservation:   { icon: Calendar,   bg: "bg-green-50",  color: "text-green-600" },
  admin_action:  { icon: ScrollText, bg: "bg-purple-50", color: "text-purple-600" },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [widgets, setWidgets] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWidgets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/dashboard-widgets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWidgets(res.data?.data || null);
    } catch {
      setWidgets(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchWidgets(); }, [token]);

  const hasTasks = widgets && (
    widgets.tasks.pending_verifications > 0 ||
    widgets.tasks.pending_listing_approvals > 0 ||
    widgets.tasks.pending_amenity_requests > 0 ||
    widgets.tasks.pending_deactivation_requests > 0
  );

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-16 w-full">
      {/* HERO BANNER */}
      <div
        className="w-full px-6 md:px-10 py-8"
        style={{ background: "linear-gradient(135deg, #3d6b35 0%, #2d5a27 55%, #1c3818 100%)" }}
      >
        <div className="w-full flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-white/70 text-[13px] font-medium">
              {timeGreeting()}, {user?.first_name || "Admin"}!
            </p>
            <h1 className="text-white text-[28px] font-bold mt-1 flex items-center gap-2.5">
              <LayoutDashboard size={26} className="text-white/90" /> Dashboard
            </h1>
            <p className="text-white/60 text-[13px] mt-1">Here's what's happening across the platform today.</p>
          </div>
          <button
            onClick={fetchWidgets}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition text-white text-sm font-semibold"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-6">

        {/* ── QUICK STATS ── matches Client 2's exact spec (Q16) for the platform administrator's
             "healthy at a glance" numbers: Active Users | Active Listings | Reservations | Platform
             Revenue, with month-over-month comparison. ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : widgets && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickStatCard icon={Users} label="Active Users" value={widgets.stats.active_users}
              color="#3d6b35" onClick={() => navigate("/admin/users")} />
            <QuickStatCard icon={Building} label="Active Listings" value={widgets.stats.active_listings}
              color="#0891b2" onClick={() => navigate("/admin/listings-summary")} />
            <QuickStatCard icon={Calendar} label="Reservations" value={widgets.stats.reservations_this_month}
              delta={widgets.stats.reservations_change_pct} sublabel="this month"
              color="#d97706" />
            <QuickStatCard icon={Wallet} label="Platform Revenue" value={formatPeso(widgets.stats.revenue_this_month)}
              delta={widgets.stats.revenue_change_pct} sublabel="this month"
              color="#7c3aed" onClick={() => navigate("/admin/revenue-by-owner")} />
          </div>
        )}

        {/* ── TASK TRACKER + ACTIVITY FEED — same pattern validated by both interview
             respondents for the Property Owner dashboard, applied platform-wide here ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <SectionHeader title="Needs Your Attention" />
            <div className="mt-3">
              <Card>
                {loading ? (
                  <div className="space-y-3 py-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : !hasTasks ? (
                  <div className="text-center py-8">
                    <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">All caught up — nothing pending.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {widgets.tasks.pending_verifications > 0 && (
                      <button onClick={() => navigate("/admin/verification")}
                        className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 transition text-left -mx-4 px-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                          <BadgeCheck size={14} className="text-amber-600" />
                        </div>
                        <p className="flex-1 text-[13px] text-gray-700">
                          <span className="font-bold">{widgets.tasks.pending_verifications}</span> identity verification{widgets.tasks.pending_verifications !== 1 ? "s" : ""} awaiting review
                        </p>
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                      </button>
                    )}
                    {widgets.tasks.pending_listing_approvals > 0 && (
                      <button onClick={() => navigate("/admin/listings")}
                        className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 transition text-left -mx-4 px-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <FileCheck size={14} className="text-blue-600" />
                        </div>
                        <p className="flex-1 text-[13px] text-gray-700">
                          <span className="font-bold">{widgets.tasks.pending_listing_approvals}</span> listing{widgets.tasks.pending_listing_approvals !== 1 ? "s" : ""} awaiting approval
                        </p>
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                      </button>
                    )}
                    {widgets.tasks.pending_amenity_requests > 0 && (
                      <button onClick={() => navigate("/admin/amenities")}
                        className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 transition text-left -mx-4 px-4">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <Star size={14} className="text-green-600" />
                        </div>
                        <p className="flex-1 text-[13px] text-gray-700">
                          <span className="font-bold">{widgets.tasks.pending_amenity_requests}</span> amenity request{widgets.tasks.pending_amenity_requests !== 1 ? "s" : ""} pending
                        </p>
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                      </button>
                    )}
                    {widgets.tasks.pending_deactivation_requests > 0 && (
                      <button onClick={() => navigate("/admin/deactivation-requests")}
                        className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 transition text-left -mx-4 px-4">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <UserX size={14} className="text-red-600" />
                        </div>
                        <p className="flex-1 text-[13px] text-gray-700">
                          <span className="font-bold">{widgets.tasks.pending_deactivation_requests}</span> deactivation request{widgets.tasks.pending_deactivation_requests !== 1 ? "s" : ""} awaiting decision
                        </p>
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                      </button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>

          <div>
            <SectionHeader title="Platform Activity" />
            <div className="mt-3">
              <Card>
                {loading ? (
                  <div className="space-y-3 py-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : !widgets || widgets.activity_feed.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No recent activity yet.</p>
                ) : (
                  <div className="divide-y divide-gray-50 max-h-[280px] overflow-y-auto">
                    {widgets.activity_feed.map((item, i) => {
                      const cfg = ACTIVITY_ICON[item.type] || ACTIVITY_ICON.admin_action;
                      const ItemIcon = cfg.icon;
                      return (
                        <div key={i} className="flex items-start gap-3 py-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
                            <ItemIcon size={14} className={cfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-gray-700 leading-snug">{item.message}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Clock size={10} className="text-gray-300" />
                              <p className="text-[11px] text-gray-400">{timeAgo(item.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}