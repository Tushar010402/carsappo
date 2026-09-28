import type { Metadata } from "next";
import Link from "next/link";
import type { VehicleMake, VehicleModel } from "@prisma/client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FUEL_TYPES, fuelLabel } from "@/lib/constants";
import { param } from "@/lib/admin/query";
import { deleteMake, deleteModel, saveMake, saveModel } from "@/app/admin/_actions/vehicles";
import { EmptyRow, PageHeader, Panel, TBody, THead, Table, Td, Th, Thumb, Tr } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { FormDialog } from "@/components/admin/dialog";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { SlugFields } from "@/components/admin/slug-fields";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Vehicles" };

function MakeForm({ make }: { make?: VehicleMake }) {
  return (
    <AdminForm action={saveMake} className="space-y-4">
      {make && <input type="hidden" name="id" value={make.id} />}
      <SlugFields defaultName={make?.name} defaultSlug={make?.slug} prefix="/shop?make=" namePlaceholder="e.g. Hyundai" />
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <FormField name="logo" label="Logo">
          <MediaInput name="logo" defaultValue={make?.logo} folder="vehicles" />
        </FormField>
        <FormField name="sortOrder" label="Sort order">
          <input id="sortOrder" name="sortOrder" type="number" className="field" defaultValue={make?.sortOrder ?? 0} required />
        </FormField>
      </div>
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>{make ? "Save make" : "Create make"}</FormSubmit>
      </div>
    </AdminForm>
  );
}

function ModelForm({ makeId, model }: { makeId: string; model?: VehicleModel }) {
  return (
    <AdminForm action={saveModel} className="space-y-4">
      {model && <input type="hidden" name="id" value={model.id} />}
      <input type="hidden" name="makeId" value={makeId} />
      <SlugFields defaultName={model?.name} defaultSlug={model?.slug} prefix="?model=" namePlaceholder="e.g. Creta" />
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField name="type" label="Type">
          <select id="type" name="type" className="field" defaultValue={model?.type ?? "CAR"}>
            <option value="CAR">Car</option>
            <option value="BIKE">Bike</option>
          </select>
        </FormField>
        <FormField name="yearFrom" label="Year from">
          <input id="yearFrom" name="yearFrom" type="number" min={1950} max={2100} className="field" defaultValue={model?.yearFrom ?? new Date().getFullYear()} required />
        </FormField>
        <FormField name="yearTo" label="Year to" hint="Empty = still in production">
          <input id="yearTo" name="yearTo" type="number" min={1950} max={2100} className="field" defaultValue={model?.yearTo ?? ""} />
        </FormField>
      </div>
      <FormField name="fuelTypes" label="Fuel types">
        <div className="flex flex-wrap gap-2">
          {FUEL_TYPES.map((f) => (
            <label key={f.value} className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white">
              <input type="checkbox" name="fuelTypes" value={f.value} defaultChecked={model?.fuelTypes.includes(f.value) ?? f.value === "PETROL"} className="sr-only" />
              {f.label}
            </label>
          ))}
        </div>
      </FormField>
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>{model ? "Save model" : "Add model"}</FormSubmit>
      </div>
    </AdminForm>
  );
}

