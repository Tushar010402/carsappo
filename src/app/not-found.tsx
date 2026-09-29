import { StoreShell } from "@/components/layout/store-shell";
import StoreNotFound from "./(store)/not-found";

/** Unmatched URLs get the full storefront (navigation, search, footer) rather than a dead end. */
export default function RootNotFound() {
  return (
    <StoreShell>
      <StoreNotFound />
    </StoreShell>
  );
}
