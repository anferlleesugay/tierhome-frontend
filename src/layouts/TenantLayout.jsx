// FILE: src/layouts/TenantLayout.jsx

import { useState } from "react";
import TenantSidebar from "../components/navbar/TenantSidebar";

export default function TenantLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex w-full">
      <TenantSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}