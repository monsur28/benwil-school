"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import {
  createNoticeSchema,
  editNoticeSchema,
  NOTICE_AUDIENCE_TYPES,
  type CreateNoticeInput,
  type EditNoticeInput,
} from "@/lib/validations/notices"
import { createNoticeDraft, createNoticeAndPublish, updateNotice } from "@/actions/notices/notices"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

function toDatetimeLocalValue(date: Date) {
  return date.toISOString().slice(0, 16)
}

type NoticeDialogProps = {
  notice?: {
    id: string
    title: string
    titleBn: string | null
    content: string
    contentBn: string | null
    categoryId: string
    audienceType: (typeof NOTICE_AUDIENCE_TYPES)[number]
    classId: string | null
    sectionId: string | null
    publishAt: Date
    expiresAt: Date | null
  }
  categories: { id: string; name: string }[]
  classes: { id: string; name: string }[]
  sections: { id: string; classId: string; name: string }[]
}

export function NoticeDialog({ notice, categories, classes, sections }: NoticeDialogProps) {
  const t = useTranslations("notices")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(notice)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateNoticeInput | EditNoticeInput>({
    resolver: zodResolver(isEdit ? editNoticeSchema : createNoticeSchema),
    defaultValues: isEdit
      ? {
          id: notice!.id,
          title: notice!.title,
          titleBn: notice!.titleBn ?? "",
          content: notice!.content,
          contentBn: notice!.contentBn ?? "",
          categoryId: notice!.categoryId,
          audienceType: notice!.audienceType,
          classId: notice!.classId ?? "",
          sectionId: notice!.sectionId ?? "",
          publishAt: toDatetimeLocalValue(notice!.publishAt),
          expiresAt: notice!.expiresAt ? toDatetimeLocalValue(notice!.expiresAt) : "",
        }
      : {
          title: "",
          titleBn: "",
          content: "",
          contentBn: "",
          categoryId: "",
          audienceType: "ALL",
          classId: "",
          sectionId: "",
          publishAt: toDatetimeLocalValue(new Date()),
          expiresAt: "",
        },
  })

  const audienceType = watch("audienceType")
  const selectedClassId = watch("classId")
  const availableSections = sections.filter((section) => section.classId === selectedClassId)

  function submit(values: CreateNoticeInput | EditNoticeInput, publish: boolean) {
    startTransition(async () => {
      const result = isEdit
        ? await updateNotice(values)
        : publish
          ? await createNoticeAndPublish(values)
          : await createNoticeDraft(values)

      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({
        title: t(isEdit ? "success.noticeUpdated" : publish ? "success.published" : "success.draftSaved"),
        type: "success",
      })
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger
        render={isEdit ? <Button variant="ghost" size="icon-sm" aria-label={t("actions.edit")} /> : <Button size="sm" />}
      >
        {isEdit ? (
          <Pencil />
        ) : (
          <>
            <Plus />
            {t("actions.newNotice")}
          </>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("actions.edit") : t("actions.newNotice")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((values) => submit(values, false))} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="notice-title">{t("fields.title")}</FieldLabel>
                <Input id="notice-title" {...register("title")} />
                <FieldError errors={[errors.title && { message: t(errors.title.message as never) }]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="notice-title-bn">{t("fields.titleBn")}</FieldLabel>
                <Input id="notice-title-bn" {...register("titleBn")} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="notice-content">{t("fields.content")}</FieldLabel>
                <Textarea id="notice-content" rows={5} {...register("content")} />
                <FieldError errors={[errors.content && { message: t(errors.content.message as never) }]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="notice-content-bn">{t("fields.contentBn")}</FieldLabel>
                <Textarea id="notice-content-bn" rows={5} {...register("contentBn")} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="notice-category">{t("fields.category")}</FieldLabel>
              <NativeSelect id="notice-category" {...register("categoryId")}>
                <NativeSelectOption value="">—</NativeSelectOption>
                {categories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.categoryId && { message: t(errors.categoryId.message as never) }]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="notice-audience">{t("fields.audience")}</FieldLabel>
              <NativeSelect id="notice-audience" {...register("audienceType")}>
                {NOTICE_AUDIENCE_TYPES.map((type) => (
                  <NativeSelectOption key={type} value={type}>
                    {t(`audience.${type}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            {(audienceType === "CLASS" || audienceType === "SECTION") && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="notice-class">{t("fields.class")}</FieldLabel>
                  <NativeSelect id="notice-class" {...register("classId")}>
                    <NativeSelectOption value="">—</NativeSelectOption>
                    {classes.map((klass) => (
                      <NativeSelectOption key={klass.id} value={klass.id}>
                        {klass.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  <FieldError errors={[errors.classId && { message: t(errors.classId.message as never) }]} />
                </Field>

                {audienceType === "SECTION" && (
                  <Field>
                    <FieldLabel htmlFor="notice-section">{t("fields.section")}</FieldLabel>
                    <NativeSelect id="notice-section" {...register("sectionId")}>
                      <NativeSelectOption value="">—</NativeSelectOption>
                      {availableSections.map((section) => (
                        <NativeSelectOption key={section.id} value={section.id}>
                          {section.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <FieldError errors={[errors.sectionId && { message: t(errors.sectionId.message as never) }]} />
                  </Field>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="notice-publish-at">{t("fields.publishAt")}</FieldLabel>
                <Input id="notice-publish-at" type="datetime-local" {...register("publishAt")} />
                <FieldError errors={[errors.publishAt && { message: t(errors.publishAt.message as never) }]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="notice-expires-at">{t("fields.expiresAt")}</FieldLabel>
                <Input id="notice-expires-at" type="datetime-local" {...register("expiresAt")} />
                <FieldError errors={[errors.expiresAt && { message: t(errors.expiresAt.message as never) }]} />
              </Field>
            </div>
          </FieldGroup>

          <DialogFooter>
            {isEdit ? (
              <Button type="submit" disabled={isPending}>
                {t("actions.save")}
              </Button>
            ) : (
              <>
                <Button type="submit" variant="outline" disabled={isPending}>
                  {t("actions.saveDraft")}
                </Button>
                <Button type="button" disabled={isPending} onClick={handleSubmit((values) => submit(values, true))}>
                  {t("actions.publish")}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
