// FILE: src/pages/LandlordMaintenance.jsx

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Wrench, RefreshCw, Clock, CheckCircle2, XCircle, Loader,
  User, Building, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "bg-amber-100 text-amber-700",  icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700",    icon: Loader },
  resolved:    { label: "Resolved",    color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected:    { label: "Rejected",    color: "bg-gray-100 text-gray-500",   icon: XCircle },
};

const TABS = [
  { key: "pending",     label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved",    label: "Resolved" },
  { key: "rejected",    label: "Rejected" },
  { key: "all",         label: "All" },
];

export default function LandlordMaintenance() {
  const { token } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [activeRequest, setActiveRequest] = useState(null);
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/landlord/maintenance-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data?.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchRequests(); }, [token]);

  const filtered = useMemo(() => {
    if (tab === "all") return requests;
    return requests.filter((r) => r.status === tab);
  }, [requests, tab]);

  const handleUpdateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await axios.put(`${API}/maintenance-requests/${id}/status`,
        { status, landlord_note: note || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveRequest(null);
      setNote("");
      fetchRequests();
    } catch {
      // silent — request stays open, landlord can retry
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f5f7f5] pb-16 w-full">
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between gap-4">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2 shrink-0">
            <Wrench size={24} color="#3d6b35" /> Maintenance Requests
          </h1>
          <button onClick={fetchRequests} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="w-full flex gap-2 mt-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                tab === t.key ? "bg-[#3d6b35] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {t.label}
              {t.key !== "all" && (
                <span className="ml-1 opacity-70">({requests.filter((r) => r.status === t.key).length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
            <Wrench size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No {tab !== "all" ? tab.replace("_", " ") : ""} maintenance requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((r) => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[14px] font-semibold text-gray-800 flex-1">{r.title}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 flex items-center gap-1 ${cfg.color}`}>
                      <StatusIcon size={10} /> {cfg.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 flex items-center gap-1.5 mb-1">
                    <Building size={11} className="shrink-0" /> {r.listing?.title || "—"}
                  </p>
                  <p className="text-[12px] text-gray-500 flex items-center gap-1.5 mb-3">
                    <User size={11} className="shrink-0" /> {r.tenant?.first_name} {r.tenant?.last_name}
                  </p>
                  <p className="text-[12.5px] text-gray-600 leading-relaxed flex-1 mb-3">{r.description}</p>
                  {r.landlord_note && (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 mb-3">
                      <p className="text-[11px] text-gray-500">Your note: {r.landlord_note}</p>
                    </div>
                  )}
                  {(r.status === "pending" || r.status === "in_progress") && (
                    <button
                      onClick={() => { setActiveRequest(r); setNote(r.landlord_note || ""); }}
                      className="mt-auto w-full py-2 border border-[#3d6b35] text-[#3d6b35] rounded-xl text-xs font-semibold hover:bg-[#3d6b35]/5 transition"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPDATE STATUS MODAL */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => !updating && setActiveRequest(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Update Request</h2>
              <button onClick={() => setActiveRequest(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm font-semibold text-gray-800 mb-1">{activeRequest.title}</p>
              <p className="text-xs text-gray-400 mb-4">{activeRequest.listing?.title}</p>

              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Note <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                placeholder="e.g., Technician scheduled for Friday"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition resize-none mb-4" />

              <div className="grid grid-cols-1 gap-2">
                {activeRequest.status === "pending" && (
                  <button onClick={() => handleUpdateStatus(activeRequest.id, "in_progress")} disabled={updating}
                    className="py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-50">
                    {updating ? "Updating..." : "Mark In Progress"}
                  </button>
                )}
                <button onClick={() => handleUpdateStatus(activeRequest.id, "resolved")} disabled={updating}
                  className="py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                  {updating ? "Updating..." : "Mark Resolved"}
                </button>
                <button onClick={() => handleUpdateStatus(activeRequest.id, "rejected")} disabled={updating}
                  className="py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50">
                  {updating ? "Updating..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}