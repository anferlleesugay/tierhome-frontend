// FILE: src/pages/AdminUserManagement.jsx

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Users, Search, RefreshCw, BadgeCheck, XCircle,
  UserX, UserCheck, Loader, AlertCircle, CheckCircle,
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
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-sm font-medium ${styles[type] || styles.info}`}
      style={{ minWidth: "240px", maxWidth: "340px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", backdropFilter: "blur(8px)" }}
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

const roleColor = (role) =>
  role === "landlord" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700";

const TABS = [
  { key: "all",      label: "All" },
  { key: "tenant",   label: "Tenants" },
  { key: "landlord", label: "Property Owners" },
];

export default function AdminUserManagement() {
  const { token } = useAuth();

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");
  const [tab,     setTab]     = useState("all");
  const [actingId, setActingId] = useState(null);
  const [toast,   setToast]   = useState(null);

  const showToast = (message, type = "info", icon = null) => {
    setToast({ message, type, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data?.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchUsers(); }, [token]);

  const filtered = useMemo(() => {
    let list = users;
    if (tab !== "all") list = list.filter((u) => u.role === tab);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((u) =>
        `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, tab, query]);

  const handleDeactivate = async (userId) => {
    if (actingId) return;
    setActingId(userId);
    try {
      await axios.post(`${API}/admin/users/${userId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: false } : u));
      showToast("Account deactivated.", "success", CheckCircle);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to deactivate account.", "error", AlertCircle);
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
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: true } : u));
      showToast("Account reactivated.", "success", UserCheck);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reactivate account.", "error", AlertCircle);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-16 w-full">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-4 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between gap-4">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2 shrink-0">
            <Users size={24} color="#3d6b35" /> User Management
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

          <button onClick={fetchUsers} className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400 shrink-0">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* TABS */}
        <div className="w-full flex gap-2 mt-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                tab === t.key
                  ? "bg-[#3d6b35] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {t.label}
              {t.key !== "all" && (
                <span className="ml-1 opacity-70">
                  ({users.filter((u) => u.role === t.key).length})
                </span>
              )}
            </button>
          ))}
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
              {query ? "No users match your search." : "No users found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((u) => {
              const initials = `${u.first_name?.charAt(0) || ""}${u.last_name?.charAt(0) || ""}`;
              const isActing = actingId === u.id;

              return (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden border ${
                    u.is_active ? "bg-green-100 border-green-100" : "bg-gray-100 border-gray-200"
                  }`}>
                    {u.profile_picture ? (
                      <img src={STORAGE + u.profile_picture} alt={u.first_name}
                        className={`w-full h-full object-cover ${!u.is_active ? "grayscale" : ""}`} />
                    ) : (
                      <span className={`text-sm font-bold ${u.is_active ? "text-[#3d6b35]" : "text-gray-400"}`}>
                        {initials}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {u.first_name} {u.last_name}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${roleColor(u.role)}`}>
                        {u.role === "landlord" ? "Owner" : "Tenant"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  </div>

                  {/* Status + action */}
                  {u.is_active ? (
                    <button
                      onClick={() => handleDeactivate(u.id)}
                      disabled={isActing}
                      title="Deactivate account"
                      className="shrink-0 h-9 px-3 border border-red-200 text-red-500 rounded-xl text-xs font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isActing ? <Loader size={13} className="animate-spin" /> : <><UserX size={13} /> Deactivate</>}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(u.id)}
                      disabled={isActing}
                      title="Reactivate account"
                      className="shrink-0 h-9 px-3 bg-[#3d6b35] text-white rounded-xl text-xs font-semibold hover:bg-[#2d5525] transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isActing ? <Loader size={13} className="animate-spin" /> : <><UserCheck size={13} /> Reactivate</>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} icon={toast.icon} />}
    </div>
  );
}