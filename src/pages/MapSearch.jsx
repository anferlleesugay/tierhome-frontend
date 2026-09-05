// FILE: src/pages/MapSearch.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { MapPin, Search, X, Loader, Navigation } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { loadGoogleMaps } from "../utils/loadGoogleMaps";

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;
const GMAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

// ✅ Custom SVG marker for listings (house pin)
const LISTING_MARKER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
  <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26S36 31.5 36 18C36 8.06 27.94 0 18 0z" fill="#3d6b35"/>
  <path d="M18 2C9.17 2 2 9.17 2 18c0 12 16 24 16 24S34 30 34 18C34 9.17 26.83 2 18 2z" fill="#2d5525"/>
  <rect x="10" y="17" width="16" height="11" rx="1" fill="white"/>
  <polygon points="8,18 18,10 28,18" fill="white"/>
  <rect x="15" y="21" width="6" height="7" rx="0.5" fill="#3d6b35"/>
</svg>`;

// ✅ Custom marker for user location (person icon)
const USER_MARKER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
  <circle cx="22" cy="22" r="20" fill="#2563eb" opacity="0.15"/>
  <circle cx="22" cy="22" r="15" fill="#2563eb"/>
  <circle cx="22" cy="16" r="5" fill="white"/>
  <path d="M12 34c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="white"/>
</svg>`;

const svgToUrl = (svg) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

