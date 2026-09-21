// FILE: src/components/VerificationStatusModal.jsx
//
// Global popup for identity verification status changes — shows a
// celebratory "You're Verified!" modal or a "Verification Rejected" modal
// with the specific reason, regardless of which page the user is currently
// on (browsing, on their dashboard, etc.), not just when they happen to be
// sitting on the /verify page itself.
//
// Driven by AuthContext's verificationPopup state, which only fires on a
// genuine status TRANSITION detected during background polling — never
// re-shows the same already-seen status on every page load.

import { PartyPopper, XCircle, ArrowRight, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function VerificationStatusModal() {
  const { verificationPopup, dismissVerificationPopup, role } = useAuth();
  const navigate = useNavigate();

  if (!verificationPopup) return null;

  const isVerified = verificationPopup.type === "verified";

  const handlePrimaryAction = () => {
    dismissVerificationPopup();
    if (isVerified) {
      navigate(role === "landlord" ? "/landlord/analytics" : "/browse");
    } else {
      navigate("/verify");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center px-4"
      onClick={dismissVerificationPopup}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
            isVerified ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {isVerified ? (
            <PartyPopper size={38} className="text-green-600" />
          ) : (
            <XCircle size={38} className="text-red-600" />
          )}
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isVerified ? "You're Verified!" : "Verification Rejected"}
        </h2>

        {isVerified ? (
          <p className="text-gray-500 mb-6">
            Your identity has been confirmed. You now have full access to TierHome.
          </p>
        ) : (
          <>
            {verificationPopup.reason && (
              <p className="text-sm text-gray-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-left">
                {verificationPopup.reason}
              </p>
            )}
            <p className="text-gray-500 mb-6">
              Please try again with clearer photos.
            </p>
          </>
        )}

        <div className="flex gap-3">
          <button
            onClick={dismissVerificationPopup}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            Dismiss
          </button>
          <button
            onClick={handlePrimaryAction}
            className={`flex-1 h-11 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition ${
              isVerified
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isVerified ? (
              <>
                Continue <ArrowRight size={16} />
              </>
            ) : (
              <>
                <RefreshCw size={15} /> Try Again
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}