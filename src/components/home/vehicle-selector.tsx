"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CarFront, RotateCcw } from "lucide-react";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { FUEL_TYPES, fuelLabel } from "@/lib/constants";
import { useGarage, vehicleLabel, vehicleQuery } from "@/store/garage";
import type { VehicleTree } from "@/lib/catalog";
import { cn } from "@/lib/utils";

/** Brand → Model → Year → Fuel Type → compatible products. */
export function VehicleSelector({
  makes,
  compact,
  onSelect,
}: {
  makes: VehicleTree;
  compact?: boolean;
  onSelect?: (query: string) => void;
}) {
  const router = useRouter();
  const saved = useGarage((s) => s.vehicle);
  const setVehicle = useGarage((s) => s.setVehicle);
  // null = untouched, in which case the vehicle saved in "My Garage" pre-fills the selector.
  const [makeInput, setMake] = useState<string | null>(null);
  const [modelInput, setModel] = useState<string | null>(null);
  const [yearInput, setYear] = useState<string | null>(null);
  const [fuelInput, setFuel] = useState<string | null>(null);
  const untouched = makeInput === null;
  const make = makeInput ?? saved?.make ?? "";
  const model = modelInput ?? (untouched ? (saved?.model ?? "") : "");
  const year = yearInput ?? (untouched && saved?.year ? String(saved.year) : "");
  const fuel = fuelInput ?? (untouched ? (saved?.fuel ?? "") : "");

  const makeObj = makes.find((m) => m.slug === make);
  const modelObj = makeObj?.models.find((m) => m.slug === model);
  const endYear = modelObj ? (modelObj.yearTo ?? new Date().getFullYear() + 1) : 0;
  const years = modelObj ? Array.from({ length: endYear - modelObj.yearFrom + 1 }, (_, i) => endYear - i) : [];
  const fuels = modelObj?.fuelTypes.length ? modelObj.fuelTypes : FUEL_TYPES.map((f) => f.value);

  const submit = () => {
    if (!makeObj || !modelObj) return;
    const v = {
      make: makeObj.slug,
      makeName: makeObj.name,
      model: modelObj.slug,
      modelName: modelObj.name,
      year: year ? Number(year) : undefined,
      fuel: fuel || undefined,
    };
    setVehicle(v);
    const qs = vehicleQuery(v);
    if (onSelect) onSelect(qs);
    else router.push(`/shop?${qs}`);
  };

  const steps = [
    { label: "Brand", done: !!make },
    { label: "Model", done: !!model },
    { label: "Year", done: !!year },
    { label: "Fuel", done: !!fuel },
  ];

  return (
    <div className={cn(!compact && "rounded-[28px] bg-white p-5 shadow-lift sm:p-7")}>
      {!compact && (
        <ol className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-muted sm:gap-2" aria-hidden>
          {steps.map((s, i) => (
            <li key={s.label} className="flex items-center gap-1.5 sm:gap-2">
              <span className={cn("grid size-6 place-items-center rounded-full text-[11px] font-bold", s.done ? "bg-brand text-ink" : "bg-mist")}>{i + 1}</span>
              <span className={cn(s.done && "text-ink")}>{s.label}</span>
              {i < steps.length - 1 && <span className="mx-1 hidden h-px w-8 bg-line sm:block" />}
            </li>
          ))}
        </ol>
      )}
      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_auto]")}>
        <Select
          aria-label="Brand"
          value={make}
          onChange={(e) => {
            setMake(e.target.value);
            setModel("");
            setYear("");
            setFuel("");
          }}
          className="h-12"
        >
          <option value="">Select brand</option>
          {makes.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Model"
          value={model}
          disabled={!makeObj}
          onChange={(e) => {
            setMake(make);
            setModel(e.target.value);
            setYear("");
            setFuel("");
          }}
          className="h-12"
        >
          <option value="">Select model</option>
          {makeObj?.models.map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Year"
          value={year}
          disabled={!modelObj}
          onChange={(e) => {
            setMake(make);
            setModel(model);
            setYear(e.target.value);
            setFuel(fuel);
          }}
          className="h-12"
        >
          <option value="">Year (optional)</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Fuel type"
          value={fuel}
          disabled={!modelObj}
          onChange={(e) => {
            setMake(make);
            setModel(model);
            setYear(year);
            setFuel(e.target.value);
          }}
          className="h-12"
        >
          <option value="">Fuel (optional)</option>
          {fuels.map((f) => (
            <option key={f} value={f}>
              {fuelLabel(f)}
            </option>
          ))}
        </Select>
        <Button size="lg" variant="dark" disabled={!modelObj} onClick={submit} className="h-12">
          Find parts <ArrowRight className="size-4" />
        </Button>
      </div>
      {saved && !compact && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <CarFront className="size-4 text-muted" />
          <span className="text-muted">My garage:</span>
          <button onClick={() => router.push(`/shop?${vehicleQuery(saved)}`)} className="font-medium underline decoration-brand decoration-2 underline-offset-4">
            {vehicleLabel(saved)}
          </button>
          <button
            onClick={() => {
              setVehicle(null);
              setMake("");
              setModel("");
              setYear("");
              setFuel("");
            }}
            className="ml-1 inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
          >
            <RotateCcw className="size-3" /> Clear
          </button>
        </div>
      )}
    </div>
  );
}
