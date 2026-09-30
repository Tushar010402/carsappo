import { FeatureIcon } from "@/components/icons/feature-icon";

export type WhyPoint = { icon: string; title: string; text: string };

/** "Why Carsappo" points — edited in Admin → Storefront → Homepage. */
export function WhyCarsappo({ points }: { points: WhyPoint[] }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-line bg-line md:grid-cols-3">
      {points.map((p) => (
        <div key={p.title} className="bg-white p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft">
            <FeatureIcon name={p.icon} className="size-6" strokeWidth={1.7} />
          </span>
          <h3 className="mt-5 font-display text-base font-semibold sm:text-lg">✔ {p.title}</h3>
          <p className="mt-1.5 text-sm text-muted">{p.text}</p>
        </div>
      ))}
    </div>
  );
}
