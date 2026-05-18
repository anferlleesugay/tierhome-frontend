// FILE: src/pages/AdminVerification.jsx
// ✅ FIX #1: Corrected pagination data extraction
// ✅ FIX #2: Removed hardcoded localhost URL

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle, XCircle, Clock,
  AlertCircle, RefreshCw, Loader,
  User, BadgeCheck, Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
// ✅ FIX #2: REMOVED HARDCODED LOCALHOST - NOW DYNAMIC
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

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);
  const showToast = (message, type = "info", icon = null) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, icon });
    timerRef.current = setTimeout(() => setToast(null), 3000);
  };
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);
  return { toast, showToast };
}

function ScoreBadge({ score }) {
  if (score >= 90) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
        <BadgeCheck size={12} /> Auto Verified · {Math.round(score)}%
      </span>
    );
  }
  if (score >= 70) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700">
        <AlertCircle size={12} /> {Math.round(score)}% Match
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
      <XCircle size={12} /> Low Confidence · {Math.round(score)}%
    </span>
  );
}

function ScoreBar({ score }) {
  const color = score >= 90 ? "#3d6b35" : score >= 70 ? "#d97706" : "#ef4444";
  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          Face Similarity Score
        </span>
        <span className="text-[12px] font-bold" style={{ color }}>
          {Math.round(score)}%
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}

function VerificationCard({ item, onApprove, onReject, processing }) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reason, setReason] = useState("");

  const user = item.user || {};
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  const initials = user.first_name?.charAt(0) || "U";

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-PH", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  const idUrl = item.id_photo_path ? `${STORAGE}${item.id_photo_path}` : null;
  const selfieUrl = item.selfie_path ? `${STORAGE}${item.selfie_path}` : null;

  return (
    <div className="bg-white rounded-2xl p-5"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base shrink-0"
            style={{ background: "#dcfce7", color: "#3d6b35" }}>
            {initials}
          </div>
          <div>
            <p className="text-[14px] font-bold text-gray-900">{fullName || "Unknown User"}</p>
            <p className="text-[12px] text-gray-400">{user.email || ""}</p>
            <p className="text-[11px] text-gray-400">{user.phone_number || ""}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <ScoreBadge score={item.rekognition_score || 0} />
          <p className="text-[11px] text-gray-400 mt-1.5">
            {formatDate(item.created_at)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Government ID
          </p>
          {idUrl ? (
            <div className="relative group">
              <img src={idUrl} alt="Government ID"
                className="w-full h-[140px] object-cover rounded-xl border border-gray-100"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <a href={idUrl} target="_blank" rel="noreferrer"
                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                <div className="bg-white rounded-full p-2">
                  <Eye size={16} className="text-gray-700" />
                </div>
              </a>
            </div>
          ) : (
            <div className="w-full h-[140px] rounded-xl bg-gray-100 flex items-center justify-center">
              <User size={24} className="text-gray-300" />
            </div>
          )}
        </div>

        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Selfie Photo
          </p>
          {selfieUrl ? (
            <div className="relative group">
              <img src={selfieUrl} alt="Selfie"
                className="w-full h-[140px] object-cover rounded-xl border border-gray-100"
                onError={(e) => { e.target.style.display = "none"; }}
              />
              <a href={selfieUrl} target="_blank" rel="noreferrer"
                className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                <div className="bg-white rounded-full p-2">
                  <Eye size={16} className="text-gray-700" />
                </div>
              </a>
            </div>
          ) : (
            <div className="w-full h-[140px] rounded-xl bg-gray-100 flex items-center justify-center">
              <User size={24} className="text-gray-300" />
            </div>
          )}
        </div>
      </div>

      <ScoreBar score={item.rekognition_score || 0} />

      {showRejectInput && (
        <div className="mt-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter rejection reason (e.g. ID photo unclear, face not matching)..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
          />
        </div>
      )}

      <div className="flex gap-2 mt-4">
        {!showRejectInput ? (
          <>
            <button
              onClick={() => onApprove(item.id)}
              disabled={processing === item.id}
              className="flex-1 h-[44px] rounded-xl text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: processing === item.id ? "#86a886" : "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)",
                cursor: processing === item.id ? "not-allowed" : "pointer",
                boxShadow: processing === item.id ? "none" : "0 4px 12px rgba(61,107,53,0.3)",
              }}
            >
              {processing === item.id ? <Loader size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Approve
            </button>

            <button
              onClick={() => setShowRejectInput(true)}
              disabled={processing === item.id}
              className="flex-1 h-[44px] rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: processing === item.id ? "#f5f5f5" : "white",
                color: processing === item.id ? "#999" : "#ef4444",
                border: "1.5px solid #fee2e2",
                cursor: processing === item.id ? "not-allowed" : "pointer",
              }}
            >
              {processing === item.id ? <Loader size={15} className="animate-spin" /> : <XCircle size={15} />}
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onReject(item.id, reason)}
              disabled={processing === item.id}
              className="flex-1 h-[44px] rounded-xl text-white text-[13px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: processing === item.id ? "#ef9999" : "#ef4444",
                cursor: processing === item.id ? "not-allowed" : "pointer",
                boxShadow: processing === item.id ? "none" : "0 4px 12px rgba(239,68,68,0.3)",
              }}
            >
              {processing === item.id ? <Loader size={15} className="animate-spin" /> : <CheckCircle size={15} />}
              Confirm Reject
            </button>

            <button
              onClick={() => { setShowRejectInput(false); setReason(""); }}
              disabled={processing === item.id}
              className="flex-1 h-[44px] rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
              style={{
                background: "white",
                color: "#666",
                border: "1.5px solid #e5e7eb",
                cursor: processing === item.id ? "not-allowed" : "pointer",
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewedCard({ item }) {
  const user = item.user || {};
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
  const initials = user.first_name?.charAt(0) || "U";

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-PH", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const statusConfig = {
    approved: { bg: "#f0fdf4", color: "#3d6b35", icon: "✓" },
    verified: { bg: "#f0fdf4", color: "#3d6b35", icon: "✓" },
    rejected: { bg: "#fef2f2", color: "#ef4444", icon: "✕" },
    pending: { bg: "#fef3c7", color: "#d97706", icon: "⏳" },
  };

  const config = statusConfig[item.status] || statusConfig.pending;

  return (
    <div className="bg-white rounded-xl p-4 flex items-center justify-between border border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
          style={{ background: "#dcfce7", color: "#3d6b35" }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-gray-900">{fullName || "Unknown User"}</p>
          <p className="text-[12px] text-gray-400">{user.email || ""}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-[12px] font-bold" style={{ color: config.color }}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </p>
          <p className="text-[11px] text-gray-400">{formatDate(item.reviewed_at || item.verified_at)}</p>
        </div>
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: config.bg, color: config.color }}>
          {config.icon}
        </div>
      </div>
    </div>
  );
}

