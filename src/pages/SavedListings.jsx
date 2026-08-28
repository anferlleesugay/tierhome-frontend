// FILE: src/pages/SavedListings.jsx

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Heart, AlertCircle, RefreshCw,
  ShieldAlert, ArrowRight,
} from "lucide-react";

import ListingCard from "../components/listings/ListingCard";
import SkeletonCard from "../components/listings/SkeletonCard";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

// ================================================
// TOAST COMPONENT
// ================================================
function Toast({ message, type, icon: Icon }) {
  if (!message) return null;

  const styles = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-600",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    info: "bg-blue-50 border-blue-200 text-blue-600",
  };

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2
        z-[999] flex items-center gap-2.5
        px-4 py-3 rounded-2xl border
        text-sm font-medium animate-fade-in
        ${styles[type] || styles.info}
      `}
      style={{
        minWidth: "240px",
        maxWidth: "340px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        backdropFilter: "blur(8px)",
      }}
    >
      {Icon && <Icon size={16} className="shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

// ================================================
// HOOK: useToast
// ================================================
function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = (message, type = "info", icon = null) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, icon });
    timerRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, showToast };
}

// ================================================
// MAIN COMPONENT
// ================================================
export default function SavedListings() {
  const navigate = useNavigate();
  const { token, isLoggedIn, isVerified } = useAuth();
  const { toast, showToast } = useToast();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingIds, setRemovingIds] = useState([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  // Fetch saved listings
  const fetchSaved = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = res.data?.data || [];
      const mapped = raw.map((item) => item.listing).filter(Boolean);
      setListings(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to load saved listings");
      showToast("Failed to load saved listings", "error", AlertCircle);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSaved();
  }, [token]);

  // Remove card with fade out animation
  const removeFromList = (id) => {
    setRemovingIds((prev) => [...prev, id]);
    showToast("Removed from saved listings", "info", Heart);
    setTimeout(() => {
      setListings((prev) => prev.filter((l) => l.id !== id));
      setRemovingIds((prev) => prev.filter((x) => x !== id));
    }, 300);
  };

  return (
    <>
      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          icon={toast.icon}
        />
      )}

      <div className="bg-gray-50 min-h-full">

        {/* HEADER */}
        <div className="px-5 md:px-10 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Saved Listings
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Properties you saved in Angeles City
            </p>
          </div>

          {!loading && listings.length > 0 && (
            <div className="hidden md:flex items-center gap-2">
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: "#dcfce7", color: "#3d6b35" }}
              >
                {listings.length}{" "}
                {listings.length === 1 ? "property" : "properties"} saved
              </span>
            </div>
          )}
        </div>

        {/* VERIFY BANNER */}
        {!isVerified && (
          <div className="mx-5 md:mx-10 mb-5">
            <div
              className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border"
              style={{
                background: "#fffbeb",
                borderColor: "#fde68a",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#fef3c7" }}
                >
                  <ShieldAlert size={18} color="#d97706" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Identity verification required
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Complete verification to unlock messaging
                    and reservations
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/verify")}
                className="flex items-center gap-1.5 text-xs font-bold shrink-0 px-4 py-2 rounded-xl transition-all"
                style={{
                  background: "#d97706",
                  color: "white",
                }}
              >
                Verify now
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* CONTENT */}
        <div className="px-5 md:px-10 pb-10">

          {/* LOADING */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "#fef2f2" }}
              >
                <AlertCircle size={28} color="#ef4444" />
              </div>
              <p className="text-base font-semibold text-gray-800 mb-1">
                Failed to load saved listings
              </p>
              <p className="text-sm text-gray-500 mb-5">
                Something went wrong. Please try again.
              </p>
              <button
                onClick={() => {
                  showToast("Retrying...", "info", RefreshCw);
                  fetchSaved();
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold transition-all"
                style={{
                  background: "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)",
                  boxShadow: "0 4px 12px rgba(61,107,53,0.3)",
                }}
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          )}

          {/* EMPTY */}
          {!loading && !error && listings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "#f0fdf4" }}
              >
                <Heart size={36} color="#3d6b35" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                No saved listings yet
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">
                Start browsing and tap the heart icon on
                properties you like
              </p>
              <button
                onClick={() => navigate("/browse")}
                className="flex items-center gap-2 px-7 py-3 rounded-full text-white font-semibold text-sm transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #3d6b35 0%, #2d5a27 100%)",
                  boxShadow: "0 4px 12px rgba(61,107,53,0.3)",
                }}
              >
                Browse Listings
                <ArrowRight size={15} />
              </button>
            </div>
          )}

          {/* SUCCESS — listing grid */}
          {!loading && !error && listings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => {
                const isRemoving = removingIds.includes(listing.id);
                return (
                  <div
                    key={listing.id}
                    className="transition-all duration-300"
                    style={{
                      opacity: isRemoving ? 0 : 1,
                      transform: isRemoving
                        ? "scale(0.95)"
                        : "scale(1)",
                    }}
                  >
                    <ListingCard
                      listing={listing}
                      showTier={false}
                      initialSaved={true}
                      onUnsave={(id) => removeFromList(id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}