// FILE: src/layouts/AdminLayout.jsx

import { useState } from "react";
import AdminSidebar from "../components/navbar/AdminSidebar";

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex w-full">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}