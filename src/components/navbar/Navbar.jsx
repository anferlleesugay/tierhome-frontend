// FILE: src/components/navbar/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Menu, Search, LogOut, BadgeCheck, AlertCircle, ChevronDown,
  LayoutDashboard, Building, Calendar, MessageCircle,
  Shield, ClipboardList, BarChart2, CheckSquare, Star,
} from "lucide-react";

import logo from "../../assets/logo.png";
import icon from "../../assets/icon.png";

import SearchBar from "./SearchBar";
import MobileSearchModal from "./MobileSearchModal";
import MobileBottomNav from "./MobileBottomNav";
import HamburgerMenu from "./HamburgerMenu";

import { useAuth } from "../../context/AuthContext";

function TopNavLink({ to, icon: Icon, label }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const isActive  = location.pathname.startsWith(to);
  return (
    <button onClick={() => navigate(to)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        isActive ? "bg-green-50 text-[#3d6b35]" : "text-gray-600 hover:bg-gray-50 hover:text-[#3d6b35]"
      }`}>
      <Icon size={16} />
      {label}
    </button>
  );
}

function DropdownItem({ label, to, onClose }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => { navigate(to); onClose(); }}
      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-[#3d6b35] transition-colors">
      {label}
    </button>
  );
}

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, isLoggedIn, isVerified, role, logout } = useAuth();

  const [scrolled,      setScrolled]      = useState(false);
  const [openDropdown,  setOpenDropdown]  = useState(false);
  const [barangay,      setBarangay]      = useState("All Barangays");
  const [budget,        setBudget]        = useState("");
  const [propertyType,  setPropertyType]  = useState("All Types");
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showHamburger,    setShowHamburger]    = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (barangay !== "All Barangays") params.append("barangay", barangay);
    if (budget) params.append("budget", budget.replace(/,/g, ""));
    if (propertyType !== "All Types") params.append("type", propertyType);
    navigate(`/browse?${params.toString()}`);
  };

  const compactText = [
    barangay !== "All Barangays" ? barangay : "Anywhere",
    budget ? `₱${budget}` : "Any Budget",
    propertyType !== "All Types" ? propertyType : "Any Type",
  ].join(" · ");

  const landlordLinks = [
    { to: "/landlord/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
    { to: "/landlord/listings",     icon: Building,        label: "Listings" },
    { to: "/landlord/reservations", icon: Calendar,        label: "Reservations" },
    { to: "/landlord/messages",     icon: MessageCircle,   label: "Messages" },
  ];

  const adminLinks = [
    { to: "/admin/dashboard",    icon: Shield,        label: "Dashboard" },
    { to: "/admin/verification", icon: CheckSquare,   label: "Verifications" },
    { to: "/admin/listings",     icon: ClipboardList, label: "Listings" },
    { to: "/admin/amenities",    icon: Star,          label: "Amenities" },
    { to: "/admin/analytics",    icon: BarChart2,     label: "Analytics" },
  ];

  const isLandlord = role === "landlord";
  const isAdmin    = role === "admin";

  return (
    <>
      <nav className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
        scrolled ? "h-16 shadow-md border-b border-primary/20" : "h-20 shadow-sm border-b border-gray-100"
      }`}>

        {/* ── DESKTOP ── */}
        <div className="hidden md:flex max-w-[1280px] mx-auto px-6 xl:px-8 h-full items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex flex-col shrink-0">
            <img src={logo} className="w-[150px] h-auto object-contain" />
            {!isLandlord && !isAdmin && (
              <span className="text-[10px] text-gray-400 mt-0.5">Angeles City · Verified Rentals</span>
            )}
          </Link>

          {/* Center — nav links for landlord/admin, search for tenant/guest */}
          {isLandlord ? (
            <div className="flex items-center gap-1">
              {landlordLinks.map((l) => <TopNavLink key={l.to} {...l} />)}
            </div>
          ) : isAdmin ? (
            <div className="flex items-center gap-1">
              {adminLinks.map((l) => <TopNavLink key={l.to} {...l} />)}
            </div>
          ) : !scrolled ? (
            <SearchBar barangay={barangay} setBarangay={setBarangay}
              budget={budget} setBudget={setBudget}
              propertyType={propertyType} setPropertyType={setPropertyType}
              onSearch={handleSearch} />
          ) : (
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-3 border border-gray-200 rounded-2xl px-5 h-11 shadow-sm hover:border-[#3d6b35] transition-colors">
              <Search size={15} className="text-gray-400" />
              <span className="text-sm text-gray-600">{compactText}</span>
            </button>
          )}

          {/* Right — auth */}
          <div className="flex items-center gap-4 relative shrink-0">
            {!isLoggedIn ? (
              <>
                <button onClick={() => navigate("/login", { state: { background: location } })}
                  className="text-sm font-medium text-gray-700 hover:text-[#3d6b35] transition">
                  Login
                </button>
                <button onClick={() => navigate("/register", { state: { background: location } })}
                  className="text-sm font-semibold border-2 border-[#3d6b35] text-[#3d6b35] px-5 py-2 rounded-full hover:bg-[#3d6b35] hover:text-white transition-all duration-200">
                  Register
                </button>
              </>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setOpenDropdown(!openDropdown)}
                  className="flex items-center gap-2.5 hover:bg-gray-50 px-3 py-2 rounded-2xl transition-all">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border-2 border-green-100"
                      style={{ background: "#dcfce7", color: "#3d6b35" }}>
                      {user?.profile_picture ? (
                        <img src={`${import.meta.env.VITE_API_URL.replace("/api", "")}/storage/${user.profile_picture}`}
                          alt={user?.first_name} className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = "none"; }} />
                      ) : (
                        <span>{user?.first_name?.charAt(0) || "U"}</span>
                      )}
                    </div>
                    {isVerified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
                        <BadgeCheck size={13} style={{ color: "#3d6b35" }} />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden lg:block">Hi, {user?.first_name}</span>
                  <ChevronDown size={14} className={`text-gray-400 hidden lg:block transition-transform duration-200 ${openDropdown ? "rotate-180" : ""}`} />
                </button>

                {openDropdown && (
                  <div className="absolute right-0 top-14 w-[240px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden z-50">

                    {/* User info */}
                    <div className="px-4 py-4 border-b border-gray-50">
                      <p className="font-bold text-sm text-gray-900">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{user?.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                          role === "tenant" ? "bg-green-100 text-green-700"
                          : role === "landlord" ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                        }`}>
                          {role?.charAt(0).toUpperCase() + role?.slice(1)}
                        </span>
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold bg-green-100 text-green-700">
                            <BadgeCheck size={11} /> Verified
                          </span>
                        ) : (
                          <button onClick={() => { setOpenDropdown(false); navigate("/verify"); }}
                            className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 transition">
                            <AlertCircle size={11} /> Verify now
                          </button>
                        )}
                      </div>
                    </div>

                    {/* My Profile for all roles */}
                    <div className="py-1 border-b border-gray-50">
                      <DropdownItem label="My Profile" to="/profile" onClose={() => setOpenDropdown(false)} />
                    </div>

                    {/* Tenant links */}
                    {role === "tenant" && (
                      <div className="py-1">
                        <DropdownItem label="Browse Listings"       to="/browse"              onClose={() => setOpenDropdown(false)} />
                        <DropdownItem label="Map Search"            to="/tenant/map"          onClose={() => setOpenDropdown(false)} />
                        <DropdownItem label="Dashboard"             to="/tenant/dashboard"    onClose={() => setOpenDropdown(false)} />
                        <DropdownItem label="Saved Listings"        to="/tenant/saved"        onClose={() => setOpenDropdown(false)} />
                        <DropdownItem label="My Reservations"       to="/tenant/reservations" onClose={() => setOpenDropdown(false)} />
                        <DropdownItem label="Messages"              to="/tenant/messages"     onClose={() => setOpenDropdown(false)} />
                        <DropdownItem label="Affordability Ranking" to="/tenant/ranking"      onClose={() => setOpenDropdown(false)} />
                        {!isVerified && <DropdownItem label="Verify Identity" to="/verify"   onClose={() => setOpenDropdown(false)} />}
                      </div>
                    )}

                    {/* Logout */}
                    <div className="border-t border-gray-50 px-2 py-2">
                      <button onClick={() => { logout(); setOpenDropdown(false); navigate("/"); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition text-sm font-medium">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── MOBILE ── */}
        <div className="md:hidden flex items-center justify-between px-4 h-full">
          <Link to="/"><img src={icon} className="w-10 h-10 object-contain" /></Link>

          {isLandlord || isAdmin ? (
            <span className="flex-1 mx-4 text-center text-sm font-semibold text-gray-700">
              {isLandlord ? "Landlord Portal" : "Admin Portal"}
            </span>
          ) : (
            <button onClick={() => setShowMobileSearch(true)}
              className="flex-1 mx-4 border border-gray-200 rounded-2xl px-4 h-11 flex items-center gap-2 hover:border-[#3d6b35] transition">
              <Search size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400 truncate">Search properties...</span>
            </button>
          )}

          <button onClick={() => setShowHamburger(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
            <Menu size={22} className="text-gray-700" />
          </button>
        </div>
      </nav>

      {showMobileSearch && (
        <MobileSearchModal barangay={barangay} setBarangay={setBarangay}
          budget={budget} setBudget={setBudget}
          propertyType={propertyType} setPropertyType={setPropertyType}
          onClose={() => setShowMobileSearch(false)} onSearch={handleSearch} />
      )}
      {showHamburger && <HamburgerMenu onClose={() => setShowHamburger(false)} />}
      <MobileBottomNav />
    </>
  );
}