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
  PieChart, Pie, Cell,
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

const STATUS_COLORS = {
  pending: "#d97706",
  approved: "#3d6b35",
  rejected: "#ef4444",
  cancelled: "#6b7280",
};

function MetricCard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: color + "18" }}
        >
          <Icon size={19} color={color} />
        </div>
        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[30px] font-bold text-gray-800 leading-tight">{value}</p>
      {sublabel && <p className="text-[12px] text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide pt-2">{title}</p>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full ${className}`}>
      {children}
    </div>
  );
}

function buildForecastChartData(historicalMonths, forecastArray, valueLabel) {
  const base = historicalMonths.map((d) => ({ month: d.month, [valueLabel]: d.count }));
  if (!forecastArray || forecastArray.length === 0) return base;

  const forecastPoints = forecastArray.map((val, i) => ({
    month: `+${i + 1}mo`,
    Forecast: val,
  }));

  const combined = [...base, ...forecastPoints];
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

  const demandChartData = trendData
    ? buildForecastChartData(
        trendData.searches_by_month || [],
        trendData.forecast?.demand_next_3_months || [],
        "Tenant Demand"
      )
    : [];

  const reservationChartData = trendData
    ? buildForecastChartData(
        trendData.reservations_by_month || [],
        trendData.forecast?.reservations_next_3_months || [],
        "Reservations"
      )
    : [];

  const statusPieData = (trendData?.status_breakdown || []).map((s) => ({
    name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
    value: s.count,
    color: STATUS_COLORS[s.status] || "#94a3b8",
  }));

  const roleSplitData = trendData?.summary ? [
    { name: "Tenants", value: trendData.summary.total_tenants, color: "#3d6b35" },
    { name: "Property Owners", value: trendData.summary.total_landlords, color: "#2563eb" },
  ] : [];

  const confidencePieData = [
    { name: "High (≥90%)", value: highConf, color: "#3d6b35" },
    { name: "Medium (70–89%)", value: midConf, color: "#d97706" },
    { name: "Low (<70%)", value: lowConf, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <div className="min-h-full bg-[#f5f7f5] pb-16 w-full">
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 size={24} color="#3d6b35" /> Analytics
          </h1>
          <button
            onClick={() => { fetchAll(); fetchTrends(); }}
            className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400"
          >
            <RefreshCw size={18} className={(loading || trendLoading) ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-6">

        {trendData?.summary && (
          <>
            <SectionHeader title="Platform Summary" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        <SectionHeader title="Demand & Reservation Trends (3-Month Forecast)" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <p className="text-[13px] font-bold text-gray-800 mb-1">Tenant Demand — Search Activity</p>
            {trendLoading ? (
              <div className="h-64 bg-gray-50 rounded-xl animate-pulse" />
            ) : demandChartData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No search activity logged yet.</p>
            ) : (
              <>
                <p className="text-[11px] text-gray-400 mb-2">
                  Based on tenant searches, filters, and affordability checks — not just completed reservations.
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={demandChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
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
          </Card>

          <Card>
            <p className="text-[13px] font-bold text-gray-800 mb-3">Reservation Volume</p>
            {reservationChartData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No reservation data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reservationChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="Reservations" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Forecast" stroke="#7c3aed" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <SectionHeader title="Distribution Overview" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Card>
            <p className="text-[13px] font-bold text-gray-800 mb-3">Reservation Status Breakdown</p>
            {statusPieData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No reservations yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <p className="text-[13px] font-bold text-gray-800 mb-3">Tenants vs. Property Owners</p>
            {roleSplitData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No user data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={roleSplitData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {roleSplitData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <p className="text-[13px] font-bold text-gray-800 mb-3">Verification Confidence</p>
            {confidencePieData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-16">No pending verifications to analyze.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={confidencePieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {confidencePieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {trendData?.top_barangays?.length > 0 && (
            <div>
              <SectionHeader title="Most-Searched Barangays" />
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-3">
                <div className="divide-y divide-gray-50">
                  {trendData.top_barangays.map((b, i) => (
                    <div key={b.barangay} className="flex items-center gap-3 px-5 py-3.5">
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
            </div>
          )}

          {trendData?.users_by_month && (
            <div>
              <SectionHeader title="New User Registrations" />
              <Card className="mt-3">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trendData.users_by_month} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" name="New Users" fill="#2563eb" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <>
            <SectionHeader title="Moderation Overview" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={BadgeCheck} label="Verified Users" value={totalVerified} color="#3d6b35" sublabel="in Face Collection" />
              <MetricCard icon={Clock} label="Pending Verifications" value={pendingVer} color="#d97706" sublabel="awaiting review" />
              <MetricCard icon={Building} label="Pending Listings" value={pendingLst} color="#2563eb" sublabel="awaiting approval" />
              <MetricCard icon={MessageCircle} label="Conversations" value={totalConv} color="#7c3aed" sublabel="active threads" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <SectionHeader title="Pending Listing Price Stats" />
                <Card className="mt-3">
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
                </Card>
              </div>

              <div>
                <SectionHeader title="Security Config" />
                <Card className="mt-3">
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
                </Card>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {data.pending_verifications.length > 0 && (
                <div>
                  <SectionHeader title="Verification Queue Log" />
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-3">
                    <div className="divide-y divide-gray-50">
                      {data.pending_verifications.slice(0, 8).map((item) => {
                        const u = item.user || {};
                        const score = item.similarity_score || 0;
                        const scoreColor = score >= 90 ? "#3d6b35" : score >= 70 ? "#d97706" : "#ef4444";
                        return (
                          <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
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
                </div>
              )}

              {data.conversations.length > 0 && (
                <div>
                  <SectionHeader title="Recent Conversations" />
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-3">
                    <div className="divide-y divide-gray-50">
                      {data.conversations.slice(0, 6).map((conv) => {
                        const tenant = conv.tenant || {};
                        const landlord = conv.landlord || {};
                        const lastMsg = conv.messages?.[0];
                        return (
                          <div key={conv.id} className="flex items-center gap-3 px-5 py-3.5">
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
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}