export default async function VehiclesPage({ searchParams }: PageProps<"/admin/vehicles">) {
  await requireAdmin();
  const sp = await searchParams;
  const makes = await prisma.vehicleMake.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { models: true } } },
  });
  const selectedId = param(sp, "make") ?? makes[0]?.id;
  const selected = makes.find((m) => m.id === selectedId) ?? makes[0];
  const models = selected
    ? await prisma.vehicleModel.findMany({
        where: { makeId: selected.id },
        orderBy: { name: "asc" },
        include: { _count: { select: { compatibilities: true } } },
      })
    : [];

  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Makes and models used by Shop by Vehicle and product compatibility."
        actions={
          <FormDialog trigger={<><Plus className="size-4" /> Add make</>} triggerVariant="primary" title="New vehicle make">
            <MakeForm />
          </FormDialog>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Panel title="Makes" flush>
          <ul className="max-h-[70vh] overflow-y-auto p-2">
            {makes.length === 0 && <li className="px-3 py-8 text-center text-sm text-muted">No makes yet.</li>}
            {makes.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/admin/vehicles?make=${m.id}`}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition", selected?.id === m.id ? "bg-ink text-white" : "hover:bg-mist")}
                  aria-current={selected?.id === m.id ? "page" : undefined}
                >
                  <span className="flex-1 truncate font-medium">{m.name}</span>
                  <span className={cn("text-xs tabular-nums", selected?.id === m.id ? "text-zinc-400" : "text-muted")}>{m._count.models}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        {selected ? (
          <Panel
            title={
              <span className="flex items-center gap-3">
                {selected.logo && <Thumb src={selected.logo} size={28} />}
                {selected.name}
              </span>
            }
            description={`${models.length} model${models.length === 1 ? "" : "s"} · slug ${selected.slug}`}
            flush
            actions={
              <>
                <FormDialog trigger={<><Pencil className="size-4" /> Edit make</>} title={`Edit ${selected.name}`}>
                  <MakeForm make={selected} />
                </FormDialog>
                <ActionButton
                  action={deleteMake.bind(null, selected.id)}
                  variant="outline"
                  className="text-red-600"
                  confirm={`Delete ${selected.name} and all ${models.length} of its models? Product compatibility rows for these models are removed too.`}
                >
                  <Trash2 className="size-4" /> Delete
                </ActionButton>
                <FormDialog trigger={<><Plus className="size-4" /> Add model</>} triggerVariant="dark" title={`New ${selected.name} model`}>
                  <ModelForm makeId={selected.id} />
                </FormDialog>
              </>
            }
          >
            <Table minWidth={620}>
              <THead>
                <Th>Model</Th>
                <Th>Type</Th>
                <Th>Years</Th>
                <Th>Fuel types</Th>
                <Th align="right">Products</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <TBody>
                {models.length === 0 && <EmptyRow colSpan={6}>No models yet for {selected.name}.</EmptyRow>}
                {models.map((m) => (
                  <Tr key={m.id}>
                    <Td>
                      <span className="font-medium">{m.name}</span>
                      <span className="block font-mono text-xs text-muted">{m.slug}</span>
                    </Td>
                    <Td>
                      <Badge tone={m.type === "CAR" ? "soft" : "info"}>{m.type === "CAR" ? "Car" : "Bike"}</Badge>
                    </Td>
                    <Td className="tabular-nums">
                      {m.yearFrom}–{m.yearTo ?? "present"}
                    </Td>
                    <Td className="text-muted">{m.fuelTypes.map(fuelLabel).join(", ") || "—"}</Td>
                    <Td align="right">{m._count.compatibilities}</Td>
                    <Td align="right">
                      <div className="flex justify-end gap-0.5">
                        <FormDialog trigger={<Pencil className="size-4" />} triggerVariant="icon" triggerLabel={`Edit ${m.name}`} title={`Edit ${selected.name} ${m.name}`}>
                          <ModelForm makeId={selected.id} model={m} />
                        </FormDialog>
                        <ActionButton
                          action={deleteModel.bind(null, m.id)}
                          variant="icon-danger"
                          label={`Delete ${m.name}`}
                          confirm={`Delete ${selected.name} ${m.name}?${m._count.compatibilities ? ` It is linked to ${m._count.compatibilities} product(s).` : ""}`}
                        >
                          <Trash2 className="size-4" />
                        </ActionButton>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </Panel>
        ) : (
          <Panel>
            <p className="py-10 text-center text-sm text-muted">Add your first vehicle make to get started.</p>
          </Panel>
        )}
      </div>
    </>
  );
}
