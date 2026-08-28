// FILE: src/pages/AdminAuditTrail.jsx

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ScrollText, Search, RefreshCw, User, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const ACTION_STYLE = {
  listing_approved:               { color: "bg-green-100 text-green-700", label: "Listing Approved" },
  listing_rejected:                { color: "bg-red-100 text-red-700",     label: "Listing Rejected" },
  verification_approved:           { color: "bg-green-100 text-green-700", label: "Verification Approved" },
  verification_rejected:           { color: "bg-red-100 text-red-700",     label: "Verification Rejected" },
  amenity_request_approved:        { color: "bg-green-100 text-green-700", label: "Amenity Approved" },
  amenity_request_rejected:        { color: "bg-red-100 text-red-700",     label: "Amenity Rejected" },
  deactivation_request_approved:   { color: "bg-amber-100 text-amber-700", label: "Deactivation Approved" },
  deactivation_request_rejected:   { color: "bg-gray-100 text-gray-600",   label: "Deactivation Declined" },
  account_deactivated_direct:      { color: "bg-amber-100 text-amber-700", label: "Account Deactivated" },
  account_reactivated:             { color: "bg-blue-100 text-blue-700",   label: "Account Reactivated" },
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminAuditTrail() {
  const { token } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: search ? { search } : {},
      });
      setLogs(res.data?.data || []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchLogs(); }, [token]);

  const filtered = useMemo(() => {
    if (actionFilter === "all") return logs;
    return logs.filter((l) => l.action === actionFilter);
  }, [logs, actionFilter]);

  const availableActions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action));
    return Array.from(set);
  }, [logs]);

  return (
    <div className="min-h-full bg-[#f5f7f5] pb-16 w-full">
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2 shrink-0">
            <ScrollText size={24} color="#3d6b35" /> Audit Trail
          </h1>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
                placeholder="Search descriptions..."
                className="w-full h-10 bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 text-sm outline-none focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition-all"
              />
            </div>
            <button onClick={fetchLogs} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 shrink-0">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {availableActions.length > 0 && (
          <div className="w-full flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setActionFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
                actionFilter === "all" ? "bg-[#3d6b35] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            {availableActions.map((action) => (
              <button
                key={action}
                onClick={() => setActionFilter(action)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
                  actionFilter === action ? "bg-[#3d6b35] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {ACTION_STYLE[action]?.label || action}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-full px-6 md:px-10 mt-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
            <ScrollText size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {search ? "No matching actions found." : "No admin actions logged yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.map((log) => {
                const style = ACTION_STYLE[log.action] || { color: "bg-gray-100 text-gray-600", label: log.action };
                return (
                  <div key={log.id} className="flex items-start gap-3 px-5 py-4">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-semibold shrink-0 mt-0.5 ${style.color}`}>
                      {style.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] text-gray-700 leading-snug">{log.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <User size={10} /> {log.admin ? `${log.admin.first_name} ${log.admin.last_name}` : "Unknown admin"}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock size={10} /> {timeAgo(log.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}