// FILE: src/pages/LandlordProfile.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { MapPin, BadgeCheck, Building, ArrowLeft, Loader, Camera } from "lucide-react";
import ListingCard from "../components/listings/ListingCard";
import { useAuth } from "../context/AuthContext";

const API     = import.meta.env.VITE_API_URL;
const STORAGE = `${API.replace('/api', '')}/storage/`;

export default function LandlordProfile() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user, token, updateUser } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isOwner = user?.id === parseInt(id);

  useEffect(() => {
    axios.get(`${API}/profile/${id}`)
      .then((res) => setProfile(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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
        updateUser({ profile_picture: newPicture });
        setProfile((prev) => ({ ...prev, profile_picture_url: STORAGE + newPicture }));
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader size={32} className="text-[#3d6b35] animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 pb-20">
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
                </div>

                {/* Upload button — only show for owner */}
                {isOwner && (
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#3d6b35] rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-[#2d5a27] transition">
                    {uploadingAvatar
                      ? <span className="text-white text-[10px]">...</span>
                      : <Camera size={14} className="text-white" />
                    }
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />
                  </label>
                )}
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
          </div>
        </div>

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
    </div>
  );
}