import ListingGrid from "../components/listings/ListingGrid";

export default function LandingPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-6 xl:px-8 py-6">

      {/* TITLE */}
      <h1 className="text-xl md:text-2xl font-bold mb-6">
        Available Rentals in Angeles City
      </h1>

      {/* LISTINGS */}
      <ListingGrid />

    </div>
  );
}