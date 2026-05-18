// FILE: src/pages/AdminAmenityRequests.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import {
  CheckCircle, XCircle, Clock, Loader, Star, AlertCircle, Trash2,
  Wifi, Car, Wind, Tv, Shirt, Droplets, Dumbbell, Home, Lock,
  Flame, Music, Leaf, Zap, Mountain, Sofa, Baby, Accessibility,
  Coffee, BookOpen, Monitor, Sun, Camera, Bed, Bath, Bus, Phone,
  ShieldCheck, Bike, Plug, Thermometer, Package, UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API = import.meta.env.VITE_API_URL;

const ALL_ICONS = [
  { id: "wifi",          label: "WiFi",       icon: Wifi },
  { id: "car",           label: "Parking",    icon: Car },
  { id: "utensils",      label: "Kitchen",    icon: UtensilsCrossed },
  { id: "wind",          label: "Aircon",     icon: Wind },
  { id: "tv",            label: "TV",         icon: Tv },
  { id: "shirt",         label: "Laundry",    icon: Shirt },
  { id: "droplets",      label: "Pool",       icon: Droplets },
  { id: "dumbbell",      label: "Gym",        icon: Dumbbell },
  { id: "home",          label: "Balcony",    icon: Home },
  { id: "lock",          label: "Security",   icon: Lock },
  { id: "flame",         label: "Heating",    icon: Flame },
  { id: "music",         label: "Sound",      icon: Music },
  { id: "leaf",          label: "Garden",     icon: Leaf },
  { id: "zap",           label: "Internet",   icon: Zap },
  { id: "mountain",      label: "Outdoor",    icon: Mountain },
  { id: "sofa",          label: "Lounge",     icon: Sofa },
  { id: "baby",          label: "Kids",       icon: Baby },
  { id: "accessibility", label: "Wheelchair", icon: Accessibility },
  { id: "coffee",        label: "Café",       icon: Coffee },
  { id: "book",          label: "Library",    icon: BookOpen },
  { id: "monitor",       label: "Study",      icon: Monitor },
  { id: "sun",           label: "Rooftop",    icon: Sun },
  { id: "camera",        label: "CCTV",       icon: Camera },
  { id: "bed",           label: "Bedroom",    icon: Bed },
  { id: "bath",          label: "Bathroom",   icon: Bath },
  { id: "bus",           label: "Transport",  icon: Bus },
  { id: "phone",         label: "Landline",   icon: Phone },
  { id: "shield",        label: "Guard",      icon: ShieldCheck },
  { id: "bike",          label: "Bike",       icon: Bike },
  { id: "plug",          label: "Generator",  icon: Plug },
  { id: "thermometer",   label: "Hot Water",  icon: Thermometer },
  { id: "package",       label: "Storage",    icon: Package },
  { id: "star",          label: "Other",      icon: Star },
];

const ICON_MAP = Object.fromEntries(ALL_ICONS.map(({ id, icon }) => [id, icon]));

