import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";

export default function BarangayDropdown({ selected, setSelected, close }) {
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  const barangays = [
    "All Barangays","Agapito del Rosario","Amsic","Anunas","Balibago","Capaya",
    "Claro M. Recto","Cuayan","Cutcut","Cutud","Lourdes North West","Lourdes Sur",
    "Lourdes Sur East","Malabanias","Margot","Mining","Ninoy Aquino","Pampang",
    "Pandan","Pulung Bulu","Pulung Cacutud","Pulung Maragul","Pulungmasle",
    "Salapungan","San Jose","San Nicolas","Santa Teresita","Santa Trinidad",
    "Santo Cristo","Santo Domingo","Santo Rosario","Sapalibutad","Sapangbato",
    "Virgen Delos Remedios"
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

  // ================= FILTER =================
  const filtered = barangays.filter((b) =>
    b.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className="
        absolute top-[110%] left-0 w-full min-w-[260px]
        bg-white border border-gray-200
        rounded-2xl shadow-xl
        z-50 animate-slideDown
      "
    >
      {/* SEARCH INPUT */}
      <div className="p-3 border-b">
        <input
          placeholder="Search barangay..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full px-3 py-2 text-sm
            border border-gray-200 rounded-lg
            outline-none focus:border-primary
          "
        />
      </div>

      {/* LIST */}
      <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
        {filtered.map((b) => (
          <div
            key={b}
            onClick={() => {
              setSelected(b);
              close();
            }}
            className={`
              px-4 py-3 text-sm cursor-pointer
              flex items-center justify-between
              transition-all
              ${
                selected === b
                  ? "bg-primary text-white"
                  : "hover:bg-green-50 text-gray-700"
              }
            `}
          >
            {b}

            {selected === b && <Check size={16} />}
          </div>
        ))}

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="px-4 py-6 text-sm text-gray-400 text-center">
            No barangay found
          </div>
        )}
      </div>
    </div>
  );
}