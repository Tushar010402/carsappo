import { BadgeCheck, BadgeIndianRupee, Headset, Lock, ShieldCheck, Truck } from "lucide-react";

const POINTS = [
  { icon: BadgeCheck, title: "Genuine Products", text: "Sourced directly from brands and authorised distributors." },
  { icon: BadgeIndianRupee, title: "Wholesale Prices", text: "Premium quality at honest prices — no middlemen." },
  { icon: Truck, title: "Fast Shipping", text: "Dispatched in 24 hours, delivered across India." },
  { icon: ShieldCheck, title: "Quality Checked", text: "Every order is inspected before it leaves our warehouse." },
  { icon: Lock, title: "Secure Payments", text: "UPI, cards and net banking via Razorpay. COD available." },
  { icon: Headset, title: "Customer Support", text: "Real humans on WhatsApp, phone and email to help you." },
];

export function WhyCarsappo() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-line bg-line md:grid-cols-3">
      {POINTS.map(({ icon: Icon, title, text }) => (
        <div key={title} className="bg-white p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft">
            <Icon className="size-6" strokeWidth={1.7} />
          </span>
          <h3 className="mt-5 font-display text-base font-semibold sm:text-lg">✔ {title}</h3>
          <p className="mt-1.5 text-sm text-muted">{text}</p>
        </div>
      ))}
    </div>
  );
}