export default function MapSearch() {
  const { isLoggedIn } = useAuth();
  const navigate  = useNavigate();
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const circleRef = useRef(null);
  const userMark  = useRef(null);
  const listMarkRef = useRef([]);
  const autoSvc   = useRef(null);

  const [listings,         setListings]         = useState([]);
  const [selectedListing,  setSelectedListing]  = useState(null);
  const [loading,          setLoading]          = useState(false);
  const [searchRadius,     setSearchRadius]     = useState(3);
  const searchRadiusRef = useRef(searchRadius);
  useEffect(() => { searchRadiusRef.current = searchRadius; }, [searchRadius]);
  const [userLocation,     setUserLocation]     = useState({ lat: 15.3202, lng: 120.6205 });
  const [searchInput,      setSearchInput]      = useState("");
  const [suggestions,      setSuggestions]      = useState([]);
  const [showSuggestions,  setShowSuggestions]  = useState(false);
  const [locating,         setLocating]         = useState(false);
  const [locationName,     setLocationName]     = useState("Angeles City");

  // ── Init map ──────────────────────────────────
  useEffect(() => {
    loadGoogleMaps(['places']).then(() => {
      if (!mapRef.current || !window.google) return;

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 14,
        center: userLocation,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        zoomControl: true,
        styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
      });

      mapInst.current = map;
      autoSvc.current = new window.google.maps.places.AutocompleteService();

      // User location marker (draggable)
      const uMark = new window.google.maps.Marker({
        position: userLocation,
        map,
        title: "Your search location (drag to move)",
        icon: { url: svgToUrl(USER_MARKER_SVG), scaledSize: new window.google.maps.Size(36, 36), anchor: new window.google.maps.Point(18, 18) },
        draggable: true,
        zIndex: 999,
      });

      uMark.addListener("dragend", () => {
        const pos = uMark.getPosition();
        const newLoc = { lat: pos.lat(), lng: pos.lng() };
        setUserLocation(newLoc);
        updateCircle(newLoc);
        reverseGeocode(pos.lat(), pos.lng());
        fetchListings(pos.lat(), pos.lng(), searchRadiusRef.current);
      });

      userMark.current = uMark;

      // Search circle
      const circle = new window.google.maps.Circle({
        map,
        center: userLocation,
        radius: searchRadius * 1000,
        fillColor: "#3d6b35",
        fillOpacity: 0.08,
        strokeColor: "#3d6b35",
        strokeOpacity: 0.5,
        strokeWeight: 2,
      });
      circleRef.current = circle;

      // Click map to move search location
      map.addListener("click", (e) => {
        const newLoc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        moveUserMarker(newLoc);
      });

      fetchListings(userLocation.lat, userLocation.lng, searchRadius);
    });
  }, []);

  const updateCircle = (loc) => {
    if (circleRef.current) {
      circleRef.current.setCenter(loc);
      circleRef.current.setRadius(searchRadiusRef.current * 1000);
    }
  };

  const moveUserMarker = (newLoc) => {
    if (userMark.current) userMark.current.setPosition(newLoc);
    if (mapInst.current) mapInst.current.panTo(newLoc);
    setUserLocation(newLoc);
    updateCircle(newLoc);
    reverseGeocode(newLoc.lat, newLoc.lng);
    fetchListings(newLoc.lat, newLoc.lng, searchRadiusRef.current);
  };

  const reverseGeocode = (lat, lng) => {
    if (!window.google) return;
    new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) {
        setLocationName(results[0].formatted_address);
      }
    });
  };

  // ── Fetch listings ────────────────────────────
  const fetchListings = async (lat, lng, radius) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/listings/nearby?latitude=${lat}&longitude=${lng}&radius=${radius}`);
      const data = res.data.data || [];
      setListings(data);
      addListingMarkers(data);
    } catch { }
    finally { setLoading(false); }
  };

  const addListingMarkers = (data) => {
    // Clear old markers
    listMarkRef.current.forEach(m => m.setMap(null));
    listMarkRef.current = [];

    if (!mapInst.current || !window.google) return;

    data.forEach((listing) => {
      if (!listing.latitude || !listing.longitude) return;
      const marker = new window.google.maps.Marker({
        position: { lat: parseFloat(listing.latitude), lng: parseFloat(listing.longitude) },
        map: mapInst.current,
        title: listing.title,
        icon: {
          url:        svgToUrl(LISTING_MARKER_SVG),
          scaledSize: new window.google.maps.Size(36, 44),
          anchor:     new window.google.maps.Point(18, 44),
        },
      });
      marker.addListener("click", () => setSelectedListing(listing));
      listMarkRef.current.push(marker);
    });
  };

  // ── Radius change ──────────────────────────────
  const handleRadiusChange = (e) => {
    const r = parseFloat(e.target.value);
    setSearchRadius(r);
    if (circleRef.current) circleRef.current.setRadius(r * 1000);
    fetchListings(userLocation.lat, userLocation.lng, r);
  };

  // ── GPS location ──────────────────────────────
  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const newLoc = { lat: coords.latitude, lng: coords.longitude };
        moveUserMarker(newLoc);
        if (mapInst.current) mapInst.current.setZoom(15);
        setLocating(false);
      },
      () => { setLocating(false); alert("Could not get your location."); }
    );
  };

  // ── Address search ────────────────────────────
  const handleSearchChange = (val) => {
    setSearchInput(val);
    if (!val.trim() || !autoSvc.current) { setSuggestions([]); setShowSuggestions(false); return; }
    autoSvc.current.getPlacePredictions(
      { input: val, componentRestrictions: { country: "ph" } },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions); setShowSuggestions(true);
        }
      }
    );
  };

  const handleSuggestionSelect = (placeId, description) => {
    setSearchInput(description);
    setSuggestions([]); setShowSuggestions(false);
    new window.google.maps.Geocoder().geocode({ placeId }, (results, status) => {
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;
        const newLoc = { lat: loc.lat(), lng: loc.lng() };
        moveUserMarker(newLoc);
        if (mapInst.current) mapInst.current.setZoom(15);
        setLocationName(description);
      }
    });
  };

  const getImage = (listing) => {
    if (listing.images?.length > 0) return STORAGE + listing.images[0].image_path;
    if (listing.image) return STORAGE + listing.image;
    return null;
  };

  return (
    <div className="flex flex-col-reverse md:flex-row h-[calc(100vh-80px)]">

      {/* LEFT PANEL */}
      <div className="w-full h-[45vh] md:h-auto md:w-88 md:min-w-[340px] md:max-w-[360px] flex flex-col bg-white border-t md:border-t-0 md:border-r border-gray-100 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Map Search</h2>

          {/* Address search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search area or address..."
              className="w-full pl-9 pr-3 h-10 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition" />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto">
                {suggestions.map((s) => (
                  <button key={s.place_id} type="button"
                    onMouseDown={() => handleSuggestionSelect(s.place_id, s.description)}
                    className="w-full text-left px-3 py-2.5 hover:bg-green-50 flex items-center gap-2 border-b border-gray-50 last:border-0 transition">
                    <MapPin size={12} className="text-[#3d6b35] shrink-0" />
                    <span className="text-xs text-gray-700 truncate">{s.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GPS button */}
          <button onClick={handleGetLocation} disabled={locating}
            className="w-full h-9 bg-[#3d6b35] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5525] transition flex items-center justify-center gap-2 disabled:opacity-60 mb-3">
            {locating ? <Loader size={14} className="animate-spin" /> : <Navigation size={14} />}
            {locating ? "Getting location..." : "Use My Location"}
          </button>

          {/* Location name */}
          {locationName && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 bg-gray-50 px-3 py-2 rounded-xl">
              <MapPin size={11} className="text-[#3d6b35] shrink-0" />
              <span className="truncate">{locationName}</span>
            </div>
          )}

          {/* Radius slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-gray-700">Search Radius</span>
              <span className="text-xs font-bold text-[#3d6b35]">{searchRadius} km</span>
            </div>
            <input type="range" min="1" max="20" step="0.5" value={searchRadius}
              onChange={handleRadiusChange}
              className="w-full accent-[#3d6b35]" />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>1 km</span><span>20 km</span>
            </div>
          </div>

          {/* Tip */}
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            💡 Drag the blue dot or click the map to change your search location
          </p>
        </div>

        {/* Listings list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader size={24} className="text-[#3d6b35] animate-spin" />
            </div>
          ) : listings.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <MapPin size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No properties found</p>
              <p className="text-xs mt-1">Try increasing the radius</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {listings.map((listing) => {
                const img = getImage(listing);
                return (
                  <div key={listing.id}
                    onClick={() => { setSelectedListing(listing); mapInst.current?.panTo({ lat: parseFloat(listing.latitude), lng: parseFloat(listing.longitude) }); }}
                    className={`p-3 cursor-pointer hover:bg-gray-50 transition ${selectedListing?.id === listing.id ? "bg-green-50 border-l-4 border-l-[#3d6b35]" : ""}`}>
                    {img && (
                      <img src={img} alt={listing.title}
                        className="w-full h-28 object-cover rounded-xl mb-2"
                        onError={(e) => { e.target.style.display = "none"; }} />
                    )}
                    <p className="font-bold text-sm text-gray-900 line-clamp-1">{listing.title}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {listing.barangay}
                    </p>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-sm font-bold text-[#3d6b35]">
                        ₱{Number(listing.price).toLocaleString("en-PH")}/mo
                      </span>
                      <span className="text-[10px] bg-green-50 text-[#3d6b35] px-2 py-0.5 rounded-full font-semibold">
                        {listing.property_type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1 relative" style={{minHeight: "55vh"}}>
        <div ref={mapRef} className="w-full h-full" />

        {/* Selected listing popup */}
        {selectedListing && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10">
            <button onClick={() => setSelectedListing(null)}
              className="absolute top-3 right-3 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center hover:bg-gray-100 transition z-10">
              <X size={14} className="text-gray-600" />
            </button>
            {getImage(selectedListing) && (
              <img src={getImage(selectedListing)} alt={selectedListing.title}
                className="w-full h-36 object-cover"
                onError={(e) => { e.target.style.display = "none"; }} />
            )}
            <div className="p-4">
              <p className="font-bold text-gray-900 text-base line-clamp-1">{selectedListing.title}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 mb-2">
                <MapPin size={10} /> {selectedListing.address || selectedListing.barangay}, Angeles City
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-[#3d6b35]">
                  ₱{Number(selectedListing.price).toLocaleString("en-PH")}
                  <span className="text-xs text-gray-400 font-normal">/mo</span>
                </span>
                <button
                  onClick={() => navigate(`/listing/${selectedListing.id}`)}
                  className="px-4 py-2 bg-[#3d6b35] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5525] transition">
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results count badge */}
        <div className="absolute top-4 right-4 bg-white rounded-xl shadow px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-100">
          {loading ? "Searching..." : `${listings.length} propert${listings.length !== 1 ? "ies" : "y"} found`}
        </div>
      </div>
    </div>
  );
}