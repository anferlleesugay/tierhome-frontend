import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { X, SlidersHorizontal } from "lucide-react";

import ListingCard from "./ListingCard";
import SkeletonCard from "./SkeletonCard";
import EmptyState from "./EmptyState";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

function Chip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-green-50 text-[#3d6b35] text-xs font-medium px-3 py-1.5 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-red-500 transition-colors">
        <X size={12} />
      </button>
    </span>
  );
}

export default function ListingGrid() {
  const location = useLocation();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Read directly from the URL every render — it's the single source of
  // truth for what's currently filtered (see Navbar.jsx's own sync effect,
  // which keeps the search bar's displayed labels matching this same URL).
  const params = new URLSearchParams(location.search);
  const activeBarangay = params.get("barangay");
  const activeBudget = params.get("budget");
  const activeType = params.get("type");
  const activeSort = params.get("sort") || "";

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(false);

        const url = `${API}/listings${location.search}`;
        const res = await axios.get(url);

        // Laravel's paginate() response includes both the page of results
        // and a "total" count across all pages — surface that for the
        // live result count instead of just the current page's length.
        const payload = res.data?.data;
        setListings(payload?.data || []);
        setTotal(payload?.total ?? 0);

      } catch (err) {
        console.error("ERROR:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [location.search]);

  // Update a single query param (removing it entirely if value is falsy),
  // preserving every other currently-active filter.
  const updateParam = (key, value) => {
    const next = new URLSearchParams(location.search);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const qs = next.toString();
    navigate(qs ? `/browse?${qs}` : "/browse");
  };

  const clearAll = () => navigate("/browse");

  const hasActiveFilters = Boolean(activeBarangay || activeBudget || activeType);

  return (
    <div>
      {/* Active filter chips + Clear all */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {activeBarangay && (
            <Chip label={activeBarangay} onRemove={() => updateParam("barangay", null)} />
          )}
          {activeBudget && (
            <Chip
              label={`Under ₱${Number(activeBudget).toLocaleString()}`}
              onRemove={() => updateParam("budget", null)}
            />
          )}
          {activeType && (
            <Chip label={activeType} onRemove={() => updateParam("type", null)} />
          )}
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-red-500 underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Live result count + Sort */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {loading ? "Searching..." : `${total} propert${total === 1 ? "y" : "ies"} found`}
        </p>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-400" />
          <select
            value={activeSort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#3d6b35] bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">
          Failed to load listings
        </div>
      ) : !listings.length ? (
        <EmptyState
          message="No properties found"
          subtext="Try adjusting filters"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}