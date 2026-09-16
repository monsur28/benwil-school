"use client"

import { useState, useTransition } from "react"
import { FormProvider, useForm, type Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { AlertCircle } from "lucide-react"
import { z } from "zod"
import { updateStudentSchema } from "@/lib/validations/student"
import { createStudent } from "@/actions/students/create-student"
import { updateStudent } from "@/actions/students/update-student"
import { StepIndicator } from "@/components/students/step-indicator"
import { BasicInfoStep } from "@/components/students/steps/basic-info-step"
import { GuardianInfoStep } from "@/components/students/steps/guardian-info-step"
import { AcademicInfoStep, type AcademicOptions } from "@/components/students/steps/academic-info-step"
import { DocumentsStep } from "@/components/students/steps/documents-step"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"

const studentFormSchema = updateStudentSchema.extend({
  primaryGuardianIndex: z.string(),
})
export type StudentFormValues = z.infer<typeof studentFormSchema>

const STEP_FIELDS: Path<StudentFormValues>[][] = [
  [
    "name",
    "nameBn",
    "dateOfBirth",
    "admissionDate",
    "gender",
    "bloodGroup",
    "religion",
    "nationality",
    "birthCertificateNumber",
    "admissionNumber",
    "status",
  ],
  ["guardians"],
  ["academicYearId", "classId", "sectionId", "roll"],
  ["documents"],
]

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function StudentForm({
  mode,
  studentId,
  academicOptions,
  defaultValues,
}: {
  mode: "create" | "edit"
  studentId?: string
  academicOptions: AcademicOptions
  defaultValues?: Partial<StudentFormValues>
}) {
  const t = useTranslations("students")
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(0)
  const steps =
    mode === "create"
      ? [t("steps.basic"), t("steps.guardian"), t("steps.academic"), t("steps.documents")]
      : [t("steps.basic"), t("steps.guardian"), t("steps.academic")]

  const form = useForm({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      nameBn: "",
      dateOfBirth: "",
      admissionDate: todayIso(),
      gender: "MALE",
      bloodGroup: "",
      religion: "",
      nationality: "Bangladeshi",
      birthCertificateNumber: "",
      admissionNumber: "",
      status: "ACTIVE",
      academicYearId: academicOptions.academicYears[0]?.id ?? "",
      classId: academicOptions.classes[0]?.id ?? "",
      sectionId:
        academicOptions.sections.find(
          (section) => section.classId === academicOptions.classes[0]?.id
        )?.id ?? "",
      roll: undefined as unknown as number,
      guardians: [
        {
          name: "",
          nameBn: "",
          phone: "",
          email: "",
          occupation: "",
          address: "",
          relation: "GUARDIAN",
          isPrimary: true,
        },
      ],
      documents: [],
      primaryGuardianIndex: "0",
      ...defaultValues,
    },
  })

  const {
    handleSubmit,
    trigger,
    setError,
    formState: { errors },
  } = form

  async function goNext() {
    const valid = await trigger(STEP_FIELDS[currentStep])
    if (valid) {
      setCurrentStep((step) => Math.min(step + 1, steps.length - 1))
    }
  }

  function goBack() {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  function onSubmit(values: StudentFormValues) {
    const primaryIndex = Number(values.primaryGuardianIndex)
    const payload = {
      ...values,
      guardians: values.guardians.map((guardian, index) => ({
        ...guardian,
        isPrimary: index === primaryIndex,
      })),
    }

    startTransition(async () => {
      const result =
        mode === "create" ? await createStudent(payload) : await updateStudent(studentId!, payload)

      if (!result?.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((result.field as any)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const stepIndex = STEP_FIELDS.findIndex((fields) => fields.includes((result.field as any)!))
          if (stepIndex >= 0) setCurrentStep(stepIndex)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setError((result.field as any), { type: "server", message: result.error })
        } else {
          setError("root", { type: "server", message: result.error })
        }
      }
    })
  }

  const isLastStep = currentStep === steps.length - 1

  return (
    <FormProvider {...form}>
      <div className="space-y-6">
        <StepIndicator steps={steps} currentStep={currentStep} />

        <Card>
          <CardContent>
            <form
              onSubmit={handleSubmit(onSubmit)}
              onKeyDown={(event) => {
                // Enter should never submit a step early: only the button's
                // own click (last step only) should.
                if (event.key === "Enter" && !isLastStep) {
                  event.preventDefault()
                }
              }}
              noValidate
              className="space-y-6"
            >
              {errors.root && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}

              {currentStep === 0 && <BasicInfoStep mode={mode} />}
              {currentStep === 1 && <GuardianInfoStep />}
              {currentStep === 2 && <AcademicInfoStep {...academicOptions} />}
              {currentStep === 3 && mode === "create" && <DocumentsStep />}

              <div className="flex items-center justify-between border-t pt-4">
                <Button type="button" variant="outline" onClick={goBack} disabled={currentStep === 0}>
                  {t("actions.back")}
                </Button>

                {/* One stable button node whose behavior depends on the current
                    step, instead of swapping between two elements in the same
                    slot: swapping let a fast click's mouseup land on the newly
                    mounted submit button before the user intended to submit. */}
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={isLastStep ? handleSubmit(onSubmit) : goNext}
                >
                  {isLastStep
                    ? isPending
                      ? t("actions.saving")
                      : mode === "create"
                        ? t("actions.save")
                        : t("actions.saveChanges")
                    : t("actions.next")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  )
}
