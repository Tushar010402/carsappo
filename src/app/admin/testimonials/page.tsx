import type { Metadata } from "next";
import { Eye, EyeOff, Pencil, Play, Plus, Trash2 } from "lucide-react";
import type { Testimonial } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { youtubeId } from "@/lib/utils";
import { deleteTestimonial, setTestimonialActive } from "@/app/admin/_actions/reviews";
import { PageHeader, Panel, Thumb } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { FormDialog } from "@/components/admin/dialog";
import { TestimonialForm, type TestimonialFormValues } from "@/components/admin/testimonial-form";
import { ActiveBadge } from "@/components/admin/status-badge";
import { Stars } from "@/components/ui/stars";

export const metadata: Metadata = { title: "Testimonials" };

const TYPE_LABEL = { IMAGE: "Image reviews", VIDEO: "Video reviews", GOOGLE: "Google reviews" } as const;

function toForm(t?: Testimonial, type: Testimonial["type"] = "IMAGE"): TestimonialFormValues {
  return {
    id: t?.id,
    type: t?.type ?? type,
    name: t?.name ?? "",
    location: t?.location ?? "",
    rating: t?.rating ?? 5,
    content: t?.content ?? "",
    mediaUrl: t?.mediaUrl ?? "",
    sortOrder: t?.sortOrder ?? 0,
    isActive: t?.isActive ?? true,
  };
}

function MediaPreview({ t }: { t: Testimonial }) {
  if (!t.mediaUrl) return <span className="grid size-14 place-items-center rounded-lg bg-mist text-xs text-muted">—</span>;
  if (t.type === "VIDEO") {
    const yt = youtubeId(t.mediaUrl);
    return (
      <a href={t.mediaUrl} target="_blank" rel="noopener noreferrer" className="relative block">
        {yt ? <Thumb src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} size={56} /> : <span className="block size-14 rounded-lg bg-ink" />}
        <span className="absolute inset-0 grid place-items-center text-brand">
          <Play className="size-5 fill-current" />
        </span>
      </a>
    );
  }
  return <Thumb src={t.mediaUrl} size={56} />;
}

export default async function TestimonialsPage() {
  await requireAdmin();
  const items = await prisma.testimonial.findMany({ orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }] });
  const groups = (["IMAGE", "VIDEO", "GOOGLE"] as const).map((type) => ({ type, items: items.filter((t) => t.type === type) }));

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Homepage “Customer Reviews”: photo reviews, video reviews and Google reviews."
        actions={
          <FormDialog trigger={<><Plus className="size-4" /> Add testimonial</>} triggerVariant="primary" title="New testimonial" size="lg">
            <TestimonialForm testimonial={toForm()} />
          </FormDialog>
        }
      />
      <div className="space-y-6">
        {groups.map((g) => (
          <Panel key={g.type} title={TYPE_LABEL[g.type]} description={`${g.items.length} item${g.items.length === 1 ? "" : "s"}`} flush>
            {g.items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">None yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {g.items.map((t) => (
                  <li key={t.id} className="flex items-start gap-4 px-5 py-3">
                    <MediaPreview t={t} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        {t.location && <span className="text-xs text-muted">{t.location}</span>}
                        <Stars rating={t.rating} size={12} />
                        <ActiveBadge active={t.isActive} on="Visible" />
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{t.content}</p>
                      <p className="mt-1 text-[11px] text-muted">Sort {t.sortOrder}</p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <ActionButton action={setTestimonialActive.bind(null, t.id, !t.isActive)} variant="icon" label={t.isActive ? "Hide" : "Show"}>
                        {t.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </ActionButton>
                      <FormDialog trigger={<Pencil className="size-4" />} triggerVariant="icon" triggerLabel={`Edit ${t.name}`} title="Edit testimonial" size="lg">
                        <TestimonialForm testimonial={toForm(t)} />
                      </FormDialog>
                      <ActionButton action={deleteTestimonial.bind(null, t.id)} variant="icon-danger" label="Delete" confirm="Delete this testimonial?">
                        <Trash2 className="size-4" />
                      </ActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ))}
      </div>
    </>
  );
}
