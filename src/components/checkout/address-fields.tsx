"use client";

import { Field, Input, Select } from "@/components/ui/field";
import { INDIAN_STATES } from "@/lib/constants";
import type { AddressInput } from "@/lib/validators";

export type AddressDraft = Omit<AddressInput, "state" | "line2" | "landmark"> & { state: string; line2?: string; landmark?: string };

export const emptyAddress: AddressDraft = { name: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" };

export function AddressFields({
  value,
  onChange,
  errors = {},
  prefix = "address.",
}: {
  value: AddressDraft;
  onChange: (v: AddressDraft) => void;
  errors?: Record<string, string>;
  prefix?: string;
}) {
  const set = (k: keyof AddressDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value });
  const err = (k: string) => errors[`${prefix}${k}`];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" error={err("name")} htmlFor="a-name">
        <Input id="a-name" autoComplete="name" value={value.name} onChange={set("name")} invalid={!!err("name")} />
      </Field>
      <Field label="Mobile number" error={err("phone")} htmlFor="a-phone">
        <Input id="a-phone" autoComplete="tel" inputMode="tel" value={value.phone} onChange={set("phone")} invalid={!!err("phone")} placeholder="10-digit mobile" />
      </Field>
      <Field label="Flat / House no., Building, Street" error={err("line1")} className="sm:col-span-2" htmlFor="a-line1">
        <Input id="a-line1" autoComplete="address-line1" value={value.line1} onChange={set("line1")} invalid={!!err("line1")} />
      </Field>
      <Field label="Area, Sector, Locality (optional)" htmlFor="a-line2">
        <Input id="a-line2" autoComplete="address-line2" value={value.line2 ?? ""} onChange={set("line2")} />
      </Field>
      <Field label="Landmark (optional)" htmlFor="a-landmark">
        <Input id="a-landmark" value={value.landmark ?? ""} onChange={set("landmark")} />
      </Field>
      <Field label="Pincode" error={err("pincode")} htmlFor="a-pincode">
        <Input id="a-pincode" autoComplete="postal-code" inputMode="numeric" maxLength={6} value={value.pincode} onChange={set("pincode")} invalid={!!err("pincode")} />
      </Field>
      <Field label="City" error={err("city")} htmlFor="a-city">
        <Input id="a-city" autoComplete="address-level2" value={value.city} onChange={set("city")} invalid={!!err("city")} />
      </Field>
      <Field label="State" error={err("state")} className="sm:col-span-2" htmlFor="a-state">
        <Select id="a-state" autoComplete="address-level1" value={value.state} onChange={set("state")} invalid={!!err("state")}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
