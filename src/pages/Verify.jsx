import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Upload, Camera, CheckCircle, Clock, XCircle,
  RefreshCw, AlertCircle, ArrowRight, Loader,
  PartyPopper, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";

const API = import.meta.env.VITE_API_URL;

export default function Verify() {
  const navigate = useNavigate();
  const { token, isLoggedIn, role, user, refreshUser } = useAuth();

  const [status,          setStatus]          = useState(null);
  const [pageLoading,     setPageLoading]     = useState(true);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submittedAt,     setSubmittedAt]     = useState(null);

  const [idFile,           setIdFile]           = useState(null);
  const [idPreview,        setIdPreview]        = useState(null);
  const [showIdCamera,     setShowIdCamera]     = useState(false);

  const [selfieFile,       setSelfieFile]       = useState(null);
  const [selfiePreview,    setSelfiePreview]    = useState(null);
  const [showSelfieCamera, setShowSelfieCamera] = useState(false);

  const idVideoRef      = useRef(null);
  const idStreamRef     = useRef(null);
  const selfieVideoRef  = useRef(null);
  const selfieStreamRef = useRef(null);
  const idInputRef      = useRef(null);
  const selfieInputRef  = useRef(null);

  useEffect(() => {
    if (!isLoggedIn) navigate("/login");
  }, [isLoggedIn, navigate]);

  // ✅ AuthContext polls verification_status in the background every 15s.
  // If approval lands while the user is sitting on this exact page,
  // catch it here instead of requiring a manual refresh.
  useEffect(() => {
    if (user?.verification_status === "verified" && status !== "verified") {
      setStatus("verified");
    }
  }, [user?.verification_status]);

  useEffect(() => {
    return () => {
      idStreamRef.current?.getTracks().forEach((t) => t.stop());
      selfieStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const normalizeStatus = (s) => {
    if (!s) return "unverified";
    if (s === "approved") return "verified";
    return s;
  };

  useEffect(() => {
    const check = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API}/verify/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data       = res.data?.data;
        const normalized = normalizeStatus(data?.status);
        setStatus(normalized);
        setRejectionReason(data?.rejection_reason || "");
        setSubmittedAt(data?.created_at || null);
        if (normalized === "verified") {
          await refreshUser();
          if (role === "landlord") navigate("/landlord/dashboard");
          else navigate("/browse");
        }
      } catch {
        setStatus("unverified");
      } finally {
        setPageLoading(false);
      }
    };
    check();
  }, [token, navigate]);

  /* ─── ID Camera ─────────────────────────────────── */
  const startIdCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      idStreamRef.current = stream;
      setShowIdCamera(true);
      setTimeout(() => { if (idVideoRef.current) idVideoRef.current.srcObject = stream; }, 100);
    } catch { setError("Camera access denied."); }
  };

  const captureId = () => {
    if (!idVideoRef.current) return;
    const c = document.createElement("canvas");
    c.width = idVideoRef.current.videoWidth;
    c.height = idVideoRef.current.videoHeight;
    c.getContext("2d").drawImage(idVideoRef.current, 0, 0);
    c.toBlob((blob) => {
      setIdPreview(c.toDataURL("image/jpeg", 0.9));
      setIdFile(new File([blob], "id_photo.jpg", { type: "image/jpeg" }));
      stopIdCamera();
    }, "image/jpeg", 0.9);
  };

  const stopIdCamera = () => {
    idStreamRef.current?.getTracks().forEach((t) => t.stop());
    idStreamRef.current = null;
    setShowIdCamera(false);
  };

  /* ─── Selfie Camera ──────────────────────────────── */
  const startSelfieCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      selfieStreamRef.current = stream;
      setShowSelfieCamera(true);
      setTimeout(() => { if (selfieVideoRef.current) selfieVideoRef.current.srcObject = stream; }, 100);
    } catch { setError("Camera access denied."); }
  };

  const captureSelfie = () => {
    if (!selfieVideoRef.current) return;
    const c = document.createElement("canvas");
    c.width = selfieVideoRef.current.videoWidth;
    c.height = selfieVideoRef.current.videoHeight;
    c.getContext("2d").drawImage(selfieVideoRef.current, 0, 0);
    c.toBlob((blob) => {
      setSelfiePreview(c.toDataURL("image/jpeg", 0.9));
      setSelfieFile(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
      stopSelfieCamera();
    }, "image/jpeg", 0.9);
  };

  const stopSelfieCamera = () => {
    selfieStreamRef.current?.getTracks().forEach((t) => t.stop());
    selfieStreamRef.current = null;
    setShowSelfieCamera(false);
  };

  /* ─── File Handlers ──────────────────────────────── */
  const onIdFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setIdFile(f);
    const r = new FileReader(); r.onload = (ev) => setIdPreview(ev.target?.result); r.readAsDataURL(f);
  };

  const onSelfieFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    setSelfieFile(f);
    const r = new FileReader(); r.onload = (ev) => setSelfiePreview(ev.target?.result); r.readAsDataURL(f);
  };

  /* ─── Submit ─────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!idFile || !selfieFile) return;
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("id_photo", idFile);
      fd.append("selfie",   selfieFile);
      const res = await axios.post(`${API}/verify`, fd, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      const returned = normalizeStatus(res.data?.data?.status);
      const reason   = res.data?.data?.rejection_reason || res.data?.message || "";
      setSubmitting(false);
      if (returned === "verified") {
        await refreshUser();
        if (role === "landlord") navigate("/landlord/dashboard");
        else navigate("/browse");
      } else {
        setStatus(returned);
        setRejectionReason(reason);
      }
    } catch (err) {
      const msg       = err.response?.data?.message || "Submission failed. Please try again.";
      const errStatus = err.response?.data?.data?.status;
      const errReason = err.response?.data?.data?.rejection_reason || msg;
      setSubmitting(false);
      if (errStatus === "rejected") {
        setStatus("rejected");
        setRejectionReason(errReason);
      } else {
        setError(msg);
      }
    }
  };

  const handleReset = () => {
    setIdFile(null); setIdPreview(null);
    setSelfieFile(null); setSelfiePreview(null);
    setError(""); setStatus("unverified");
  };

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const currentStep = !idFile ? 1 : !selfieFile ? 2 : 3;
  const steps = ["Upload ID", "Take Selfie", "Submit"];

  /* ─── Loading ────────────────────────────────────── */
  if (pageLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader size={36} className="text-green-600 animate-spin" />
    </div>
  );

  /* ─── Verified ───────────────────────────────────── */
  if (status === "verified") return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <PartyPopper size={40} className="text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">You're Verified!</h1>
        <p className="text-gray-500 mb-8">Your identity has been confirmed. Welcome to TierHome!</p>
        <button onClick={() => role === "landlord" ? navigate("/landlord/dashboard") : navigate("/browse")}
          className="w-full h-12 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition">
          <ArrowRight size={18} /> {role === "landlord" ? "Go to Dashboard" : "Browse Listings"}
        </button>
      </div>
    </div>
  );

  /* ─── Pending ────────────────────────────────────── */
  if (status === "pending") return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <Clock size={40} className="text-amber-600 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Under Review</h1>
        <p className="text-gray-500 mb-2">Your verification is being reviewed.</p>
        {submittedAt && <p className="text-sm text-gray-400 mb-8">Submitted on {formatDate(submittedAt)}</p>}
        <button onClick={() => role === "landlord" ? navigate("/landlord/dashboard") : navigate("/browse")}
          className="w-full h-12 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition">
          Continue
        </button>
      </div>
    </div>
  );

  /* ─── Rejected ───────────────────────────────────── */
  if (status === "rejected") return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Verification Rejected</h1>
        {rejectionReason && (
          <p className="text-sm text-gray-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">{rejectionReason}</p>
        )}
        <p className="text-sm text-gray-400 mb-8">Please try again with clearer photos.</p>
        <button onClick={handleReset}
          className="w-full h-12 rounded-xl bg-red-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition mb-3">
          <RefreshCw size={18} /> Try Again
        </button>
        <button onClick={() => role === "landlord" ? navigate("/landlord/dashboard") : navigate("/browse")}
          className="w-full h-12 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition">
          Continue
        </button>
      </div>
    </div>
  );

  /* ─── Unverified Main Form ───────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">Identity Verification</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        <div>
          <div className="flex items-center mb-2">
            {steps.map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep > i + 1 ? "bg-green-600 text-white" :
                  currentStep === i + 1 ? "bg-green-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {currentStep > i + 1 ? <CheckCircle size={14} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${currentStep > i + 1 ? "bg-green-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between px-0">
            {steps.map((label, i) => (
              <span key={i} className={`text-xs font-semibold ${currentStep === i + 1 ? "text-green-600" : "text-gray-400"}`}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 flex-1">{error}</p>
            <button onClick={() => setError("")}><X size={16} className="text-red-400" /></button>
          </div>
        )}

        {/* STEP 1: ID */}
        <div className={`bg-white rounded-2xl border shadow-sm p-6 transition-opacity ${!idFile && currentStep !== 1 ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-gray-900">Step 1 — Government ID</h2>
            {idFile && <CheckCircle size={20} className="text-green-500" />}
          </div>
          <p className="text-sm text-gray-500 mb-5">Upload or capture a clear photo of your government-issued ID.</p>
          {showIdCamera && (
            <div className="mb-4 rounded-xl overflow-hidden bg-black">
              <video ref={idVideoRef} autoPlay playsInline className="w-full rounded-t-xl" />
              <div className="flex gap-3 p-3 bg-gray-900">
                <button onClick={captureId} className="flex-1 h-10 bg-green-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition">
                  <CheckCircle size={15} /> Capture
                </button>
                <button onClick={stopIdCamera} className="flex-1 h-10 bg-gray-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-500 transition">
                  <X size={15} /> Cancel
                </button>
              </div>
            </div>
          )}
          {idPreview && !showIdCamera && (
            <div className="relative mb-4 rounded-xl overflow-hidden border border-gray-200">
              <img src={idPreview} alt="ID" className="w-full h-48 object-cover" />
              <button onClick={() => { setIdFile(null); setIdPreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition shadow">
                <X size={14} />
              </button>
            </div>
          )}
          {!showIdCamera && !idFile && (
            <div className="grid grid-cols-2 gap-3">
              <label htmlFor="id-file" className="h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-green-500 hover:bg-green-50 transition">
                <Upload size={26} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Upload Photo</span>
                <span className="text-xs text-gray-400">JPG, PNG up to 5MB</span>
                <input id="id-file" type="file" accept="image/*" className="hidden" ref={idInputRef} onChange={onIdFile} />
              </label>
              <button onClick={startIdCamera} className="h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-green-500 hover:bg-green-50 transition">
                <Camera size={26} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Take Photo</span>
                <span className="text-xs text-gray-400">Use your camera</span>
              </button>
            </div>
          )}
          {idFile && !showIdCamera && (
            <div className="grid grid-cols-2 gap-3">
              <label htmlFor="id-file-2" className="h-10 border border-gray-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition text-sm font-medium text-gray-600">
                <Upload size={14} /> Change File
                <input id="id-file-2" type="file" accept="image/*" className="hidden" onChange={onIdFile} />
              </label>
              <button onClick={startIdCamera} className="h-10 border border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition text-sm font-medium text-gray-600">
                <Camera size={14} /> Retake Photo
              </button>
            </div>
          )}
        </div>

        {/* STEP 2: SELFIE */}
        <div className={`bg-white rounded-2xl border shadow-sm p-6 transition-opacity ${!idFile ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-bold text-gray-900">Step 2 — Selfie Photo</h2>
            {selfieFile && <CheckCircle size={20} className="text-green-500" />}
          </div>
          <p className="text-sm text-gray-500 mb-5">Upload or take a selfie so we can compare your face to your ID.</p>
          {showSelfieCamera && (
            <div className="mb-4 rounded-xl overflow-hidden bg-black">
              <video ref={selfieVideoRef} autoPlay playsInline className="w-full rounded-t-xl" />
              <div className="flex gap-3 p-3 bg-gray-900">
                <button onClick={captureSelfie} className="flex-1 h-10 bg-green-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition">
                  <CheckCircle size={15} /> Capture
                </button>
                <button onClick={stopSelfieCamera} className="flex-1 h-10 bg-gray-600 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-500 transition">
                  <X size={15} /> Cancel
                </button>
              </div>
            </div>
          )}
          {selfiePreview && !showSelfieCamera && (
            <div className="relative mb-4 rounded-xl overflow-hidden border border-gray-200">
              <img src={selfiePreview} alt="Selfie" className="w-full h-48 object-cover" />
              <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600 transition shadow">
                <X size={14} />
              </button>
            </div>
          )}
          {!showSelfieCamera && !selfieFile && (
            <div className="grid grid-cols-2 gap-3">
              <label htmlFor="selfie-file" className="h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-green-500 hover:bg-green-50 transition">
                <Upload size={26} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Upload Photo</span>
                <span className="text-xs text-gray-400">JPG, PNG up to 5MB</span>
                <input id="selfie-file" type="file" accept="image/*" className="hidden" ref={selfieInputRef} onChange={onSelfieFile} />
              </label>
              <button onClick={startSelfieCamera} className="h-28 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-green-500 hover:bg-green-50 transition">
                <Camera size={26} className="text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">Take Selfie</span>
                <span className="text-xs text-gray-400">Use front camera</span>
              </button>
            </div>
          )}
          {selfieFile && !showSelfieCamera && (
            <div className="grid grid-cols-2 gap-3">
              <label htmlFor="selfie-file-2" className="h-10 border border-gray-300 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition text-sm font-medium text-gray-600">
                <Upload size={14} /> Change File
                <input id="selfie-file-2" type="file" accept="image/*" className="hidden" onChange={onSelfieFile} />
              </label>
              <button onClick={startSelfieCamera} className="h-10 border border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition text-sm font-medium text-gray-600">
                <Camera size={14} /> Retake Selfie
              </button>
            </div>
          )}
        </div>

        {/* STEP 3: REVIEW & SUBMIT */}
        {idFile && selfieFile && (
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1">Step 3 — Review & Submit</h2>
            <p className="text-sm text-gray-500 mb-5">Make sure both photos are clear before submitting.</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Government ID</p>
                <img src={idPreview} alt="ID" className="w-full h-40 object-cover rounded-xl border" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Selfie</p>
                <img src={selfiePreview} alt="Selfie" className="w-full h-40 object-cover rounded-xl border" />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full h-12 rounded-xl bg-green-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition mb-3">
              {submitting
                ? <><Loader size={18} className="animate-spin" /> Verifying your identity...</>
                : <><CheckCircle size={18} /> Submit for Verification</>
              }
            </button>
            {!submitting && (
              <button onClick={handleReset} className="w-full h-12 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition">
                Start Over
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}