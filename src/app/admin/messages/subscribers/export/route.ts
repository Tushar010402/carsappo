import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { csvResponse } from "@/lib/admin/csv";
import { istToday } from "@/lib/admin/query";

export async function GET() {
  try {
    await assertAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const subscribers = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  return csvResponse(
    `carsappo-newsletter-${istToday()}.csv`,
    ["Email", "Subscribed at (UTC)"],
    subscribers.map((s) => [s.email, s.createdAt]),
  );
}
