import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-display text-6xl font-semibold">404</p>
      <p className="text-muted">This page could not be found.</p>
      <Link href="/" className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
        Back to Carsappo
      </Link>
    </div>
  );
}
