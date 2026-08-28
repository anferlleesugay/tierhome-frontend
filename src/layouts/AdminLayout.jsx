// FILE: src/layouts/AdminLayout.jsx

import { useState } from "react";
import AdminSidebar from "../components/navbar/AdminSidebar";

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex w-full h-full">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={`flex-1 min-w-0 h-full ${collapsed ? "md:ml-[76px]" : "md:ml-[220px]"}`}>
        {children}
      </div>
    </div>
  );
}