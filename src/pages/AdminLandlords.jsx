// FILE: src/pages/AdminLandlords.jsx

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users, Search, Building, RefreshCw, ChevronRight,
  BadgeCheck, XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;

export default function AdminLandlords() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [landlords, setLandlords] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [query,     setQuery]     = useState("");

  const fetchLandlords = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/landlords`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLandlords(res.data?.data || []);
    } catch {
      setLandlords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchLandlords(); }, [token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return landlords;
    return landlords.filter((l) =>
      `${l.first_name} ${l.last_name} ${l.email}`.toLowerCase().includes(q)
    );
  }, [landlords, query]);

  return (
    <div className="min-h-full bg-[#f5f7f5] pb-16 w-full">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between gap-4">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2 shrink-0">
            <Users size={24} color="#3d6b35" /> Property Owners
          </h1>

          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition-all"
            />
          </div>

          <button onClick={fetchLandlords} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 shrink-0">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6">

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
            <Users size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {query ? "No property owners match your search." : "No property owners yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((l) => (
              <button
                key={l.id}
                onClick={() => navigate(`/admin/landlords/${l.id}`)}
                className="flex items-center gap-3 px-4 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition text-left"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0 overflow-hidden border border-green-100">
                  {l.profile_picture ? (
                    <img src={STORAGE + l.profile_picture} alt={l.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-[#3d6b35]">
                      {l.first_name?.charAt(0)}{l.last_name?.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {l.first_name} {l.last_name}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{l.email}</p>
                </div>

                {/* Listing count */}
                <div className="text-right shrink-0 flex items-center gap-1.5">
                  <Building size={13} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500">{l.listings_count}</span>
                </div>

                {/* Active status */}
                {l.is_active ? (
                  <BadgeCheck size={16} className="text-green-500 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-gray-300 shrink-0" />
                )}

                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}