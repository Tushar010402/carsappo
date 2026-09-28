"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-paper p-8 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
        <CircleAlert className="size-6" />
      </span>
      <h1 className="mt-4 text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">
        This admin page failed to load{error.digest ? ` (ref ${error.digest})` : ""}. Check the server logs, then try again.
      </p>
      <Button variant="dark" className="mt-6" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
