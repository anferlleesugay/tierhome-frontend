import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Plus, Edit2, Trash2, X, Upload, MapPin,
  Wifi, Car, UtensilsCrossed, Wind, Tv, Shirt,
  Droplets, Dumbbell, Home, Lock, Flame, Sofa,
  Music, Leaf, Accessibility, Baby, Mountain, Zap, Search, Loader, Star,
  Coffee, BookOpen, Monitor, Sun, Camera, Bed, Bath, Bus, Phone,
  ShieldCheck, Clock, Bike, Plug, Thermometer, Package,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE";

const AMENITIES = [
  { id: "wifi",          label: "WiFi",              icon: Wifi },
  { id: "parking",       label: "Free Parking",      icon: Car },
  { id: "kitchen",       label: "Kitchen",           icon: UtensilsCrossed },
  { id: "aircon",        label: "Air Conditioning",  icon: Wind },
  { id: "tv",            label: "TV",                icon: Tv },
  { id: "laundry",       label: "Washer/Dryer",      icon: Shirt },
  { id: "pool",          label: "Swimming Pool",     icon: Droplets },
  { id: "gym",           label: "Gym",               icon: Dumbbell },
  { id: "balcony",       label: "Balcony",           icon: Home },
  { id: "security",      label: "24/7 Security",     icon: Lock },
  { id: "heating",       label: "Heating",           icon: Flame },
  { id: "sofa",          label: "Sofa",              icon: Sofa },
  { id: "soundsystem",   label: "Sound System",      icon: Music },
  { id: "garden",        label: "Garden",            icon: Leaf },
  { id: "accessibility", label: "Wheelchair Access", icon: Accessibility },
  { id: "crib",          label: "Crib",              icon: Baby },
  { id: "outdoor",       label: "Outdoor Space",     icon: Mountain },
  { id: "highspeed",     label: "High Speed Internet", icon: Zap },
];

const PROPERTY_TYPES = ["House", "Apartment", "Condo", "Studio", "Dormitory", "Boarding House", "Bedspace"];

const AMENITY_ICON_MAP = {
  wifi: Wifi, car: Car, utensils: UtensilsCrossed, utensils2: UtensilsCrossed,
  wind: Wind, tv: Tv, shirt: Shirt, droplets: Droplets, dumbbell: Dumbbell,
  home: Home, lock: Lock, flame: Flame, music: Music, leaf: Leaf, zap: Zap,
  mountain: Mountain, sofa: Sofa, baby: Baby, accessibility: Accessibility, star: Star,
  coffee: Coffee, book: BookOpen, monitor: Monitor, sun: Sun, camera: Camera,
  bed: Bed, bath: Bath, bus: Bus, phone: Phone, shield: ShieldCheck,
  clock: Clock, bike: Bike, plug: Plug, thermometer: Thermometer, package: Package,
  // label fallbacks
  parking: Car, aircon: Wind, kitchen: UtensilsCrossed, laundry: Shirt,
  pool: Droplets, gym: Dumbbell, balcony: Home, security: Lock, heating: Flame,
  soundsystem: Music, garden: Leaf, highspeed: Zap, outdoor: Mountain,
};

