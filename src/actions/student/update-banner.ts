"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/db/client"
import { requireStudentIdentity } from "@/lib/portal/identity"
import { getDocumentStorage } from "@/lib/storage/document-storage"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

const uploadSchema = z.object({
  file: z
    .any()
    .refine((file) => file instanceof File, "Expected a file")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
})

export async function uploadStudentBanner(formData: FormData) {
  try {
    const { student } = await requireStudentIdentity()

    const file = formData.get("file")
    const validatedFields = uploadSchema.safeParse({ file })

    if (!validatedFields.success) {
      return { success: false, error: validatedFields.error.issues[0].message }
    }

    const validFile = validatedFields.data.file as File

    const storage = getDocumentStorage()
    const extension = validFile.name.split('.').pop()
    const relativePath = `uploads/banners/student_${student.id}_${Date.now()}.${extension}`

    const uploadedFile = await storage.upload(validFile, relativePath)

    await prisma.student.update({
      where: { id: student.id },
      data: { bannerUrl: uploadedFile.url },
    })

    revalidatePath("/portal/student")
    
    return { success: true, bannerUrl: uploadedFile.url }
  } catch (error) {
    console.error("Error uploading banner:", error)
    return { success: false, error: "Failed to upload banner" }
  }
}
