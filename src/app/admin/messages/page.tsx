import type { Metadata } from "next";
import { CheckCheck, Download, Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { ADMIN_PAGE_SIZE, enumParam, pageParam, param, withParams } from "@/lib/admin/query";
import { deleteMessage, deleteSubscriber, markAllMessagesRead, setMessageRead } from "@/app/admin/_actions/messages";
import { EmptyRow, PageHeader, Panel, TBody, THead, Table, Tabs, Td, Th, Tr } from "@/components/admin/ui";
import { FilterBar, SearchInput } from "@/components/admin/filters";
import { AdminPagination } from "@/components/admin/pagination";
import { ActionButton } from "@/components/admin/action-button";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = enumParam(sp, "tab", ["inbox", "subscribers"] as const) ?? "inbox";
  const q = param(sp, "q");
  const page = pageParam(sp);
  const [unread, subscriberCount] = await Promise.all([prisma.contactMessage.count({ where: { isRead: false } }), prisma.newsletterSubscriber.count()]);

  return (
    <>
      <PageHeader
        title="Messages"
        description="Contact form submissions and newsletter subscribers."
        actions={
          tab === "inbox" ? (
            unread > 0 ? (
              <ActionButton action={markAllMessagesRead}>
                <CheckCheck className="size-4" /> Mark all read
              </ActionButton>
            ) : null
          ) : (
            <a href="/admin/messages/subscribers/export" className={buttonClasses("dark", "sm")}>
              <Download className="size-4" /> Export CSV
            </a>
          )
        }
      />
      <Tabs
        items={[
          { href: "/admin/messages", label: "Inbox", count: unread, active: tab === "inbox" },
          { href: "/admin/messages?tab=subscribers", label: "Newsletter", count: subscriberCount, active: tab === "subscribers" },
        ]}
      />
      {tab === "inbox" ? <Inbox q={q} page={page} sp={sp} /> : <Subscribers q={q} page={page} sp={sp} />}
    </>
  );
}

type TabProps = { q?: string; page: number; sp: Record<string, string | string[] | undefined> };

async function Inbox({ q, page, sp }: TabProps) {
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { subject: { contains: q, mode: "insensitive" as const } },
          { message: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};
  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({ where, orderBy: [{ isRead: "asc" }, { createdAt: "desc" }], skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE }),
    prisma.contactMessage.count({ where }),
  ]);
  return (
    <Panel flush>
      <FilterBar action="/admin/messages" resetHref="/admin/messages">
        <SearchInput defaultValue={q} placeholder="Search name, email or message…" />
      </FilterBar>
      <ul className="divide-y divide-line">
        {messages.length === 0 && <li className="px-5 py-14 text-center text-sm text-muted">No messages{q ? " match your search" : " yet"}.</li>}
        {messages.map((m) => (
          <li key={m.id} className={cn("flex flex-col gap-3 px-5 py-4 sm:flex-row", !m.isRead && "bg-brand-soft/40")}>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {!m.isRead && <span className="size-2 rounded-full bg-brand-dark" aria-label="Unread" />}
                <span className="font-semibold">{m.subject || "(No subject)"}</span>
                {!m.isRead && <Badge tone="brand">New</Badge>}
              </div>
              <p className="mt-0.5 text-xs text-muted">
                {m.name} · <a href={`mailto:${m.email}`} className="hover:underline">{m.email}</a>
                {m.phone && (
                  <>
                    {" "}· <a href={`tel:${m.phone}`} className="hover:underline">{m.phone}</a>
                  </>
                )}{" "}
                · {formatDateTime(m.createdAt)}
              </p>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-zinc-700">{m.message}</p>
            </div>
            <div className="flex shrink-0 items-start gap-1">
              <a
                href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message to Carsappo"}`)}`}
                className="grid size-8 place-items-center rounded-lg text-muted hover:bg-mist hover:text-ink"
                aria-label={`Reply to ${m.name}`}
                title="Reply by email"
              >
                <Reply className="size-4" />
              </a>
              <ActionButton action={setMessageRead.bind(null, m.id, !m.isRead)} variant="icon" label={m.isRead ? "Mark unread" : "Mark read"}>
                {m.isRead ? <Mail className="size-4" /> : <MailOpen className="size-4" />}
              </ActionButton>
              <ActionButton action={deleteMessage.bind(null, m.id)} variant="icon-danger" label="Delete message" confirm="Delete this message?">
                <Trash2 className="size-4" />
              </ActionButton>
            </div>
          </li>
        ))}
      </ul>
      <AdminPagination page={page} pageSize={ADMIN_PAGE_SIZE} total={total} hrefFor={(n) => withParams("/admin/messages", sp, { page: n })} />
    </Panel>
  );
}

async function Subscribers({ q, page, sp }: TabProps) {
  const where = q ? { email: { contains: q, mode: "insensitive" as const } } : {};
  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * ADMIN_PAGE_SIZE, take: ADMIN_PAGE_SIZE }),
    prisma.newsletterSubscriber.count({ where }),
  ]);
  return (
    <Panel flush>
      <FilterBar action="/admin/messages" resetHref="/admin/messages?tab=subscribers">
        <input type="hidden" name="tab" value="subscribers" />
        <SearchInput defaultValue={q} placeholder="Search email…" />
      </FilterBar>
      <Table minWidth={520}>
        <THead>
          <Th>Email</Th>
          <Th>Subscribed</Th>
          <Th>
            <span className="sr-only">Actions</span>
          </Th>
        </THead>
        <TBody>
          {subscribers.length === 0 && <EmptyRow colSpan={3}>No subscribers yet.</EmptyRow>}
          {subscribers.map((s) => (
            <Tr key={s.id}>
              <Td>
                <a href={`mailto:${s.email}`} className="font-medium hover:underline">
                  {s.email}
                </a>
              </Td>
              <Td className="text-muted">{formatDateTime(s.createdAt)}</Td>
              <Td align="right">
                <ActionButton action={deleteSubscriber.bind(null, s.id)} variant="icon-danger" label={`Remove ${s.email}`} confirm={`Remove ${s.email} from the newsletter list?`}>
                  <Trash2 className="size-4" />
                </ActionButton>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      <AdminPagination page={page} pageSize={ADMIN_PAGE_SIZE} total={total} hrefFor={(n) => withParams("/admin/messages", sp, { page: n })} />
    </Panel>
  );
}