// ============================================================
// MAP LOCATION PICKER
// ============================================================
function MapLocationPicker({ onLocationSelect, initialLat, initialLng }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const initializedRef = useRef(false);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);

  const [searchInput, setSearchInput] = useState("");
  const [locationName, setLocationName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    const loadMap = () => {
      if (window.google) { initializeMap(); return; }
      if (document.querySelector(`script[src*="maps.googleapis.com"]`)) {
        const interval = setInterval(() => {
          if (window.google) { clearInterval(interval); initializeMap(); }
        }, 100);
        return;
      }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    };
    loadMap();
  }, []);

  const initializeMap = () => {
    if (initializedRef.current || !mapRef.current || !window.google) return;
    initializedRef.current = true;

    const defaultLat = parseFloat(initialLat) || 14.5995;
    const defaultLng = parseFloat(initialLng) || 120.9842;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 15,
      center: { lat: defaultLat, lng: defaultLng },
      mapTypeControl: true,
      fullscreenControl: true,
      streetViewControl: false,
      zoomControl: true,
    });

    mapInstanceRef.current = map;
    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
    placesServiceRef.current = new window.google.maps.places.PlacesService(map);

    if (initialLat && initialLng) {
      placeOrMoveMarker(new window.google.maps.LatLng(defaultLat, defaultLng), false);
    }

    map.addListener("click", (event) => {
      placeOrMoveMarker(event.latLng, true);
      reverseGeocode(event.latLng.lat(), event.latLng.lng());
    });
  };

  const placeOrMoveMarker = (latLng, notify = true) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setPosition(latLng);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: latLng,
        map,
        draggable: true,
        title: "Drag to adjust",
        icon: {
          url: "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2250%22%20viewBox%3D%220%200%2040%2050%22%3E%3Cpath%20d%3D%22M20%200C9%200%200%209%200%2020c0%2015%2020%2030%2020%2030S40%2035%2040%2020C40%209%2031%200%2020%200z%22%20fill%3D%22%233d6b35%22%2F%3E%3Crect%20x%3D%2211%22%20y%3D%2219%22%20width%3D%2218%22%20height%3D%2212%22%20rx%3D%221%22%20fill%3D%22white%22%2F%3E%3Cpolygon%20points%3D%229%2C20%2020%2C11%2031%2C20%22%20fill%3D%22white%22%2F%3E%3Crect%20x%3D%2216%22%20y%3D%2223%22%20width%3D%228%22%20height%3D%228%22%20rx%3D%221%22%20fill%3D%22%233d6b35%22%2F%3E%3C%2Fsvg%3E",
          scaledSize: new window.google.maps.Size(40, 50),
          anchor: new window.google.maps.Point(20, 50),
        },
      });
      markerRef.current.addListener("dragend", () => {
        const pos = markerRef.current.getPosition();
        reverseGeocode(pos.lat(), pos.lng());
      });
    }

    if (notify) onLocationSelect(latLng.lat(), latLng.lng(), null);
  };

  const reverseGeocode = (lat, lng) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        const addr = results[0].formatted_address;
        setLocationName(addr);
        onLocationSelect(lat, lng, addr);
      }
    });
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (!value.trim() || !autocompleteServiceRef.current) {
      setSuggestions([]); setShowSuggestions(false); return;
    }
    autocompleteServiceRef.current.getPlacePredictions(
      { input: value, componentRestrictions: { country: "ph" } },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions); setShowSuggestions(true);
        } else {
          setSuggestions([]); setShowSuggestions(false);
        }
      }
    );
  };

  const handleSuggestionSelect = (placeId, description) => {
    setSearchInput(description);
    setLocationName(description);
    setSuggestions([]);
    setShowSuggestions(false);

    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      { placeId, fields: ["geometry", "formatted_address"] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          const location = place.geometry.location;
          const addr = place.formatted_address;
          mapInstanceRef.current.panTo(location);
          mapInstanceRef.current.setZoom(16);
          placeOrMoveMarker(location, false);
          setLocationName(addr);
          onLocationSelect(location.lat(), location.lng(), addr);
        }
      }
    );
  };

  const handlePinButton = () => {
    if (!searchInput.trim() || !window.google) return;
    setPinLoading(true);
    setSuggestions([]);
    setShowSuggestions(false);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchInput }, (results, status) => {
      setPinLoading(false);
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        const addr = results[0].formatted_address;
        mapInstanceRef.current.panTo(location);
        mapInstanceRef.current.setZoom(16);
        placeOrMoveMarker(location, false);
        setLocationName(addr);
        onLocationSelect(location.lat(), location.lng(), addr);
      }
    });
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const latLng = new window.google.maps.LatLng(lat, lng);
      mapInstanceRef.current.panTo(latLng);
      mapInstanceRef.current.setZoom(16);
      placeOrMoveMarker(latLng, false);
      reverseGeocode(lat, lng);
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative flex gap-2">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePinButton()}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search address..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3d6b35]"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  onMouseDown={() => handleSuggestionSelect(s.place_id, s.description)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-0 transition"
                >
                  <MapPin size={14} className="text-[#3d6b35] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {s.structured_formatting?.main_text || s.description}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {s.structured_formatting?.secondary_text || ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handlePinButton}
          disabled={!searchInput.trim() || pinLoading}
          className="px-3 py-2 bg-[#3d6b35] text-white rounded-lg hover:bg-[#2d5525] transition disabled:opacity-50 flex items-center justify-center w-10"
        >
          {pinLoading ? <Loader size={15} className="animate-spin" /> : <span className="text-base">📍</span>}
        </button>
        <button
          type="button"
          onClick={handleCurrentLocation}
          className="px-3 py-2 border border-[#3d6b35] text-[#3d6b35] rounded-lg hover:bg-[#3d6b35] hover:text-white transition text-sm"
        >
          🎯
        </button>
      </div>

      <div ref={mapRef} className="w-full h-64 md:h-80 rounded-lg border-2 border-gray-200 shadow-sm" />

      {locationName && (
        <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
          <MapPin size={14} className="text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs text-green-800 font-medium">{locationName}</p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        💡 Type an address and click 📍, click on the map, or drag the green marker to adjust.
      </p>
    </div>
  );
}

// ============================================================
// MAIN LANDLORD LISTINGS PAGE
// ============================================================
export default function LandlordListings() {
  const { token, isVerified, role, logout } = useAuth();

  const [listings,      setListings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,          setShowForm]          = useState(false);
  const [showMapPicker,     setShowMapPicker]     = useState(false);
  const [editingId,         setEditingId]         = useState(null);
  const [error,             setError]             = useState("");
  const [success,           setSuccess]           = useState("");
  const [images,            setImages]            = useState([]);
  const [dbAmenities,       setDbAmenities]       = useState([]); // from DB
  const [showAmenityModal,  setShowAmenityModal]  = useState(false);
  const [amenityReqName,    setAmenityReqName]    = useState("");
  const [amenityReqIcon,    setAmenityReqIcon]    = useState("star"); // defaults to star (Other)
  const [amenityReqLoading, setAmenityReqLoading] = useState(false);
  const [amenityReqMsg,     setAmenityReqMsg]     = useState(null);
  const [myRequests,        setMyRequests]        = useState([]);

  const [formData, setFormData] = useState({
    title: "", description: "", terms_and_conditions: "", reservation_fee: "", price: "",
    address: "", barangay: "", property_type: "House",
    latitude: "", longitude: "", amenities: [],
    total_slots: "",
  });

  useEffect(() => {
    if (token) {
      fetchListings();
      fetchDbAmenities();
      fetchMyRequests();
    }
  }, [token]);

  const fetchDbAmenities = async () => {
    try {
      const res = await axios.get(`${API}/amenities`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data.data || [];
      console.log("DB Amenities:", data); // DEBUG
      setDbAmenities(data);
    } catch {}
  };

  const fetchMyRequests = async () => {
    try {
      const res = await axios.get(`${API}/amenity-requests/mine`, { headers: { Authorization: `Bearer ${token}` } });
      setMyRequests(res.data.data || []);
    } catch {}
  };

  const handleAmenityRequest = async () => {
    if (!amenityReqName.trim()) return;
    setAmenityReqLoading(true);
    setAmenityReqMsg(null);
    try {
      await axios.post(`${API}/amenity-requests`, { name: amenityReqName.trim(), icon: amenityReqIcon },
        { headers: { Authorization: `Bearer ${token}` } });
      setAmenityReqMsg({ type: "success", text: "Request submitted! Admin will review it." });
      setAmenityReqName("");
      fetchMyRequests();
    } catch (err) {
      setAmenityReqMsg({ type: "error", text: err.response?.data?.message || "Failed to submit request." });
    } finally { setAmenityReqLoading(false); }
  };

  // ✅ Calls /my-listings — shows ALL landlord's own listings
  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/my-listings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data.data?.data || res.data.data || [];
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const toggleAmenity = (id) =>
    setFormData((p) => ({
      ...p,
      amenities: p.amenities.includes(id)
        ? p.amenities.filter((a) => a !== id)
        : [...p.amenities, id],
    }));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => {
      const updated = [...prev];
      if (!updated[index].existing) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleLocationSelect = (lat, lng, address) => {
    if (!address) {
      setFormData((prev) => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
      return;
    }

    // Extract barangay from Google Maps address
    // Format: "123 Street, Barangay Name, Angeles, Pampanga, Philippines"
    let extractedBarangay = "";
    const parts = address.split(",").map(p => p.trim());

    const barangayKeywords = [
      'Balibago', 'Claro M. Recto', 'Cutcut', 'Lourdes North West', 'Lourdes Norte',
      'Malabanias', 'Mining', 'Pandan', 'Pulung Maragul', 'San Nicolas',
      'Sto. Rosario', 'Telabastagan', 'Sindalan', 'Margot', 'Marisol',
      'Anunas', 'Calibutbut', 'Capaya', 'Cuayan', 'Sapalibutad',
      'Salapungan', 'Virgen Delos Remedios', 'Pulung Cacutud',
    ];

    for (const part of parts) {
      for (const keyword of barangayKeywords) {
        if (part.toLowerCase().includes(keyword.toLowerCase())) {
          extractedBarangay = keyword;
          break;
        }
      }
      if (extractedBarangay) break;
    }

    setFormData((prev) => ({
      ...prev,
      latitude:  lat.toFixed(6),
      longitude: lng.toFixed(6),
      address,
      ...(extractedBarangay ? { barangay: extractedBarangay } : {}),
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "", description: "", terms_and_conditions: "", reservation_fee: "", price: "",
      address: "", barangay: "", property_type: "House",
      latitude: "", longitude: "", amenities: [],
      total_slots: "",
    });
    images.forEach((img) => { if (!img.existing) URL.revokeObjectURL(img.preview); });
    setImages([]);
    setShowForm(false);
    setShowMapPicker(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!token) {
      setError("You are not logged in. Please log in again."); return;
    }

    if (!formData.title || !formData.description || !formData.price || !formData.address) {
      setError("Please fill in all required fields"); return;
    }

    try {
      const fd = new FormData();
      fd.append("title",                 formData.title);
      fd.append("description",           formData.description);
      fd.append("terms_and_conditions",  formData.terms_and_conditions);
      fd.append("reservation_fee",        formData.reservation_fee || 0);
      fd.append("price",                 formData.price);
      fd.append("address",               formData.address);
      fd.append("barangay",              formData.barangay);
      fd.append("property_type",         formData.property_type);
      fd.append("latitude",              formData.latitude);
      fd.append("longitude",             formData.longitude);
      fd.append("amenities",             JSON.stringify(formData.amenities));
      if (formData.total_slots) fd.append("total_slots", formData.total_slots);

      // ✅ Send new images only (not existing server images)
      const newImages = images.filter((img) => img.file !== null);
      if (newImages.length > 0) {
        fd.append("image", newImages[0].file);
        newImages.forEach((img) => fd.append("images[]", img.file));
      }

      const cfg = {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      };

      if (editingId) {
        // ✅ Laravel does not support multipart PUT — use POST with _method spoofing
        fd.append("_method", "PUT");
        await axios.post(`${API}/listings/${editingId}`, fd, cfg);
        setSuccess("Listing updated successfully!");
      } else {
        await axios.post(`${API}/listings`, fd, cfg);
        setSuccess("Listing created successfully!");
      }

      resetForm();
      fetchListings();
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expired. Please log out and log in again.");
        logout();
      } else {
        setError(err.response?.data?.message || "Failed to save listing");
      }
    }
  };

  const handleEdit = (listing) => {
    setFormData({
      title:                 listing.title                 || "",
      description:           listing.description           || "",
      terms_and_conditions:  listing.terms_and_conditions   || "",
      reservation_fee:        listing.reservation_fee        || "",
      price:                 listing.price                 || "",
      address:               listing.address               || "",
      barangay:              listing.barangay              || "",
      property_type:         listing.property_type         || "House",
      latitude:              listing.latitude              || "",
      longitude:             listing.longitude             || "",
      amenities:             listing.amenities?.map((a) => {
        // Static amenities use icon as key, DB custom amenities use name
        const isStatic = AMENITIES.find((s) => s.id === a.icon);
        return isStatic ? a.icon : a.name;
      }) || [],
      total_slots:   listing.total_slots   || "",
    });
    // ✅ Load all existing images from listing_images table, fallback to single image
    if (listing.images && listing.images.length > 0) {
      setImages(listing.images.map((img) => ({
        file: null,
        preview: STORAGE + img.image_path,
        existing: true,
      })));
    } else if (listing.image) {
      setImages([{ file: null, preview: STORAGE + listing.image, existing: true }]);
    } else {
      setImages([]);
    }
    setEditingId(listing.id);
    setShowForm(true);
    setShowMapPicker(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      await axios.delete(`${API}/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Listing deleted successfully!");
      fetchListings();
    } catch { setError("Failed to delete listing"); }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading listings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Your Listings</h1>
          <button
            onClick={() => showForm ? resetForm() : setShowForm(true)}
            className="flex items-center gap-2 bg-[#3d6b35] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2d5525] transition"
          >
            <Plus size={20} />
            Add Listing
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")}><X size={18} /></button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-800 rounded-lg flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess("")}><X size={18} /></button>
          </div>
        )}

        {/* FORM */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              {editingId ? "Edit Listing" : "Create New Listing"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* BASIC INFO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange}
                    placeholder="e.g., Cozy 1BR Apartment"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b35]" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Property Type *</label>
                  <select name="property_type" value={formData.property_type} onChange={handleInputChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b35]">
                    {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Price (₱/month) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange}
                    placeholder="e.g. 12500"
                    step="0.01"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b35]" />
                  {formData.price && (
                    <p className="text-xs text-[#3d6b35] mt-1 font-semibold">
                      ₱{Number(formData.price).toLocaleString("en-PH")}/month
                    </p>
                  )}
                </div>

                {/* ✅ Slots — only for multi-tenant types */}
                {["Dormitory", "Boarding House", "Bedspace"].includes(formData.property_type) && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Available Slots *
                      <span className="text-xs text-gray-400 font-normal ml-1">
                        (number of tenants this property can accommodate)
                      </span>
                    </label>
                    <input type="number" name="total_slots" value={formData.total_slots}
                      onChange={handleInputChange} placeholder="e.g. 10" min="1"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b35]" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Barangay</label>
                  <input type="text" name="barangay" value={formData.barangay} onChange={handleInputChange}
                    placeholder="e.g., Balibago"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b35]" />
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange}
                  placeholder="Describe your property..." rows="4"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b35]" />
              </div>

              {/* TERMS AND CONDITIONS */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Terms & Conditions
                  <span className="text-xs text-gray-400 font-normal ml-2">(house rules, deposit policy, pet policy, etc. — optional)</span>
                </label>
                <textarea name="terms_and_conditions" value={formData.terms_and_conditions} onChange={handleInputChange}
                  placeholder="e.g. 2 months deposit required, no pets allowed, minimum 6-month lease..." rows="4"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b35]" />
              </div>

              {/* RESERVATION FEE */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reservation Fee (₱)
                  <span className="text-xs text-gray-400 font-normal ml-2">(optional — leave blank or 0 if no fee required)</span>
                </label>
                <input type="number" name="reservation_fee" value={formData.reservation_fee} onChange={handleInputChange}
                  placeholder="e.g. 1500" min="0" step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b35]" />
                <p className="text-xs text-gray-400 mt-1">
                  This is a sandbox/test payment for demonstration purposes — no real money is processed.
                </p>
              </div>

              {/* FULL ADDRESS */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Address *
                  <span className="text-xs text-gray-400 font-normal ml-2">(auto-filled when you pick a location)</span>
                </label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange}
                  placeholder="Pick location on map or type here..."
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3d6b35]" />
              </div>

              {/* MAP */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium">📍 Property Location</label>
                  <button type="button" onClick={() => setShowMapPicker(!showMapPicker)}
                    className="text-sm px-3 py-1.5 bg-[#3d6b35] text-white rounded-lg hover:bg-[#2d5525] transition">
                    {showMapPicker ? "Hide Map" : "Open Map"}
                  </button>
                </div>
                {showMapPicker && (
                  <MapLocationPicker
                    onLocationSelect={handleLocationSelect}
                    initialLat={formData.latitude}
                    initialLng={formData.longitude}
                  />
                )}
              </div>

              {/* IMAGES */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Property Images
                  <span className="text-xs text-gray-400 font-normal ml-2">(select as many as you want)</span>
                </label>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200">
                        <img src={img.preview} alt={`Image ${i + 1}`}
                          className="w-full h-24 object-cover"
                          onError={(e) => { e.target.style.display = "none"; }} />
                        {!img.existing && (
                          <button type="button" onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                            <X size={11} />
                          </button>
                        )}
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                    <label htmlFor="image-input"
                      className="h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#3d6b35] hover:bg-green-50 transition">
                      <Upload size={18} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Add more</span>
                    </label>
                  </div>
                )}

                {images.length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-[#3d6b35] hover:bg-green-50 transition">
                    <Upload className="mx-auto mb-3 text-gray-400" size={36} />
                    <p className="text-sm font-medium text-gray-700 mb-1">Click to upload photos</p>
                    <p className="text-xs text-gray-400">You can select multiple images at once</p>
                    <label htmlFor="image-input"
                      className="inline-block mt-3 px-4 py-2 bg-[#3d6b35] text-white rounded-lg cursor-pointer hover:bg-[#2d5525] transition text-sm">
                      Select Images
                    </label>
                  </div>
                )}

                <input type="file" accept="image/*" multiple onChange={handleImageChange}
                  className="hidden" id="image-input" />

                {images.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {images.filter(i => !i.existing).length} new image(s) · First image is the cover
                  </p>
                )}
              </div>

              {/* AMENITIES */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold">What this place offers</label>
                  <button type="button" onClick={() => setShowAmenityModal(true)}
                    className="text-xs text-[#3d6b35] font-semibold hover:underline flex items-center gap-1">
                    + Request new amenity
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {/* ✅ Static amenities */}
                  {AMENITIES.map(({ id, label, icon: Icon }) => {
                    const isSelected = formData.amenities.includes(id);
                    return (
                      <button key={id} type="button" onClick={() => toggleAmenity(id)}
                        className={`p-2 md:p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                          isSelected
                            ? "border-[#3d6b35] bg-[#3d6b35] text-white"
                            : "border-gray-300 text-gray-700 hover:border-[#3d6b35]"
                        }`}>
                        <Icon size={20} />
                        <span className="text-xs font-medium text-center line-clamp-2">{label}</span>
                      </button>
                    );
                  })}
                  {/* ✅ DB amenities — use amenity.name as key, show correct icon */}
                  {dbAmenities
                    .filter((a) => !AMENITIES.find((s) => s.label.toLowerCase() === a.name.toLowerCase()))
                    .map((amenity) => {
                      const key        = amenity.name; // always use name as key for DB amenities
                      const isSelected = formData.amenities.includes(key);
                      const IconComp   = AMENITY_ICON_MAP[amenity.icon] || Star;
                      return (
                        <button key={amenity.id} type="button"
                          onClick={() => toggleAmenity(key)}
                          className={`p-2 md:p-3 rounded-lg border-2 transition flex flex-col items-center gap-1 ${
                            isSelected
                              ? "border-[#3d6b35] bg-[#3d6b35] text-white"
                              : "border-gray-300 text-gray-700 hover:border-[#3d6b35]"
                          }`}>
                          <IconComp size={20} />
                          <span className="text-xs font-medium text-center line-clamp-2">{amenity.name}</span>
                        </button>
                      );
                  })}
                </div>
              </div>

              {/* SUBMIT */}
              <div className="flex flex-col md:flex-row gap-4">
                <button type="submit"
                  className="flex-1 py-3 bg-[#3d6b35] text-white rounded-lg font-semibold hover:bg-[#2d5525] transition">
                  {editingId ? "Update Listing" : "Create Listing"}
                </button>
                <button type="button" onClick={resetForm}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LISTINGS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {listings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No listings yet</p>
              <button onClick={() => setShowForm(true)}
                className="mt-4 px-6 py-2 bg-[#3d6b35] text-white rounded-lg font-medium hover:bg-[#2d5525] transition">
                Create Your First Listing
              </button>
            </div>
          ) : (
            listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                {listing.image && (
                  <img src={STORAGE + listing.image} alt={listing.title}
                    className="w-full h-40 object-cover"
                    onError={(e) => { e.target.style.display = "none"; }} />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-lg">{listing.title}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ml-2 ${
                      listing.is_verified
                        ? "bg-green-100 text-green-700"
                        : listing.status === "rejected"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      {listing.is_verified ? "✅ Approved" : listing.status === "rejected" ? "❌ Rejected" : "⏳ Pending"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{listing.description}</p>

                  {listing.status === "rejected" && (
                    <div className="mb-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                      ❌ Rejected by admin. Click <strong>Edit</strong> to update and resubmit for review.
                    </div>
                  )}
                  {!listing.is_verified && listing.status !== "rejected" && (
                    <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                      ⏳ Waiting for admin approval before going live.
                    </div>
                  )}

                  {listing.amenities?.length > 0 && (
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {listing.amenities.slice(0, 4).map((item) => {
                        const aid = item?.icon || item;
                        const am = AMENITIES.find((a) => a.id === aid);
                        if (!am) return null;
                        const Icon = am.icon;
                        return (
                          <div key={aid} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md" title={am.label}>
                            <Icon size={14} className="text-[#3d6b35]" />
                            <span className="text-xs hidden sm:inline">{am.label}</span>
                          </div>
                        );
                      })}
                      {listing.amenities.length > 4 && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md">
                          +{listing.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-green-600 font-bold text-lg">
                        ₱{Number(listing.price).toLocaleString("en-PH")}
                      </p>
                      <p className="text-xs text-gray-500">{listing.property_type}</p>
                    </div>
                    {listing.barangay && (
                      <div className="flex items-center gap-1 text-gray-600 text-xs">
                        <MapPin size={14} /> {listing.barangay}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(listing)}
                      className="flex-1 py-2 border border-[#3d6b35] text-[#3d6b35] rounded-lg text-sm font-medium hover:bg-[#3d6b35] hover:text-white transition flex items-center justify-center gap-1">
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDelete(listing.id)}
                      className="flex-1 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500 hover:text-white transition flex items-center justify-center gap-1">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ✅ AMENITY REQUEST MODAL */}
      {showAmenityModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => { setShowAmenityModal(false); setAmenityReqMsg(null); setAmenityReqName(""); setAmenityReqIcon("star"); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <h2 className="font-bold text-gray-900 text-lg">Request New Amenity</h2>
              <button onClick={() => { setShowAmenityModal(false); setAmenityReqMsg(null); setAmenityReqName(""); setAmenityReqIcon("star"); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                ✕
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto flex-1">
              <p className="text-sm text-gray-500 mb-4">
                Don't see the amenity you need? Request it and admin will add it to the global list.
              </p>

              {amenityReqMsg && (
                <div className={`text-sm px-3 py-2.5 rounded-xl mb-4 ${
                  amenityReqMsg.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {amenityReqMsg.text}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Amenity Name
                </label>
                <input type="text" value={amenityReqName}
                  onChange={(e) => setAmenityReqName(e.target.value)}
                  placeholder="e.g. Rooftop Deck, Study Room, CCTV..."
                  className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition" />
              </div>

              {/* ✅ Icon picker — 36 icons */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Pick an Icon
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { id: "wifi",          label: "WiFi",        icon: Wifi },
                    { id: "car",           label: "Parking",     icon: Car },
                    { id: "utensils",      label: "Kitchen",     icon: UtensilsCrossed },
                    { id: "wind",          label: "Aircon",      icon: Wind },
                    { id: "tv",            label: "TV",          icon: Tv },
                    { id: "shirt",         label: "Laundry",     icon: Shirt },
                    { id: "droplets",      label: "Pool",        icon: Droplets },
                    { id: "dumbbell",      label: "Gym",         icon: Dumbbell },
                    { id: "home",          label: "Balcony",     icon: Home },
                    { id: "lock",          label: "Security",    icon: Lock },
                    { id: "flame",         label: "Heating",     icon: Flame },
                    { id: "music",         label: "Sound",       icon: Music },
                    { id: "leaf",          label: "Garden",      icon: Leaf },
                    { id: "zap",           label: "Internet",    icon: Zap },
                    { id: "mountain",      label: "Outdoor",     icon: Mountain },
                    { id: "sofa",          label: "Lounge",      icon: Sofa },
                    { id: "baby",          label: "Kids",        icon: Baby },
                    { id: "accessibility", label: "Access",      icon: Accessibility },
                    { id: "coffee",        label: "Café",        icon: Coffee },
                    { id: "book",          label: "Library",     icon: BookOpen },
                    { id: "monitor",       label: "Study",       icon: Monitor },
                    { id: "sun",           label: "Rooftop",     icon: Sun },
                    { id: "camera",        label: "CCTV",        icon: Camera },
                    { id: "bed",           label: "Bedroom",     icon: Bed },
                    { id: "bath",          label: "Bathroom",    icon: Bath },
                    { id: "bus",           label: "Transport",   icon: Bus },
                    { id: "utensils2",     label: "Dining",      icon: UtensilsCrossed },
                    { id: "trash",         label: "Disposal",    icon: Trash2 },
                    { id: "phone",         label: "Landline",    icon: Phone },
                    { id: "shield",        label: "CCTV Guard",  icon: ShieldCheck },
                    { id: "clock",         label: "24/7",        icon: Clock },
                    { id: "bike",          label: "Bike",        icon: Bike },
                    { id: "plug",          label: "Generator",   icon: Plug },
                    { id: "thermometer",   label: "Hot Water",   icon: Thermometer },
                    { id: "package",       label: "Storage",     icon: Package },
                    { id: "star",          label: "Other",       icon: Star },
                  ].map(({ id, label, icon: Icon }) => {
                    const sel = amenityReqIcon === id;
                    return (
                      <button key={id} type="button" title={label}
                        onClick={() => setAmenityReqIcon(id)}
                        className={`p-2 rounded-xl border-2 flex flex-col items-center gap-1 transition ${
                          sel ? "border-[#3d6b35] bg-green-50" : "border-gray-200 hover:border-[#3d6b35]"
                        }`}>
                        <Icon size={18} className={sel ? "text-[#3d6b35]" : "text-gray-500"} />
                        <span className="text-[9px] text-gray-400 text-center">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* My pending requests */}
              {myRequests.filter(r => r.status === 'pending').length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Your Pending Requests:</p>
                  {myRequests.filter(r => r.status === 'pending').map(r => (
                    <p key={r.id} className="text-xs text-amber-600">• {r.name}</p>
                  ))}
                </div>
              )}

              <button onClick={handleAmenityRequest} disabled={!amenityReqName.trim() || amenityReqLoading}
                className="w-full py-3 bg-[#3d6b35] text-white rounded-xl font-semibold hover:bg-[#2d5525] transition disabled:opacity-50">
                {amenityReqLoading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}