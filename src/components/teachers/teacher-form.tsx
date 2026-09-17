"use client"

import { useTransition } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import {
  User,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Loader2,
  UserPlus,
  Check,
  AlertCircle,
} from "lucide-react"
import {
  createTeacherSchema,
  updateTeacherSchema,
  type CreateTeacherInput,
  type UpdateTeacherInput,
} from "@/lib/validations/teacher"
import { GENDER_OPTIONS, EMPLOYMENT_TYPE_OPTIONS } from "@/lib/teachers/options"
import { createTeacher, updateTeacher } from "@/actions/teachers/teachers"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"
import { Panel, PanelHeader, PanelBody } from "@/components/shared/panel"

function toDateInputValue(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : ""
}

function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-danger font-bold ml-0.5">
      *
    </span>
  )
}

type ExistingTeacher = {
  id: string
  name: string
  phone: string | null
  gender: "MALE" | "FEMALE" | "OTHER" | null
  dateOfBirth: Date | null
  address: string | null
  employeeId: string | null
  designation: string | null
  department: string | null
  joiningDate: Date | null
  employmentType: string | null
  qualifications: string | null
  specialization: string | null
  experience: string | null
}

export function TeacherForm({ teacher }: { teacher?: ExistingTeacher }) {
  const t = useTranslations("teachers")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(teacher)

  const {
    register,
    control,
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
          gender: teacher!.gender ?? "",
          dateOfBirth: toDateInputValue(teacher!.dateOfBirth),
          address: teacher!.address ?? "",
          employeeId: teacher!.employeeId ?? "",
          designation: teacher!.designation ?? "",
          department: teacher!.department ?? "",
          joiningDate: toDateInputValue(teacher!.joiningDate),
          employmentType: (teacher!.employmentType ?? "") as UpdateTeacherInput["employmentType"],
          qualifications: teacher!.qualifications ?? "",
          specialization: teacher!.specialization ?? "",
          experience: teacher!.experience ?? "",
        }
      : {
          name: "",
          email: "",
          password: "",
          phone: "",
          gender: "",
          dateOfBirth: "",
          address: "",
          employeeId: "",
          designation: "",
          department: "",
          joiningDate: "",
          employmentType: "" as never,
          qualifications: "",
          specialization: "",
          experience: "",
          isActive: true,
        },
  })

  const errors = rawErrors as typeof rawErrors & {
    email?: { message?: string }
    password?: { message?: string }
    isActive?: { message?: string }
  }

  function submit(values: CreateTeacherInput | UpdateTeacherInput) {
    startTransition(async () => {
      if (isEdit) {
        const result = await updateTeacher(teacher!.id, values as UpdateTeacherInput)
        if (result && !result.success) {
          setError("root", { message: result.error })
        } else {
          toast.add({ title: t("success.saved"), type: "success" })
          router.push(`/teachers/${teacher!.id}`)
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
        <Alert variant="destructive" className="flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {/* 1. Personal Information */}
      <Panel tone="default" className="rounded-2xl border border-border/80 bg-card shadow-xs">
        <PanelHeader
          icon={<User className="size-4" />}
          iconTone="blue"
          title={t("sections.basic")}
          description={t("sectionDescriptions.basic")}
        />
        <PanelBody className="space-y-4 p-5 sm:p-6">
          <Field>
            <FieldLabel htmlFor="teacher-name">
              {t("fields.name")}
              <RequiredMark />
            </FieldLabel>
            <Input
              id="teacher-name"
              placeholder={t("fields.namePlaceholder")}
              aria-required="true"
              {...register("name")}
            />
            <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="teacher-phone">
                {t("fields.phone")}
                {!isEdit && <RequiredMark />}
              </FieldLabel>
              <Input
                id="teacher-phone"
                type="tel"
                placeholder={t("fields.phonePlaceholder")}
                aria-required={!isEdit}
                {...register("phone")}
              />
              <FieldError errors={[errors.phone && { message: t(errors.phone.message as never) }]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="teacher-gender">{t("fields.gender")}</FieldLabel>
              <NativeSelect id="teacher-gender" className="w-full" {...register("gender")} defaultValue="">
                <NativeSelectOption value="">{t("fields.selectGender")}</NativeSelectOption>
                {GENDER_OPTIONS.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {t(`gender.${option}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="teacher-dob">{t("fields.dateOfBirth")}</FieldLabel>
              <Input id="teacher-dob" type="date" {...register("dateOfBirth")} />
              <FieldError errors={[errors.dateOfBirth && { message: t(errors.dateOfBirth.message as never) }]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="teacher-address">{t("fields.address")}</FieldLabel>
              <Input
                id="teacher-address"
                placeholder={t("fields.addressPlaceholder")}
                {...register("address")}
              />
            </Field>
          </div>
        </PanelBody>
      </Panel>

      {/* 2. Employment Details */}
      <Panel tone="default" className="rounded-2xl border border-border/80 bg-card shadow-xs">
        <PanelHeader
          icon={<Briefcase className="size-4" />}
          iconTone="amber"
          title={t("sections.employment")}
          description={t("sectionDescriptions.employment")}
        />
        <PanelBody className="space-y-4 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="teacher-employee-id">
                {t("fields.employeeId")}
                {!isEdit && <RequiredMark />}
              </FieldLabel>
              <Input
                id="teacher-employee-id"
                placeholder={t("fields.employeeIdPlaceholder")}
                aria-required={!isEdit}
                {...register("employeeId")}
              />
              <FieldError errors={[errors.employeeId && { message: t(errors.employeeId.message as never) }]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="teacher-designation">
                {t("fields.designation")}
                {!isEdit && <RequiredMark />}
              </FieldLabel>
              <Input
                id="teacher-designation"
                placeholder={t("fields.designationPlaceholder")}
                aria-required={!isEdit}
                {...register("designation")}
              />
              <FieldError errors={[errors.designation && { message: t(errors.designation.message as never) }]} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="teacher-department">{t("fields.department")}</FieldLabel>
              <Input
                id="teacher-department"
                placeholder={t("fields.departmentPlaceholder")}
                {...register("department")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="teacher-joining-date">
                {t("fields.joiningDate")}
                {!isEdit && <RequiredMark />}
              </FieldLabel>
              <Input
                id="teacher-joining-date"
                type="date"
                aria-required={!isEdit}
                {...register("joiningDate")}
              />
              <FieldError errors={[errors.joiningDate && { message: t(errors.joiningDate.message as never) }]} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="teacher-employment-type">
                {t("fields.employmentType")}
                {!isEdit && <RequiredMark />}
              </FieldLabel>
              <NativeSelect
                id="teacher-employment-type"
                className="w-full"
                aria-required={!isEdit}
                {...register("employmentType")}
                defaultValue=""
              >
                <NativeSelectOption value="">{t("fields.selectEmploymentType")}</NativeSelectOption>
                {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {t(`employmentType.${option}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError
                errors={[errors.employmentType && { message: t(errors.employmentType.message as never) }]}
              />
            </Field>
          </div>
        </PanelBody>
      </Panel>

      {/* 3. Professional Information */}
      <Panel tone="default" className="rounded-2xl border border-border/80 bg-card shadow-xs">
        <PanelHeader
          icon={<GraduationCap className="size-4" />}
          iconTone="purple"
          title={t("sections.academic")}
          description={t("sectionDescriptions.academic")}
        />
        <PanelBody className="space-y-4 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="teacher-qualifications">{t("fields.qualifications")}</FieldLabel>
              <Input
                id="teacher-qualifications"
                placeholder={t("fields.qualificationsPlaceholder")}
                {...register("qualifications")}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="teacher-specialization">{t("fields.specialization")}</FieldLabel>
              <Input
                id="teacher-specialization"
                placeholder={t("fields.specializationPlaceholder")}
                {...register("specialization")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="teacher-experience">{t("fields.experience")}</FieldLabel>
              <Input
                id="teacher-experience"
                placeholder={t("fields.experiencePlaceholder")}
                {...register("experience")}
              />
            </Field>
          </div>
        </PanelBody>
      </Panel>

      {/* 4. Account Access & Credentials (only shown on creation) */}
      {!isEdit && (
        <Panel tone="default" className="rounded-2xl border border-border/80 bg-card shadow-xs">
          <PanelHeader
            icon={<ShieldCheck className="size-4" />}
            iconTone="emerald"
            title={t("sections.account")}
            description={t("sectionDescriptions.account")}
          />
          <PanelBody className="space-y-5 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="teacher-email">
                  {t("fields.email")}
                  <RequiredMark />
                </FieldLabel>
                <Input
                  id="teacher-email"
                  type="email"
                  placeholder={t("fields.emailPlaceholder")}
                  aria-required="true"
                  {...register("email")}
                />
                <p className="text-xs text-muted-foreground">{t("fields.emailHint")}</p>
                <FieldError errors={[errors.email && { message: t(errors.email.message as never) }]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="teacher-password">
                  {t("fields.password")}
                  <RequiredMark />
                </FieldLabel>
                <Input
                  id="teacher-password"
                  type="password"
                  placeholder={t("fields.passwordPlaceholder")}
                  autoComplete="new-password"
                  aria-required="true"
                  {...register("password")}
                />
                <FieldError errors={[errors.password && { message: t(errors.password.message as never) }]} />
              </Field>
            </div>

            {/* Elevated System Access Permission Box */}
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-start gap-3.5 rounded-xl border border-primary/20 bg-primary/[0.03] p-4 transition-colors hover:bg-primary/[0.06] hover:border-primary/30">
                  <Checkbox
                    id="teacher-is-active"
                    checked={field.value ?? true}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    className="mt-0.5"
                  />
                  <label htmlFor="teacher-is-active" className="cursor-pointer select-none space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {t("fields.systemAccess")}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t("fields.systemAccessHint")}
                    </p>
                  </label>
                </div>
              )}
            />
          </PanelBody>
        </Panel>
      )}

      {/* 5. Action Footer */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-primary/70" />
          <span>{t("fields.requiredNote")}</span>
        </div>

        <div className="flex items-center gap-3 max-sm:w-full">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => router.back()}
            className="min-h-10 px-5 max-sm:flex-1"
          >
            {t("actions.cancel")}
          </Button>

          <Button
            type="submit"
            disabled={isPending}
            className="min-h-10 min-w-36 gap-2 px-6 shadow-sm max-sm:flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{t("actions.saving")}</span>
              </>
            ) : isEdit ? (
              <>
                <Check className="size-4" />
                <span>{t("actions.save")}</span>
              </>
            ) : (
              <>
                <UserPlus className="size-4" />
                <span>{t("actions.create")}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
