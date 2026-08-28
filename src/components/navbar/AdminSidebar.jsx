// FILE: src/components/navbar/AdminSidebar.jsx

import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BarChart2, CheckSquare, ClipboardList, Star, Users, UserCog, UserX,
  FileText, ChevronLeft, ChevronRight, ScrollText, Wallet, Activity,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",       path: "/admin/dashboard",              icon: LayoutDashboard },
  { label: "Analytics",       path: "/admin/analytics",              icon: BarChart2 },
  { label: "Verifications",   path: "/admin/verification",           icon: CheckSquare },
  { label: "Listings",        path: "/admin/listings",                icon: ClipboardList },
  { label: "Amenities",       path: "/admin/amenities",               icon: Star },
  { label: "Property Owners", path: "/admin/landlords",               icon: Users },
  { label: "User Management", path: "/admin/users",                   icon: UserCog },
  { label: "Deactivations",   path: "/admin/deactivation-requests",   icon: UserX },
  { label: "Listings Summary",path: "/admin/listings-summary",        icon: FileText },
  { label: "Revenue by Owner",path: "/admin/revenue-by-owner",        icon: Wallet },
  { label: "Audit Trail",     path: "/admin/audit-trail",             icon: ScrollText },
  { label: "Model Monitoring", path: "/admin/model-monitoring",       icon: Activity },
];

export default function AdminSidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 bg-white border-r border-gray-100 min-h-full sticky top-0 transition-all duration-200 ${
        collapsed ? "w-[76px]" : "w-[220px]"
      }`}
    >
      <div className={`flex items-center h-16 px-4 border-b border-gray-100 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Admin Menu</span>}
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          title={collapsed ? "Expand menu" : "Collapse menu"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
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