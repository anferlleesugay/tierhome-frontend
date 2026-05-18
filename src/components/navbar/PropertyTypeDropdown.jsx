import { useRef, useEffect } from "react";
import {
  Home,
  Building,
  Building2,
  Warehouse,
  School,
  DoorOpen,
  BedDouble,
  LayoutGrid
} from "lucide-react";

export default function PropertyTypeDropdown({
  selected,
  setSelected,
  close,
}) {
  const ref = useRef(null);

  const types = [
    { name: "All Types", icon: LayoutGrid },
    { name: "House", icon: Home },
    { name: "Apartment", icon: Building },
    { name: "Condo", icon: Building2 },
    { name: "Studio", icon: Warehouse },
    { name: "Dormitory", icon: School },
    { name: "Boarding House", icon: DoorOpen },
    { name: "Bedspace", icon: BedDouble },
  ];

  // ================= OUTSIDE CLICK =================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!ref.current?.contains(e.target)) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [close]);

  return (
    <div
      ref={ref}
      className="
        absolute top-[110%] left-0 w-full min-w-[260px]
        bg-white border border-gray-200
        rounded-2xl shadow-xl
        p-3
        grid grid-cols-2 gap-2
        z-50 animate-slideDown
      "
    >
      {types.map((type) => {
        const Icon = type.icon;

        return (
          <div
            key={type.name}
            onClick={() => {
              setSelected(type.name);
              close();
            }}
            className={`
              flex items-center gap-2
              p-3 rounded-xl cursor-pointer
              transition-all text-sm font-medium
              ${
                selected === type.name
                  ? "bg-primary text-white"
                  : "hover:bg-green-50 text-gray-700"
              }
            `}
          >
            <Icon size={18} />
            {type.name}
          </div>
        );
      })}
    </div>
  );
}