import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { ADMIN_PAGE_SIZE, enumParam, pageParam, param, withParams } from "@/lib/admin/query";
import { approveReviews, deleteReview, setReviewApproved } from "@/app/admin/_actions/reviews";
import { PageHeader, Panel, Tabs, Thumb } from "@/components/admin/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/admin/filters";
import { AdminPagination } from "@/components/admin/pagination";
import { ActionButton } from "@/components/admin/action-button";
import { Stars } from "@/components/ui/stars";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = enumParam(sp, "tab", ["pending", "approved"] as const) ?? "pending";
  const q = param(sp, "q");
  const rating = enumParam(sp, "rating", ["1", "2", "3", "4", "5"] as const);
  const page = pageParam(sp);

  const where: Prisma.ReviewWhereInput = {
    isApproved: tab === "approved",
    ...(rating ? { rating: Number(rating) } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { body: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { product: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [reviews, total, pendingCount, approvedCount] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { product: { select: { id: true, name: true, slug: true, images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 } } } },
    }),
    prisma.review.count({ where }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.review.count({ where: { isApproved: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Product reviews"
        description="Reviews appear on product pages only after approval. Ratings update automatically."
        actions={
          tab === "pending" && reviews.length > 1 ? (
            <ActionButton action={approveReviews.bind(null, reviews.map((r) => r.id))} variant="dark" confirm={`Approve all ${reviews.length} reviews on this page?`}>
              <Check className="size-4" /> Approve all on page
            </ActionButton>
          ) : null
        }
      />
      <Tabs
        items={[
          { href: "/admin/reviews?tab=pending", label: "Pending", count: pendingCount, active: tab === "pending" },
          { href: "/admin/reviews?tab=approved", label: "Approved", count: approvedCount, active: tab === "approved" },
        ]}
      />
      <Panel flush>
        <FilterBar action="/admin/reviews" resetHref={`/admin/reviews?tab=${tab}`}>
          <input type="hidden" name="tab" value={tab} />
          <SearchInput defaultValue={q} placeholder="Search reviewer, text or product…" />
          <FilterSelect label="Rating" name="rating" defaultValue={rating ?? ""}>
            <option value="">Any rating</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} star{r > 1 ? "s" : ""}
              </option>
            ))}
          </FilterSelect>
        </FilterBar>
        <ul className="divide-y divide-line">
          {reviews.length === 0 && (
            <li className="px-5 py-14 text-center text-sm text-muted">{tab === "pending" ? "All caught up — no reviews waiting for approval." : "No approved reviews match."}</li>
          )}
          {reviews.map((r) => (
            <li key={r.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row">
              <Link href={`/admin/products/${r.product.id}`} className="flex w-full shrink-0 items-start gap-3 sm:w-56">
                <Thumb src={r.product.images[0]?.url} size={40} />
                <span className="line-clamp-2 text-xs font-medium text-muted hover:text-ink">{r.product.name}</span>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars rating={r.rating} />
                  {r.title && <span className="font-semibold">{r.title}</span>}
                  {r.isVerified && <Badge tone="success">Verified purchase</Badge>}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-zinc-700">{r.body}</p>
                {r.images.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {r.images.map((img) => (
                      <a key={img} href={img} target="_blank" rel="noopener noreferrer">
                        <Thumb src={img} size={56} />
                      </a>
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted">
                  {r.name} · {formatDateTime(r.createdAt)}
                  {r.userId ? " · registered customer" : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                {r.isApproved ? (
                  <ActionButton action={setReviewApproved.bind(null, r.id, false)}>
                    <EyeOff className="size-4" /> Unapprove
                  </ActionButton>
                ) : (
                  <ActionButton action={setReviewApproved.bind(null, r.id, true)} variant="dark">
                    <Check className="size-4" /> Approve
                  </ActionButton>
                )}
                <ActionButton action={deleteReview.bind(null, r.id)} variant="icon-danger" label="Delete review" confirm="Delete this review permanently?">
                  <Trash2 className="size-4" />
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
        <AdminPagination page={page} pageSize={ADMIN_PAGE_SIZE} total={total} hrefFor={(n) => withParams("/admin/reviews", sp, { page: n })} />
      </Panel>
    </>
  );
}
