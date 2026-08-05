// FILE: src/pages/LandlordReservations.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar, MapPin, CheckCircle, XCircle, Clock,
  Loader, User, Ban, ChevronDown, ChevronUp, X, MessageCircle,
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

  // ✅ Reject/remove reason modal state
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [rejectReason,   setRejectReason]   = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReservations = async (silent = false) => {
    try {
      const res = await axios.get(`${API}/landlord-reservations`, { headers });
      setReservations(res.data.data || []);
    } catch { }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    fetchReservations();
    // ✅ Auto-refresh every 15s so approvals/cancellations from the tenant side show up
    // without needing a manual page reload
    const interval = setInterval(() => fetchReservations(true), 15000);
    return () => clearInterval(interval);
  }, [token]);

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this reservation?")) return;
    setResponding(id + "approved");
    try {
      await axios.put(`${API}/reservation/${id}/respond`, { status: "approved" }, { headers });
      fetchReservations();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to respond.");
    } finally { setResponding(null); }
  };

  const openRejectModal = (id) => {
    setRejectTargetId(id);
    setRejectReason("");
  };

  const closeRejectModal = () => {
    setRejectTargetId(null);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!rejectTargetId) return;
    setResponding(rejectTargetId + "rejected");
    try {
      await axios.put(`${API}/reservation/${rejectTargetId}/respond`,
        { status: "rejected", reason: rejectReason || null },
        { headers }
      );
      closeRejectModal();
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
                    {res.move_out_date && (
                      <div>
                        <p className="font-semibold text-gray-700 mb-0.5">Expected Move-out</p>
                        <p>{new Date(res.move_out_date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
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

                  <button
                    onClick={() => navigate(`/landlord/messages?tenant=${tenant?.id}&listing=${listing?.id}`)}
                    className="w-full py-2.5 border border-[#3d6b35] text-[#3d6b35] rounded-xl text-sm font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={14} /> Message {tenant?.first_name}
                  </button>

                  {res.payment_status && res.payment_status !== 'not_required' && (
                    <div className={`flex items-center justify-between text-xs px-3 py-2.5 rounded-xl border ${
                      res.payment_status === 'paid' ? 'bg-green-50 border-green-100 text-green-700' :
                      res.payment_status === 'refunded' ? 'bg-gray-50 border-gray-100 text-gray-600' :
                      res.payment_status === 'refund_processing' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                      res.payment_status === 'pending' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                      'bg-red-50 border-red-100 text-red-600'
                    }`}>
                      <span className="font-semibold">
                        Reservation Fee: ₱{Number(res.listing?.reservation_fee || 0).toLocaleString("en-PH")}
                      </span>
                      <span className="font-bold uppercase tracking-wide">
                        {res.payment_status === 'paid' ? 'Paid (Sandbox)' :
                         res.payment_status === 'refunded' ? 'Refunded (Sandbox)' :
                         res.payment_status === 'refund_processing' ? 'Refund Processing' :
                         res.payment_status === 'pending' ? 'Awaiting Payment' :
                         res.payment_status === 'refund_failed' ? 'Refund Failed — Contact Support' :
                         'Payment Failed'}
                      </span>
                    </div>
                  )}

                  {res.notes && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="font-semibold text-gray-700 mb-0.5">Tenant Notes</p>
                      <p>{res.notes}</p>
                    </div>
                  )}

                  {res.status === "cancelled" && res.cancellation_reason && (
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="font-semibold text-gray-700 mb-0.5">Cancellation Reason {res.cancelled_by ? `(by ${res.cancelled_by})` : ""}</p>
                      <p>{res.cancellation_reason}</p>
                    </div>
                  )}

                  {/* Action buttons — only for pending */}
                  {res.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(res.id)}
                        disabled={!!responding}
                        className="flex-1 py-2.5 bg-[#3d6b35] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5525] transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {responding === res.id + "approved"
                          ? <Loader size={14} className="animate-spin" />
                          : <CheckCircle size={14} />}
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectModal(res.id)}
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
                  {!["cancelled", "rejected"].includes(res.status) && res.status !== "pending" && (
                    <button
                      onClick={() => openRejectModal(res.id)}
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

      {/* ✅ REJECT / REMOVE REASON MODAL */}
      {rejectTargetId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => { if (!responding) closeRejectModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Reject Reservation</h2>
              <button onClick={closeRejectModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-4">
                Letting the tenant know why helps them find a better fit elsewhere.
              </p>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Reason <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Unit no longer available, requirements not met..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition resize-none mb-5" />

              <div className="flex gap-2">
                <button onClick={closeRejectModal}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={confirmReject} disabled={!!responding}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {responding ? <Loader size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}