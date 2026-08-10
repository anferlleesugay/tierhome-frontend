// FILE: src/pages/AdminListings.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building, CheckCircle, XCircle, MapPin,
  RefreshCw, Loader, Eye, Home,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;

const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH");
const formatDate = (d) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl border text-sm font-medium shadow-xl ${
      type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
    }`}>
      {message}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const ref = useRef(null);
  const show = (message, type = "info") => {
    if (ref.current) clearTimeout(ref.current);
    setToast({ message, type });
    ref.current = setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

function RejectModal({ open, onClose, onConfirm, processing }) {
  const [reason, setReason] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Reject Listing</h3>
        <p className="text-sm text-gray-500 mb-4">Provide a reason for rejection (optional):</p>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
          placeholder="e.g. Incomplete information, misleading photos..."
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-red-400 resize-none mb-4" />
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={() => { onConfirm(reason); setReason(""); }} disabled={processing}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50">
            {processing ? <Loader size={14} className="animate-spin" /> : <XCircle size={14} />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing, onApprove, onReject, processing, navigate }) {
  const imgs    = listing.images?.length > 0 ? listing.images : null;
  const imgUrl  = imgs ? STORAGE + imgs[0].image_path : listing.image ? STORAGE + listing.image : null;
  const landlord = listing.landlord || {};
  const amenities = (listing.amenities || []).map((a) => a.name || a).filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {imgUrl ? (
          <img src={imgUrl} alt={listing.title} className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building size={40} className="text-gray-300" />
          </div>
        )}
        <div className="absolute top-3 left-3 bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
          ⏳ Pending Review
        </div>
        <button
          onClick={() => navigate(`/listing/${listing.id}`)}
          className="absolute top-3 right-3 bg-white/90 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-white transition shadow-sm">
          <Eye size={12} /> Preview
        </button>
      </div>

      {/* Details */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-bold text-gray-900 leading-tight line-clamp-1">{listing.title}</h3>
          <p className="text-base font-bold text-[#3d6b35] shrink-0">
            {formatPeso(listing.price)}<span className="text-[10px] font-medium text-gray-400">/mo</span>
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <MapPin size={11} /> {listing.address || listing.barangay || "No address set"}, Angeles City
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-green-50 text-[#3d6b35] px-2.5 py-1 rounded-full font-semibold">
            {listing.property_type}
          </span>
          {listing.total_slots && (
            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">
              🛏 {listing.total_slots} slots
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{listing.description}</p>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {amenities.slice(0, 5).map((a) => (
              <span key={a} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{a}</span>
            ))}
            {amenities.length > 5 && (
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{amenities.length - 5} more</span>
            )}
          </div>
        )}

        {/* Landlord info */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-4 bg-gray-50 rounded-xl px-3 py-2.5">
          <div>
            <p className="font-semibold text-gray-700">{landlord.first_name} {landlord.last_name}</p>
            <p>{landlord.email}</p>
          </div>
          <p>{formatDate(listing.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onReject(listing.id)} disabled={!!processing}
            className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1.5 disabled:opacity-50">
            {processing === listing.id + "reject" ? <Loader size={13} className="animate-spin" /> : <XCircle size={14} />}
            Reject
          </button>
          <button onClick={() => onApprove(listing.id)} disabled={!!processing}
            className="flex-1 py-2.5 rounded-xl bg-[#3d6b35] text-white text-sm font-semibold hover:bg-[#2d5525] transition flex items-center justify-center gap-1.5 disabled:opacity-50">
            {processing === listing.id + "approve" ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={14} />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminListings() {
  const navigate       = useNavigate();
  const { token }      = useAuth();
  const { toast, show } = useToast();

  const [listings,         setListings]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [processing,       setProcessing]       = useState(null);
  const [rejectTarget,     setRejectTarget]     = useState(null);
  const [rejectProcessing, setRejectProcessing] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/listings/pending`, { headers });
      setListings(res.data?.data?.data || res.data?.data || []);
    } catch {
      show("Failed to load pending listings.", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchListings(); }, [token]);

  const handleApprove = async (id) => {
    setProcessing(id + "approve");
    try {
      await axios.post(`${API}/admin/listings/${id}/approve`, {}, { headers });
      show("Listing approved and published! ✅", "success");
      fetchListings();
    } catch (err) {
      show(err.response?.data?.message || "Failed to approve.", "error");
    } finally { setProcessing(null); }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setRejectProcessing(true);
    try {
      await axios.post(`${API}/admin/listings/${rejectTarget}/reject`, { reason }, { headers });
      show("Listing rejected.", "success");
      setRejectTarget(null);
      fetchListings();
    } catch (err) {
      show(err.response?.data?.message || "Failed to reject.", "error");
    } finally { setRejectProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 md:px-10 py-5 sticky top-0 z-20">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <Building size={20} className="text-[#3d6b35]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Listing Moderation</h1>
              <p className="text-xs text-gray-500">Review and approve landlord listings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {listings.length > 0 && (
              <span className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200">
                {listings.length} pending
              </span>
            )}
            <button onClick={fetchListings}
              className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-400">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 mt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-96 bg-white rounded-2xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-1">All clear!</h3>
            <p className="text-sm text-gray-400">No listings pending review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing}
                onApprove={handleApprove}
                onReject={(id) => setRejectTarget(id)}
                processing={processing}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>

      <RejectModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
        processing={rejectProcessing}
      />
      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}