// FILE: src/pages/LandlordReservations.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar, MapPin, CheckCircle, XCircle, Clock,
  Loader, User, Ban, ChevronDown, ChevronUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-700",  icon: Clock },
  approved:  { label: "Approved",  color: "bg-green-100 text-green-700",  icon: CheckCircle },
  rejected:  { label: "Rejected",  color: "bg-red-100 text-red-700",      icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500",    icon: Ban },
};

export default function LandlordReservations() {
  const navigate        = useNavigate();
  const { token }       = useAuth();

  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [responding,   setResponding]   = useState(null);
  const [filter,       setFilter]       = useState("all");
  const [expanded,     setExpanded]     = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReservations = async () => {
    try {
      const res = await axios.get(`${API}/landlord-reservations`, { headers });
      setReservations(res.data.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReservations(); }, [token]);

  const handleRespond = async (id, status) => {
    const label = status === "approved" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${label} this reservation?`)) return;
    setResponding(id + status);
    try {
      await axios.put(`${API}/reservation/${id}/respond`, { status }, { headers });
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to respond.");
    } finally { setResponding(null); }
  };

  const getImage = (listing) => {
    if (listing?.images?.length > 0) return STORAGE + listing.images[0].image_path;
    if (listing?.image) return STORAGE + listing.image;
    return null;
  };

  const filtered = filter === "all"
    ? reservations
    : reservations.filter((r) => r.status === filter);

  const counts = {
    all:       reservations.length,
    pending:   reservations.filter((r) => r.status === "pending").length,
    approved:  reservations.filter((r) => r.status === "approved").length,
    rejected:  reservations.filter((r) => r.status === "rejected").length,
    cancelled: reservations.filter((r) => r.status === "cancelled").length,
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size={32} className="text-[#3d6b35] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 md:px-10 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <Calendar size={20} className="text-[#3d6b35]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reservations</h1>
            <p className="text-xs text-gray-500">Manage tenant reservation requests</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="max-w-4xl mx-auto px-4 md:px-10 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Object.entries(counts).map(([key, count]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                filter === key
                  ? "bg-[#3d6b35] text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#3d6b35]"
              }`}>
              {key.charAt(0).toUpperCase() + key.slice(1)} ({count})
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-10 py-4 space-y-4">

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-600">No {filter === "all" ? "" : filter} reservations</p>
          </div>
        ) : filtered.map((res) => {
          const listing    = res.listing;
          const tenant     = res.tenant;
          const img        = getImage(listing);
          const cfg        = STATUS_CONFIG[res.status] || STATUS_CONFIG.pending;
          const StatusIcon = cfg.icon;
          const isExpanded = expanded === res.id;

          return (
            <div key={res.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Top row */}
              <div className="flex gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : res.id)}>

                {/* Listing image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  {img
                    ? <img src={img} alt={listing?.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300"><MapPin size={20} /></div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{listing?.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{listing?.property_type} · ₱{Number(listing?.price || 0).toLocaleString("en-PH")}/mo</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.color}`}>
                      <StatusIcon size={11} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Tenant info */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 overflow-hidden border border-green-200 shrink-0">
                      {tenant?.profile_picture
                        ? <img src={STORAGE + tenant.profile_picture} alt={tenant.first_name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#3d6b35]">
                            {tenant?.first_name?.charAt(0)}
                          </div>
                      }
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{tenant?.first_name} {tenant?.last_name}</p>
                    <span className="text-[10px] text-gray-400">· {new Date(res.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</span>
                  </div>
                </div>

                {isExpanded ? <ChevronUp size={16} className="text-gray-400 shrink-0 mt-1" /> : <ChevronDown size={16} className="text-gray-400 shrink-0 mt-1" />}
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-3">

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
                    <div>
                      <p className="font-semibold text-gray-700 mb-0.5">Request Date</p>
                      <p>{new Date(res.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                    {res.move_in_date && (
                      <div>
                        <p className="font-semibold text-gray-700 mb-0.5">Preferred Move-in</p>
                        <p>{new Date(res.move_in_date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-700 mb-0.5">Tenant Email</p>
                      <p>{tenant?.email}</p>
                    </div>
                    {tenant?.phone_number && (
                      <div>
                        <p className="font-semibold text-gray-700 mb-0.5">Phone</p>
                        <p>{tenant?.phone_number}</p>
                      </div>
                    )}
                  </div>

                  {res.notes && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="font-semibold text-gray-700 mb-0.5">Tenant Notes</p>
                      <p>{res.notes}</p>
                    </div>
                  )}

                  {/* Action buttons — only for pending */}
                  {res.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(res.id, "approved")}
                        disabled={!!responding}
                        className="flex-1 py-2.5 bg-[#3d6b35] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5525] transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {responding === res.id + "approved"
                          ? <Loader size={14} className="animate-spin" />
                          : <CheckCircle size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleRespond(res.id, "rejected")}
                        disabled={!!responding}
                        className="flex-1 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {responding === res.id + "rejected"
                          ? <Loader size={14} className="animate-spin" />
                          : <XCircle size={14} />}
                        Reject
                      </button>
                    </div>
                  )}

                  {res.status === "approved" && (
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                      <CheckCircle size={13} /> You approved this reservation.
                    </div>
                  )}

                  {/* ✅ Landlord can remove ANY active reservation — listing goes back to available */}
                  {!["cancelled", "rejected"].includes(res.status) && (
                    <button
                      onClick={async () => {
                        if (!window.confirm("Remove this reservation? The listing will go back to available.")) return;
                        try {
                          await axios.put(`${API}/reservation/${res.id}/respond`, { status: "rejected" }, { headers });
                          fetchReservations();
                        } catch (err) {
                          alert(err.response?.data?.message || "Failed to remove reservation.");
                        }
                      }}
                      className="w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2"
                    >
                      <XCircle size={14} /> Remove Reservation
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}