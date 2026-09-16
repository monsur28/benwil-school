"use client"

import { useTransition, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Sparkles, Camera, Loader2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { uploadStudentBanner } from "@/actions/student/update-banner"

interface PortalWelcomeBannerProps {
  name: string
  quote?: string
  bannerUrl?: string | null
}

export function PortalWelcomeBanner({
  name,
  quote = "Small steps every day lead to big achievements.",
  bannerUrl,
}: PortalWelcomeBannerProps) {
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      const result = await uploadStudentBanner(formData)
      if (result.success) {
        toast.add({ title: "Banner updated successfully!", type: "success" })
      } else {
        toast.add({ title: result.error || "Failed to update banner.", type: "error" })
      }
    })
  }

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-r from-dashboard-blue to-dashboard-purple text-primary-foreground p-6 h-full flex flex-col justify-center min-h-[160px]">
      {bannerUrl && (
        <Image
          src={bannerUrl}
          alt="Dashboard Banner"
          fill
          className="object-cover opacity-80 mix-blend-overlay"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      )}
      {!bannerUrl && (
        <>
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary-foreground opacity-10 blur-3xl"></div>
          <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-primary-foreground opacity-10 blur-2xl"></div>
        </>
      )}

      {/* Upload Button overlay */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <input 
          type="file" 
          accept="image/jpeg,image/jpg,image/png,image/webp" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button 
          variant="secondary" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
        </Button>
      </div>

      <div className="relative z-10 space-y-2 max-w-[70%]">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight drop-shadow-md">Good Morning, {name}!</h1>
        <div className="flex items-center space-x-2 text-primary-foreground/90 text-sm sm:text-base drop-shadow">
          <Sparkles className="w-4 h-4" />
          <p>{quote}</p>
        </div>
      </div>
    </Card>
  )
}
