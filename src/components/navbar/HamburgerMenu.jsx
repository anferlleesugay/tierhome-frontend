// FILE: src/components/navbar/HamburgerMenu.jsx
import { useNavigate, useLocation } from "react-router-dom";
import {
  X, ChevronRight, LogOut, Home, Search, Heart, Calendar,
  MessageCircle, LayoutDashboard, Building, Shield, UserCheck,
  List, User, MapPin, Calculator, BadgeCheck, Users, UserX, UserCog, ClipboardList,
  BarChart2, FileText,
} from "lucide-react";
import logo from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";

export default function HamburgerMenu({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, isVerified, role, logout } = useAuth();

  const handleNav = (path) => { navigate(path); onClose(); };
  const handleLogin    = () => { navigate("/login",    { state: { background: location } }); onClose(); };
  const handleRegister = () => { navigate("/register", { state: { background: location } }); onClose(); };
  const handleLogout   = () => { logout(); navigate("/"); onClose(); };

  const guestLinks = [
    { name: "Home",           path: "/",       icon: Home },
    { name: "Browse Listings",path: "/browse", icon: Search },
  ];

  const tenantLinks = [
    { name: "Home",                 path: "/",                    icon: Home },
    { name: "Browse Listings",      path: "/browse",              icon: Search },
    { name: "Map Search",           path: "/tenant/map",          icon: MapPin },
    { name: "My Dashboard",         path: "/tenant/dashboard",    icon: LayoutDashboard },
    { name: "My Profile",           path: "/profile",             icon: User },
    { name: "Saved Listings",       path: "/tenant/saved",        icon: Heart },
    { name: "My Reservations",      path: "/tenant/reservations", icon: Calendar },
    { name: "Messages",             path: "/tenant/messages",     icon: MessageCircle },
    { name: "Affordability Ranking",path: "/tenant/ranking",      icon: Calculator },
    ...(!isVerified ? [{ name: "Verify Identity", path: "/verify", icon: BadgeCheck }] : []),
  ];

  const landlordLinks = [
    { name: "My Dashboard",   path: "/landlord/analytics",      icon: LayoutDashboard },
    { name: "Analytics",      path: "/landlord/data-analytics", icon: BarChart2 },
    { name: "My Profile",     path: "/profile",                 icon: User },
    { name: "My Listings",    path: "/landlord/listings",       icon: Building },
    { name: "Reservations",   path: "/landlord/reservations",   icon: Calendar },
    { name: "Messages",       path: "/landlord/messages",       icon: MessageCircle },
    { name: "Reports",        path: "/landlord/reports",        icon: FileText },
    ...(!isVerified ? [{ name: "Verify Identity", path: "/verify", icon: BadgeCheck }] : []),
  ];

  const adminLinks = [
    { name: "Analytics",          path: "/admin/analytics",    icon: Shield },
    { name: "My Profile",         path: "/profile",            icon: User },
    { name: "Verification Queue", path: "/admin/verification", icon: UserCheck },
    { name: "Listing Moderation", path: "/admin/listings",     icon: Building },
    { name: "Amenity Requests",   path: "/admin/amenities",    icon: List },
    { name: "Listings Summary",   path: "/admin/listings-summary", icon: ClipboardList },
    { name: "Property Owners",    path: "/admin/landlords",    icon: Users },
    { name: "User Management",    path: "/admin/users",        icon: UserCog },
    { name: "Deactivation Requests", path: "/admin/deactivation-requests", icon: UserX },
  ];

  const getLinks = () => {
    if (!isLoggedIn) return guestLinks;
    if (role === "tenant")   return tenantLinks;
    if (role === "landlord") return landlordLinks;
    if (role === "admin")    return adminLinks;
    return guestLinks;
  };

  const links = getLinks();
  const initials = user?.first_name?.charAt(0) || "U";
  const STORAGE = `${import.meta.env.VITE_API_URL.replace('/api', '')}/storage/`;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="w-[85%] max-w-[340px] bg-white h-full flex flex-col shadow-2xl animate-slideIn">

        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <img src={logo} alt="TierHome" className="w-[120px] h-auto object-contain" />
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
            <X size={20} className="text-gray-700" />
          </button>
        </div>

        {/* USER SECTION */}
        <div className="px-4 py-4 border-b border-gray-100">
          {isLoggedIn ? (
            <div className="flex items-center gap-3 bg-green-50 rounded-2xl p-3 cursor-pointer"
              onClick={() => handleNav("/profile")}>
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-bold text-base shrink-0 border-2 border-green-200"
                style={{ background: "#dcfce7", color: "#3d6b35" }}>
                {user?.profile_picture
                  ? <img src={STORAGE + user.profile_picture} alt={user.first_name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = "none"; }} />
                  : initials
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    role === "tenant"   ? "bg-green-100 text-green-700"  :
                    role === "landlord" ? "bg-blue-100 text-blue-700"   :
                                         "bg-purple-100 text-purple-700"
                  }`}>
                    {role?.charAt(0).toUpperCase() + role?.slice(1)}
                  </span>
                  {isVerified
                    ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ Verified</span>
                    : role !== "admin" && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Unverified</span>
                    )
                  }
                </div>
              </div>
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
            </div>
          ) : (
            <div className="bg-green-50 rounded-2xl p-4">
              <p className="text-[13px] font-bold text-gray-800 mb-0.5">Welcome to TierHome</p>
              <p className="text-[11px] text-gray-500 mb-3">Login to access all features</p>
              <div className="flex gap-2">
                <button onClick={handleLogin}
                  className="flex-1 h-9 rounded-xl border-2 text-[12px] font-bold transition"
                  style={{ borderColor: "#3d6b35", color: "#3d6b35" }}>
                  Login
                </button>
                <button onClick={handleRegister}
                  className="flex-1 h-9 rounded-xl text-white text-[12px] font-bold transition"
                  style={{ background: "#3d6b35" }}>
                  Register
                </button>
              </div>
            </div>
          )}
        </div>

        {/* NAV LINKS */}
        <div className="flex-1 overflow-y-auto py-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <button key={link.name} onClick={() => handleNav(link.path)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-green-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: isActive ? "#3d6b35" : "#f0fdf4" }}>
                    <Icon size={16} color={isActive ? "white" : "#3d6b35"} />
                  </div>
                  <span className={`text-[14px] font-medium ${isActive ? "text-[#3d6b35] font-semibold" : "text-gray-700"}`}>
                    {link.name}
                  </span>
                </div>
                <ChevronRight size={15} className="text-gray-300 group-hover:text-[#3d6b35] transition-colors" />
              </button>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="px-4 py-4 border-t border-gray-100">
          {isLoggedIn && (
            <button onClick={handleLogout}
              className="w-full h-11 rounded-xl border-2 flex items-center justify-center gap-2 text-[13px] font-semibold transition hover:bg-red-50 mb-2"
              style={{ borderColor: "#fecaca", color: "#ef4444" }}>
              <LogOut size={15} /> Logout
            </button>
          )}
          <p className="text-[10px] text-gray-400 text-center">TierHome v1.0 · Angeles City, Pampanga</p>
        </div>
      </div>

      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    </div>
  );
}