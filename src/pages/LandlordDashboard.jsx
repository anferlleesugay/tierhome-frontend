// FILE: src/pages/LandlordDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LayoutDashboard, Building, Calendar, MessageCircle,
  ChevronRight, LogOut, BadgeCheck, Clock,
  Eye, CheckCircle, XCircle, AlertCircle, User, Camera,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
const STORAGE = `${import.meta.env.VITE_API_URL.replace("/api", "")}/storage/`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const formatPeso = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH");

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#d97706", bg: "#fef3c7", icon: Clock },
  approved:  { label: "Approved",  color: "#3d6b35", bg: "#dcfce7", icon: CheckCircle },
  rejected:  { label: "Rejected",  color: "#ef4444", bg: "#fee2e2", icon: XCircle },
  cancelled: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6", icon: XCircle },
};

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color: c.color, background: c.bg }}
    >
      <Icon size={10} /> {c.label}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left w-full"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: color + "18" }}
      >
        <Icon size={20} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-[22px] font-bold text-gray-800">{value}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </button>
  );
}

export default function LandlordDashboard() {
  const navigate = useNavigate();
  const { user, token, logout, isVerified, updateUser } = useAuth();

  const [listings, setListings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.allSettled([
      axios.get(`${API}/landlord-reservations`, { headers }),
      axios.get(`${API}/conversations`, { headers }),
      axios.get(`${API}/my-listings`, { headers }),
    ]).then(([res, conv, listings]) => {
      const resList = res.value?.data?.data?.data || [];
      setReservations(resList);
      const myListings = listings.value?.data?.data?.data || listings.value?.data?.data || [];
      setListings(Array.isArray(myListings) ? myListings : []);
      setConversations(conv.value?.data?.data || []);
    }).finally(() => setLoading(false));
  }, [token]);

  const handleLogout = () => { logout(); navigate("/"); };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("profile_picture", file);
      const res = await axios.post(`${API}/profile/picture`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const newPicture = res.data?.data?.profile_picture || res.data?.profile_picture;
      if (newPicture) updateUser({ profile_picture: newPicture });
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const avatarUrl = user?.profile_picture ? STORAGE + user.profile_picture : null;
  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "L";

  const pendingCount = reservations.filter((r) => r.status === "pending").length;
  const unreadConv = conversations.length;

  const verStatus = user?.verification_status || "unverified";

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-28">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-5">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4">

            {/* AVATAR WITH UPLOAD */}
            <label className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#3d6b35]/10 flex items-center justify-center shrink-0 cursor-pointer group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-[#3d6b35]">{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                {uploadingAvatar
                  ? <span className="text-white text-[10px] font-bold">...</span>
                  : <Camera size={16} className="text-white" />
                }
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
              />
            </label>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-gray-400 font-medium">Landlord Dashboard</p>
              <h1 className="text-[20px] font-bold text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600">
                    <BadgeCheck size={13} /> Verified Landlord
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                    <Clock size={13} /> {verStatus === "pending" ? "Pending Verification" : "Unverified"}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-5 space-y-4">

        {/* Verification Banner */}
        {!isVerified && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border bg-blue-50 border-blue-200">
            <AlertCircle size={18} className="text-blue-600 shrink-0" />
            <p className="text-sm text-gray-700 flex-1">Complete identity verification to publish listings.</p>
            <button
              onClick={() => navigate("/verify")}
              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition shrink-0"
            >
              Verify Now
            </button>
          </div>
        )}

        {/* Account Info */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Account Info</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <User size={14} className="text-gray-400 shrink-0" />
              <span className="text-[13px] text-gray-600">{user?.email}</span>
            </div>
            {user?.phone_number && (
              <div className="flex items-center gap-3">
                <Building size={14} className="text-gray-400 shrink-0" />
                <span className="text-[13px] text-gray-600">{user.phone_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[68px] bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <StatCard
              icon={Building}
              label="My Listings"
              value={listings.length}
              color="#3d6b35"
              onClick={() => navigate("/landlord/listings")}
            />
            <StatCard
              icon={Calendar}
              label="Pending Reservations"
              value={pendingCount}
              color="#d97706"
              onClick={() => navigate("/landlord/reservations")}
            />
            <StatCard
              icon={MessageCircle}
              label="Conversations"
              value={unreadConv}
              color="#2563eb"
              onClick={() => navigate("/landlord/messages")}
            />
          </div>
        )}

        {/* Recent Reservations */}
        {!loading && reservations.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">Recent Reservations</p>
              <button
                onClick={() => navigate("/landlord/reservations")}
                className="text-[11px] font-semibold text-[#3d6b35] flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {reservations.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-[#3d6b35]/10 flex items-center justify-center shrink-0">
                    <User size={15} color="#3d6b35" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800 truncate">
                      {r.tenant?.first_name} {r.tenant?.last_name}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">{r.listing?.title}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={r.status} />
                    <span className="text-[10px] text-gray-400">{formatDate(r.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Manage Listings", icon: Building, path: "/landlord/listings", color: "#3d6b35" },
              { label: "View Reservations", icon: Calendar, path: "/landlord/reservations", color: "#d97706" },
              { label: "Messages", icon: MessageCircle, path: "/landlord/messages", color: "#2563eb" },
              { label: "Verify Identity", icon: BadgeCheck, path: "/verify", color: "#7c3aed", hide: isVerified },
            ]
              .filter((a) => !a.hide)
              .map(({ label, icon: Icon, path, color }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 hover:bg-[#f5f7f5] transition text-left"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: color + "18" }}
                  >
                    <Icon size={16} color={color} />
                  </div>
                  <span className="text-[12px] font-semibold text-gray-700">{label}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}