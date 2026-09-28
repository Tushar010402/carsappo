import type { Metadata } from "next";
import Link from "next/link";
import { firstParam } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const sp = await searchParams;
  const token = firstParam(sp.token);
  const email = firstParam(sp.email);
  return (
    <AuthShell title="Choose a new password">
      {token && email ? (
        <ResetPasswordForm token={token} email={email} />
      ) : (
        <p className="text-sm text-muted">
          This link is incomplete.{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            Request a new reset link
          </Link>
          .
        </p>
      )}
    </AuthShell>
  );
}
