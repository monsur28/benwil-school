"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Plus, Trash2 } from "lucide-react"
import type { StudentFormValues } from "@/components/students/student-form"
import { translateFieldError } from "@/components/students/field-message"
import { RELATION_OPTIONS } from "@/lib/students/options"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"

const EMPTY_GUARDIAN = {
  name: "",
  nameBn: "",
  phone: "",
  email: "",
  occupation: "",
  address: "",
  relation: "GUARDIAN" as const,
  isPrimary: false,
}

export function GuardianInfoStep() {
  const t = useTranslations("students")
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<StudentFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: "guardians" })

  return (
    <div className="space-y-4">
      {errors.guardians?.root && (
        <p className="text-sm text-destructive">
          {translateFieldError(t, errors.guardians.root)}
        </p>
      )}
      {errors.guardians?.message && (
        <p className="text-sm text-destructive">{translateFieldError(t, errors.guardians)}</p>
      )}

      {fields.map((field, index) => (
        <Card key={field.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                value={index}
                className="size-4 accent-primary"
                aria-label={t("fields.isPrimary")}
                {...register("primaryGuardianIndex")}
              />
              {t("fields.isPrimary")}
            </CardTitle>
            {fields.length > 1 && (
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(index)}
                  aria-label={t("actions.remove")}
                >
                  <Trash2 />
                </Button>
              </CardAction>
            )}
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`guardians.${index}.name`}>
                  {t("fields.guardianName")}
                </FieldLabel>
                <Input
                  id={`guardians.${index}.name`}
                  aria-invalid={Boolean(errors.guardians?.[index]?.name)}
                  {...register(`guardians.${index}.name`)}
                />
                <FieldError
                  errors={[
                    errors.guardians?.[index]?.name && {
                      message: translateFieldError(t, errors.guardians[index]?.name),
                    },
                  ]}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`guardians.${index}.nameBn`}>
                  {t("fields.guardianNameBn")}
                </FieldLabel>
                <Input id={`guardians.${index}.nameBn`} {...register(`guardians.${index}.nameBn`)} />
              </Field>

              <Field>
                <FieldLabel htmlFor={`guardians.${index}.phone`}>{t("fields.phone")}</FieldLabel>
                <Input
                  id={`guardians.${index}.phone`}
                  type="tel"
                  aria-invalid={Boolean(errors.guardians?.[index]?.phone)}
                  {...register(`guardians.${index}.phone`)}
                />
                <FieldError
                  errors={[
                    errors.guardians?.[index]?.phone && {
                      message: translateFieldError(t, errors.guardians[index]?.phone),
                    },
                  ]}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`guardians.${index}.email`}>{t("fields.email")}</FieldLabel>
                <Input
                  id={`guardians.${index}.email`}
                  type="email"
                  aria-invalid={Boolean(errors.guardians?.[index]?.email)}
                  {...register(`guardians.${index}.email`)}
                />
                <FieldError
                  errors={[
                    errors.guardians?.[index]?.email && {
                      message: translateFieldError(t, errors.guardians[index]?.email),
                    },
                  ]}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`guardians.${index}.relation`}>
                  {t("fields.relation")}
                </FieldLabel>
                <NativeSelect id={`guardians.${index}.relation`} {...register(`guardians.${index}.relation`)}>
                  {RELATION_OPTIONS.map((option) => (
                    <NativeSelectOption key={option} value={option}>
                      {t(`relation.${option}`)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel htmlFor={`guardians.${index}.occupation`}>
                  {t("fields.occupation")}
                </FieldLabel>
                <Input
                  id={`guardians.${index}.occupation`}
                  {...register(`guardians.${index}.occupation`)}
                />
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor={`guardians.${index}.address`}>
                  {t("fields.address")}
                </FieldLabel>
                <Textarea
                  id={`guardians.${index}.address`}
                  rows={2}
                  {...register(`guardians.${index}.address`)}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ ...EMPTY_GUARDIAN })}
      >
        <Plus />
        {t("actions.addGuardian")}
      </Button>
    </div>
  )
}
