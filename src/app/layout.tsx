import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { getSettings } from "@/lib/settings";
import { Analytics } from "@/components/layout/analytics";
import { Toaster } from "@/components/providers/toast";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { seo, store } = await getSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: { default: seo.defaultTitle, template: seo.titleTemplate || "%s | Carsappo" },
    description: seo.defaultDescription,
    keywords: seo.keywords,
    applicationName: store.name,
    openGraph: {
      type: "website",
      siteName: store.name,
      locale: "en_IN",
      title: seo.defaultTitle,
      description: seo.defaultDescription,
      images: seo.ogImage ? [{ url: seo.ogImage, width: 1200, height: 630 }] : undefined,
    },
    twitter: { card: "summary_large_image" },
    verification: seo.googleSiteVerification ? { google: seo.googleSiteVerification } : undefined,
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { tracking } = await getSettings();
  return (
    <html lang="en-IN" className={`${inter.variable} ${poppins.variable}`}>
      <body className="flex min-h-screen flex-col">
        {children}
        <Toaster />
        <Analytics tracking={tracking} />
      </body>
    </html>
  );
}
