import {
  Armchair,
  BadgeCheck,
  Bike,
  Box,
  BrushCleaning,
  Car,
  CarFront,
  CircleDot,
  Droplets,
  Fan,
  Gauge,
  Layers,
  LayoutGrid,
  Lightbulb,
  Package,
  Plug,
  Sofa,
  Sparkles,
  SprayCan,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

/** Icons selectable for categories in the admin panel (kept small to avoid bundling all of lucide). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Layers,
  Armchair,
  Sofa,
  SprayCan,
  Sparkles,
  Droplets,
  BrushCleaning,
  Car,
  CarFront,
  Zap,
  Plug,
  Lightbulb,
  Bike,
  Wind,
  Fan,
  Gauge,
  CircleDot,
  Wrench,
  Box,
  Package,
  BadgeCheck,
  LayoutGrid,
};

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && CATEGORY_ICONS[name]) || LayoutGrid;
  return <Icon className={className} aria-hidden strokeWidth={1.6} />;
}
