export default function Loading() {
  return (
    <div className="container-x py-10" aria-busy="true" aria-label="Loading">
      <div className="h-4 w-40 animate-pulse rounded-full bg-mist" />
      <div className="mt-6 h-10 w-2/3 max-w-xl animate-pulse rounded-2xl bg-mist" />
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-square animate-pulse rounded-[var(--radius-card)] bg-mist" />
            <div className="mt-4 h-3 w-1/3 animate-pulse rounded-full bg-mist" />
            <div className="mt-2 h-4 w-4/5 animate-pulse rounded-full bg-mist" />
          </div>
        ))}
      </div>
    </div>
  );
}
