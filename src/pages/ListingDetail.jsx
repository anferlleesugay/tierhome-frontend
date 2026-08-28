import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin, Heart, BadgeCheck, MessageCircle, Calendar,
  Wifi, Car, Utensils, UtensilsCrossed, Wind, Tv, Shirt, X, ChevronLeft, ChevronRight, ArrowLeft,
  Droplets, Dumbbell, Lock, Flame, Music, Leaf, Zap, Home as HomeIcon,
  Baby, Mountain, Sofa, CheckCircle, AlertCircle, Loader, Star, Accessibility,
  Coffee, BookOpen, Monitor, Sun, Camera, Bed, Bath, Bus, Phone,
  ShieldCheck, Bike, Plug, Thermometer, Package,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// ✅ Maps amenity icon string → Lucide component
const AMENITY_ICON_MAP = {
  // icon key → component
  wifi: Wifi, car: Car, utensils: UtensilsCrossed, utensils2: UtensilsCrossed,
  wind: Wind, tv: Tv, shirt: Shirt, droplets: Droplets, dumbbell: Dumbbell,
  home: HomeIcon, lock: Lock, flame: Flame, music: Music, leaf: Leaf, zap: Zap,
  mountain: Mountain, sofa: Sofa, baby: Baby, star: Star,
  coffee: Coffee, book: BookOpen, monitor: Monitor, sun: Sun, camera: Camera,
  bed: Bed, bath: Bath, bus: Bus, phone: Phone, shield: ShieldCheck,
  bike: Bike, plug: Plug, thermometer: Thermometer, package: Package,
  // aliases
  parking: Car, aircon: Wind, kitchen: UtensilsCrossed, laundry: Shirt,
  pool: Droplets, gym: Dumbbell, balcony: HomeIcon, security: Lock,
  heating: Flame, soundsystem: Music, garden: Leaf, highspeed: Zap,
  outdoor: Mountain, accessibility: Accessibility,
  // label fallbacks
  "wifi": Wifi, "free parking": Car, "kitchen": UtensilsCrossed, "air conditioning": Wind,
  "tv": Tv, "washer/dryer": Shirt, "swimming pool": Droplets, "gym": Dumbbell,
  "balcony": HomeIcon, "24/7 security": Lock, "heating": Flame, "sofa": Sofa,
  "sound system": Music, "garden": Leaf, "wheelchair access": Accessibility,
  "crib": Baby, "outdoor space": Mountain, "high speed internet": Zap,
};

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;
const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const formatPrice = (price) =>
  "₱" + Number(price || 0).toLocaleString("en-PH");

