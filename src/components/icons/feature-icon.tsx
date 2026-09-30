import {
  Award,
  BadgeCheck,
  BadgeIndianRupee,
  Car,
  Clock,
  Gift,
  Headset,
  HeartHandshake,
  Leaf,
  Lock,
  MapPin,
  Package,
  RefreshCcw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsUp,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Icons the admin can pick for "Why Carsappo" points and About-page values. */
export const FEATURE_ICONS: Record<string, LucideIcon> = {
  BadgeCheck,
  BadgeIndianRupee,
  Truck,
  ShieldCheck,
  Lock,
  Headset,
  Sparkles,
  HeartHandshake,
  Rocket,
  Award,
  Star,
  ThumbsUp,
  Clock,
  Gift,
  Leaf,
  Car,
  Wrench,
  Zap,
  MapPin,
  Package,
  RefreshCcw,
};

export const FEATURE_ICON_NAMES = Object.keys(FEATURE_ICONS);

export function FeatureIcon({ name, className, strokeWidth }: { name?: string | null; className?: string; strokeWidth?: number }) {
  const Icon = (name && FEATURE_ICONS[name]) || BadgeCheck;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
