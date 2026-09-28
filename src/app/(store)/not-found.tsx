import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid size-16 place-items-center rounded-2xl bg-brand">
        <SearchX className="size-8" />
      </span>
      <h1 className="mt-6 text-4xl font-semibold">Page not found</h1>
      <p className="mt-2 max-w-md text-muted">The page you&apos;re looking for took a wrong turn. Let&apos;s get you back on the road.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Go home</ButtonLink>
        <ButtonLink href="/shop" variant="outline">
          Shop accessories
        </ButtonLink>
      </div>
    </div>
  );
}
