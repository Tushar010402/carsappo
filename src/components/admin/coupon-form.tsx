"use client";

import { useState } from "react";
import { saveCoupon } from "@/app/admin/_actions/coupons";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { MoneyInput, Toggle } from "@/components/admin/ui";

export type CouponFormValues = {
  id?: string;
  code: string;
  description: string;
  type: "PERCENT" | "FLAT";
  value: string; // percent or rupees
  minOrder: string; // rupees
  maxDiscount: string; // rupees
  usageLimit: string;
  perUserLimit: string;
  startsAt: string; // datetime-local (IST)
  expiresAt: string;
  isActive: boolean;
  isPublic: boolean;
};

export function CouponForm({ coupon }: { coupon: CouponFormValues }) {
  const [type, setType] = useState(coupon.type);
  return (
    <AdminForm action={saveCoupon} className="space-y-4">
      {coupon.id && <input type="hidden" name="id" value={coupon.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="code" label="Code" hint="Customers type this at checkout.">
          <input id="code" name="code" className="field font-mono uppercase" defaultValue={coupon.code} required maxLength={30} placeholder="WELCOME10" />
        </FormField>
        <FormField name="type" label="Discount type">
          <select id="type" name="type" className="field" value={type} onChange={(e) => setType(e.target.value as "PERCENT" | "FLAT")}>
            <option value="PERCENT">Percentage off</option>
            <option value="FLAT">Flat amount off</option>
          </select>
        </FormField>
      </div>
      <FormField name="description" label="Description" hint="Shown to customers for public coupons.">
        <input id="description" name="description" className="field" defaultValue={coupon.description} maxLength={200} placeholder="10% off your first order" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField name="value" label={type === "PERCENT" ? "Percent off" : "Amount off"}>
          {type === "PERCENT" ? (
            <div className="relative">
              <input id="value" name="value" type="number" min={1} max={100} step={1} className="field pr-8" defaultValue={coupon.value} required />
              <span className="pointer-events-none absolute inset-y-0 right-3.5 grid place-items-center text-sm text-muted">%</span>
            </div>
          ) : (
            <MoneyInput id="value" name="value" defaultValue={coupon.value} required />
          )}
        </FormField>
        <FormField name="minOrder" label="Minimum order">
          <MoneyInput id="minOrder" name="minOrder" defaultValue={coupon.minOrder || "0"} required />
        </FormField>
        {type === "PERCENT" && (
          <FormField name="maxDiscount" label="Max discount" hint="Cap (optional)">
            <MoneyInput id="maxDiscount" name="maxDiscount" defaultValue={coupon.maxDiscount} />
          </FormField>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="usageLimit" label="Total usage limit" hint="Empty = unlimited">
          <input id="usageLimit" name="usageLimit" type="number" min={1} className="field" defaultValue={coupon.usageLimit} />
        </FormField>
        <FormField name="perUserLimit" label="Uses per customer" hint="Empty = unlimited">
          <input id="perUserLimit" name="perUserLimit" type="number" min={1} className="field" defaultValue={coupon.perUserLimit} />
        </FormField>
        <FormField name="startsAt" label="Starts (IST)" hint="Empty = immediately">
          <input id="startsAt" name="startsAt" type="datetime-local" className="field" defaultValue={coupon.startsAt} />
        </FormField>
        <FormField name="expiresAt" label="Expires (IST)" hint="Empty = never">
          <input id="expiresAt" name="expiresAt" type="datetime-local" className="field" defaultValue={coupon.expiresAt} />
        </FormField>
      </div>
      <div className="space-y-3 rounded-xl bg-mist/70 p-3">
        <Toggle name="isActive" label="Active" description="Can be redeemed" defaultChecked={coupon.isActive} />
        <Toggle name="isPublic" label="Public" description="Listed to customers in the cart and account" defaultChecked={coupon.isPublic} />
      </div>
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>{coupon.id ? "Save coupon" : "Create coupon"}</FormSubmit>
      </div>
    </AdminForm>
  );
}
