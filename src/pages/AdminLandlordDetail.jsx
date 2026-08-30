// FILE: src/pages/AdminLandlordDetail.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, BarChart2, Building, Calendar, RefreshCw, Sparkles,
  Wallet, Search, Loader, BadgeCheck, Receipt,
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

// Builds chart data with N forecast points appended, bridging the line at the last real point
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

// ── Merges the demand and reservation datasets into one shared timeline so both
// metrics can be compared directly on a single chart, rather than two separate
// charts with unrelated scales side by side.
function mergeDemandAndReservationData(demandData, reservationData) {
  const byMonth = {};
  demandData.forEach((d) => {
    byMonth[d.month] = { ...byMonth[d.month], month: d.month, "Tenant Demand": d["Tenant Demand"], "Demand Forecast": d.Forecast };
  });
  reservationData.forEach((d) => {
    byMonth[d.month] = { ...byMonth[d.month], month: d.month, "Reservations": d.Reservations, "Reservation Forecast": d.Forecast };
  });
  // Preserve chronological order using whichever source array is longer/authoritative
  const order = (demandData.length >= reservationData.length ? demandData : reservationData).map((d) => d.month);
  return order.map((m) => byMonth[m]);
}

export default function AdminLandlordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await axios.get(`${API}/admin/landlords/${id}/analytics`, {
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

  useEffect(() => { if (token) fetchOverview(); }, [token, id]);

  const demandChartData = data
    ? buildForecastChartData(data.searches_by_month, data.forecast?.demand_next_3_months, "Tenant Demand")
    : [];

  const reservationChartData = data
    ? buildForecastChartData(data.reservations_by_month, data.forecast?.reservations_next_3_months, "Reservations")
    : [];

  const combinedChartData = mergeDemandAndReservationData(demandChartData, reservationChartData);

  const landlord = data?.landlord;
  const initials = landlord ? `${landlord.first_name?.charAt(0) || ""}${landlord.last_name?.charAt(0) || ""}` : "?";

  return (
    <div className="min-h-full bg-[#f5f7f5] pb-16 w-full">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between">
          <button onClick={() => navigate("/admin/landlords")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
            <ArrowLeft size={16} /> Property Owners
          </button>
          <button onClick={fetchOverview} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
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
            <p className="text-sm text-gray-400">Could not load this Property Owner's data.</p>
          </div>
        ) : (
          <>
            {/* LANDLORD HEADER CARD */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center shrink-0 overflow-hidden border border-green-100">
                {landlord?.profile_picture ? (
                  <img src={STORAGE + landlord.profile_picture} alt={landlord.first_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-[#3d6b35]">{initials}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900 truncate">
                  {landlord?.first_name} {landlord?.last_name}
                </p>
                <p className="text-sm text-gray-400 truncate">{landlord?.email}</p>
              </div>
            </div>

            {/* SUMMARY */}
            <SectionHeader title="Overview" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard icon={Building} label="Total Listings" value={data.summary.total_listings} color="#3d6b35" />
              <MetricCard icon={Search} label="Area Searches" value={data.summary.area_searches} color="#d97706"
                sublabel="tenants interested in their area(s)" />
              <MetricCard icon={Calendar} label="Total Reservations" value={data.summary.total_reservations}
                color="#2563eb" sublabel={`${data.summary.pending_reservations} pending`} />
              <MetricCard icon={Wallet} label="Total Revenue" value={formatPeso(data.summary.total_revenue)}
                color="#7c3aed" sublabel="from paid reservation fees" />
            </div>

            {/* TENANT DEMAND + RESERVATION TREND — combined into one chart so demand
                 and reservations can be compared directly on a shared timeline. */}
            <SectionHeader title="3-Month Forecasts" />
            <div>
              <Card>
                <p className="text-[13px] font-bold text-gray-800 mb-1">Tenant Demand vs. Reservation Requests</p>
                {combinedChartData.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-16">No data yet.</p>
                ) : (
                  <>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Search/affordability-check activity for this landlord's barangay(s), compared against actual reservation requests on the same timeline.
                    </p>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={combinedChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="demand" tick={{ fontSize: 10 }} allowDecimals={false} domain={[-0.3, "dataMax + 1"]}
                          label={{ value: "Searches", angle: -90, position: "insideLeft", fontSize: 10, fill: "#d97706" }} />
                        <YAxis yAxisId="reservations" orientation="right" tick={{ fontSize: 10 }} allowDecimals={false} domain={[-1, "dataMax + 2"]}
                          label={{ value: "Reservations", angle: 90, position: "insideRight", fontSize: 10, fill: "#2563eb" }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line yAxisId="demand" type="monotone" dataKey="Tenant Demand" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line yAxisId="reservations" type="monotone" dataKey="Reservations" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line yAxisId="demand" type="monotone" dataKey="Demand Forecast" stroke="#2563eb" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                        <Line yAxisId="reservations" type="monotone" dataKey="Reservation Forecast" stroke="#ea580c" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
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
            </div>

            {/* REVENUE + LISTINGS — side by side on desktop */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <SectionHeader title="Revenue from Reservation Fees" />
                <div className="mt-3">
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
                </div>
              </div>

              <div>
                <SectionHeader title="Paid Reservation Breakdown" />
                <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {!data.paid_reservations || data.paid_reservations.length === 0 ? (
                    <div className="text-center py-16">
                      <Receipt size={36} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No paid reservation fees yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
                      {data.paid_reservations.map((r) => (
                        <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                            <Receipt size={16} className="text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-gray-800 truncate">{r.tenant_name}</p>
                            <p className="text-[12px] text-gray-400 truncate">
                              {r.listing_title}
                              {r.paid_at && ` · ${new Date(r.paid_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`}
                            </p>
                          </div>
                          <p className="text-[15px] font-bold text-[#3d6b35] shrink-0">{formatPeso(r.amount)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <SectionHeader title="Listings" />
                <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {!data.listing_performance || data.listing_performance.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-16">No listings yet.</p>
                  ) : (
                    <div className="divide-y divide-gray-50 max-h-[480px] overflow-y-auto">
                      {data.listing_performance.map((l) => {
                        const cover = l.images?.[0]?.image_path;
                        return (
                          <div key={l.id} className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                            onClick={() => navigate(`/admin/listings/${l.id}/analytics`)}>
                            <div className="w-14 h-14 rounded-xl bg-[#3d6b35]/10 flex items-center justify-center shrink-0 overflow-hidden">
                              {cover ? (
                                <img src={STORAGE + cover} alt={l.title} className="w-full h-full object-cover" />
                              ) : (
                                <Building size={20} color="#3d6b35" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-semibold text-gray-800 truncate flex items-center gap-1.5">
                                {l.title}
                                {l.is_verified && <BadgeCheck size={14} className="text-green-500 shrink-0" />}
                              </p>
                              <p className="text-[13px] text-gray-400">{formatPeso(l.price)}/mo · {l.barangay || l.status}</p>
                            </div>
                            <div className="text-right shrink-0 w-20">
                              <p className="text-[16px] font-bold text-[#3d6b35]">{l.total_reservations}</p>
                              <p className="text-[10px] text-gray-400">requests</p>
                            </div>
                            <div className="text-right shrink-0 w-20">
                              <p className="text-[16px] font-bold text-blue-600">{l.approved_reservations}</p>
                              <p className="text-[10px] text-gray-400">approved</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}