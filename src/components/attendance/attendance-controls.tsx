"use client"

import { useMemo, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Calendar as CalendarIcon, RotateCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel } from "@/components/ui/field"

type ClassOption = { id: string; name: string }
type SectionOption = { id: string; classId: string; name: string }

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function AttendanceControls({
  classes,
  sections,
}: {
  classes: ClassOption[]
  sections: SectionOption[]
}) {
  const searchParams = useSearchParams()
  return (
    <AttendanceControlsInner
      key={searchParams.toString()}
      classes={classes}
      sections={sections}
    />
  )
}

function AttendanceControlsInner({
  classes,
  sections,
}: {
  classes: ClassOption[]
  sections: SectionOption[]
}) {
  const t = useTranslations("attendance")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)

  const currentClassId = searchParams.get("classId") ?? classes[0]?.id ?? ""
  const availableSections = sections.filter((section) => section.classId === currentClassId)
  const currentSectionId = searchParams.get("sectionId") ?? availableSections[0]?.id ?? ""
  const currentDate = searchParams.get("date") ?? todayIso()
  const isToday = currentDate === todayIso()

  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = currentDate.split("-").map(Number)
      const dateObj = new Date(y, m - 1, d)
      return new Intl.DateTimeFormat(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(dateObj)
    } catch {
      return currentDate
    }
  }, [currentDate, locale])

  function submit(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams()
    const formData = new FormData(formRef.current!)

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value) params.set(key, value)
    }
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="panel overflow-hidden p-3.5 sm:p-4">
      <form
        ref={formRef}
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap lg:items-end lg:gap-4">
          <Field className="w-full sm:w-44">
            <FieldLabel htmlFor="attendance-class" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("fields.class")}
            </FieldLabel>
            <NativeSelect
              id="attendance-class"
              name="classId"
              defaultValue={currentClassId}
              className="w-full"
              onChange={(event) => {
                const nextClassId = event.target.value
                const firstSection = sections.find((section) => section.classId === nextClassId)
                submit({ classId: nextClassId, sectionId: firstSection?.id ?? "" })
              }}
            >
              {classes.map((klass) => (
                <NativeSelectOption key={klass.id} value={klass.id}>
                  {klass.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field className="w-full sm:w-36">
            <FieldLabel htmlFor="attendance-section" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("fields.section")}
            </FieldLabel>
            <NativeSelect
              id="attendance-section"
              name="sectionId"
              defaultValue={currentSectionId}
              className="w-full"
              onChange={(event) => submit({ sectionId: event.target.value })}
            >
              {availableSections.map((section) => (
                <NativeSelectOption key={section.id} value={section.id}>
                  {section.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>

          <Field className="w-full sm:w-48">
            <FieldLabel htmlFor="attendance-date" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("fields.date")}
            </FieldLabel>
            <Input
              id="attendance-date"
              name="date"
              type="date"
              max={todayIso()}
              defaultValue={currentDate}
              className="h-9 w-full font-medium"
              onChange={(event) => submit({ date: event.target.value || todayIso() })}
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border-light pt-3 sm:justify-end lg:border-t-0 lg:pt-0">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <CalendarIcon className="size-4" />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                {isToday ? (
                  <span className="inline-flex items-center rounded-sm bg-success-light px-1.5 py-0.5 text-[10px] font-semibold text-success">
                    {t("today")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => submit({ date: todayIso() })}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <RotateCcw className="size-3" />
                    {t("goToToday")}
                  </button>
                )}
              </div>
              <span className="text-xs font-medium text-foreground">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
