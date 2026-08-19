// FILE: src/components/navbar/LandlordSidebar.jsx

import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building, Calendar, MessageCircle,
  User, ChevronLeft, ChevronRight, BarChart2, FileText, Wrench, CalendarDays, Receipt,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",    path: "/landlord/analytics",      icon: LayoutDashboard },
  { label: "Analytics",    path: "/landlord/data-analytics", icon: BarChart2 },
  { label: "Calendar",     path: "/landlord/calendar",       icon: CalendarDays },
  { label: "Listings",     path: "/landlord/listings",       icon: Building },
  { label: "Reservations", path: "/landlord/reservations",   icon: Calendar },
  { label: "Maintenance",  path: "/landlord/maintenance",    icon: Wrench },
  { label: "Expenses",     path: "/landlord/expenses",       icon: Receipt },
  { label: "Messages",     path: "/landlord/messages",       icon: MessageCircle },
  { label: "Reports",      path: "/landlord/reports",        icon: FileText },
  { label: "My Profile",   path: "/profile",                 icon: User },
];

export default function LandlordSidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-gray-100 min-h-screen sticky top-0 transition-all duration-200 ${
        collapsed ? "w-[76px]" : "w-[220px]"
      }`}
    >
      {/* Collapse toggle */}
      <div className={`flex items-center h-16 px-4 border-b border-gray-100 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Menu</span>}
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          title={collapsed ? "Expand menu" : "Collapse menu"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path
            || (path !== "/profile" && location.pathname.startsWith(path));
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl transition ${
                collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-[#3d6b35]/10 text-[#3d6b35] font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <Icon size={19} className="shrink-0" />
              {!collapsed && <span className="text-[13.5px]">{label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}