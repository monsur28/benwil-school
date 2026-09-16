"use client"

import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

export function ColorInput({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const swatchValue = HEX_COLOR.test(value) ? value : "#ffffff"

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={swatchValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
        />
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#18315A"
          maxLength={7}
          className="font-mono uppercase"
        />
      </div>
      <FieldError errors={[error ? { message: error } : undefined]} />
    </Field>
  )
}
