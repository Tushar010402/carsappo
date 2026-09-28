export default function ProductLoading() {
  return (
    <div className="container-x py-8" aria-busy="true" aria-label="Loading product">
      <div className="h-4 w-64 animate-pulse rounded-full bg-mist" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="aspect-square animate-pulse rounded-[28px] bg-mist" />
        <div className="space-y-4">
          <div className="h-3 w-24 animate-pulse rounded-full bg-mist" />
          <div className="h-10 w-4/5 animate-pulse rounded-2xl bg-mist" />
          <div className="h-8 w-40 animate-pulse rounded-2xl bg-mist" />
          <div className="h-24 animate-pulse rounded-2xl bg-mist" />
          <div className="h-13 animate-pulse rounded-full bg-mist" />
        </div>
      </div>
    </div>
  );
}
