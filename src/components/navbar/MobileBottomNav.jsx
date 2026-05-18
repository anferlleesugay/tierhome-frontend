// FILE: src/components/navbar/MobileBottomNav.jsx
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home, Search, Heart, MessageCircle, User,
  LayoutDashboard, Shield, Building, MapPin, Calendar,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { savedCount, isLoggedIn, role } = useAuth();

  const handleNav = (path, requiresAuth = false) => {
    if (requiresAuth && !isLoggedIn) {
      navigate("/login", { state: { background: location } });
      return;
    }
    navigate(path);
  };

  const getNavItems = () => {
    if (!isLoggedIn) return [
      { name: "Home",    path: "/",       icon: Home,        auth: false },
      { name: "Browse",  path: "/browse", icon: Search,      auth: false },
      { name: "Saved",   path: "/tenant/saved",    icon: Heart,       auth: true },
      { name: "Messages",path: "/tenant/messages", icon: MessageCircle,auth: true },
      { name: "Account", path: "/login",  icon: User,        auth: false },
    ];

    if (role === "tenant") return [
      { name: "Home",    path: "/",                    icon: Home,         auth: false },
      { name: "Browse",  path: "/browse",              icon: Search,       auth: false },
      { name: "Map",     path: "/tenant/map",          icon: MapPin,       auth: false },
      { name: "Messages",path: "/tenant/messages",     icon: MessageCircle,auth: false },
      { name: "Profile", path: "/profile",             icon: User,         auth: false },
    ];

    if (role === "landlord") return [
      { name: "Listings",     path: "/landlord/listings",     icon: Building,     auth: false },
      { name: "Reservations", path: "/landlord/reservations", icon: Calendar,     auth: false },
      { name: "Messages",     path: "/landlord/messages",     icon: MessageCircle,auth: false },
      { name: "Dashboard",    path: "/landlord/dashboard",    icon: LayoutDashboard,auth: false },
      { name: "Profile",      path: "/profile",               icon: User,         auth: false },
    ];

    if (role === "admin") return [
      { name: "Dashboard", path: "/admin/dashboard",    icon: Shield,         auth: false },
      { name: "Verify",    path: "/admin/verification", icon: User,           auth: false },
      { name: "Listings",  path: "/admin/listings",     icon: Building,       auth: false },
      { name: "Amenities", path: "/admin/amenities",    icon: LayoutDashboard,auth: false },
      { name: "Analytics", path: "/admin/analytics",    icon: LayoutDashboard,auth: false },
    ];

    return [
      { name: "Home",    path: "/",       icon: Home,  auth: false },
      { name: "Browse",  path: "/browse", icon: Search,auth: false },
      { name: "Account", path: "/login",  icon: User,  auth: false },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.name === "Profile"  && location.pathname === "/profile") ||
            (item.name === "Dashboard"&& location.pathname.includes("dashboard"));

          return (
            <button key={item.name} onClick={() => handleNav(item.path, item.auth)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 active:scale-95 transition-transform relative">
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: "#3d6b35" }} />
              )}
              <div className="relative">
                <Icon size={21} color={isActive ? "#3d6b35" : "#9ca3af"} />
                {item.name === "Saved" && savedCount > 0 && (
                  <div className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[9px] text-white font-bold">{savedCount > 9 ? "9+" : savedCount}</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium" style={{ color: isActive ? "#3d6b35" : "#9ca3af" }}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}