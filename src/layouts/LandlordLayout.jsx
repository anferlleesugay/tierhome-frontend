// FILE: src/layouts/LandlordLayout.jsx

import { useState } from "react";
import LandlordSidebar from "../components/navbar/LandlordSidebar";

export default function LandlordLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex w-full">
      <LandlordSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}