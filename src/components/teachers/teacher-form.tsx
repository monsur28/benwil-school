"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  createTeacherSchema,
  updateTeacherSchema,
  type CreateTeacherInput,
  type UpdateTeacherInput,
} from "@/lib/validations/teacher"
import { createTeacher, updateTeacher } from "@/actions/teachers/teachers"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : ""
}

type ExistingTeacher = {
  id: string
  name: string
  phone: string | null
  address: string | null
  employeeId: string | null
  designation: string | null
  department: string | null
  joiningDate: Date | null
  employmentType: string | null
  qualifications: string | null
  specialization: string | null
}

export function TeacherForm({ teacher }: { teacher?: ExistingTeacher }) {
  const t = useTranslations("teachers")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(teacher)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors: rawErrors },
  } = useForm<CreateTeacherInput | UpdateTeacherInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(isEdit ? updateTeacherSchema : createTeacherSchema) as any,
    defaultValues: isEdit
      ? {
          name: teacher!.name,
          phone: teacher!.phone ?? "",
          address: teacher!.address ?? "",
          employeeId: teacher!.employeeId ?? "",
          designation: teacher!.designation ?? "",
          department: teacher!.department ?? "",
          joiningDate: toDateInputValue(teacher!.joiningDate),
          employmentType: teacher!.employmentType ?? "",
          qualifications: teacher!.qualifications ?? "",
          specialization: teacher!.specialization ?? "",
        }
      : {
          name: "",
          email: "",
          password: "",
          phone: "",
          address: "",
          employeeId: "",
          designation: "",
          department: "",
          joiningDate: "",
          employmentType: "",
          qualifications: "",
          specialization: "",
        },
  })

  // The union type only has email/password on the create branch; this form
  // only ever renders those fields when !isEdit, so a single loose cast
  // here is simpler than threading a narrowed type through every access.
  const errors = rawErrors as typeof rawErrors & {
    email?: { message?: string }
    password?: { message?: string }
  }

  function submit(values: CreateTeacherInput | UpdateTeacherInput) {
    startTransition(async () => {
      if (isEdit) {
        const result = await updateTeacher(teacher!.id, values as UpdateTeacherInput)
        if (result && !result.success) {
          setError("root", { message: result.error })
        }
        return
      }

      const result = await createTeacher(values as CreateTeacherInput)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t("success.created"), type: "success" })
      router.push(`/teachers/${result.data.id}`)
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
        <p className="text-sm font-semibold text-foreground">{t("sections.basic")}</p>
        <Field>
          <FieldLabel htmlFor="teacher-name">{t("fields.name")}</FieldLabel>
          <Input id="teacher-name" {...register("name")} />
          <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
        </Field>

        {!isEdit && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="teacher-email">{t("fields.email")}</FieldLabel>
              <Input id="teacher-email" type="email" {...register("email")} />
              <FieldError errors={[errors.email && { message: t(errors.email.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="teacher-password">{t("fields.password")}</FieldLabel>
              <Input id="teacher-password" type="password" autoComplete="new-password" {...register("password")} />
              <FieldError errors={[errors.password && { message: t(errors.password.message as never) }]} />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="teacher-phone">{t("fields.phone")}</FieldLabel>
            <Input id="teacher-phone" {...register("phone")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="teacher-address">{t("fields.address")}</FieldLabel>
            <Input id="teacher-address" {...register("address")} />
          </Field>
        </div>

        <p className="pt-2 text-sm font-semibold text-foreground">{t("sections.employment")}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="teacher-employee-id">{t("fields.employeeId")}</FieldLabel>
            <Input id="teacher-employee-id" {...register("employeeId")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="teacher-designation">{t("fields.designation")}</FieldLabel>
            <Input id="teacher-designation" placeholder={t("fields.designationPlaceholder")} {...register("designation")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="teacher-department">{t("fields.department")}</FieldLabel>
            <Input id="teacher-department" {...register("department")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="teacher-joining-date">{t("fields.joiningDate")}</FieldLabel>
            <Input id="teacher-joining-date" type="date" {...register("joiningDate")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="teacher-employment-type">{t("fields.employmentType")}</FieldLabel>
            <Input id="teacher-employment-type" placeholder={t("fields.employmentTypePlaceholder")} {...register("employmentType")} />
          </Field>
        </div>

        <p className="pt-2 text-sm font-semibold text-foreground">{t("sections.academic")}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="teacher-qualifications">{t("fields.qualifications")}</FieldLabel>
            <Input id="teacher-qualifications" {...register("qualifications")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="teacher-specialization">{t("fields.specialization")}</FieldLabel>
            <Input id="teacher-specialization" {...register("specialization")} />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? t("actions.saving") : isEdit ? t("actions.save") : t("actions.create")}
        </Button>
      </div>
    </form>
  )
}
