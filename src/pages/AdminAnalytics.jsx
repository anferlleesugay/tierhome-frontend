// FILE: src/pages/AdminAnalytics.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart2, Users, Building, BadgeCheck,
  MessageCircle, Calendar, TrendingUp, RefreshCw,
  CheckCircle, XCircle, Clock, Activity, Shield, Sparkles, Search, MapPin,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
const STORAGE = `${import.meta.env.VITE_API_URL.replace("/api", "")}/storage/`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH");

function MetricCard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + "18" }}
        >
          <Icon size={17} color={color} />
        </div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[26px] font-bold text-gray-800">{value}</p>
      {sublabel && <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2">{title}</p>
  );
}

// ✅ Builds chart data with N forecast points appended, bridging the line at the last real point
function buildForecastChartData(historicalMonths, forecastArray, valueLabel) {
  const base = historicalMonths.map((d) => ({ month: d.month, [valueLabel]: d.count }));
  if (!forecastArray || forecastArray.length === 0) return base;

  const forecastPoints = forecastArray.map((val, i) => ({
    month: `+${i + 1}mo`,
    Forecast: val,
  }));

  const combined = [...base, ...forecastPoints];
  // Bridge: last real point also gets a Forecast value so the dashed line connects visually
  if (base.length > 0) {
    combined[base.length - 1].Forecast = base[base.length - 1][valueLabel];
  }
  return combined;
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [data, setData] = useState({
    pending_verifications: [],
    pending_listings: [],
    verified_faces: [],
    conversations: [],
  });
  const [loading, setLoading] = useState(true);

  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [verRes, lstRes, facesRes, convRes] = await Promise.allSettled([
        axios.get(`${API}/admin/verify/pending`, { headers }),
        axios.get(`${API}/admin/listings/pending`, { headers }),
        axios.get(`${API}/admin/verify/faces/verified`, { headers }),
        axios.get(`${API}/conversations`, { headers }),
      ]);

      setData({
        pending_verifications: verRes.value?.data?.data?.data || [],
        pending_listings: lstRes.value?.data?.data?.data || [],
        verified_faces: facesRes.value?.data?.data || [],
        conversations: convRes.value?.data?.data || [],
      });
    } catch {
      // partial data still shown
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    setTrendLoading(true);
    try {
      const res = await axios.get(`${API}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTrendData(res.data?.data || null);
    } catch {
      setTrendData(null);
    } finally {
      setTrendLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAll();
      fetchTrends();
    }
  }, [token]);

  const totalVerified = data.verified_faces.length;
  const pendingVer = data.pending_verifications.length;
  const pendingLst = data.pending_listings.length;
  const totalConv = data.conversations.length;

  const highConf = data.pending_verifications.filter((v) => v.similarity_score >= 90).length;
  const midConf = data.pending_verifications.filter((v) => v.similarity_score >= 70 && v.similarity_score < 90).length;
  const lowConf = data.pending_verifications.filter((v) => v.similarity_score < 70).length;

  const prices = data.pending_listings.map((l) => Number(l.price)).filter(Boolean);
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  // ✅ Demand (search activity) chart with 3-month forecast
  const demandChartData = trendData
    ? buildForecastChartData(
        trendData.searches_by_month || [],
        trendData.forecast?.demand_next_3_months || [],
        "Tenant Demand"
      )
    : [];

  // ✅ Reservations chart with 3-month forecast
  const reservationChartData = trendData
    ? buildForecastChartData(
        trendData.reservations_by_month || [],
        trendData.forecast?.reservations_next_3_months || [],
        "Reservations"
      )
    : [];

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-28">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 size={20} color="#3d6b35" /> Analytics & Audit
          </h1>
          <button
            onClick={() => { fetchAll(); fetchTrends(); }}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400"
          >
            <RefreshCw size={16} className={(loading || trendLoading) ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-4">

        {/* PLATFORM SUMMARY */}
        {trendData?.summary && (
          <>
            <SectionHeader title="Platform Summary" />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={Users} label="Total Users" value={trendData.summary.total_users} color="#3d6b35"
                sublabel={`${trendData.summary.total_tenants} tenants · ${trendData.summary.total_landlords} landlords`} />
              <MetricCard icon={Building} label="Total Listings" value={trendData.summary.total_listings} color="#2563eb"
                sublabel={`${trendData.summary.verified_listings} verified`} />
              <MetricCard icon={Search} label="Total Searches" value={trendData.summary.total_searches} color="#d97706"
                sublabel="tenant interest signals" />
              <MetricCard icon={Calendar} label="Total Reservations" value={trendData.summary.total_reservations} color="#7c3aed"
                sublabel={`${trendData.summary.pending_reservations} pending`} />
            </div>
          </>
        )}

        {/* ✅ TENANT DEMAND (search activity) + 3-MONTH FORECAST — this answers "when will tenants be looking to rent" */}
        <SectionHeader title="Tenant Demand — Search Activity (3-Month Forecast)" />
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          {trendLoading ? (
            <div className="h-52 bg-gray-50 rounded-xl animate-pulse" />
          ) : demandChartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No search activity logged yet.</p>
          ) : (
            <>
              <p className="text-[11px] text-gray-400 mb-2">
                Based on tenant searches, filters, and affordability checks — not just completed reservations.
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={demandChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Tenant Demand" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Forecast" stroke="#3d6b35" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>

              {trendData?.forecast?.insight && (
                <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-xl flex gap-2.5">
                  <Sparkles size={16} className="text-[#3d6b35] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-[#3d6b35] uppercase tracking-wide mb-1">AI Insight</p>
                    <p className="text-[12px] text-gray-700 leading-relaxed">{trendData.forecast.insight}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RESERVATIONS TREND */}
        <SectionHeader title="Reservation Volume (3-Month Forecast)" />
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          {reservationChartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No reservation data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={reservationChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Reservations" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Forecast" stroke="#7c3aed" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ✅ TOP SEARCHED BARANGAYS */}
        {trendData?.top_barangays?.length > 0 && (
          <>
            <SectionHeader title="Most-Searched Barangays" />
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {trendData.top_barangays.map((b, i) => (
                  <div key={b.barangay} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center shrink-0 text-[11px] font-bold text-amber-600">
                      {i + 1}
                    </div>
                    <MapPin size={14} className="text-gray-400 shrink-0" />
                    <p className="flex-1 text-[13px] font-semibold text-gray-700">{b.barangay}</p>
                    <p className="text-[12px] font-bold text-[#3d6b35]">{b.count} searches</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* USER GROWTH */}
        {trendData?.users_by_month && (
          <>
            <SectionHeader title="New User Registrations" />
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={trendData.users_by_month} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" name="New Users" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <>
            <SectionHeader title="Moderation Overview" />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={BadgeCheck} label="Verified Users" value={totalVerified} color="#3d6b35" sublabel="in Face Collection" />
              <MetricCard icon={Clock} label="Pending Verifications" value={pendingVer} color="#d97706" sublabel="awaiting review" />
              <MetricCard icon={Building} label="Pending Listings" value={pendingLst} color="#2563eb" sublabel="awaiting approval" />
              <MetricCard icon={MessageCircle} label="Conversations" value={totalConv} color="#7c3aed" sublabel="active threads" />
            </div>

            <SectionHeader title="Verification Confidence Distribution" />
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              {pendingVer === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No pending verifications to analyze.</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "High Confidence (≥90%)", count: highConf, color: "#3d6b35", icon: CheckCircle },
                    { label: "Medium Confidence (70–89%)", count: midConf, color: "#d97706", icon: Clock },
                    { label: "Low Confidence (<70%)", count: lowConf, color: "#ef4444", icon: XCircle },
                  ].map(({ label, count, color, icon: Icon }) => {
                    const pct = pendingVer > 0 ? Math.round((count / pendingVer) * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon size={13} color={color} />
                            <span className="text-[12px] font-semibold text-gray-600">{label}</span>
                          </div>
                          <span className="text-[12px] font-bold" style={{ color }}>{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <SectionHeader title="Pending Listing Price Stats" />
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              {prices.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No pending listings to analyze.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Average Rent", val: avgPrice, color: "#3d6b35" },
                    { label: "Lowest Rent", val: minPrice, color: "#2563eb" },
                    { label: "Highest Rent", val: maxPrice, color: "#7c3aed" },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="text-center bg-[#f5f7f5] rounded-xl p-3">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{label}</p>
                      <p className="text-[14px] font-bold" style={{ color }}>{formatPeso(val)}</p>
                      <p className="text-[9px] text-gray-400">/month</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {data.pending_verifications.length > 0 && (
              <>
                <SectionHeader title="Verification Queue Log" />
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-gray-50">
                    {data.pending_verifications.slice(0, 8).map((item) => {
                      const u = item.user || {};
                      const score = item.similarity_score || 0;
                      const scoreColor = score >= 90 ? "#3d6b35" : score >= 70 ? "#d97706" : "#ef4444";
                      return (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                            style={{ background: scoreColor + "15", color: scoreColor }}
                          >
                            {u.first_name?.[0]}{u.last_name?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-gray-800 truncate">
                              {u.first_name} {u.last_name}
                            </p>
                            <p className="text-[10px] text-gray-400 capitalize">
                              {u.role} · {formatDate(item.created_at)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[13px] font-bold" style={{ color: scoreColor }}>
                              {Math.round(score)}%
                            </p>
                            <p className="text-[9px] text-gray-400">similarity</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {data.conversations.length > 0 && (
              <>
                <SectionHeader title="Recent Conversations" />
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="divide-y divide-gray-50">
                    {data.conversations.slice(0, 6).map((conv) => {
                      const tenant = conv.tenant || {};
                      const landlord = conv.landlord || {};
                      const lastMsg = conv.messages?.[0];
                      return (
                        <div key={conv.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                            <MessageCircle size={14} color="#2563eb" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-gray-800 truncate">
                              {tenant.first_name} {tenant.last_name}
                              <span className="text-gray-400 font-normal"> → </span>
                              {landlord.first_name} {landlord.last_name}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {lastMsg?.message || "No messages"} · {formatDate(conv.updated_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <SectionHeader title="Security Config" />
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Shield size={16} color="#3d6b35" />
                <p className="text-[13px] font-bold text-gray-800">AWS Rekognition — Face Collections</p>
              </div>
              <div className="space-y-2 text-[12px] text-gray-600">
                <div className="flex justify-between"><span className="text-gray-400">Collection</span><span className="font-semibold">tierhome-users</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Region</span><span className="font-semibold">ap-southeast-1 (Singapore)</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Similarity Threshold</span><span className="font-semibold">≥ 90%</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Face Model</span><span className="font-semibold">v7.0 (latest)</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Indexed Faces</span><span className="font-semibold text-[#3d6b35]">{totalVerified}</span></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}