// FILE: src/pages/AdminListingsSummary.jsx

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ClipboardList, Search, RefreshCw, Building, BadgeCheck,
  Calendar, Wallet, Heart, Loader,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;

const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH");

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "18" }}>
          <Icon size={17} color={color} />
        </div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[24px] font-bold text-gray-800">{value}</p>
    </div>
  );
}

const statusColor = (status) => {
  if (status === "available") return "bg-green-100 text-green-700";
  if (status === "unavailable") return "bg-gray-100 text-gray-500";
  return "bg-amber-100 text-amber-700";
};

export default function AdminListingsSummary() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [listings, setListings] = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/listings-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings(res.data?.data?.listings || []);
      setSummary(res.data?.data?.summary || null);
    } catch {
      setListings([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter((l) => {
      const ownerName = `${l.landlord?.first_name || ""} ${l.landlord?.last_name || ""}`.toLowerCase();
      return l.title?.toLowerCase().includes(q) || ownerName.includes(q) || l.barangay?.toLowerCase().includes(q);
    });
  }, [listings, query]);

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-16 w-full">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between gap-4">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2 shrink-0">
            <ClipboardList size={24} color="#3d6b35" /> Listings Summary
          </h1>

          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by listing, owner, or barangay..."
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition-all"
            />
          </div>

          <button onClick={fetchData} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 shrink-0">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-6">

        {loading ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />
              ))}
            </div>
            <div className="flex items-center justify-center py-12">
              <Loader size={28} className="text-[#3d6b35] animate-spin" />
            </div>
          </>
        ) : (
          <>
            {/* SUMMARY */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard icon={Building} label="Total Listings" value={summary.total_listings} color="#3d6b35" />
                <MetricCard icon={BadgeCheck} label="Verified" value={summary.verified_listings} color="#2563eb" />
                <MetricCard icon={Calendar} label="Total Reservations" value={summary.total_reservations} color="#d97706" />
                <MetricCard icon={Wallet} label="Total Revenue" value={formatPeso(summary.total_revenue)} color="#7c3aed" />
              </div>
            )}

            {/* ALL LISTINGS */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
                <Building size={36} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  {query ? "No listings match your search." : "No listings yet."}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {filtered.map((l) => {
                    const cover = l.images?.[0]?.image_path;
                    return (
                      <div
                        key={l.id}
                        onClick={() => navigate(`/admin/listings/${l.id}/analytics`)}
                        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition"
                      >
                        <div className="w-14 h-14 rounded-xl bg-[#3d6b35]/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {cover ? (
                            <img src={STORAGE + cover} alt={l.title} className="w-full h-full object-cover" />
                          ) : (
                            <Building size={20} color="#3d6b35" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[15px] font-semibold text-gray-800 truncate">{l.title}</p>
                            {l.is_verified && <BadgeCheck size={14} className="text-green-500 shrink-0" />}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${statusColor(l.status)}`}>
                              {l.status}
                            </span>
                          </div>
                          <p className="text-[13px] text-gray-400">
                            {formatPeso(l.price)}/mo · {l.barangay || "—"} ·{" "}
                            <span
                              className="hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (l.landlord?.id) navigate(`/admin/landlords/${l.landlord.id}`);
                              }}
                            >
                              {l.landlord ? `${l.landlord.first_name} ${l.landlord.last_name}` : "Unknown owner"}
                            </span>
                          </p>
                        </div>

                        <div className="text-right shrink-0 w-20">
                          <p className="text-[16px] font-bold text-[#3d6b35]">{l.total_reservations}</p>
                          <p className="text-[10px] text-gray-400">requests</p>
                        </div>
                        <div className="text-right shrink-0 w-20">
                          <p className="text-[16px] font-bold text-blue-600">{l.approved_reservations}</p>
                          <p className="text-[10px] text-gray-400">approved</p>
                        </div>
                        <div className="text-right shrink-0 w-24">
                          <p className="text-[16px] font-bold text-purple-600">{formatPeso(l.total_revenue)}</p>
                          <p className="text-[10px] text-gray-400">revenue</p>
                        </div>
                        <div className="text-right shrink-0 w-14 flex flex-col items-end">
                          <span className="flex items-center gap-1 text-[13px] font-bold text-red-500">
                            <Heart size={12} /> {l.saved_count}
                          </span>
                          <p className="text-[10px] text-gray-400">saved</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}