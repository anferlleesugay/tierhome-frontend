import { useState } from "react";
import { X, Search } from "lucide-react";

export default function MobileSearchModal({
  barangay,
  setBarangay,
  budget,
  setBudget,
  propertyType,
  setPropertyType,
  onClose,
  onSearch,
}) {
  const [step, setStep] = useState("location");

  const barangays = [
    "All Barangays","Agapito del Rosario","Amsic","Anunas","Balibago","Capaya",
    "Claro M. Recto","Cuayan","Cutcut","Cutud","Lourdes Norte","Lourdes Sur",
    "Lourdes Sur East","Malabanias","Margot","Mining","Ninoy Aquino","Pampang",
    "Pandan","Pulung Bulu","Pulung Cacutud","Pulung Maragul","Pulungmasle",
    "Salapungan","San Jose","San Nicolas","Santa Teresita","Santa Trinidad",
    "Santo Cristo","Santo Domingo","Santo Rosario","Sapalibutad","Sapangbato",
    "Virgen Delos Remedios"
  ];

  const propertyTypes = [
    "All Types",
    "House",
    "Apartment",
    "Condo",
    "Studio",
    "Dormitory",
    "Boarding House",
    "Bedspace",
  ];

  const formatPeso = (val) => {
    const num = val.replace(/\D/g, "");
    return num ? Number(num).toLocaleString() : "";
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">

      {/* MODAL */}
      <div className="bg-white w-full rounded-t-2xl p-5 animate-slideUp">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {step === "location" && "Select Location"}
            {step === "budget" && "Enter Budget"}
            {step === "type" && "Property Type"}
          </h2>

          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* ================= STEP 1: LOCATION ================= */}
        {step === "location" && (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {barangays.map((b) => (
              <div
                key={b}
                onClick={() => {
                  setBarangay(b);
                  setStep("budget");
                }}
                className={`px-4 py-3 rounded-xl cursor-pointer
                  ${barangay === b
                    ? "bg-primary text-white"
                    : "hover:bg-gray-100"
                  }
                `}
              >
                {b}
              </div>
            ))}
          </div>
        )}

        {/* ================= STEP 2: BUDGET ================= */}
        {step === "budget" && (
          <div className="space-y-4">

            <input
              value={budget}
              onChange={(e) => setBudget(formatPeso(e.target.value))}
              placeholder="₱ Enter monthly budget"
              className="w-full border p-4 rounded-xl text-lg outline-none"
            />

            <button
              onClick={() => setStep("type")}
              className="w-full bg-primary text-white py-3 rounded-xl"
            >
              Next
            </button>
          </div>
        )}

        {/* ================= STEP 3: TYPE ================= */}
        {step === "type" && (
          <div className="grid grid-cols-2 gap-3">

            {propertyTypes.map((type) => (
              <div
                key={type}
                onClick={() => setPropertyType(type)}
                className={`p-3 rounded-xl text-center cursor-pointer
                  ${propertyType === type
                    ? "bg-primary text-white"
                    : "bg-gray-100"
                  }
                `}
              >
                {type}
              </div>
            ))}

            {/* SEARCH BUTTON */}
            <button
              onClick={() => {
                onSearch();
                onClose();
              }}
              className="
                col-span-2 mt-4
                bg-primary text-white
                py-4 rounded-xl
                flex items-center justify-center gap-2
              "
            >
              <Search size={18} />
              Search Listings
            </button>
          </div>
        )}

      </div>
    </div>
  );
}