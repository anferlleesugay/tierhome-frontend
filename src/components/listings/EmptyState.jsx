import { SearchX } from "lucide-react";

export default function EmptyState({
  message,
  subtext,
  showClearButton = false,
  onClear,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">

      {/* ICON */}
      <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5">
        <SearchX size={36} className="text-primary" />
      </div>

      {/* MESSAGE */}
      <h2 className="text-lg font-bold text-gray-800 mb-2">
        {message}
      </h2>

      {/* SUBTEXT */}
      <p className="text-sm text-gray-400 mb-6">
        {subtext}
      </p>

      {/* BUTTON */}
      {showClearButton && (
        <button
          onClick={onClear}
          className="
            border-2 border-primary text-primary bg-white
            px-6 py-2.5 rounded-full font-semibold text-sm
            hover:bg-primary hover:text-white
            transition-all duration-200
          "
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}