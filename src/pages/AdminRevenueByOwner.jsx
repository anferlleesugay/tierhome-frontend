// FILE: src/pages/AdminRevenueByOwner.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Wallet, RefreshCw, TrendingUp, TrendingDown, Building,
  RotateCcw, Clock, Receipt, Home,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
const formatPesoShort = (n) => "₱" + Number(n || 0).toLocaleString("en-PH");

function SectionHeader({ title }) {
  return <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide pt-2">{title}</p>;
}

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full ${className}`}>{children}</div>;
}

function MetricCard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "18" }}>
          <Icon size={19} color={color} />
        </div>
        <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[26px] font-bold text-gray-800 leading-tight">{value}</p>
      {sublabel && <p className="text-[12px] text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

export default function AdminRevenueByOwner() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [owners, setOwners] = useState([]);
  const [platformTotal, setPlatformTotal] = useState(0);
  const [platformThisMonth, setPlatformThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Fuller platform revenue report — Client 2 Q18 asked specifically for
  // revenue by month, by property, transaction volume, refunds, and outstanding payments ──
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/revenue-by-owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOwners(res.data?.data?.owners || []);
      setPlatformTotal(res.data?.data?.platform_total || 0);
      setPlatformThisMonth(res.data?.data?.platform_this_month || 0);
    } catch {
      setOwners([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const res = await axios.get(`${API}/admin/platform-revenue-report`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data?.data || null);
    } catch {
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const refreshAll = () => { fetchData(); fetchReport(); };

  useEffect(() => { if (token) refreshAll(); }, [token]);

  const monthChartData = (report?.revenue_by_month || []).map((m) => ({ month: m.month, Revenue: m.total }));

  return (
    <div className="min-h-full bg-[#f5f7f5] pb-16 w-full">
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <Wallet size={24} color="#3d6b35" /> Revenue by Owner
          </h1>
          <button onClick={refreshAll} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            <RefreshCw size={18} className={(loading || reportLoading) ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-6">

        {/* PLATFORM TOTALS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #3d6b35, #2d5a27)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80 mb-1">Platform Total Revenue</p>
            <p className="text-[26px] font-bold">{formatPeso(platformTotal)}</p>
          </div>
          <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80 mb-1">This Month, All Owners</p>
            <p className="text-[26px] font-bold">{formatPeso(platformThisMonth)}</p>
          </div>
        </div>

        {/* ── TRANSACTION VOLUME / REFUNDS / OUTSTANDING — Client 2 Q18 ── */}
        {reportLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        ) : report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard icon={Receipt} label="Total Transactions" value={report.total_transactions}
              sublabel={`${report.transactions_this_month} this month`} color="#2563eb" />
            <MetricCard icon={RotateCcw} label="Refunds Issued" value={report.refunds.count}
              sublabel={formatPesoShort(report.refunds.amount)} color="#d97706" />
            <MetricCard icon={Clock} label="Outstanding Payments" value={report.outstanding.count}
              sublabel={formatPesoShort(report.outstanding.amount) + " unpaid"} color="#ef4444" />
            <MetricCard icon={Home} label="Failed Refunds" value={report.refunds.failed_count}
              sublabel="needs manual follow-up" color="#6b7280" />
          </div>
        )}

        {/* ── REVENUE BY MONTH + REVENUE BY PROPERTY ── */}
        <div className="flex flex-wrap gap-4 items-stretch">
          <div className="flex-1 min-w-[340px] flex flex-col">
            <SectionHeader title="Revenue by Month" />
            <Card className="mt-3 flex-1 min-h-[280px] flex flex-col">
              {reportLoading ? (
                <div className="flex-1 bg-gray-50 rounded-xl animate-pulse" />
              ) : monthChartData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-gray-400 text-center">No paid revenue in the last 6 months.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthChartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatPeso(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="Revenue" fill="#3d6b35" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <div className="flex-1 min-w-[340px] flex flex-col">
            <SectionHeader title="Revenue by Property (Top 10)" />
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-3 flex-1 min-h-[280px] flex flex-col">
              {reportLoading ? (
                <div className="p-6 space-y-3 flex-1">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}</div>
              ) : !report || report.revenue_by_property.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Building size={32} className="text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No property revenue recorded yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 overflow-y-auto flex-1">
                  {report.revenue_by_property.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="text-[11px] font-bold text-gray-300 w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 truncate">{p.title}</p>
                        <p className="text-[11px] text-gray-400 truncate">{p.owner} · {p.barangay}</p>
                      </div>
                      <p className="text-[13px] font-bold text-[#3d6b35] shrink-0">{formatPesoShort(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PER-OWNER BREAKDOWN */}
        <SectionHeader title="Per-Owner Breakdown" />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : owners.length === 0 ? (
            <div className="p-12 text-center">
              <Building size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No revenue recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {owners.map((owner, i) => (
                <div key={owner.id} onClick={() => navigate(`/admin/landlords/${owner.id}`)}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition">
                  <div className="w-8 text-center shrink-0">
                    {i === 0 ? <span className="text-[16px]">🏆</span> : <span className="text-[13px] font-bold text-gray-300">{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-800 truncate">{owner.name}</p>
                    <p className="text-[12px] text-gray-400">{owner.email} · {owner.total_listings} listing{owner.total_listings !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right shrink-0 w-28">
                    <p className="text-[16px] font-bold text-[#3d6b35]">{formatPeso(owner.total_revenue)}</p>
                    <p className="text-[10px] text-gray-400">total revenue</p>
                  </div>
                  <div className="text-right shrink-0 w-24">
                    <p className="text-[14px] font-bold text-gray-700">{formatPeso(owner.revenue_this_month)}</p>
                    {owner.revenue_change_pct !== null && (
                      <span className={`flex items-center justify-end gap-0.5 text-[11px] font-semibold ${owner.revenue_change_pct >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {owner.revenue_change_pct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {Math.abs(owner.revenue_change_pct)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}