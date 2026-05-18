// FILE: src/pages/AdminDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Shield, Users, Building, Clock,
  CheckCircle, XCircle, ChevronRight,
  LogOut, BarChart2, BadgeCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
const STORAGE = `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

function StatCard({ icon: Icon, label, value, color, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left w-full relative overflow-hidden"
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
      {badge > 0 && (
        <span className="absolute top-3 right-10 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </button>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  const [pending, setPending] = useState({ verifications: 0, listings: 0 });
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    Promise.allSettled([
      axios.get(`${API}/admin/verify/pending`, { headers }),
      axios.get(`${API}/admin/listings/pending`, { headers }),
    ]).then(([ver, lst]) => {
      const verData = ver.value?.data?.data?.data || [];
      const lstData = lst.value?.data?.data?.data || [];
      setPending({ verifications: verData.length, listings: lstData.length });
      setRecentVerifications(verData.slice(0, 4));
      setRecentListings(lstData.slice(0, 4));
    }).finally(() => setLoading(false));
  }, [token]);

  const handleLogout = () => { logout(); navigate("/"); };

  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[#f5f7f5] pb-28">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#3d6b35]/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-[#3d6b35]">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-gray-400 font-medium">Admin Dashboard</p>
              <h1 className="text-[20px] font-bold text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600">
                <Shield size={12} /> System Administrator
              </span>
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

      <div className="max-w-2xl mx-auto px-4 mt-5 space-y-4">

        {/* Overview Label */}
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">System Overview</p>

        {/* Stat Cards */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-[68px] bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <StatCard
              icon={BadgeCheck}
              label="Pending Verifications"
              value={pending.verifications}
              color="#d97706"
              badge={pending.verifications}
              onClick={() => navigate("/admin/verification")}
            />
            <StatCard
              icon={Building}
              label="Pending Listings"
              value={pending.listings}
              color="#2563eb"
              badge={pending.listings}
              onClick={() => navigate("/admin/listings")}
            />
            <StatCard
              icon={BarChart2}
              label="Analytics & Audit"
              value="View"
              color="#7c3aed"
              onClick={() => navigate("/admin/analytics")}
            />
          </div>
        )}

        {/* Recent Pending Verifications */}
        {!loading && recentVerifications.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                Recent Pending Verifications
              </p>
              <button
                onClick={() => navigate("/admin/verification")}
                className="text-[11px] font-semibold text-[#3d6b35] flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentVerifications.map((item) => {
                const u = item.user || {};
                const score = item.similarity_score || 0;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Clock size={15} color="#d97706" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">
                        {u.first_name} {u.last_name}
                      </p>
                      <p className="text-[11px] text-gray-400 capitalize">{u.role} · {formatDate(item.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-[12px] font-bold"
                        style={{ color: score >= 90 ? "#3d6b35" : score >= 70 ? "#d97706" : "#ef4444" }}
                      >
                        {Math.round(score)}%
                      </p>
                      <p className="text-[10px] text-gray-400">match</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Pending Listings */}
        {!loading && recentListings.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide">
                Recent Pending Listings
              </p>
              <button
                onClick={() => navigate("/admin/listings")}
                className="text-[11px] font-semibold text-[#3d6b35] flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentListings.map((listing) => {
                return (
                  <div key={listing.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {(() => {
                        const imgUrl = listing.images?.length > 0
                          ? STORAGE + listing.images[0].image_path
                          : listing.image ? STORAGE + listing.image : null;
                        return imgUrl
                          ? <img src={imgUrl} alt={listing.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Building size={14} className="text-gray-300" /></div>;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 truncate">{listing.title}</p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {listing.landlord?.first_name} {listing.landlord?.last_name} · {listing.barangay}
                      </p>
                    </div>
                    <p className="text-[12px] font-bold text-[#3d6b35] shrink-0">
                      ₱{Number(listing.price).toLocaleString("en-PH")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Review Verifications", icon: BadgeCheck, path: "/admin/verification", color: "#d97706" },
              { label: "Moderate Listings",    icon: Building,  path: "/admin/listings",      color: "#2563eb" },
              { label: "Amenity Requests",     icon: BarChart2, path: "/admin/amenities",     color: "#3d6b35" },
              { label: "Analytics",            icon: BarChart2, path: "/admin/analytics",     color: "#7c3aed" },
            ].map(({ label, icon: Icon, path, color }) => (
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