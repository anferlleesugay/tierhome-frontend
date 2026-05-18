import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

import ListingCard from "./ListingCard";
import SkeletonCard from "./SkeletonCard";
import EmptyState from "./EmptyState";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export default function ListingGrid() {
  const location = useLocation();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(false);

        const url = `${API}/listings${location.search}`;
        console.log("API:", url);

        const res = await axios.get(url);

        // ✅ FIXED RESPONSE PARSE
        const raw = res.data?.data?.data || [];

        setListings(raw);

      } catch (err) {
        console.error("ERROR:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [location.search]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">
        Failed to load listings
      </div>
    );
  }

  if (!listings.length) {
    return (
      <EmptyState
        message="No properties found"
        subtext="Try adjusting filters"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}