// FILE: src/components/listings/ListingCard.jsx

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Heart, MapPin, BadgeCheck,
  CheckCircle, AlertCircle, XCircle,
  LogIn, ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// ================================================
// FORMAT PRICE
// ================================================
const formatPrice = (price) =>
  new Intl.NumberFormat("en-PH").format(price || 0);

// ================================================
// IMAGE SLIDESHOW — arrows + touch swipe for mobile
// ================================================
function ImageSlideshow({ images, title }) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef(null);

  const prev = (e) => {
    e.stopPropagation();
    setCurrent((i) => (i === 0 ? images.length - 1 : i - 1));
  };

  const next = (e) => {
    e.stopPropagation();
    setCurrent((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  // ✅ Touch swipe support for mobile
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setCurrent((i) => (i === images.length - 1 ? 0 : i + 1));
      else          setCurrent((i) => (i === 0 ? images.length - 1 : i - 1));
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <img
        src={images[current]}
        alt={title}
        className="w-full h-full object-cover transition-opacity duration-200"
        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"; }}
      />

      {/* Arrows — only if more than 1 image */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center transition z-10 text-lg font-bold"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center transition z-10 text-lg font-bold"
          >
            ›
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`rounded-full transition-all ${
                  i === current
                    ? "bg-white w-3 h-1.5"
                    : "bg-white/50 w-1.5 h-1.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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
export default function ListingCard({
  listing,
  showTier = false,
  onUnsave = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { savedIds, toggleSave, isLoggedIn, isVerified } = useAuth();
  const { toast, showToast } = useToast();
  const savingRef = useRef(false);

  // Derive saved state from global AuthContext
  const isSaved = savedIds ? savedIds.includes(listing.id) : false;

  // ================================================
  // SAFE DATA
  // ================================================
  const STORAGE = `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/`;

  // ✅ Build images array from listing_images table or fallback to single image
  const allImages = listing.images?.length > 0
    ? listing.images.map((img) => STORAGE + img.image_path)
    : listing.image && listing.image !== ""
      ? [STORAGE + listing.image]
      : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"];

  const price = Number(listing.price || 0);

  const locationText = listing.barangay
    ? `${listing.barangay}, Angeles City`
    : listing.address || "Angeles City";

  const propertyType = listing.property_type || "Property";

  const landlordName = listing.landlord
    ? `${listing.landlord.first_name || ""} ${listing.landlord.last_name || ""}`.trim()
    : "Property Owner";

  const landlordInitial =
    listing.landlord?.first_name?.charAt(0) || "P";

  // ================================================
  // TIER STYLE
  // ================================================
  const getTierStyle = () => {
    if (!listing.tier) return null;
    switch (listing.tier) {
      case "Highly Affordable":
        return { bg: "bg-green-600", icon: <CheckCircle size={12} /> };
      case "Moderately Affordable":
        return { bg: "bg-amber-500", icon: <AlertCircle size={12} /> };
      case "Financially Risky":
        return { bg: "bg-red-500", icon: <XCircle size={12} /> };
      default:
        return null;
    }
  };

  const tierStyle = getTierStyle();

  // ================================================
  // HANDLERS
  // ================================================
  const handleCardClick = () => {
    navigate(`/listing/${listing.id}`);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (savingRef.current) return;

    // Not logged in
    if (!isLoggedIn) {
      showToast("Please login to save listings", "info", LogIn);
      setTimeout(() => {
        navigate("/login", { state: { background: location } });
      }, 1500);
      return;
    }

    // Not verified
    if (!isVerified) {
      showToast("Verify your identity to save listings", "warning", ShieldCheck);
      setTimeout(() => {
        navigate("/verify");
      }, 1500);
      return;
    }

    savingRef.current = true;

    try {
      const wasSaved = isSaved;
      await toggleSave(listing.id);

      if (wasSaved) {
        showToast("Removed from saved listings", "info", Heart);
        if (onUnsave) onUnsave(listing.id);
      } else {
        showToast("Added to saved listings!", "success", Heart);
      }
    } catch (err) {
      console.error("SAVE ERROR:", err);
      showToast("Something went wrong. Try again.", "error", XCircle);
    } finally {
      savingRef.current = false;
    }
  };

  // ================================================
  // RENDER
  // ================================================
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

      {/* CARD */}
      <div
        onClick={handleCardClick}
        className="
          bg-white rounded-[20px] border border-gray-100
          shadow-[0_2px_8px_rgba(0,0,0,0.06)]
          overflow-hidden cursor-pointer
          transition-all duration-300
          hover:-translate-y-1
          hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]
          hover:border-green-200
        "
      >
        {/* IMAGE SLIDESHOW */}
        <div className="relative w-full aspect-[4/3]">
          <ImageSlideshow images={allImages} title={listing.title} />

          {/* TIER BADGE */}
          {showTier && listing.tier && tierStyle && (
            <div
              className={`
                absolute top-3 left-3 ${tierStyle.bg}
                text-white text-[11px] font-semibold
                px-3 py-1 rounded-full
                flex items-center gap-1
              `}
            >
              {tierStyle.icon}
              {listing.tier}
            </div>
          )}

          {/* HEART BUTTON */}
          <button
            onClick={handleSave}
            title={isSaved ? "Remove from saved" : "Save listing"}
            className="
              absolute top-3 right-3
              w-9 h-9 bg-white rounded-full
              flex items-center justify-center
              shadow-md hover:scale-110
              transition-all active:scale-95
            "
          >
            <Heart
              size={18}
              className={
                isSaved
                  ? "text-red-500 fill-red-500"
                  : "text-gray-400"
              }
            />
          </button>

          {/* VERIFIED BADGE */}
          {listing.is_verified && (
            <div className="
              absolute bottom-3 left-3
              bg-white/90 text-green-700
              text-[10px] px-2 py-1 rounded-full
              flex items-center gap-1
            ">
              <BadgeCheck size={12} />
              Verified
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="p-[14px_16px_16px]">

          {/* TITLE + PRICE */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-sm font-bold text-gray-800 line-clamp-1 flex-1">
              {listing.title || "Untitled Property"}
            </h3>
            <div className="text-right shrink-0">
              <span
                className="text-sm font-bold"
                style={{ color: "#000000" }}
              >
                ₱{formatPrice(price)}
              </span>
              <span className="text-[10px] text-gray-400 block">
                /month
              </span>
            </div>
          </div>

          {/* LOCATION */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            <span className="text-xs text-gray-500 line-clamp-1">
              {locationText}
            </span>
          </div>

          {/* PROPERTY TYPE */}
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#f0fdf4", color: "#3d6b35" }}
            >
              {propertyType}
            </span>
            {/* ✅ Show available slots for multi-tenant types */}
            {["Dormitory", "Boarding House", "Bedspace"].includes(propertyType) &&
              listing.available_slots != null && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                🛏 {listing.available_slots} slot{listing.available_slots !== 1 ? "s" : ""} left
              </span>
            )}
          </div>

          <hr className="my-3 border-gray-100" />

          {/* LANDLORD + VIEW DETAILS */}
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
              onClick={(e) => {
                e.stopPropagation();
                if (listing.landlord?.id) navigate(`/landlord-profile/${listing.landlord.id}`);
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border border-green-100"
                style={{ background: "#dcfce7", color: "#3d6b35" }}
              >
                {listing.landlord?.profile_picture ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL.replace("/api", "")}/storage/${listing.landlord.profile_picture}`}
                    alt={landlordName}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  landlordInitial
                )}
              </div>
              <span className="text-xs text-gray-500 line-clamp-1">
                {landlordName}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/listing/${listing.id}`);
              }}
              className="text-xs font-semibold hover:underline shrink-0"
              style={{ color: "#3d6b35" }}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </>
  );
}