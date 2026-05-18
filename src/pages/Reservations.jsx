// FILE: src/pages/Reservations.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar, MapPin, CheckCircle, XCircle, Clock,
  AlertCircle, Loader, ArrowLeft, Ban,
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

export default function Reservations() {
  const navigate        = useNavigate();
  const { token, user } = useAuth();

  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [cancelling,   setCancelling]   = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReservations = async () => {
    try {
      const res = await axios.get(`${API}/reservations`, { headers });
      setReservations(res.data.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReservations(); }, [token]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;
    setCancelling(id);
    try {
      await axios.put(`${API}/reservation/${id}/cancel`, {}, { headers });
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel.");
    } finally { setCancelling(null); }
  };

  const getImage = (listing) => {
    if (listing?.images?.length > 0) return STORAGE + listing.images[0].image_path;
    if (listing?.image) return STORAGE + listing.image;
    return null;
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
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <Calendar size={20} className="text-[#3d6b35]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Reservations</h1>
            <p className="text-xs text-gray-500">Track your property reservation requests</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-10 py-6 space-y-4">

        {reservations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="font-semibold text-gray-600 mb-1">No reservations yet</p>
            <p className="text-sm text-gray-400 mb-4">Find a property and click Reserve to get started</p>
            <button onClick={() => navigate("/browse")}
              className="px-6 py-2.5 bg-[#3d6b35] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5525] transition">
              Browse Listings
            </button>
          </div>
        ) : reservations.map((res) => {
          const listing   = res.listing;
          const img       = getImage(listing);
          const cfg       = STATUS_CONFIG[res.status] || STATUS_CONFIG.pending;
          const StatusIcon = cfg.icon;
          const canCancel = res.status === 'pending' || res.status === 'approved';

          return (
            <div key={res.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Listing image + info */}
              <div className="flex gap-4 p-4">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 cursor-pointer"
                  onClick={() => navigate(`/listing/${listing?.id}`)}>
                  {img
                    ? <img src={img} alt={listing?.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-gray-300"><MapPin size={24} /></div>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1 cursor-pointer hover:text-[#3d6b35] transition"
                      onClick={() => navigate(`/listing/${listing?.id}`)}>
                      {listing?.title}
                    </h3>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${cfg.color}`}>
                      <StatusIcon size={12} />
                      {cfg.label}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={11} /> {listing?.barangay}, Angeles City
                  </p>

                  <p className="text-sm font-bold text-[#3d6b35] mt-1">
                    ₱{Number(listing?.price || 0).toLocaleString("en-PH")}/mo
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    {listing?.property_type} · Hosted by {listing?.landlord?.first_name}
                  </p>
                </div>
              </div>

              {/* Reservation details */}
              <div className="px-4 pb-4 space-y-2">
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="font-semibold text-gray-700 mb-0.5">Reservation Date</p>
                    <p>{new Date(res.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                  {res.move_in_date && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-0.5">Preferred Move-in</p>
                      <p>{new Date(res.move_in_date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
                    </div>
                  )}
                </div>

                {res.notes && (
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
                    <p className="font-semibold text-gray-700 mb-0.5">Your Notes</p>
                    <p>{res.notes}</p>
                  </div>
                )}

                {/* Status message */}
                {res.status === "pending" && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <Clock size={13} className="shrink-0" />
                    Waiting for landlord to approve your request.
                  </div>
                )}
                {res.status === "approved" && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                    <CheckCircle size={13} className="shrink-0" />
                    Your reservation has been approved! Contact the landlord to finalize.
                  </div>
                )}
                {res.status === "rejected" && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <XCircle size={13} className="shrink-0" />
                    Your reservation was rejected. You may reserve another property.
                  </div>
                )}

                {/* Cancel button */}
                {canCancel && (
                  <button
                    onClick={() => handleCancel(res.id)}
                    disabled={cancelling === res.id}
                    className="w-full py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {cancelling === res.id ? <Loader size={14} className="animate-spin" /> : <Ban size={14} />}
                    Cancel Reservation
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}