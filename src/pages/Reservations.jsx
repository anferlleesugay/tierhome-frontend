// FILE: src/pages/Reservations.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar, MapPin, CheckCircle, XCircle, Clock,
  AlertCircle, Loader, ArrowLeft, Ban, X, MessageCircle, Wrench,
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

  // ✅ Cancel reason modal state
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelReason,   setCancelReason]   = useState("");

  // ✅ Report an issue (maintenance request) modal state
  const [maintenanceTarget, setMaintenanceTarget] = useState(null); // the reservation being reported for
  const [maintenanceTitle, setMaintenanceTitle] = useState("");
  const [maintenanceDesc,  setMaintenanceDesc]  = useState("");
  const [maintenanceCategory, setMaintenanceCategory] = useState("");
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReservations = async (silent = false) => {
    try {
      const res = await axios.get(`${API}/reservations`, { headers });
      setReservations(res.data.data || []);
    } catch { }
    finally { if (!silent) setLoading(false); }
  };

  const [myMaintenanceRequests, setMyMaintenanceRequests] = useState([]);

  const fetchMyMaintenanceRequests = async () => {
    try {
      const res = await axios.get(`${API}/maintenance-requests/mine`, { headers });
      setMyMaintenanceRequests(res.data?.data || []);
    } catch { }
  };

  useEffect(() => {
    fetchReservations();
    fetchMyMaintenanceRequests();
    // ✅ Auto-refresh every 15s so approvals/rejections from the landlord side show up
    // without needing a manual page reload
    const interval = setInterval(() => { fetchReservations(true); fetchMyMaintenanceRequests(); }, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const openCancelModal = (id) => {
    setCancelTargetId(id);
    setCancelReason("");
  };

  const closeCancelModal = () => {
    setCancelTargetId(null);
    setCancelReason("");
  };

  const confirmCancel = async () => {
    if (!cancelTargetId) return;
    setCancelling(cancelTargetId);
    try {
      await axios.put(`${API}/reservation/${cancelTargetId}/cancel`,
        { reason: cancelReason || null },
        { headers }
      );
      closeCancelModal();
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

  const submitMaintenanceRequest = async () => {
    if (!maintenanceTitle.trim() || !maintenanceDesc.trim() || !maintenanceTarget) return;
    setSubmittingMaintenance(true);
    setMaintenanceMsg(null);
    try {
      await axios.post(`${API}/maintenance-requests`, {
        listing_id: maintenanceTarget.listing?.id,
        title: maintenanceTitle,
        description: maintenanceDesc,
        category: maintenanceCategory || null,
      }, { headers });
      setMaintenanceMsg({ type: "success", text: "Your report has been sent to the Property Owner." });
      setMaintenanceTitle(""); setMaintenanceDesc(""); setMaintenanceCategory("");
      fetchMyMaintenanceRequests();
      setTimeout(() => { setMaintenanceTarget(null); setMaintenanceMsg(null); }, 1800);
    } catch (err) {
      setMaintenanceMsg({ type: "error", text: err.response?.data?.message || "Failed to submit report." });
    } finally {
      setSubmittingMaintenance(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size={32} className="text-[#3d6b35] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-5">
        <div className="w-full flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <Calendar size={20} className="text-[#3d6b35]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Reservations</h1>
            <p className="text-xs text-gray-500">Track your property reservation requests</p>
          </div>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 py-6">

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
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reservations.map((res) => {
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
                  {res.move_out_date && (
                    <div>
                      <p className="font-semibold text-gray-700 mb-0.5">Expected Move-out</p>
                      <p>{new Date(res.move_out_date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</p>
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
                  <>
                    <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                      <CheckCircle size={13} className="shrink-0" />
                      Your reservation has been approved! Contact the Property Owner to finalize.
                    </div>
                    <button
                      onClick={() => navigate(`/tenant/messages?landlord=${listing?.landlord?.id}&listing=${listing?.id}`)}
                      className="w-full py-2.5 border border-[#3d6b35] text-[#3d6b35] rounded-xl text-sm font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={14} /> Message Property Owner
                    </button>
                    <button
                      onClick={() => setMaintenanceTarget(res)}
                      className="w-full mt-2 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-2"
                    >
                      <Wrench size={14} /> Report an Issue
                    </button>

                    {/* Your submitted reports for this listing, with the Property Owner's note */}
                    {myMaintenanceRequests
                      .filter((mr) => mr.listing_id === listing?.id || mr.listing?.id === listing?.id)
                      .map((mr) => {
                        const statusStyle = {
                          pending:     "bg-amber-100 text-amber-700",
                          in_progress: "bg-blue-100 text-blue-700",
                          resolved:    "bg-green-100 text-green-700",
                          rejected:    "bg-gray-100 text-gray-500",
                        }[mr.status] || "bg-gray-100 text-gray-500";
                        return (
                          <div key={mr.id} className="mt-2 bg-gray-50 border border-gray-100 rounded-xl p-3">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-xs font-semibold text-gray-700 truncate">{mr.title}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${statusStyle}`}>
                                {mr.status.replace("_", " ")}
                              </span>
                            </div>
                            {mr.landlord_note && (
                              <p className="text-[11px] text-gray-500 mt-1">
                                <span className="font-semibold text-gray-600">Property Owner:</span> {mr.landlord_note}
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </>
                )}
                {res.status === "rejected" && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    <XCircle size={13} className="shrink-0" />
                    Your reservation was rejected.{res.cancellation_reason ? ` Reason: ${res.cancellation_reason}` : " You may reserve another property."}
                  </div>
                )}
                {res.status === "cancelled" && res.cancellation_reason && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                    <Ban size={13} className="shrink-0" />
                    Cancelled{res.cancelled_by ? ` by ${res.cancelled_by}` : ""}. Reason: {res.cancellation_reason}
                  </div>
                )}

                {/* Cancel button */}
                {canCancel && (
                  <button
                    onClick={() => openCancelModal(res.id)}
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
        )}
      </div>

      {/* ✅ CANCEL REASON MODAL */}
      {cancelTargetId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => { if (cancelling === null) closeCancelModal(); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Cancel Reservation</h2>
              <button onClick={closeCancelModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to cancel this reservation? Letting the landlord know why helps them understand.
              </p>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Reason <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Found another place, change of plans..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition resize-none mb-5" />

              <div className="flex gap-2">
                <button onClick={closeCancelModal}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                  Keep Reservation
                </button>
                <button onClick={confirmCancel} disabled={cancelling !== null}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {cancelling !== null ? <Loader size={14} className="animate-spin" /> : <Ban size={14} />}
                  Cancel It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ REPORT AN ISSUE MODAL */}
      {maintenanceTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => { if (!submittingMaintenance) { setMaintenanceTarget(null); setMaintenanceMsg(null); } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Report an Issue</h2>
              <button onClick={() => setMaintenanceTarget(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-xs text-gray-400">{maintenanceTarget.listing?.title}</p>

              {maintenanceMsg && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${
                  maintenanceMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {maintenanceMsg.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {maintenanceMsg.text}
                </div>
              )}

              <input type="text" value={maintenanceTitle} onChange={(e) => setMaintenanceTitle(e.target.value)}
                placeholder="Brief title (e.g., Leaking faucet)"
                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition" />

              <select value={maintenanceCategory} onChange={(e) => setMaintenanceCategory(e.target.value)}
                className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition">
                <option value="">Category (optional)</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Appliance">Appliance</option>
                <option value="Structural">Structural</option>
                <option value="Other">Other</option>
              </select>

              <textarea value={maintenanceDesc} onChange={(e) => setMaintenanceDesc(e.target.value)} rows={4}
                placeholder="Describe the issue in detail..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition resize-none" />

              <div className="flex gap-2 pt-1">
                <button onClick={() => setMaintenanceTarget(null)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={submitMaintenanceRequest} disabled={submittingMaintenance || !maintenanceTitle.trim() || !maintenanceDesc.trim()}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {submittingMaintenance ? <Loader size={14} className="animate-spin" /> : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}