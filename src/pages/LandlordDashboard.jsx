// FILE: src/pages/LandlordDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, Building, Calendar, RefreshCw,
  Wallet, MessageCircle, FileCheck, Clock,
  ArrowRight, CheckCircle2, LogIn, Home, TrendingUp, TrendingDown, Wrench,
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

// delta = month-over-month % change — Client 2 specifically asked for this comparison
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

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [widgets, setWidgets] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWidgets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/landlord/dashboard-widgets`, {
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
              {timeGreeting()}, {user?.first_name || "there"}!
            </p>
            <h1 className="text-white text-[28px] font-bold mt-1 flex items-center gap-2.5">
              <LayoutDashboard size={26} className="text-white/90" /> Dashboard
            </h1>
            <p className="text-white/60 text-[13px] mt-1">Here's what's happening with your properties today.</p>
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

        {/* ── QUICK STATS ── matches Client 2's exact spec: Active Listings | Occupancy Rate |
             Reservation Volume | Revenue (+ month-over-month comparison), plus Upcoming Check-ins
             which both respondents separately named as a top-4 number they check first. ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : widgets && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <QuickStatCard icon={Building} label="Active Listings" value={widgets.stats.active_listings}
              color="#3d6b35" onClick={() => navigate("/landlord/listings")} />
            <QuickStatCard icon={Home} label="Occupancy Rate"
              value={widgets.stats.occupancy_rate === null ? "—" : `${widgets.stats.occupancy_rate}%`}
              sublabel={widgets.stats.occupancy_rate === null ? "No listings yet" : "of your listings"}
              color="#0891b2" />
            <QuickStatCard icon={Calendar} label="Reservation Volume" value={widgets.stats.reservations_this_month}
              delta={widgets.stats.reservations_change_pct} sublabel="this month"
              color="#d97706" onClick={() => navigate("/landlord/reservations")} />
            <QuickStatCard icon={Wallet} label="Revenue This Month" value={formatPeso(widgets.stats.revenue_this_month)}
              delta={widgets.stats.revenue_change_pct} color="#7c3aed" onClick={() => navigate("/landlord/data-analytics")} />
            <QuickStatCard icon={LogIn} label="Upcoming Move-ins" value={widgets.stats.upcoming_checkins}
              sublabel="next 14 days" color="#2563eb" onClick={() => navigate("/landlord/reservations")} />
          </div>
        )}

        {/* ── TASK TRACKER + ACTIVITY FEED — both directly validated by both interview respondents ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div>
            <SectionHeader title="Needs Your Attention" />
            <div className="mt-3">
              <Card>
                {loading ? (
                  <div className="space-y-3 py-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : !widgets || (widgets.tasks.pending_reservations === 0 && widgets.tasks.pending_listing_approvals === 0 && widgets.tasks.unread_messages === 0 && widgets.tasks.pending_maintenance === 0) ? (
                  <div className="text-center py-8">
                    <CheckCircle2 size={28} className="text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">All caught up — nothing pending.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {widgets.tasks.pending_reservations > 0 && (
                      <button onClick={() => navigate("/landlord/reservations")}
                        className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 transition text-left -mx-4 px-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                          <Calendar size={14} className="text-amber-600" />
                        </div>
                        <p className="flex-1 text-[13px] text-gray-700">
                          <span className="font-bold">{widgets.tasks.pending_reservations}</span> reservation{widgets.tasks.pending_reservations !== 1 ? "s" : ""} awaiting your review
                        </p>
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                      </button>
                    )}
                    {widgets.tasks.pending_listing_approvals > 0 && (
                      <button onClick={() => navigate("/landlord/listings")}
                        className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 transition text-left -mx-4 px-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <FileCheck size={14} className="text-blue-600" />
                        </div>
                        <p className="flex-1 text-[13px] text-gray-700">
                          <span className="font-bold">{widgets.tasks.pending_listing_approvals}</span> listing{widgets.tasks.pending_listing_approvals !== 1 ? "s" : ""} awaiting admin approval
                        </p>
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                      </button>
                    )}
                    {widgets.tasks.unread_messages > 0 && (
                      <button onClick={() => navigate("/landlord/messages")}
                        className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 transition text-left -mx-4 px-4">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                          <MessageCircle size={14} className="text-purple-600" />
                        </div>
                        <p className="flex-1 text-[13px] text-gray-700">
                          <span className="font-bold">{widgets.tasks.unread_messages}</span> unread message{widgets.tasks.unread_messages !== 1 ? "s" : ""} from tenants
                        </p>
                        <ArrowRight size={14} className="text-gray-300 shrink-0" />
                      </button>
                    )}
                    {widgets.tasks.pending_maintenance > 0 && (
                      <button onClick={() => navigate("/landlord/maintenance")}
                        className="w-full flex items-center gap-3 py-3 hover:bg-gray-50 transition text-left -mx-4 px-4">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                          <Wrench size={14} className="text-red-600" />
                        </div>
                        <p className="flex-1 text-[13px] text-gray-700">
                          <span className="font-bold">{widgets.tasks.pending_maintenance}</span> maintenance request{widgets.tasks.pending_maintenance !== 1 ? "s" : ""} open
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
            <SectionHeader title="Recent Activity" />
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
                    {widgets.activity_feed.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 py-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          item.type === "reservation" ? "bg-amber-50" : "bg-purple-50"
                        }`}>
                          {item.type === "reservation"
                            ? <Calendar size={14} className="text-amber-600" />
                            : <MessageCircle size={14} className="text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-gray-700 leading-snug">{item.message}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock size={10} className="text-gray-300" />
                            <p className="text-[11px] text-gray-400">{timeAgo(item.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
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