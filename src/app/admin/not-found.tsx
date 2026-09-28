import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-paper p-8 text-center">
      <h1 className="text-lg font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-muted">This record doesn&apos;t exist or was deleted.</p>
      <Link href="/admin" className="mt-6 inline-block text-sm font-semibold underline underline-offset-4">
        Back to dashboard
      </Link>
    </div>
  );
}
