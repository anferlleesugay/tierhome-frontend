// FILE: src/pages/LandlordProfile.jsx

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin, BadgeCheck, Building, ArrowLeft, Loader, Camera,
  Mail, Lock, Phone, Eye, EyeOff, CheckCircle, AlertCircle,
  X, Edit2, UserX, Clock, Trash2,
} from "lucide-react";
import ListingCard from "../components/listings/ListingCard";
import { useAuth } from "../context/AuthContext";

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;

export default function LandlordProfile() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user, token, role, isVerified, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isOwner = user?.id === parseInt(id);

  // ── Self-view account settings (only fetched/used when isOwner) ──
  const [account,       setAccount]       = useState(null);
  const [activeSection, setActiveSection] = useState(null); // "phone" | "email" | "password"

  const [phone,        setPhone]        = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneMsg,     setPhoneMsg]     = useState(null);

  const [newEmail,     setNewEmail]     = useState("");
  const [emailPass,    setEmailPass]    = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg,     setEmailMsg]     = useState(null);

  const [currentPass,  setCurrentPass]  = useState("");
  const [newPass,      setNewPass]      = useState("");
  const [confirmPass,  setConfirmPass]  = useState("");
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [passLoading,  setPassLoading]  = useState(false);
  const [passMsg,      setPassMsg]      = useState(null);

  // Account deactivation
  const [deactivationRequest, setDeactivationRequest] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal]  = useState(false);
  const [deactivateReason,    setDeactivateReason]     = useState("");
  const [deactivating,        setDeactivating]         = useState(false);
  const [deactivateError,     setDeactivateError]      = useState("");

  // Account deletion (separate action, same admin-review queue —
  // distinguished by "type" on the same underlying request record)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason,    setDeleteReason]    = useState("");
  const [deleting,        setDeleting]        = useState(false);
  const [deleteError,     setDeleteError]     = useState("");

  useEffect(() => {
    axios.get(`${API}/profile/${id}`)
      .then((res) => setProfile(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isOwner || !token) return;
    fetchAccount();
    fetchDeactivationStatus();
  }, [isOwner, token]);

  const fetchAccount = async () => {
    try {
      const res = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccount(res.data.data);
      setPhone(res.data.data.phone_number || "");
    } catch { }
  };

  const fetchDeactivationStatus = async () => {
    try {
      const res = await axios.get(`${API}/account/deactivate/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeactivationRequest(res.data?.data || null);
    } catch { }
  };

  const handleSubmitDeactivation = async () => {
    setDeactivating(true);
    setDeactivateError("");
    try {
      await axios.post(`${API}/account/deactivate`,
        { reason: deactivateReason || null, type: "deactivate" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDeactivateModal(false);
      setDeactivateReason("");
      fetchDeactivationStatus();
    } catch (err) {
      setDeactivateError(err.response?.data?.message || "Failed to submit request.");
    } finally { setDeactivating(false); }
  };

  const handleSubmitDeletion = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      await axios.post(`${API}/account/deactivate`,
        { reason: deleteReason || null, type: "delete" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDeleteModal(false);
      setDeleteReason("");
      fetchDeactivationStatus();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to submit request.");
    } finally { setDeleting(false); }
  };

  // Cancelling a pending request works the same regardless of its type —
  // the endpoint just checks it belongs to the current user and is pending.
  const handleCancelDeactivation = async () => {
    if (!deactivationRequest?.id) return;
    setDeactivating(true);
    try {
      await axios.delete(`${API}/account/deactivate/${deactivationRequest.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeactivationRequest(null);
    } catch { }
    finally { setDeactivating(false); }
  };

  // ── Profile picture upload ─────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("profile_picture", file);
      const res = await axios.post(`${API}/profile/picture`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const newPicture = res.data?.data?.profile_picture || res.data?.profile_picture;
      if (newPicture) {
        updateUser(res.data.data);
        setProfile((prev) => ({ ...prev, profile_picture_url: STORAGE + newPicture }));
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Update phone ───────────────────────────────────────
  const handleUpdatePhone = async (e) => {
    e.preventDefault();
    setPhoneMsg(null);
    setPhoneLoading(true);
    try {
      const res = await axios.post(`${API}/profile/phone`, { phone_number: phone }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccount(res.data.data);
      setPhoneMsg({ type: "success", text: "Phone number updated!" });
      setActiveSection(null);
    } catch (err) {
      setPhoneMsg({ type: "error", text: err.response?.data?.message || "Failed to update." });
    } finally { setPhoneLoading(false); }
  };

  // ── Update email ───────────────────────────────────────
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailMsg(null);
    setEmailLoading(true);
    try {
      const res = await axios.post(`${API}/profile/email`, { email: newEmail, password: emailPass }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccount(res.data.data);
      updateUser(res.data.data);
      setEmailMsg({ type: "success", text: "Email updated!" });
      setNewEmail(""); setEmailPass("");
      setActiveSection(null);
    } catch (err) {
      setEmailMsg({ type: "error", text: err.response?.data?.message || "Failed to update." });
    } finally { setEmailLoading(false); }
  };

  // ── Update password ────────────────────────────────────
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassMsg(null);
    if (newPass !== confirmPass) { setPassMsg({ type: "error", text: "Passwords do not match." }); return; }
    setPassLoading(true);
    try {
      await axios.post(`${API}/profile/password`, {
        current_password: currentPass,
        password: newPass,
        password_confirmation: confirmPass,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPassMsg({ type: "success", text: "Password updated!" });
      setCurrentPass(""); setNewPass(""); setConfirmPass("");
      setActiveSection(null);
    } catch (err) {
      setPassMsg({ type: "error", text: err.response?.data?.message || "Failed to update." });
    } finally { setPassLoading(false); }
  };

  if (loading) return (
    <div className="min-h-full flex items-center justify-center">
      <Loader size={32} className="text-[#3d6b35] animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl font-bold text-gray-700 mb-2">Profile not found</p>
        <button onClick={() => navigate(-1)} className="text-[#3d6b35] font-medium hover:underline">Go back</button>
      </div>
    </div>
  );

  const avatarUrl = profile?.profile_picture_url || null;
  const initials  = `${profile?.first_name?.charAt(0) || ""}${profile?.last_name?.charAt(0) || ""}`;
  const listings  = profile?.listings || [];

  return (
    <div className="min-h-full bg-gray-50 pb-24 md:pb-10">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          <ArrowLeft size={16} /> Back
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          {/* Cover */}
          <div className="h-28 bg-gradient-to-r from-[#3d6b35] to-[#2d5a27]" />

          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-green-100 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={profile.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-[#3d6b35]">{initials}</span>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                      <Loader size={20} className="text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Upload button — only show for owner */}
                {isOwner && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#3d6b35] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#2d5525] transition"
                  >
                    <Camera size={14} />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
                    Property Owner
                  </span>
                  {profile?.verification_status === "verified" && (
                    <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                      <BadgeCheck size={12} /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              {profile?.first_name} {profile?.middle_initial ? profile.middle_initial + ". " : ""}{profile?.last_name}
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Building size={14} /> {listings.length} active listing{listings.length !== 1 ? "s" : ""}
            </p>
            {isOwner && account?.phone_number && (
              <p className="text-sm text-gray-500">{account.phone_number}</p>
            )}
          </div>
        </div>

        {/* ── SELF-VIEW: ACCOUNT SETTINGS ─────────────────── */}
        {isOwner && (
          <div className="space-y-4 mb-8">

            {/* Phone */}
            <Section
              icon={Phone}
              title="Phone Number"
              value={account?.phone_number || "Not set"}
              isActive={activeSection === "phone"}
              onEdit={() => setActiveSection(activeSection === "phone" ? null : "phone")}
            >
              {phoneMsg && <Msg type={phoneMsg.type} text={phoneMsg.text} />}
              <form onSubmit={handleUpdatePhone} className="space-y-3 mt-3">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09XXXXXXXXX"
                  maxLength={11}
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={phoneLoading} className={btnClass}>
                    {phoneLoading ? <Loader size={14} className="animate-spin" /> : "Save"}
                  </button>
                  <button type="button" onClick={() => setActiveSection(null)} className={cancelClass}>Cancel</button>
                </div>
              </form>
            </Section>

            {/* Email */}
            <Section
              icon={Mail}
              title="Email Address"
              value={account?.email || ""}
              isActive={activeSection === "email"}
              onEdit={() => setActiveSection(activeSection === "email" ? null : "email")}
            >
              {emailMsg && <Msg type={emailMsg.type} text={emailMsg.text} />}
              <form onSubmit={handleUpdateEmail} className="space-y-3 mt-3">
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address" className={inputClass} required />
                <input type="password" value={emailPass} onChange={(e) => setEmailPass(e.target.value)} placeholder="Current password to confirm" className={inputClass} required />
                <div className="flex gap-2">
                  <button type="submit" disabled={emailLoading} className={btnClass}>
                    {emailLoading ? <Loader size={14} className="animate-spin" /> : "Save"}
                  </button>
                  <button type="button" onClick={() => setActiveSection(null)} className={cancelClass}>Cancel</button>
                </div>
              </form>
            </Section>

            {/* Password */}
            <Section
              icon={Lock}
              title="Password"
              value="••••••••"
              isActive={activeSection === "password"}
              onEdit={() => setActiveSection(activeSection === "password" ? null : "password")}
            >
              {passMsg && <Msg type={passMsg.type} text={passMsg.text} />}
              <form onSubmit={handleUpdatePassword} className="space-y-3 mt-3">
                <div className="relative">
                  <input type={showCurrent ? "text" : "password"} value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} placeholder="Current password" className={inputClass} required />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <div className="relative">
                  <input type={showNew ? "text" : "password"} value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New password (min 8 chars)" className={inputClass} required />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Confirm new password" className={inputClass} required />
                <div className="flex gap-2">
                  <button type="submit" disabled={passLoading} className={btnClass}>
                    {passLoading ? <Loader size={14} className="animate-spin" /> : "Save"}
                  </button>
                  <button type="button" onClick={() => setActiveSection(null)} className={cancelClass}>Cancel</button>
                </div>
              </form>
            </Section>

            {/* Verification status */}
            {!isVerified && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Identity Not Verified</p>
                  <p className="text-xs text-amber-600 mt-0.5">Verify your identity to unlock all features</p>
                </div>
                <button
                  onClick={() => navigate("/verify")}
                  className="text-xs font-bold px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition"
                >
                  Verify Now
                </button>
              </div>
            )}

            {/* Account deactivation */}
            {role !== "admin" && (
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                      <UserX size={16} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Deactivate Account</p>
                      <p className="text-xs text-gray-400">Requires admin approval before taking effect</p>
                    </div>
                  </div>

                  {deactivationRequest?.status === "pending" && deactivationRequest.type === "deactivate" ? (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700 font-medium">Your deactivation request is pending admin review.</p>
                      </div>
                      <button
                        onClick={handleCancelDeactivation}
                        disabled={deactivating}
                        className="text-xs font-bold text-amber-700 hover:underline shrink-0 disabled:opacity-50"
                      >
                        {deactivating ? "..." : "Cancel Request"}
                      </button>
                    </div>
                  ) : deactivationRequest?.status === "rejected" && deactivationRequest.type === "deactivate" ? (
                    <div className="mt-3 space-y-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                        <p className="text-xs text-gray-600">
                          Your previous request was declined{deactivationRequest.admin_note ? `: "${deactivationRequest.admin_note}"` : "."}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeactivateModal(true)}
                        className="text-xs font-bold text-red-500 hover:underline"
                      >
                        Submit a new request
                      </button>
                    </div>
                  ) : deactivationRequest?.status === "pending" && deactivationRequest.type === "delete" ? (
                    <p className="mt-3 text-xs text-gray-400">Unavailable while your account deletion request is pending.</p>
                  ) : (
                    <button
                      onClick={() => setShowDeactivateModal(true)}
                      className="mt-3 text-xs font-bold px-4 py-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition"
                    >
                      Request Deactivation
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Account deletion — separate, stronger action from
                deactivation: this permanently anonymizes personal data and
                purges biometric verification data, not just a reversible
                pause. */}
            {role !== "admin" && (
              <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                      <Trash2 size={16} className="text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Delete My Account</p>
                      <p className="text-xs text-gray-400">Permanent — cannot be undone once approved</p>
                    </div>
                  </div>

                  {deactivationRequest?.status === "pending" && deactivationRequest.type === "delete" ? (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock size={14} className="text-red-600 shrink-0" />
                        <p className="text-xs text-red-700 font-medium">Your account deletion request is pending admin review.</p>
                      </div>
                      <button
                        onClick={handleCancelDeactivation}
                        disabled={deactivating}
                        className="text-xs font-bold text-red-700 hover:underline disabled:opacity-50"
                      >
                        {deactivating ? "..." : "Cancel Request"}
                      </button>
                    </div>
                  ) : deactivationRequest?.status === "rejected" && deactivationRequest.type === "delete" ? (
                    <div className="mt-3 space-y-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                        <p className="text-xs text-gray-600">
                          Your previous request was declined{deactivationRequest.admin_note ? `: "${deactivationRequest.admin_note}"` : "."}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        Submit a new request
                      </button>
                    </div>
                  ) : deactivationRequest?.status === "pending" && deactivationRequest.type === "deactivate" ? (
                    <p className="mt-3 text-xs text-gray-400">Unavailable while your deactivation request is pending.</p>
                  ) : (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="mt-3 text-xs font-bold px-4 py-2 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition"
                    >
                      Request Account Deletion
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Listings */}
        {listings.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Active Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Building size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No active listings yet</p>
          </div>
        )}
      </div>

      {/* Deactivation confirmation modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => { if (!deactivating) setShowDeactivateModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Request Deactivation</h2>
              <button onClick={() => setShowDeactivateModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-4">
                This will submit a request to deactivate your account. An administrator will review it before your account is actually deactivated — you'll be notified either way.
              </p>

              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Reason <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="Let us know why you're leaving..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition resize-none mb-4" />

              {deactivateError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl mb-4">
                  <AlertCircle size={13} className="shrink-0" /> {deactivateError}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setShowDeactivateModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleSubmitDeactivation} disabled={deactivating}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {deactivating ? <Loader size={14} className="animate-spin" /> : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete account confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4"
          onClick={() => { if (!deleting) setShowDeleteModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Delete My Account</h2>
              <button onClick={() => setShowDeleteModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 mb-4">
                <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">
                  This permanently erases your name, email, phone number, profile photo, and the ID/selfie
                  used for identity verification — including removing your face from our verification
                  system. This cannot be undone. An administrator will review your request before it takes effect.
                </p>
              </div>

              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Reason <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Let us know why you're leaving..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition resize-none mb-4" />

              {deleteError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2.5 rounded-xl mb-4">
                  <AlertCircle size={13} className="shrink-0" /> {deleteError}
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleSubmitDeletion} disabled={deleting}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  {deleting ? <Loader size={14} className="animate-spin" /> : "Submit Deletion Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable Section ─────────────────────────────────────
function Section({ icon: Icon, title, value, isActive, onEdit, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
            <Icon size={16} className="text-[#3d6b35]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
            <p className="text-sm font-medium text-gray-800">{value}</p>
          </div>
        </div>
        <button onClick={onEdit} className="text-xs font-semibold text-[#3d6b35] flex items-center gap-1 hover:underline">
          <Edit2 size={13} /> {isActive ? "Cancel" : "Edit"}
        </button>
      </div>
      {isActive && (
        <div className="px-5 pb-4 border-t border-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Message ──────────────────────────────────────────────
function Msg({ type, text }) {
  return (
    <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl mt-2 ${
      type === "success" ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
    }`}>
      {type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
      {text}
    </div>
  );
}

const inputClass = "w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm text-gray-800 outline-none focus:bg-white focus:border-[#3d6b35] focus:ring-2 focus:ring-[#3d6b35]/10 transition-all";
const btnClass   = "flex-1 h-10 bg-[#3d6b35] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5525] transition flex items-center justify-center gap-1";
const cancelClass = "flex-1 h-10 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition";