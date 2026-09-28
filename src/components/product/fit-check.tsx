"use client";

import Link from "next/link";
import { CarFront, CheckCircle2, CircleAlert } from "lucide-react";
import { useGarage, vehicleLabel } from "@/store/garage";

type Compat = { make: string; model: string; yearFrom: number | null; yearTo: number | null; fuelType: string | null };

/** Tells the shopper whether this product fits the car saved in "My Garage". */
export function FitCheck({ universal, compat }: { universal: boolean; compat: Compat[] }) {
  const vehicle = useGarage((s) => s.vehicle);

  if (universal) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="size-4" /> Universal fit — works with all cars
      </p>
    );
  }
  if (!vehicle) {
    return (
      <Link href="/#shop-by-vehicle" className="flex items-center gap-2 rounded-2xl bg-mist px-4 py-3 text-sm font-medium hover:bg-line">
        <CarFront className="size-4" /> Custom fit — select your car to check compatibility
      </Link>
    );
  }
  const fits = compat.some(
    (c) =>
      c.make === vehicle.make &&
      c.model === vehicle.model &&
      (!vehicle.year || ((c.yearFrom === null || c.yearFrom <= vehicle.year) && (c.yearTo === null || c.yearTo >= vehicle.year))) &&
      (!vehicle.fuel || c.fuelType === null || c.fuelType === vehicle.fuel),
  );
  return fits ? (
    <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
      <CheckCircle2 className="size-4" /> Fits your {vehicleLabel(vehicle)}
    </p>
  ) : (
    <p className="flex flex-wrap items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
      <CircleAlert className="size-4" /> May not fit your {vehicleLabel(vehicle)}.
      <Link href="/#shop-by-vehicle" className="underline">
        Change car
      </Link>
    </p>
  );
}