const getListingImageUrl = (listing) => {
  if (!listing) return null;
  const STORAGE = `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/`;
  if (listing.images?.length > 0) return STORAGE + listing.images[0].image_path;
  if (listing.image) return STORAGE + listing.image;
  return null;
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, isVerified, toggleSave, savedIds, token, user, loading: authLoading } = useAuth();

  const [listing,    setListing]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [notAllowed, setNotAllowed] = useState(null); // error message

  // gallery states
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveStep,      setReserveStep]      = useState("terms"); // terms | form | success
  const [moveInDate,       setMoveInDate]       = useState("");
  const isSafariBrowser = typeof navigator !== "undefined" &&
    /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent);
  const [moveOutDate,      setMoveOutDate]      = useState("");
  const [reserveNotes,     setReserveNotes]     = useState("");
  const [termsAccepted,    setTermsAccepted]    = useState(false);
  const [reserving,        setReserving]        = useState(false);
  const [reserveError,     setReserveError]     = useState("");
  const [currentReservationId, setCurrentReservationId] = useState(null);
  const [payingNow,        setPayingNow]        = useState(false);
  const [paymentError,     setPaymentError]     = useState("");

  const openReserveModal = () => {
      setReserveStep("terms");
      setReserveError("");
      setMoveInDate("");
      setMoveOutDate("");
      setReserveNotes("");
      setTermsAccepted(false);
      setShowReserveModal(true);
    };
  const closeReserveModal = () => {
    setShowReserveModal(false);
    setReserveStep("terms");
  };
  const [index,       setIndex]       = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [viewerOpen,  setViewerOpen]  = useState(false);

  const isSaved = savedIds.includes(Number(id));

  const handleReserve = async () => {
    if (!termsAccepted) {
      setReserveError("Please confirm you have read and agree to the house rules & policies.");
      return;
    }
    setReserveError("");
    setReserving(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/reserve/${id}`,
        { move_in_date: moveInDate || null, move_out_date: moveOutDate || null, notes: reserveNotes || null, terms_accepted: termsAccepted },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newReservationId = res.data?.data?.id;
      setCurrentReservationId(newReservationId);

      // If this listing requires a reservation fee, go to the payment step instead of straight to success
      if (listing.reservation_fee && Number(listing.reservation_fee) > 0) {
        setReserveStep("payment");
      } else {
        setReserveStep("success");
      }
    } catch (err) {
      setReserveError(err.response?.data?.message || "Failed to submit reservation.");
    } finally { setReserving(false); }
  };

const handlePay = async () => {
    setPaymentError("");
    setPayingNow(true);
    try {
      // Create a Xendit Invoice on our backend (sandbox/test mode)
      const intentRes = await axios.post(`${import.meta.env.VITE_API_URL}/reservation/${currentReservationId}/pay`,
        {}, { headers: { Authorization: `Bearer ${token}` } });

      const { invoice_url } = intentRes.data.data;

      if (invoice_url) {
        // Send the tenant to Xendit's hosted sandbox checkout page.
        // Using replace() instead of href so this leg doesn't sit as its
        // own entry in browser history (avoids landing back on a stale
        // Xendit page if the user presses Back after payment completes).
        window.location.replace(invoice_url);
      } else {
        setPaymentError("Could not start the sandbox payment. Please try again.");
        setPayingNow(false);
      }

    } catch (err) {
      setPaymentError(err.response?.data?.message || "Payment could not be started. Please try again.");
      setPayingNow(false);
    }
  };
  useEffect(() => {
    // ✅ Handle tenant returning from Xendit's sandbox checkout page
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_return') === '1' && params.get('reservation_id') && token) {
      const resId = params.get('reservation_id');
      setCurrentReservationId(resId);
      setShowReserveModal(true);
      setReserveStep('payment');
      setPayingNow(true);

      axios.post(`${import.meta.env.VITE_API_URL}/reservation/${resId}/confirm-payment`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (res.data?.data?.payment_status === 'paid') {
          setReserveStep('success');

          // Xendit's own return redirect just pushed a fresh history entry
          // directly on top of their checkout page. A single Back press
          // from here would land the tenant right back on that stale,
          // already-used payment page. Trap it: push one extra entry now,
          // and if the tenant presses Back, immediately forward them past
          // the Xendit entry to a safe in-app screen instead of letting
          // it render.
          window.history.pushState({ tierhomePaymentDone: true }, '', `/listing/${id}`);
          const handlePopState = () => {
            navigate('/tenant/reservations', { replace: true });
          };
          window.addEventListener('popstate', handlePopState);
          return () => window.removeEventListener('popstate', handlePopState);
        } else {
          setPaymentError("Payment was not completed. You can try again below.");
        }
      }).catch(() => {
        setPaymentError("We couldn't confirm your payment status. Please check My Reservations.");
      }).finally(() => {
        setPayingNow(false);
        // Clean the URL so refreshing doesn't re-trigger this
        window.history.replaceState({}, '', `/listing/${id}`);
      });
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return; // wait for auth to resolve first
    const fetchListing = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API}/listings/${id}`, { headers });
        const fetchedListing = res.data.data;

        // ✅ Landlords may only preview their OWN listing — never another
        // landlord's, even with the ?preview=1 flag. Admin can still view any.
        if (user?.role === "landlord" && fetchedListing.landlord_id !== user.id) {
          setNotAllowed("You can only preview your own listings.");
        } else {
          setListing(fetchedListing);
        }
      } catch (err) {
        const status = err.response?.status;
        const msg    = err.response?.data?.message;
        if (status === 403) {
          setNotAllowed(msg || "This listing is not available.");
        } else if (status === 404) {
          setNotAllowed("Listing not found.");
        } else {
          setNotAllowed("Failed to load listing. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, token, authLoading]);

  if (loading) return <div className="p-10 text-center text-gray-400">Loading...</div>;

  if (notAllowed) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <MapPin size={36} className="text-gray-300" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Listing Unavailable</h2>
      <p className="text-gray-500 mb-6 max-w-xs">{notAllowed}</p>
      <button onClick={() => navigate("/browse")}
        className="px-6 py-3 bg-[#3d6b35] text-white rounded-xl font-semibold hover:bg-[#2d5525] transition">
        Browse Other Listings
      </button>
    </div>
  );

  const landlord = listing.landlord || {};

  const allImages = listing.images?.length > 0
    ? listing.images.map((img) => STORAGE + img.image_path)
    : listing.image
      ? [STORAGE + listing.image]
      : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200"];

  const images = allImages;

  const openViewer = (i) => {
    setIndex(i);
    setViewerOpen(true);
  };

  return (
    <div className="bg-[#fafafa] min-h-screen pb-24">

      {/* ================= MOBILE GALLERY + BACK ================= */}
      <div className="md:hidden relative">

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow"
        >
          <ArrowLeft size={18} />
        </button>

        {/* IMAGE SCROLL */}
        <div
          className="flex overflow-x-auto snap-x"
          onScroll={(e) => {
            const scrollLeft = e.target.scrollLeft;
            const width = e.target.clientWidth;
            const i = Math.round(scrollLeft / width);
            setMobileIndex(i);
          }}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${listing.title} - photo ${i + 1}`}
              onClick={() => openViewer(i)}
              className="w-full h-72 object-cover flex-shrink-0 snap-center"
            />
          ))}
        </div>

        {/* COUNTER */}
        <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
          {mobileIndex + 1} / {images.length}
        </div>
      </div>

      {/* ================= DESKTOP HEADER ================= */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 pt-6">

        <h1 className="text-3xl font-semibold text-gray-900">
          {listing.title}
        </h1>

        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <MapPin size={14} />
          {(() => { const addr = listing.address || ""; const already = listing.barangay && addr.toLowerCase().includes(listing.barangay.toLowerCase()); return [addr, already ? null : listing.barangay, "Angeles City"].filter(Boolean).join(", "); })()}
          {listing.is_verified && (
            <span className="flex items-center gap-1 text-[#3d6b35] ml-2 font-medium">
              <BadgeCheck size={14} /> Verified
            </span>
          )}
        </div>

        {/* DESKTOP GALLERY */}
        <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden mt-6 h-[460px] relative">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${listing.title} - photo ${i + 1}`}
              onClick={() => openViewer(i)}
              className={`object-cover w-full h-full cursor-pointer hover:brightness-95 ${
                i === 0 ? "col-span-2 row-span-2" : ""
              }`}
            />
          ))}

          <button
            onClick={() => setViewerOpen(true)}
            className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-xl shadow text-sm"
          >
            View all photos
          </button>
        </div>
      </div>

      {/* ================= CONTENT ================= */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-6 grid lg:grid-cols-3 gap-10">

        {/* Mobile title + address */}
        <div className="lg:hidden lg:col-span-2 mb-2">
          <h1 className="text-2xl font-semibold text-gray-900">{listing.title}</h1>
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin size={13} />
            {(() => { const addr = listing.address || ""; const already = listing.barangay && addr.toLowerCase().includes(listing.barangay.toLowerCase()); return [addr, already ? null : listing.barangay, "Angeles City"].filter(Boolean).join(", "); })()}
          </div>
        </div>

        {/* LEFT */}
        <div className="lg:col-span-2 space-y-10">

          {/* LANDLORD PROFILE CARD */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">
              {listing.property_type} hosted by {landlord.first_name || "Property Owner"}
            </h2>
            <div
              onClick={() => landlord.id && navigate(`/landlord-profile/${landlord.id}`)}
              className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-[#3d6b35] hover:bg-green-50 transition cursor-pointer group"
            >
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full overflow-hidden bg-green-100 flex items-center justify-center shrink-0 border-2 border-green-200">
                {landlord.profile_picture ? (
                  <img
                    src={`${STORAGE}${landlord.profile_picture}`}
                    alt={landlord.first_name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                ) : (
                  <span className="text-xl font-bold text-[#3d6b35]">
                    {landlord.first_name?.charAt(0) || "L"}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">
                  {landlord.first_name} {landlord.last_name}
                </p>
                {landlord.verification_status === "verified" && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                    ✅ Verified Property Owner
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  Click to view profile & other listings
                </p>
              </div>

              <span className="text-[#3d6b35] text-sm font-semibold group-hover:underline shrink-0">
                View →
              </span>
            </div>
          </div>

          <div className="border-b pb-6">
            <h3 className="font-semibold mb-2">About this place</h3>
            <p className="text-sm text-gray-600">
              {listing.description}
            </p>
          </div>

          {listing.terms_and_conditions && (
            <div className="border-b pb-6">
              <h3 className="font-semibold mb-2">House Rules & Policies</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {listing.terms_and_conditions}
              </p>
            </div>
          )}

          <div className="border-b pb-6">
            <h3 className="font-semibold mb-4">What this place offers</h3>
            {listing.amenities?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {listing.amenities.map((amenity) => {
                  const name = amenity.name || amenity.label || amenity;
                  const IconComponent = AMENITY_ICON_MAP[amenity.icon] || AMENITY_ICON_MAP[name?.toLowerCase()] || null;
                  return (
                    <div key={amenity.id || name} className="flex items-center gap-2 text-gray-700">
                      {IconComponent
                        ? <IconComponent size={18} className="text-[#3d6b35] shrink-0" />
                        : <span className="w-[18px] h-[18px] rounded-full bg-green-100 shrink-0 flex items-center justify-center text-[10px] text-[#3d6b35] font-bold">✓</span>
                      }
                      <span>{name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No amenities listed</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Where you'll be</h3>
            {listing.latitude && listing.longitude ? (
              <ListingMap
                lat={parseFloat(listing.latitude)}
                lng={parseFloat(listing.longitude)}
                title={listing.title}
              />
            ) : (
              <div className="h-60 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                <MapPin size={16} className="mr-2" /> Location not set
              </div>
            )}
          </div>

        </div>

        {/* RIGHT CARD */}
        <div className="sticky top-24 h-fit">
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">

            <h2 className="text-xl font-semibold">
              {formatPrice(listing.price)}
              <span className="text-sm text-gray-400 font-normal">/month</span>
            </h2>

            {/* ✅ Show slots for multi-tenant types */}
            {["Dormitory", "Boarding House", "Bedspace"].includes(listing.property_type) &&
              listing.available_slots != null && (
              <div className={`text-sm font-semibold px-3 py-2 rounded-xl flex items-center gap-2 ${
                listing.available_slots === 0
                  ? "bg-red-50 text-red-600"
                  : "bg-blue-50 text-blue-600"
              }`}>
                🛏 {listing.available_slots} of {listing.total_slots} slot{listing.total_slots !== 1 ? "s" : ""} available
              </div>
            )}

            {listing.status !== 'available' ? (
              <div className="w-full h-12 bg-gray-100 text-gray-400 rounded-xl flex items-center justify-center text-sm font-medium">
                Not Available
              </div>
            ) : (
              <button
                onClick={() => {
                  if (!isLoggedIn) return navigate("/login");
                  if (!isVerified) return navigate("/verify");
                  if (user?.role !== 'tenant') return;
                  openReserveModal();
                }}
                className="w-full h-12 bg-[#3d6b35] text-white rounded-xl font-semibold hover:bg-[#2d5525] transition"
              >
                Reserve
              </button>
            )}

            <button
              onClick={() => {
                if (!isLoggedIn) return navigate("/login");
                if (!isVerified) return navigate("/verify");
                navigate(`/tenant/messages?landlord=${listing.landlord?.id}&listing=${listing.id}`);
              }}
              className="w-full h-12 border rounded-xl text-[#3d6b35] font-medium hover:bg-green-50 transition"
            >
              Message Property Owner
            </button>

            <button
              onClick={() => toggleSave(Number(id))}
              className="w-full h-11 border rounded-xl"
            >
              <Heart
                className={isSaved ? "text-red-500 fill-red-500 inline mr-2" : "inline mr-2"}
              />
              {isSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* ================= VIEWER ================= */}
      {viewerOpen && (
        <ImageViewer
          images={images}
          index={index}
          setIndex={setIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* ✅ RESERVE MODAL */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => { if (!reserving) closeReserveModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden"
            onClick={(e) => e.stopPropagation()}>

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">
                {reserveStep === "terms" ? "House Rules & Policies" :
                 reserveStep === "payment" ? "Reservation Fee Payment" :
                 reserveStep === "success" ? "Request Sent!" : "Reserve Property"}
              </h2>
              <button onClick={closeReserveModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-5">

              {/* ── STEP 1: House Rules & Policies ── */}
              {reserveStep === "terms" && (
                <div>
                  {listing.terms_and_conditions ? (
                    <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                        Property Owner's House Rules & Policies
                      </p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {listing.terms_and_conditions}
                      </p>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <p className="text-sm text-gray-500">
                        This Property Owner has not provided specific house rules & policies for this listing.
                      </p>
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 mb-5 cursor-pointer select-none">
                    <input type="checkbox" checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#3d6b35] shrink-0" />
                    <span className="text-sm text-gray-600">
                      I have read and agree to the property's house rules & policies{listing.terms_and_conditions ? "" : " (none provided by the Property Owner)"}.
                    </span>
                  </label>

                  <button
                    onClick={() => setReserveStep("form")}
                    disabled={!termsAccepted}
                    className="w-full py-3 bg-[#3d6b35] text-white rounded-xl font-semibold hover:bg-[#2d5525] transition disabled:opacity-50">
                    Continue to Reservation →
                  </button>
                </div>
              )}

              {/* ── STEP 2: Form ── */}
              {reserveStep === "form" && (
                <>
                  <div className="flex gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                    {getListingImageUrl(listing) && (
                      <img src={getListingImageUrl(listing)} alt={listing.title}
                        className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{listing.title}</p>
                      <p className="text-xs text-gray-500">{listing.property_type} · {listing.barangay}</p>
                      <p className="text-sm font-bold text-[#3d6b35] mt-0.5">
                        ₱{Number(listing.price).toLocaleString("en-PH")}/mo
                      </p>
                    </div>
                  </div>

                  {reserveError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl mb-4">
                      <AlertCircle size={15} className="shrink-0" /> {reserveError}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Preferred Move-in Date <span className="text-gray-400 font-normal normal-case">(optional)</span>
                    </label>
                    <div className="relative overflow-hidden rounded-xl">
                      <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        style={{ fontSize: "16px" }}
                        className={`block w-full min-w-0 max-w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 ${isSafariBrowser ? "pr-10" : ""} text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition box-border`} />
                      {isSafariBrowser && (
                        <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Expected Move-out Date <span className="text-gray-400 font-normal normal-case">(optional — leave blank if month-to-month)</span>
                    </label>
                    <div className="relative overflow-hidden rounded-xl">
                      <input type="date" value={moveOutDate} onChange={(e) => setMoveOutDate(e.target.value)}
                        min={moveInDate || new Date().toISOString().split("T")[0]}
                        style={{ fontSize: "16px" }}
                        className={`block w-full min-w-0 max-w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 ${isSafariBrowser ? "pr-10" : ""} text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition box-border`} />
                      {isSafariBrowser && (
                        <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      )}
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Message to Property Owner <span className="text-gray-400 font-normal normal-case">(optional)</span>
                    </label>
                    <textarea value={reserveNotes} onChange={(e) => setReserveNotes(e.target.value)}
                      placeholder="Any notes or questions for the Property Owner..."
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition resize-none" />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => setReserveStep("terms")}
                      className="px-4 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                      ← Back
                    </button>
                    
                    <button onClick={handleReserve} disabled={reserving || !termsAccepted}
                      className="flex-1 py-3 bg-[#3d6b35] text-white rounded-xl font-semibold hover:bg-[#2d5525] transition flex items-center justify-center gap-2 disabled:opacity-50">
                      {reserving ? <><Loader size={16} className="animate-spin" /> Submitting...</> : "Submit Request"}
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 3: Payment (sandbox) ── */}
              {reserveStep === "payment" && (
                <div>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800 font-semibold mb-1">Sandbox Payment</p>
                    <p className="text-xs text-blue-700">
                      This is a test transaction using PayMongo's sandbox environment. No real money will be charged.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-5">
                    <span className="text-sm text-gray-600">Reservation Fee</span>
                    <span className="text-xl font-bold text-[#3d6b35]">
                      ₱{Number(listing?.reservation_fee || 0).toLocaleString("en-PH")}
                    </span>
                  </div>

                  {paymentError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-xl mb-4">
                      <AlertCircle size={15} className="shrink-0" /> {paymentError}
                    </div>
                  )}

                  <button onClick={handlePay} disabled={payingNow}
                    className="w-full py-3 bg-[#3d6b35] text-white rounded-xl font-semibold hover:bg-[#2d5525] transition flex items-center justify-center gap-2 disabled:opacity-50">
                    {payingNow ? <><Loader size={16} className="animate-spin" /> Processing...</> : "Pay with GCash (Sandbox)"}
                  </button>

                  <p className="text-xs text-gray-400 text-center mt-3">
                    You'll be redirected to a test payment page. Select "Authorize Test Payment" to simulate a successful payment.
                  </p>
                </div>
              )}

              {/* ── STEP 3: Success ── */}
              {reserveStep === "success" && (
                <div className="text-center py-2">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-[#3d6b35]" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Request Sent!</h3>
                  <p className="text-sm text-gray-500 mb-5">
                    Your reservation request has been sent{listing?.reservation_fee > 0 ? " and your reservation fee payment was confirmed (sandbox)" : ""}. The Property Owner will review and respond.
                  </p>
                  <button onClick={() => navigate("/tenant/reservations")}
                    className="w-full py-3 bg-[#3d6b35] text-white rounded-xl font-semibold hover:bg-[#2d5525] transition">
                    View My Reservations
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Amenity({ icon, label }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      {label}
    </div>
  );
}

// ================================================
// LISTING MAP — shows a single pin at the property location
// ================================================
function ListingMap({ lat, lng, title }) {
  const mapRef       = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const init = () => {
      if (initializedRef.current || !mapRef.current || !window.google) return;
      initializedRef.current = true;

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: { lat, lng },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title,
        icon: {
          url: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2250%22%20viewBox%3D%220%200%2040%2050%22%3E%3Cpath%20d%3D%22M20%200C9%200%200%209%200%2020c0%2015%2020%2030%2020%2030S40%2035%2040%2020C40%209%2031%200%2020%200z%22%20fill%3D%22%233d6b35%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2219%22%20width%3D%2218%22%20height%3D%2212%22%20rx%3D%221%22%20fill%3D%22white%22%2F%3E%3Cpolygon%20points%3D%229%2C20%2020%2C11%2031%2C20%22%20fill%3D%22white%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2223%22%20width%3D%228%22%20height%3D%228%22%20rx%3D%221%22%20fill%3D%22%233d6b35%22%2F%3E%3C%2Fsvg%3E",
          scaledSize: new window.google.maps.Size(40, 50),
          anchor: new window.google.maps.Point(20, 50),
        },
      });
    };

    if (window.google?.maps) {
      init();
      return;
    }

    // Load script if not already loaded
    if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement("script");
      window.__listingMapInit = init;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GMAP_KEY}&libraries=places&callback=__listingMapInit`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.google?.maps?.Map) { 
            clearInterval(interval); 
            init(); 
          }
          if (attempts > 50) clearInterval(interval);
        }, 100);
      }
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="w-full h-64 rounded-xl border border-gray-200 shadow-sm" />
    </div>
  );
}

function ImageViewer({ images, index, setIndex, onClose }) {
  const prev = () => setIndex(index === 0 ? images.length - 1 : index - 1);
  const next = () => setIndex(index === images.length - 1 ? 0 : index + 1);

  const [startX, setStartX] = useState(null);

  // ✅ ESC key to close, arrow keys to navigate
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape")    onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [index]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center transition z-10"
      >
        <X size={20} />
      </button>

      {/* ESC hint */}
      <p className="absolute top-4 left-4 text-white/50 text-xs hidden md:block">Press ESC to close</p>

      {/* ✅ Left arrow — visible on all screen sizes */}
      {images.length > 1 && (
        <button
          onClick={prev}
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 text-white bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center transition z-10"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <img
        src={images[index]}
        alt={`Photo ${index + 1}`}
        className="max-h-[85vh] max-w-[calc(100vw-80px)] md:max-w-[85vw] object-contain select-none"
        onTouchStart={(e) => setStartX(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (startX === null) return;
          const diff = startX - e.changedTouches[0].clientX;
          if (diff > 40)  next();
          if (diff < -40) prev();
          setStartX(null);
        }}
      />

      {/* ✅ Right arrow — visible on all screen sizes */}
      {images.length > 1 && (
        <button
          onClick={next}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 text-white bg-white/20 hover:bg-white/30 rounded-full w-10 h-10 flex items-center justify-center transition z-10"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Counter + dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        {images.length > 1 && (
          <div className="flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`rounded-full transition-all ${
                  i === index ? "bg-white w-4 h-1.5" : "bg-white/40 w-1.5 h-1.5"
                }`}
              />
            ))}
          </div>
        )}
        <span className="text-white/70 text-sm">{index + 1} / {images.length}</span>
      </div>
    </div>
  );
}