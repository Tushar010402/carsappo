import type { Metadata } from "next";
import Link from "next/link";
import type { BlogCategory, Prisma } from "@prisma/client";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { ADMIN_PAGE_SIZE, enumParam, pageParam, param, withParams } from "@/lib/admin/query";
import { deleteBlogCategory, saveBlogCategory, setPostPublished } from "@/app/admin/_actions/blog";
import { EmptyRow, PageHeader, Panel, TBody, THead, Table, Td, Th, Thumb, Tr } from "@/components/admin/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/admin/filters";
import { AdminPagination } from "@/components/admin/pagination";
import { ActionButton } from "@/components/admin/action-button";
import { FormDialog } from "@/components/admin/dialog";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { SlugFields } from "@/components/admin/slug-fields";
import { ActiveBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Blog" };

function BlogCategoryForm({ category }: { category?: BlogCategory }) {
  return (
    <AdminForm action={saveBlogCategory} className="space-y-4">
      {category && <input type="hidden" name="id" value={category.id} />}
      <SlugFields defaultName={category?.name} defaultSlug={category?.slug} prefix="/blog/category/" />
      <FormField name="description" label="Description">
        <textarea id="description" name="description" className="field min-h-20" defaultValue={category?.description ?? ""} maxLength={300} />
      </FormField>
      <FormField name="sortOrder" label="Sort order">
        <input id="sortOrder" name="sortOrder" type="number" className="field" defaultValue={category?.sortOrder ?? 0} required />
      </FormField>
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>{category ? "Save" : "Create category"}</FormSubmit>
      </div>
    </AdminForm>
  );
}

export default async function BlogPage({ searchParams }: PageProps<"/admin/blog">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const status = enumParam(sp, "status", ["published", "draft"] as const);
  const category = param(sp, "category");
  const page = pageParam(sp);

  const where: Prisma.PostWhereInput = {
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { tags: { has: q.toLowerCase() } }] } : {}),
    ...(status ? { isPublished: status === "published" } : {}),
    ...(category ? { categoryId: category } : {}),
  };

  const [posts, total, categories] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ publishedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { category: { select: { name: true } } },
    }),
    prisma.post.count({ where }),
    prisma.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { posts: true } } } }),
  ]);

  return (
    <>
      <PageHeader
        title="Blog"
        description="Car care guides and news. Markdown supported."
        actions={
          <ButtonLink href="/admin/blog/new" size="sm">
            <Plus className="size-4" /> New post
          </ButtonLink>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel flush>
          <FilterBar action="/admin/blog" resetHref="/admin/blog">
            <SearchInput defaultValue={q} placeholder="Search title or tag…" />
            <FilterSelect label="Status" name="status" defaultValue={status ?? ""}>
              <option value="">All</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </FilterSelect>
            <FilterSelect label="Category" name="category" defaultValue={category ?? ""}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </FilterSelect>
          </FilterBar>
          <Table minWidth={700}>
            <THead>
              <Th>Post</Th>
              <Th>Category</Th>
              <Th>Published</Th>
              <Th>Status</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <TBody>
              {posts.length === 0 && <EmptyRow colSpan={5}>No posts found.</EmptyRow>}
              {posts.map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <Link href={`/admin/blog/${p.id}`} className="group flex items-center gap-3">
                      <Thumb src={p.coverImage} size={44} />
                      <span className="min-w-0">
                        <span className="line-clamp-1 font-medium group-hover:underline">{p.title}</span>
                        <span className="text-xs text-muted">
                          {p.readingMinutes} min read · {p.author}
                        </span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-muted">{p.category.name}</Td>
                  <Td className="text-muted">{p.publishedAt ? formatDate(p.publishedAt) : "—"}</Td>
                  <Td>
                    <ActiveBadge active={p.isPublished} on="Published" off="Draft" />
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-0.5">
                      <ActionButton action={setPostPublished.bind(null, p.id, !p.isPublished)} variant="icon" label={p.isPublished ? "Unpublish" : "Publish"}>
                        {p.isPublished ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </ActionButton>
                      <Link href={`/admin/blog/${p.id}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-mist hover:text-ink" aria-label={`Edit ${p.title}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
          <AdminPagination page={page} pageSize={ADMIN_PAGE_SIZE} total={total} hrefFor={(n) => withParams("/admin/blog", sp, { page: n })} />
        </Panel>

        <Panel
          title="Categories"
          flush
          actions={
            <FormDialog trigger={<><Plus className="size-4" /> Add</>} title="New blog category">
              <BlogCategoryForm />
            </FormDialog>
          }
        >
          <ul className="divide-y divide-line">
            {categories.length === 0 && <li className="px-5 py-8 text-center text-sm text-muted">No categories yet.</li>}
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-2 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted">
                    {c._count.posts} post{c._count.posts === 1 ? "" : "s"} · <span className="font-mono">{c.slug}</span>
                  </p>
                </div>
                <FormDialog trigger={<Pencil className="size-4" />} triggerVariant="icon" triggerLabel={`Edit ${c.name}`} title={`Edit ${c.name}`}>
                  <BlogCategoryForm category={c} />
                </FormDialog>
                <ActionButton action={deleteBlogCategory.bind(null, c.id)} variant="icon-danger" label={`Delete ${c.name}`} confirm={`Delete category "${c.name}"?`}>
                  <Trash2 className="size-4" />
                </ActionButton>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
