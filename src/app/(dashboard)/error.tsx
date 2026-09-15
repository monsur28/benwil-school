"use client"

import { ErrorState } from "@/components/shared/error-state"

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset?: () => void
  retry?: () => void
}

export default function DashboardError({ reset, retry }: DashboardErrorProps) {
  const handleRetry = () => {
    if (typeof retry === "function") {
      retry()
    } else if (typeof reset === "function") {
      reset()
    }
  }

  return <ErrorState onRetry={handleRetry} />
}
