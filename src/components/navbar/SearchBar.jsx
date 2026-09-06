import { useState } from "react";
import { Search } from "lucide-react";

import BarangayDropdown from "./BarangayDropdown";
import PropertyTypeDropdown from "./PropertyTypeDropdown";

export default function SearchBar({
  barangay,
  setBarangay,
  onBarangaySelect,
  budget,
  setBudget,
  propertyType,
  setPropertyType,
  onPropertyTypeSelect,
  onSearch,
}) {
  const [active, setActive] = useState(null);

  // ================= FORMAT PESO =================
  const formatPeso = (value) => {
    const num = value.replace(/\D/g, "");
    return num ? Number(num).toLocaleString() : "";
  };

  return (
    <div
      className="
        flex items-center bg-white 
        border border-gray-200 
        rounded-2xl shadow-sm 
        hover:shadow-md transition-all
        h-[64px] min-w-[600px] max-w-[700px]
      "
    >
      {/* ================= LOCATION ================= */}
      <div
        className={`
          flex-1 px-5 cursor-pointer relative
          ${active === "location" ? "bg-green-50 rounded-l-2xl" : ""}
        `}
        onClick={() => setActive(active === "location" ? null : "location")}
      >
        <div className="text-xs text-gray-500">Location</div>
        <div className="text-sm font-semibold text-gray-800 truncate">
          {barangay}
        </div>

        {active === "location" && (
          <BarangayDropdown
            selected={barangay}
            setSelected={onBarangaySelect || setBarangay}
            close={() => setActive(null)}
          />
        )}
      </div>

      {/* DIVIDER */}
      <div className="w-px h-8 bg-gray-200" />

      {/* ================= BUDGET ================= */}
      <div
        className={`
          flex-1 px-6
          ${active === "budget" ? "bg-green-50" : ""}
        `}
        onClick={() => setActive("budget")}
      >
        <div className="text-xs text-gray-500">Budget</div>
        <input
          value={budget}
          onChange={(e) => setBudget(formatPeso(e.target.value))}
          placeholder="Add budget"
          className="w-full text-sm font-semibold outline-none bg-transparent"
        />
      </div>

      {/* DIVIDER */}
      <div className="w-px h-8 bg-gray-200" />

      {/* ================= PROPERTY TYPE ================= */}
      <div
        className={`
          flex-1 px-5 cursor-pointer relative
          ${active === "type" ? "bg-green-50" : ""}
        `}
        onClick={() => setActive(active === "type" ? null : "type")}
      >
        <div className="text-xs text-gray-500">Property Type</div>
        <div className="text-sm font-semibold text-gray-800">
          {propertyType}
        </div>

        {active === "type" && (
          <PropertyTypeDropdown
            selected={propertyType}
            setSelected={onPropertyTypeSelect || setPropertyType}
            close={() => setActive(null)}
          />
        )}
      </div>

      {/* ================= SEARCH BUTTON ================= */}
      <div className="pr-3">
        <button
          onClick={onSearch}
          className="
            bg-primary text-white
            w-[48px] h-[48px]
            rounded-full
            flex items-center justify-center
            hover:scale-105 transition-all
          "
        >
          <Search size={18} />
        </button>
      </div>
    </div>
  );
}