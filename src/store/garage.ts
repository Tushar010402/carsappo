"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hydrationSafeStorage } from "@/store/storage";

export type GarageVehicle = {
  make: string;
  makeName: string;
  model: string;
  modelName: string;
  year?: number;
  fuel?: string;
};

type GarageState = {
  vehicle: GarageVehicle | null;
  setVehicle: (v: GarageVehicle | null) => void;
};

/** "My Garage": the shopper's selected vehicle, remembered across visits. */
export const useGarage = create<GarageState>()(
  persist(
    (set) => ({
      vehicle: null,
      setVehicle: (vehicle) => set({ vehicle }),
    }),
    { name: "carsappo-garage", storage: hydrationSafeStorage((): boolean => useGarage.persist.hasHydrated()), skipHydration: true },
  ),
);

export function vehicleLabel(v: GarageVehicle) {
  return [v.makeName, v.modelName, v.year, v.fuel ? v.fuel.charAt(0) + v.fuel.slice(1).toLowerCase() : null].filter(Boolean).join(" ");
}

export function vehicleQuery(v: GarageVehicle) {
  const qs = new URLSearchParams({ make: v.make, model: v.model });
  if (v.year) qs.set("year", String(v.year));
  if (v.fuel) qs.set("fuel", v.fuel);
  return qs.toString();
}
