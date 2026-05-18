export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-[20px] border border-gray-100 overflow-hidden animate-pulse">

      {/* IMAGE */}
      <div className="w-full aspect-[4/3] bg-gray-200" />

      {/* CONTENT */}
      <div className="p-[14px_16px_16px]">

        {/* TITLE */}
        <div className="h-4 w-3/4 bg-gray-200 rounded-md" />

        {/* LOCATION */}
        <div className="h-3 w-1/2 bg-gray-100 rounded mt-3" />

        {/* TYPE BADGE */}
        <div className="h-5 w-1/3 bg-gray-100 rounded-full mt-3" />

        {/* DIVIDER */}
        <div className="h-[1px] bg-gray-100 my-3" />

        {/* BOTTOM ROW */}
        <div className="flex items-center justify-between">

          {/* LEFT */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-200 rounded-full" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>

          {/* RIGHT */}
          <div className="h-3 w-20 bg-gray-100 rounded" />

        </div>
      </div>
    </div>
  );
}