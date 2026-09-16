"use client"

import "./globals.css"
import Link from "next/link"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset?: () => void
  retry?: () => void
}

export default function GlobalError({ error, reset, retry }: GlobalErrorProps) {
  const handleRetry = () => {
    if (typeof retry === "function") {
      retry()
    } else if (typeof reset === "function") {
      reset()
    } else {
      window.location.reload()
    }
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6 bg-background text-foreground selection:bg-primary/20 selection:text-primary">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-lg text-center space-y-5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-warning/10 text-warning border border-warning/20 shadow-xs">
            <AlertTriangle className="size-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Application Error
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A critical error occurred while loading the application shell. You can attempt to reload the view or return to the main portal.
            </p>
            {error?.digest && (
              <p className="text-[11px] font-mono text-muted-foreground bg-muted py-1 px-2 rounded-md inline-block">
                Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-xs hover:bg-foreground/90 transition-colors cursor-pointer"
            >
              <RefreshCw className="size-4" />
              Try again
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-xs hover:bg-muted transition-colors"
            >
              <Home className="size-4" />
              Return Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