function SkeletonVerifCard() {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gray-100" />
          <div className="flex-1">
            <div className="h-4 bg-gray-100 rounded-xl mb-2 w-32" />
            <div className="h-3 bg-gray-100 rounded-xl w-24" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-[140px] bg-gray-100 rounded-xl" />
        <div className="h-[140px] bg-gray-100 rounded-xl" />
      </div>
      <div className="flex-1 h-[44px] bg-gray-100 rounded-xl mb-4" />
      <div className="flex gap-2">
        <div className="flex-1 h-[44px] bg-gray-100 rounded-xl" />
        <div className="flex-1 h-[44px] bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

// ================================================
// MAIN PAGE
// ================================================
export default function AdminVerification() {
  const navigate = useNavigate();

  const { token, isLoggedIn, role, loading: authLoading } = useAuth();
  const { toast, showToast } = useToast();

  const [pending, setPending] = useState([]);
  const [reviewed, setReviewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    if (role && role !== "admin") {
      navigate("/browse");
    }
  }, [isLoggedIn, role, authLoading, navigate]);

  // ✅ FIX #1: CORRECTED PAGINATION DATA EXTRACTION
  const fetchVerifications = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/verify/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // BEFORE (BROKEN):
      // const data = res.data?.data || res.data || [];
      // const allItems = Array.isArray(data) ? data : [];
      // This would always set allItems = [] because data is a pagination object, not an array

      // AFTER (FIXED):
      // Laravel pagination returns: { data: [...], current_page, total, ... }
      const paginatedResponse = res.data?.data || {};
      const allItems = Array.isArray(paginatedResponse.data)
        ? paginatedResponse.data
        : [];

      setPending(allItems.filter(v => v.status === "pending"));
      setReviewed(
        allItems
          .filter(v =>
            v.status === "verified" ||
            v.status === "approved" ||
            v.status === "rejected"
          )
          .slice(0, 10)
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to load verifications", "error", AlertCircle);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && token && role === "admin") {
      fetchVerifications();
    }
  }, [token, role, authLoading]);

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await axios.post(
        `${API}/admin/verify/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPending(prev => prev.filter(v => v.id !== id));
      showToast("Verification approved successfully", "success", CheckCircle);
      fetchVerifications();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to approve",
        "error", XCircle
      );
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id, reason) => {
    setProcessing(id);
    try {
      await axios.post(
        `${API}/admin/verify/${id}/reject`,
        { reason: reason || "Verification rejected by admin." },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPending(prev => prev.filter(v => v.id !== id));
      showToast("Verification rejected", "info", XCircle);
      fetchVerifications();
    } catch (err) {
      showToast(
        err.response?.data?.message || "Failed to reject",
        "error", AlertCircle
      );
    } finally {
      setProcessing(null);
    }
  };

  if (authLoading) return null;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          icon={toast.icon}
        />
      )}

      <div className="min-h-screen bg-gray-50 pb-16">

        <div className="bg-white border-b border-gray-100 px-5 md:px-10 py-6">
          <div className="max-w-[1000px] mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-bold text-gray-900">
                Verification Queue
              </h1>
              <p className="text-[13px] text-gray-500 mt-0.5">
                Review pending identity verification submissions
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!loading && pending.length > 0 && (
                <span
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "#fef3c7", color: "#d97706" }}
                >
                  <Clock size={13} />
                  {pending.length} pending
                </span>
              )}
              <button
                onClick={() => {
                  showToast("Refreshing...", "info", RefreshCw);
                  fetchVerifications();
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 transition"
              >
                <RefreshCw size={15} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-[1000px] mx-auto px-5 md:px-10 pt-6">

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2].map(i => <SkeletonVerifCard key={i} />)}
            </div>
          )}

          {!loading && pending.length === 0 && reviewed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "#f0fdf4" }}>
                <CheckCircle size={38} style={{ color: "#3d6b35" }} />
              </div>
              <h3 className="text-[18px] font-bold text-gray-800 mb-2">
                All caught up!
              </h3>
              <p className="text-[13px] text-gray-500 max-w-xs">
                No verification submissions yet.
              </p>
            </div>
          )}

          {!loading && pending.length > 0 && (
            <div>
              <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-4">
                Pending Review ({pending.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                {pending.map(item => (
                  <VerificationCard
                    key={item.id}
                    item={item}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    processing={processing}
                  />
                ))}
              </div>
            </div>
          )}

          {!loading && reviewed.length > 0 && (
            <div>
              <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider mb-4">
                Recently Reviewed
              </h2>
              <div className="space-y-2">
                {reviewed.map(item => (
                  <ReviewedCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}