// FILE: src/pages/AdminRevenueByOwner.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Wallet, RefreshCw, TrendingUp, TrendingDown, Building } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

export default function AdminRevenueByOwner() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [owners, setOwners] = useState([]);
  const [platformTotal, setPlatformTotal] = useState(0);
  const [platformThisMonth, setPlatformThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { if (token) fetchData(); }, [token]);

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-16 w-full">
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <Wallet size={24} color="#3d6b35" /> Revenue by Owner
          </h1>
          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
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

        {/* PER-OWNER BREAKDOWN */}
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