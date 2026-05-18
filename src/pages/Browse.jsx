import ListingGrid from "../components/listings/ListingGrid";

export default function Browse() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">
        Available Rentals in Angeles City
      </h1>

      <ListingGrid />
    </div>
  );
}