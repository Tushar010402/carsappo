"use client";

import { useMemo, useState } from "react";
import { Car, Plus, Trash2 } from "lucide-react";
import { FUEL_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export type VehicleMakeOption = {
  id: string;
  name: string;
  models: { id: string; name: string; type: "CAR" | "BIKE"; yearFrom: number; yearTo: number | null; fuelTypes: string[] }[];
};

export type CompatRow = { vehicleModelId: string; yearFrom: number | null; yearTo: number | null; fuelType: string | null };

const cell = "field h-9 py-0 text-[13px]";

/** Vehicle fitment editor: pick make → model (or whole makes), optionally narrow years / fuel. */
export function CompatEditor({ name, makes, defaultValue }: { name: string; makes: VehicleMakeOption[]; defaultValue: CompatRow[] }) {
  const [rows, setRows] = useState<CompatRow[]>(defaultValue);
  const [makeId, setMakeId] = useState(makes[0]?.id ?? "");
  const [modelId, setModelId] = useState("");

  const modelIndex = useMemo(() => {
    const map = new Map<string, { make: VehicleMakeOption; model: VehicleMakeOption["models"][number] }>();
    for (const make of makes) for (const model of make.models) map.set(model.id, { make, model });
    return map;
  }, [makes]);

  const selectedMake = makes.find((m) => m.id === makeId);
  const has = (id: string) => rows.some((r) => r.vehicleModelId === id);

  const addModels = (ids: string[]) => {
    const fresh = ids.filter((id) => !has(id));
    if (!fresh.length) return;
    setRows((r) => [...r, ...fresh.map((id) => ({ vehicleModelId: id, yearFrom: null, yearTo: null, fuelType: null }))]);
  };

  const update = (i: number, patch: Partial<CompatRow>) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const sorted = rows
    .map((row, i) => ({ row, i, info: modelIndex.get(row.vehicleModelId) }))
    .filter((x) => x.info)
    .sort((a, b) => a.info!.make.name.localeCompare(b.info!.make.name) || a.info!.model.name.localeCompare(b.info!.model.name));

  const allCarIds = makes.flatMap((m) => m.models.filter((x) => x.type === "CAR").map((x) => x.id));

  return (
    <div className="space-y-4">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      <div className="flex flex-wrap items-end gap-2 rounded-xl bg-mist/70 p-3">
        <label className="min-w-36 flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">Make</span>
          <select
            className={cell}
            value={makeId}
            onChange={(e) => {
              setMakeId(e.target.value);
              setModelId("");
            }}
          >
            {makes.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.models.length})
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-40 flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">Model</span>
          <select className={cell} value={modelId} onChange={(e) => setModelId(e.target.value)}>
            <option value="">Select a model…</option>
            {selectedMake?.models.map((m) => (
              <option key={m.id} value={m.id} disabled={has(m.id)}>
                {m.name} {m.type === "BIKE" ? "(bike)" : ""} · {m.yearFrom}–{m.yearTo ?? "now"}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!modelId}
          onClick={() => {
            addModels([modelId]);
            setModelId("");
          }}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink px-3 text-xs font-semibold text-white disabled:opacity-40"
        >
          <Plus className="size-3.5" /> Add model
        </button>
        <button
          type="button"
          disabled={!selectedMake}
          onClick={() => selectedMake && addModels(selectedMake.models.map((m) => m.id))}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-xs font-semibold hover:border-ink disabled:opacity-40"
        >
          All {selectedMake?.name ?? ""} models
        </button>
        <button type="button" onClick={() => addModels(allCarIds)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-xs font-semibold hover:border-ink">
          <Car className="size-3.5" /> All car models ({allCarIds.length})
        </button>
      </div>

      {sorted.length ? (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-mist/70 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
              <tr>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Year from</th>
                <th className="px-3 py-2">Year to</th>
                <th className="px-3 py-2">Fuel</th>
                <th className="px-3 py-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map(({ row, i, info }) => (
                <tr key={`${row.vehicleModelId}-${i}`}>
                  <td className="px-3 py-2">
                    <span className="font-medium">{info!.make.name}</span> {info!.model.name}
                    <span className="block text-[11px] text-muted">
                      Model years {info!.model.yearFrom}–{info!.model.yearTo ?? "present"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className={cn(cell, "w-24")}
                      placeholder="Any"
                      min={1950}
                      max={2100}
                      value={row.yearFrom ?? ""}
                      aria-label="Year from"
                      onChange={(e) => update(i, { yearFrom: e.target.value ? Number(e.target.value) : null })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className={cn(cell, "w-24")}
                      placeholder="Any"
                      min={1950}
                      max={2100}
                      value={row.yearTo ?? ""}
                      aria-label="Year to"
                      onChange={(e) => update(i, { yearTo: e.target.value ? Number(e.target.value) : null })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select className={cn(cell, "w-32")} value={row.fuelType ?? ""} aria-label="Fuel type" onChange={(e) => update(i, { fuelType: e.target.value || null })}>
                      <option value="">All fuels</option>
                      {FUEL_TYPES.filter((f) => !info!.model.fuelTypes.length || info!.model.fuelTypes.includes(f.value)).map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                      className="grid size-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${info!.make.name} ${info!.model.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-line bg-mist/40 px-3 py-2 text-xs text-muted">
            <span>
              Fits <b className="text-ink">{sorted.length}</b> model{sorted.length === 1 ? "" : "s"}. Leave years / fuel empty to match every variant.
            </span>
            <button type="button" onClick={() => setRows([])} className="font-semibold text-red-600 hover:underline">
              Clear all
            </button>
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
          No vehicles yet. This product won&apos;t appear in &ldquo;Shop by Vehicle&rdquo; results until you add compatible models (or mark it universal).
        </p>
      )}
    </div>
  );
}
