// FILE: src/pages/AdminDeactivationRequests.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import {
  UserX, UserCheck, CheckCircle, XCircle, Clock, RefreshCw,
  AlertCircle, Loader, User, PowerOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;

function Toast({ message, type, icon: Icon }) {
  if (!message) return null;
  const styles = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-600",
    info: "bg-blue-50 border-blue-200 text-blue-600",
  };
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-medium animate-fade-in ${styles[type] || styles.info}`}
      style={{ minWidth: "240px", maxWidth: "340px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", backdropFilter: "blur(8px)" }}
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const roleColor = (role) =>
  role === "landlord" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700";

function SectionHeader({ icon: Icon, title, count }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Icon size={14} className="text-gray-400" />
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
        {title}{typeof count === "number" ? ` (${count})` : ""}
      </p>
    </div>
  );
}

export default function AdminDeactivationRequests() {
  const { token } = useAuth();

  const [requests, setRequests]   = useState([]);
  const [deactivated, setDeactivated] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingDeactivated, setLoadingDeactivated] = useState(true);
  const [actingId, setActingId] = useState(null); // id currently being acted on (any list)
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "info", icon = null) => {
    setToast({ message, type, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await axios.get(`${API}/admin/deactivation-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data?.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchDeactivated = async () => {
    setLoadingDeactivated(true);
    try {
      const res = await axios.get(`${API}/admin/users/deactivated`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeactivated(res.data?.data || []);
    } catch {
      setDeactivated([]);
    } finally {
      setLoadingDeactivated(false);
    }
  };

  const fetchAll = () => { fetchRequests(); fetchDeactivated(); };

  useEffect(() => { if (token) fetchAll(); }, [token]);

  const requestedAccounts = deactivated.filter((u) => u.reactivation_requested_at);
  const otherAccounts     = deactivated.filter((u) => !u.reactivation_requested_at);

  const handleApprove = async (id) => {
    if (actingId) return;
    setActingId(id);
    try {
      await axios.post(`${API}/admin/deactivation-requests/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showToast("Account deactivated.", "success", CheckCircle);
      fetchDeactivated();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve request.", "error", AlertCircle);
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (id) => {
    if (actingId) return;
    setActingId(id);
    try {
      await axios.post(`${API}/admin/deactivation-requests/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      showToast("Request declined.", "info", XCircle);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject request.", "error", AlertCircle);
    } finally {
      setActingId(null);
    }
  };

  const handleReactivate = async (userId) => {
    if (actingId) return;
    setActingId(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeactivated((prev) => prev.filter((u) => u.id !== userId));
      showToast("Account reactivated.", "success", UserCheck);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reactivate account.", "error", AlertCircle);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-full bg-[#f5f7f5] pb-16 w-full">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <UserX size={24} color="#3d6b35" /> Deactivation Requests
          </h1>
          <button onClick={fetchAll} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
            <RefreshCw size={18} className={(loadingRequests || loadingDeactivated) ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6 space-y-6">

        {/* ── PENDING REQUESTS ─────────────────────────── */}
        <SectionHeader icon={Clock} title="Pending Requests" count={loadingRequests ? undefined : requests.length} />

        {loadingRequests ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <CheckCircle size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No pending deactivation requests.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {requests.map((r) => {
              const u = r.user;
              const initials = `${u?.first_name?.charAt(0) || ""}${u?.last_name?.charAt(0) || ""}`;
              const isActing = actingId === r.id;

              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0 overflow-hidden border border-green-100">
                      {u?.profile_picture ? (
                        <img src={STORAGE + u.profile_picture} alt={u.first_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-[#3d6b35]">{initials || <User size={16} />}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {u?.first_name} {u?.last_name}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${roleColor(u?.role)}`}>
                          {u?.role === "landlord" ? "Property Owner" : "Tenant"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{u?.email}</p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Clock size={11} className="text-gray-300 shrink-0" />
                        <p className="text-[11px] text-gray-400">Requested {formatDate(r.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {r.reason && (
                    <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 flex-1">
                      <p className="text-[12px] text-gray-600 leading-relaxed">{r.reason}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleReject(r.id)}
                      disabled={isActing}
                      className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isActing ? <Loader size={14} className="animate-spin" /> : <><XCircle size={14} /> Reject</>}
                    </button>
                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={isActing}
                      className="flex-1 h-10 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isActing ? <Loader size={14} className="animate-spin" /> : <><CheckCircle size={14} /> Approve</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── REACTIVATION REQUESTS — its own section ──── */}
        {!loadingDeactivated && requestedAccounts.length > 0 && (
          <>
            <SectionHeader icon={Clock} title="Reactivation Requests" count={requestedAccounts.length} />
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {requestedAccounts.map((u) => (
                <DeactivatedAccountCard key={u.id} u={u} isActing={actingId === u.id} onReactivate={handleReactivate} highlighted />
              ))}
            </div>
          </>
        )}

        {/* ── DEACTIVATED ACCOUNTS ─────────────────────── */}
        <SectionHeader icon={PowerOff} title="Deactivated Accounts" count={loadingDeactivated ? undefined : otherAccounts.length} />

        {loadingDeactivated ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : deactivated.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <UserCheck size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No deactivated accounts right now.</p>
          </div>
        ) : otherAccounts.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-100 text-center">
            <UserCheck size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">All deactivated accounts have a pending reactivation request (see above).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {otherAccounts.map((u) => (
              <DeactivatedAccountCard key={u.id} u={u} isActing={actingId === u.id} onReactivate={handleReactivate} />
            ))}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} icon={toast.icon} />}
    </div>
  );
}

// ── Shared card for both Reactivation Requests and Deactivated Accounts ──
function DeactivatedAccountCard({ u, isActing, onReactivate, highlighted }) {
  const initials = `${u.first_name?.charAt(0) || ""}${u.last_name?.charAt(0) || ""}`;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 flex items-center gap-3 ${
      highlighted ? "border-amber-300 ring-1 ring-amber-100" : "border-gray-100"
    }`}>
      <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200">
        {u.profile_picture ? (
          <img src={STORAGE + u.profile_picture} alt={u.first_name} className="w-full h-full object-cover grayscale" />
        ) : (
          <span className="text-sm font-bold text-gray-400">{initials || <User size={16} />}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-700 truncate">
            {u.first_name} {u.last_name}
          </p>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${roleColor(u.role)}`}>
            {u.role === "landlord" ? "Property Owner" : "Tenant"}
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate">{u.email}</p>
        {highlighted && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 mt-1.5">
            <Clock size={10} /> Requested {formatDate(u.reactivation_requested_at)}
          </span>
        )}
      </div>

      <button
        onClick={() => onReactivate(u.id)}
        disabled={isActing}
        className="shrink-0 h-9 px-3 bg-[#3d6b35] text-white rounded-xl text-xs font-semibold hover:bg-[#2d5525] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        {isActing ? <Loader size={13} className="animate-spin" /> : <><UserCheck size={13} /> Reactivate</>}
      </button>
    </div>
  );
}