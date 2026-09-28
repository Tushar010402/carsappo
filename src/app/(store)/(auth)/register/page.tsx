import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { firstParam, safeRedirectPath } from "@/lib/utils";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const next = firstParam(sp.next);
  if (await getCurrentUser()) redirect(safeRedirectPath(next, "/account"));
  return (
    <AuthShell
      title="Create your account"
      subtitle="Join Carsappo for faster checkout, order tracking and exclusive offers."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold underline">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm next={next ? safeRedirectPath(next) : undefined} email={firstParam(sp.email)} />
    </AuthShell>
  );
}