const STATUS_CONFIG = {
  pending:  { label: "Pending",  color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700",     icon: XCircle },
};

function IconPicker({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {ALL_ICONS.map(({ id, label, icon: Icon }) => (
        <button key={id} type="button" title={label}
          onClick={() => onSelect(id)}
          className={`p-2 rounded-xl border-2 flex flex-col items-center gap-0.5 transition ${
            selected === id ? "border-[#3d6b35] bg-green-50" : "border-gray-200 hover:border-[#3d6b35]"
          }`}>
          <Icon size={16} className={selected === id ? "text-[#3d6b35]" : "text-gray-500"} />
          <span className="text-[8px] text-gray-400 text-center leading-tight">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default function AdminAmenityRequests() {
  const { token } = useAuth();
  const [tab,          setTab]          = useState("requests");
  const [requests,     setRequests]     = useState([]);
  const [amenities,    setAmenities]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [processing,   setProcessing]   = useState(null);
  const [filter,       setFilter]       = useState("pending");
  const [rejectNote,   setRejectNote]   = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [msg,          setMsg]          = useState(null);
  const [editAmenity,  setEditAmenity]  = useState(null);
  const [editIcon,     setEditIcon]     = useState("star");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/admin/amenity-requests`, { headers });
      setRequests(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const fetchAmenities = async () => {
    try {
      const res = await axios.get(`${API}/admin/amenities`, { headers });
      setAmenities(res.data.data || []);
    } catch {}
  };

  useEffect(() => { fetchRequests(); fetchAmenities(); }, [token]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleApprove = async (id) => {
    setProcessing(id + "approve");
    try {
      const res = await axios.post(`${API}/admin/amenity-requests/${id}/approve`, {}, { headers });
      showMsg("success", res.data.message);
      fetchRequests();
      fetchAmenities();
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Failed.");
    } finally { setProcessing(null); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setProcessing(rejectTarget + "reject");
    try {
      await axios.post(`${API}/admin/amenity-requests/${rejectTarget}/reject`,
        { admin_note: rejectNote }, { headers });
      showMsg("success", "Rejected.");
      setRejectTarget(null);
      setRejectNote("");
      fetchRequests();
    } catch {
      showMsg("error", "Failed.");
    } finally { setProcessing(null); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    setProcessing("del" + id);
    try {
      await axios.delete(`${API}/admin/amenities/${id}`, { headers });
      showMsg("success", `"${name}" removed.`);
      fetchAmenities();
    } catch {
      showMsg("error", "Failed.");
    } finally { setProcessing(null); }
  };

  const handleUpdateIcon = async () => {
    if (!editAmenity) return;
    setProcessing("icon" + editAmenity.id);
    try {
      await axios.put(`${API}/admin/amenities/${editAmenity.id}/icon`,
        { icon: editIcon }, { headers });
      showMsg("success", `Icon updated for "${editAmenity.name}".`);
      setEditAmenity(null);
      fetchAmenities();
    } catch {
      showMsg("error", "Failed.");
    } finally { setProcessing(null); }
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const counts = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size={32} className="text-[#3d6b35] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">

      <div className="bg-white border-b border-gray-100 px-4 md:px-10 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <Star size={20} className="text-[#3d6b35]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Amenities</h1>
            <p className="text-xs text-gray-500">Manage requests and global amenity list</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-10 py-6">

        {msg && (
          <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl mb-4 ${
            msg.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {msg.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("requests")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              tab === "requests" ? "bg-[#3d6b35] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#3d6b35]"
            }`}>
            Requests
            {counts.pending > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{counts.pending}</span>
            )}
          </button>
          <button onClick={() => { setTab("amenities"); fetchAmenities(); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
              tab === "amenities" ? "bg-[#3d6b35] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#3d6b35]"
            }`}>
            Global Amenities ({amenities.length})
          </button>
        </div>

        {/* REQUESTS TAB */}
        {tab === "requests" && (
          <>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {Object.entries(counts).map(([key, count]) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                    filter === key ? "bg-[#3d6b35] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-[#3d6b35]"
                  }`}>
                  {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Star size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-600">No {filter} requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((req) => {
                  const cfg        = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const IconComp   = ICON_MAP[req.icon] || Star;
                  return (
                    <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                            <IconComp size={22} className="text-[#3d6b35]" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-base">{req.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              By <span className="font-semibold">{req.landlord?.first_name} {req.landlord?.last_name}</span>
                              · {new Date(req.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Icon: {req.icon || "star"}</p>
                            {req.admin_note && <p className="text-xs text-red-500 mt-1">Note: {req.admin_note}</p>}
                          </div>
                        </div>
                        <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 ${cfg.color}`}>
                          <StatusIcon size={12} /> {cfg.label}
                        </span>
                      </div>

                      {req.status === "pending" && (
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => handleApprove(req.id)} disabled={!!processing}
                            className="flex-1 py-2.5 bg-[#3d6b35] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5525] transition flex items-center justify-center gap-2 disabled:opacity-50">
                            {processing === req.id + "approve" ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Approve & Add to List
                          </button>
                          <button onClick={() => setRejectTarget(req.id)} disabled={!!processing}
                            className="flex-1 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50">
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* GLOBAL AMENITIES TAB */}
        {tab === "amenities" && (
          <>
            <p className="text-sm text-gray-500 mb-4">Click ✏️ to update the icon. Removing won't affect existing listings.</p>
            {amenities.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <Star size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-600">No amenities yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {amenities.map((amenity) => {
                  const IconComp = ICON_MAP[amenity.icon] || Star;
                  return (
                    <div key={amenity.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                        <IconComp size={20} className="text-[#3d6b35]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{amenity.name}</p>
                        <p className="text-[10px] text-gray-400">icon: {amenity.icon || "star"}</p>
                      </div>
                      <button
                        onClick={() => { setEditAmenity(amenity); setEditIcon(amenity.icon || "star"); }}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-blue-50 transition text-base"
                        title="Change icon">
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(amenity.id, amenity.name)}
                        disabled={processing === "del" + amenity.id}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50 shrink-0">
                        {processing === "del" + amenity.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => { setRejectTarget(null); setRejectNote(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Reject Request</h3>
            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Optional reason..." rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#3d6b35] transition resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { setRejectTarget(null); setRejectNote(""); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleReject} disabled={!!processing}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition disabled:opacity-50">
                {processing ? <Loader size={14} className="animate-spin mx-auto" /> : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit icon modal */}
      {editAmenity && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => setEditAmenity(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">Change Icon</h3>
                <p className="text-xs text-gray-500">"{editAmenity.name}"</p>
              </div>
              <button onClick={() => setEditAmenity(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 text-lg">
                ✕
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <IconPicker selected={editIcon} onSelect={setEditIcon} />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 shrink-0">
              <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 rounded-xl">
                {(() => { const I = ICON_MAP[editIcon] || Star; return <I size={24} className="text-[#3d6b35]" />; })()}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{editAmenity.name}</p>
                  <p className="text-xs text-gray-400">Selected: {editIcon}</p>
                </div>
              </div>
              <button onClick={handleUpdateIcon} disabled={!!processing}
                className="w-full py-3 bg-[#3d6b35] text-white rounded-xl font-semibold hover:bg-[#2d5525] transition disabled:opacity-50 flex items-center justify-center">
                {processing === "icon" + editAmenity.id
                  ? <Loader size={16} className="animate-spin" />
                  : "Save Icon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}