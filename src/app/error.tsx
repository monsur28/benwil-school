"use client"

import { ErrorState } from "@/components/shared/error-state"

interface RootErrorProps {
  error: Error & { digest?: string }
  reset?: () => void
  retry?: () => void
}

export default function RootError({ reset, retry }: RootErrorProps) {
  const handleRetry = () => {
    if (typeof retry === "function") {
      retry()
    } else if (typeof reset === "function") {
      reset()
    }
  }

  return <ErrorState onRetry={handleRetry} />
}
