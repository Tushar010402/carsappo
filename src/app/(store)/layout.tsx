import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartDrawer } from "@/components/layout/cart-drawer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { ClientInit } from "@/components/providers/client-init";
import { JsonLd } from "@/components/ui/json-ld";
import { getSettings } from "@/lib/settings";
import { getCurrentUser } from "@/lib/auth";
import { getNavCategories } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [settings, categories, user] = await Promise.all([getSettings(), getNavCategories(), getCurrentUser()]);
  const wishlist = user
    ? (await prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } })).map((w) => w.productId)
    : null;

  return (
    <>
      <Header
        categories={categories}
        user={user ? { name: user.name, role: user.role } : null}
        announcement={settings.store.announcement}
        logoUrl={settings.store.logoUrl}
      />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer freeShippingThreshold={settings.shipping.freeShippingThreshold} />
      <WhatsAppButton number={settings.store.whatsapp} />
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
    </>
  );
}
