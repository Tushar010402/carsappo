import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a link to set a new password."
      footer={
        <Link href="/login" className="font-semibold underline">
          Back to login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
