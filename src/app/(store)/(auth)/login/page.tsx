import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { firstParam, safeRedirectPath } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = firstParam((await searchParams).next);
  const user = await getCurrentUser();
  if (user) redirect(safeRedirectPath(next, user.role === "ADMIN" ? "/admin" : "/account"));
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to track orders, manage addresses and check out faster."
      footer={
        <>
          New to Carsappo?{" "}
          <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={(next && safeRedirectPath(next, "")) || undefined} />
    </AuthShell>
  );
}
