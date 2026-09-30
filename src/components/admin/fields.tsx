import type { ReactNode } from "react";
import { FormField } from "@/components/admin/form";

/** Labelled text input / textarea wired to an AdminForm (errors show under the field). */
export function TextField({
  name,
  label,
  defaultValue,
  hint,
  multiline,
  rows,
  max = 300,
  required,
  placeholder,
  className,
}: {
  name: string;
  label: ReactNode;
  defaultValue?: string | number | null;
  hint?: ReactNode;
  multiline?: boolean;
  rows?: number;
  max?: number;
  required?: boolean;
  placeholder?: string;
  className?: string;
}) {
  return (
    <FormField name={name} label={label} hint={hint} className={className}>
      {multiline ? (
        <textarea
          id={name}
          name={name}
          className="field min-h-24"
          rows={rows}
          defaultValue={defaultValue ?? ""}
          maxLength={max}
          required={required}
          placeholder={placeholder}
        />
      ) : (
        <input id={name} name={name} className="field" defaultValue={defaultValue ?? ""} maxLength={max} required={required} placeholder={placeholder} />
      )}
    </FormField>
  );
}
