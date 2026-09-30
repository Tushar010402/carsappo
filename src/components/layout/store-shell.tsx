import { Analytics } from "@/components/layout/analytics";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { ClientInit } from "@/components/providers/client-init";
import { JsonLd } from "@/components/ui/json-ld";
import { getSettings, serviceTypes, textRenderer } from "@/lib/settings";
import { getFooterPages, getPolicyLinks } from "@/lib/pages";
import { getCurrentUser } from "@/lib/auth";
import { getNavCategories } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

/** Header, footer, cart drawer and site-wide JSON-LD around every storefront page (also used by the global 404). */
export async function StoreShell({ children }: { children: React.ReactNode }) {
  const [settings, categories, user, policies, pages] = await Promise.all([
    getSettings(),
    getNavCategories(),
    getCurrentUser(),
    getPolicyLinks({ footerOnly: true }),
    getFooterPages(),
  ]);
  const t = textRenderer(settings);
  const nav = settings.navigation;
  const wishlist = user
    ? (await prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } })).map((w) => w.productId)
    : null;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <Header
        categories={categories}
        user={user ? { name: user.name, role: user.role } : null}
        announcement={t(settings.store.announcement)}
        logoUrl={settings.store.logoUrl}
        nav={{
          items: nav.header.map((i) => ({ label: t(i.label), href: i.href })),
          megaPromoTitle: t(nav.megaPromoTitle),
          megaPromoText: t(nav.megaPromoText),
          megaPromoLink: t(nav.megaPromoLink),
        }}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} categories={categories} text={t} services={serviceTypes(settings)} policies={policies} pages={pages} />
      <CartDrawer freeShippingThreshold={settings.shipping.freeShippingThreshold} />
      <WhatsAppButton number={settings.store.whatsapp} greeting={`Hi ${settings.store.name}! I need help with`} />
      <ClientInit userId={user?.id ?? null} serverWishlist={wishlist} />
      <JsonLd
        data={organizationJsonLd({
          name: settings.store.name,
          logo: settings.store.logoUrl,
          phone: settings.store.phone,
          email: settings.store.email,
          sameAs: [settings.social.instagram, settings.social.facebook, settings.social.youtube, settings.social.x, settings.social.linkedin],
        })}
      />
      <JsonLd data={websiteJsonLd(settings.store.name)} />
      {/* Storefront only — admin pages are never tracked. */}
      <Analytics tracking={settings.tracking} />
    </>
  );
}
