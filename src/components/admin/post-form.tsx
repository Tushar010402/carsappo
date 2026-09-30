import type { Post } from "@prisma/client";
import { Save } from "lucide-react";
import { savePost } from "@/app/admin/_actions/blog";
import { AdminForm, FormActions, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { MediaInput } from "@/components/admin/media-input";
import { SlugFields } from "@/components/admin/slug-fields";
import { TagsInput } from "@/components/admin/list-editor";
import { Panel, Toggle } from "@/components/admin/ui";
import { toIstInput } from "@/lib/admin/query";

export function PostForm({ post, categories }: { post?: Post | null; categories: { id: string; name: string }[] }) {
  return (
    <AdminForm action={savePost} className="space-y-6">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Panel title="Post" bodyClassName="space-y-4">
            <SlugFields nameField="title" nameLabel="Title" defaultName={post?.title} defaultSlug={post?.slug} prefix="/blog/" namePlaceholder="How to clean leather seat covers" />
            <FormField name="excerpt" label="Excerpt" hint="1–2 sentences shown on the blog listing and in search results.">
              <textarea id="excerpt" name="excerpt" className="field min-h-20" defaultValue={post?.excerpt ?? ""} required maxLength={400} />
            </FormField>
            <FormField name="content" label="Content">
              <MarkdownEditor name="content" defaultValue={post?.content ?? ""} rows={22} />
            </FormField>
          </Panel>
          <Panel title="Search engine listing" bodyClassName="space-y-4">
            <FormField name="metaTitle" label="Meta title" hint="Defaults to the post title.">
              <input id="metaTitle" name="metaTitle" className="field" defaultValue={post?.metaTitle ?? ""} maxLength={120} />
            </FormField>
            <FormField name="metaDescription" label="Meta description" hint="Defaults to the excerpt.">
              <textarea id="metaDescription" name="metaDescription" className="field min-h-20" defaultValue={post?.metaDescription ?? ""} maxLength={320} />
            </FormField>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Publishing" bodyClassName="space-y-4">
            <Toggle name="isPublished" label="Published" description="Visible on the blog" defaultChecked={post?.isPublished ?? false} />
            <FormField name="publishedAt" label="Publish date (IST)" hint="Empty = now, when published.">
              <input id="publishedAt" name="publishedAt" type="datetime-local" className="field" defaultValue={toIstInput(post?.publishedAt)} />
            </FormField>
            <FormField name="author" label="Author">
              <input id="author" name="author" className="field" defaultValue={post?.author ?? "Team Carsappo"} required maxLength={80} />
            </FormField>
            <FormField name="readingMinutes" label="Reading time (minutes)" hint="Empty = estimated from length.">
              <input id="readingMinutes" name="readingMinutes" type="number" min={1} max={120} className="field" defaultValue={post?.readingMinutes ?? ""} />
            </FormField>
          </Panel>
          <Panel title="Organisation" bodyClassName="space-y-4">
            <FormField name="categoryId" label="Category">
              <select id="categoryId" name="categoryId" className="field" defaultValue={post?.categoryId ?? ""} required>
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField name="tags" label="Tags">
              <TagsInput name="tags" defaultValue={post?.tags ?? []} />
            </FormField>
            <FormField name="coverImage" label="Cover image" hint="16:9, at least 1200px wide.">
              <MediaInput name="coverImage" defaultValue={post?.coverImage} folder="blog" aspect="wide" />
            </FormField>
          </Panel>
        </div>
      </div>
      <FormError />
      <FormActions sticky>
        <FormSubmit>
          <Save className="size-4" /> {post ? "Save post" : "Create post"}
        </FormSubmit>
      </FormActions>
    </AdminForm>
  );
}
