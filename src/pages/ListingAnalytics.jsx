// FILE: src/pages/ListingAnalytics.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, BarChart2, Calendar, RefreshCw, Sparkles,
  Wallet, Search, Loader, BadgeCheck, Heart, Building,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;

const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH");

function MetricCard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full">
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

function Card({ children }) {
  return <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm h-full">{children}</div>;
}

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

export default function ListingAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, role } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Where "back" should go depends on which side mounted this page
  const isAdminContext = location.pathname.startsWith("/admin");
  const backLabel = isAdminContext ? "Back" : "My Analytics";
  const backPath  = isAdminContext ? -1 : "/landlord/analytics";

  const fetchAnalytics = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await axios.get(`${API}/listings/${id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data?.data || null);
    } catch {
      setNotFound(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchAnalytics(); }, [token, id]);

  const demandChartData = data
    ? buildForecastChartData(data.searches_by_month, data.forecast?.demand_next_3_months, "Area Interest")
    : [];

  const reservationChartData = data
    ? buildForecastChartData(data.reservations_by_month, data.forecast?.reservations_next_3_months, "Reservations")
    : [];

  const listing = data?.listing;
  const cover = data?.images?.[0]?.image_path;

  return (
    <div className="min-h-full bg-[#f5f7f5] pb-16 w-full">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between">
          <button onClick={() => navigate(backPath)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
            <ArrowLeft size={16} /> {backLabel}
          </button>
          <button onClick={fetchAnalytics} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-6">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size={28} className="text-[#3d6b35] animate-spin" />
          </div>
        ) : notFound || !data ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
            <p className="text-sm text-gray-400">Could not load this listing's analytics.</p>
          </div>
        ) : (
          <>
            {/* LISTING HEADER CARD */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-[#3d6b35]/10 flex items-center justify-center shrink-0 overflow-hidden">
                {cover ? (
                  <img src={STORAGE + cover} alt={listing?.title} className="w-full h-full object-cover" />
                ) : (
                  <Building size={24} color="#3d6b35" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-gray-900 truncate flex items-center gap-1.5">
                  {listing?.title}
                  {listing?.is_verified && <BadgeCheck size={16} className="text-green-500 shrink-0" />}
                </p>
                <p className="text-sm text-gray-400">
                  {formatPeso(listing?.price)}/mo · {listing?.barangay} · {listing?.property_type}
                </p>
              </div>
              <button
                onClick={() => navigate(`/listing/${id}?preview=1`)}
                className="shrink-0 text-xs font-semibold text-[#3d6b35] border border-green-200 rounded-xl px-3 py-2 hover:bg-green-50 transition"
              >
                View Public Page
              </button>
            </div>

            {/* SUMMARY */}
            <SectionHeader title="Overview" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={Calendar} label="Total Reservations" value={data.summary.total_reservations}
                color="#2563eb" sublabel={`${data.summary.pending_reservations} pending`} />
              <MetricCard icon={BarChart2} label="Approved" value={data.summary.approved_reservations}
                color="#3d6b35" sublabel={`${data.summary.rejected_reservations} rejected`} />
              <MetricCard icon={Wallet} label="Revenue" value={formatPeso(data.summary.total_revenue)}
                color="#7c3aed" sublabel="from paid reservation fees" />
              <MetricCard icon={Heart} label="Saved by Tenants" value={data.summary.saved_count}
                color="#ef4444" sublabel="tenants who favorited this listing" />
            </div>

            {/* AREA INTEREST + RESERVATION TREND */}
            <SectionHeader title="3-Month Forecasts" />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card>
                <p className="text-[13px] font-bold text-gray-800 mb-1">Interest in This Area</p>
                {demandChartData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-16">No search activity logged for this barangay yet.</p>
                ) : (
                  <>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Tenant searches are logged per barangay, not per listing — this reflects overall interest in {listing?.barangay || "this area"}, not just this listing specifically.
                    </p>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={demandChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="Area Interest" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Forecast" stroke="#2563eb" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
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
              </Card>

              <Card>
                <p className="text-[13px] font-bold text-gray-800 mb-1">Reservation Requests</p>
                {reservationChartData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-16">No reservation requests yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={reservationChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="Reservations" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Forecast" stroke="#ea580c" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* REVENUE */}
            <SectionHeader title="Revenue from This Listing" />
            <Card>
              {!data.revenue_by_month || data.revenue_by_month.every((d) => d.count === 0) ? (
                <p className="text-sm text-gray-400 text-center py-16">No paid reservation fees yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.revenue_by_month} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₱${v}`} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => formatPeso(v)} />
                    <Bar dataKey="count" name="Revenue" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}