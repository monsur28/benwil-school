"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import {
  systemSettingsSchema,
  CURRENCY_CODES,
  DATE_FORMATS,
  TIME_FORMATS,
  LANGUAGE_CODES,
  type SystemSettingsInput,
} from "@/lib/validations/school-settings"
import { updateSystemSettings } from "@/actions/settings/school-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

const WEEKDAYS = [
  { value: 0, labelKey: "system.weekdays.sunday" },
  { value: 1, labelKey: "system.weekdays.monday" },
  { value: 2, labelKey: "system.weekdays.tuesday" },
  { value: 3, labelKey: "system.weekdays.wednesday" },
  { value: 4, labelKey: "system.weekdays.thursday" },
  { value: 5, labelKey: "system.weekdays.friday" },
  { value: 6, labelKey: "system.weekdays.saturday" },
] as const

export function SystemSettingsForm({ settings }: { settings: SystemSettingsInput }) {
  const t = useTranslations("settings")
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SystemSettingsInput>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: settings,
  })

  function submit(values: SystemSettingsInput) {
    startTransition(async () => {
      const result = await updateSystemSettings(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t("success.saved"), type: "success" })
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="system-language">{t("system.defaultLanguage")}</FieldLabel>
            <NativeSelect id="system-language" {...register("defaultLanguage")}>
              <NativeSelectOption value="">{t("system.useApplicationDefault")}</NativeSelectOption>
              {LANGUAGE_CODES.map((code) => (
                <NativeSelectOption key={code} value={code}>
                  {t(`system.languages.${code}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="system-timezone">{t("system.timezone")}</FieldLabel>
            <Input id="system-timezone" placeholder="Asia/Dhaka" {...register("timezone")} />
            <FieldError errors={[errors.timezone && { message: t(errors.timezone.message as never) }]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="system-currency">{t("system.currency")}</FieldLabel>
            <NativeSelect id="system-currency" {...register("currency")}>
              <NativeSelectOption value="">{t("system.useApplicationDefault")}</NativeSelectOption>
              {CURRENCY_CODES.map((code) => (
                <NativeSelectOption key={code} value={code}>
                  {code}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="system-date-format">{t("system.dateFormat")}</FieldLabel>
            <NativeSelect id="system-date-format" {...register("dateFormat")}>
              <NativeSelectOption value="">{t("system.useApplicationDefault")}</NativeSelectOption>
              {DATE_FORMATS.map((format) => (
                <NativeSelectOption key={format} value={format}>
                  {format}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="system-time-format">{t("system.timeFormat")}</FieldLabel>
            <NativeSelect id="system-time-format" {...register("timeFormat")}>
              <NativeSelectOption value="">{t("system.useApplicationDefault")}</NativeSelectOption>
              {TIME_FORMATS.map((format) => (
                <NativeSelectOption key={format} value={format}>
                  {t(format === "12h" ? "system.timeFormat12h" : "system.timeFormat24h")}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="system-week-start">{t("system.weekStartsOn")}</FieldLabel>
            <NativeSelect id="system-week-start" {...register("weekStartsOn")}>
              <NativeSelectOption value="">{t("system.useApplicationDefault")}</NativeSelectOption>
              {WEEKDAYS.map((day) => (
                <NativeSelectOption key={day.value} value={day.value}>
                  {t(day.labelKey)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="system-page-size">{t("system.pageSize")}</FieldLabel>
            <Input id="system-page-size" type="number" min={5} max={200} {...register("pageSize")} />
          </Field>
        </div>

        <Field>
          <FieldLabel>{t("system.workingDays")}</FieldLabel>
          <Controller
            control={control}
            name="workingDays"
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const selected = (field.value ?? []).includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        const current = field.value ?? []
                        field.onChange(
                          selected ? current.filter((value) => value !== day.value) : [...current, day.value].sort()
                        )
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t(day.labelKey)}
                    </button>
                  )
                })}
              </div>
            )}
          />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isPending}>
        {isPending ? t("actions.saving") : t("actions.saveChanges")}
      </Button>
    </form>
  )
}
