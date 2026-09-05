// FILE: src/components/Footer.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import EulaModal from "./modals/EulaModal";
import logo from "../assets/logo.png";

export default function Footer() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(null);

  const openLegal = (type) => {
    setModalType(type);
    setModalOpen(true);
  };

  return (
    <>
      <EulaModal open={modalOpen} onClose={() => setModalOpen(false)} modalType={modalType} />

      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-[1280px] mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <img src={logo} alt="TierHome" className="h-8 w-auto object-contain" />
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              A verified housing rental platform for Angeles City, helping tenants find
              affordable rentals and property owners manage listings with confidence.
            </p>
          </div>

          <div>
            <p className="text-[12px] font-bold text-gray-800 uppercase tracking-wide mb-3">Explore</p>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/")} className="text-[13px] text-gray-500 hover:text-[#3d6b35] transition text-left">Home</button></li>
              <li><button onClick={() => navigate("/browse")} className="text-[13px] text-gray-500 hover:text-[#3d6b35] transition text-left">Browse Listings</button></li>
              <li><button onClick={() => navigate("/tenant/ranking")} className="text-[13px] text-gray-500 hover:text-[#3d6b35] transition text-left">Affordability Ranking</button></li>
            </ul>
          </div>

          <div>
            <p className="text-[12px] font-bold text-gray-800 uppercase tracking-wide mb-3">Account</p>
            <ul className="space-y-2">
              <li><button onClick={() => navigate("/login")} className="text-[13px] text-gray-500 hover:text-[#3d6b35] transition text-left">Sign In</button></li>
              <li><button onClick={() => navigate("/register")} className="text-[13px] text-gray-500 hover:text-[#3d6b35] transition text-left">Create Account</button></li>
              <li><button onClick={() => navigate("/register", { state: { role: "landlord" } })} className="text-[13px] text-gray-500 hover:text-[#3d6b35] transition text-left">Register as Property Owner</button></li>
            </ul>
          </div>

          <div>
            <p className="text-[12px] font-bold text-gray-800 uppercase tracking-wide mb-3">Legal</p>
            <ul className="space-y-2">
              <li><button onClick={() => openLegal("terms")} className="text-[13px] text-gray-500 hover:text-[#3d6b35] transition text-left">Terms of Service</button></li>
              <li><button onClick={() => openLegal("privacy")} className="text-[13px] text-gray-500 hover:text-[#3d6b35] transition text-left">Privacy Policy</button></li>
              <li><button onClick={() => openLegal("dataPrivacy")} className="text-[13px] text-gray-500 hover:text-[#3d6b35] transition text-left">Data Privacy Act (RA 10173)</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100">
          <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-gray-400">© {new Date().getFullYear()} TierHome. All rights reserved.</p>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Home size={12} /> Angeles City, Pampanga, Philippines
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}