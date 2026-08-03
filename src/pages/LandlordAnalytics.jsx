// FILE: src/pages/LandlordAnalytics.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart2, Building, Calendar, RefreshCw, Sparkles,
  TrendingUp, Wallet, CheckCircle, Clock, Search,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH");

function MetricCard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "18" }}>
          <Icon size={17} color={color} />
        </div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[24px] font-bold text-gray-800">{value}</p>
      {sublabel && <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function SectionHeader({ title }) {
  return <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2">{title}</p>;
}

// ✅ Builds chart data with N forecast points appended, bridging the line at the last real point
function buildForecastChartData(historicalMonths, forecastArray, valueLabel) {
  const base = (historicalMonths || []).map((d) => ({ month: d.month, [valueLabel]: d.count }));
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

export default function LandlordAnalytics() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/landlord/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchAnalytics(); }, [token]);

  const demandChartData = data
    ? buildForecastChartData(data.searches_by_month, data.forecast?.demand_next_3_months, "Tenant Demand")
    : [];

  const reservationChartData = data
    ? buildForecastChartData(data.reservations_by_month, data.forecast?.reservations_next_3_months, "Reservations")
    : [];

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-28">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 size={20} color="#3d6b35" /> My Analytics
          </h1>
          <button onClick={fetchAnalytics} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-4">

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : !data ? (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
            <p className="text-sm text-gray-400">Could not load analytics right now.</p>
          </div>
        ) : (
          <>
            {/* SUMMARY */}
            <SectionHeader title="Overview" />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard icon={Building} label="Total Listings" value={data.summary.total_listings} color="#3d6b35" />
              <MetricCard icon={Search} label="Area Searches" value={data.summary.area_searches} color="#d97706"
                sublabel="tenants interested in your area(s)" />
              <MetricCard icon={Calendar} label="Total Reservations" value={data.summary.total_reservations}
                color="#2563eb" sublabel={`${data.summary.pending_reservations} pending`} />
              <MetricCard icon={Wallet} label="Total Revenue" value={formatPeso(data.summary.total_revenue)}
                color="#7c3aed" sublabel="from paid reservation fees" />
            </div>

            {/* ✅ TENANT DEMAND (search activity in landlord's areas) + 3-MONTH FORECAST */}
            <SectionHeader title="Tenant Demand in Your Area(s) — 3-Month Forecast" />
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              {demandChartData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No search activity logged yet for your listing area(s).
                </p>
              ) : (
                <>
                  <p className="text-[11px] text-gray-400 mb-2">
                    How many tenants have searched or checked affordability for the barangay(s) where your listings are located.
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

                  {data.forecast?.insight && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-xl flex gap-2.5">
                      <Sparkles size={16} className="text-[#3d6b35] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold text-[#3d6b35] uppercase tracking-wide mb-1">AI Insight</p>
                        <p className="text-[12px] text-gray-700 leading-relaxed">{data.forecast.insight}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* RESERVATION TREND */}
            <SectionHeader title="Your Reservation Requests — 3-Month Forecast" />
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

            {/* REVENUE TREND */}
            <SectionHeader title="Revenue from Reservation Fees" />
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              {!data.revenue_by_month || data.revenue_by_month.every((d) => d.count === 0) ? (
                <p className="text-sm text-gray-400 text-center py-8">No paid reservation fees yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.revenue_by_month} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₱${v}`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => formatPeso(v)} />
                    <Bar dataKey="count" name="Revenue" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* PER-LISTING PERFORMANCE */}
            <SectionHeader title="Listing Performance" />
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {!data.listing_performance || data.listing_performance.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No listings yet.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.listing_performance.map((l) => (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => navigate(`/listing/${l.id}`)}>
                      <div className="w-9 h-9 rounded-xl bg-[#3d6b35]/10 flex items-center justify-center shrink-0">
                        <Building size={15} color="#3d6b35" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-gray-800 truncate">{l.title}</p>
                        <p className="text-[11px] text-gray-400">{formatPeso(l.price)}/mo · {l.barangay || l.status}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-[#3d6b35]">{l.total_reservations}</p>
                        <p className="text-[9px] text-gray-400">requests</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-blue-600">{l.approved_reservations}</p>
                        <p className="text-[9px] text-gray-400">approved</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}