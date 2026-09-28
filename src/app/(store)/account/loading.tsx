export default function AccountLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-48 animate-pulse rounded-2xl bg-mist" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-mist" />
      ))}
    </div>
  );
}
