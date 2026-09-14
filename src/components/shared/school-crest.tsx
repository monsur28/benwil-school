"use client"

import * as React from "react"
import { useId } from "react"
import { cn } from "cn"

interface SchoolCrestProps extends React.SVGProps<SVGSVGElement> {
  size?: "sm" | "md" | "lg" | "xl"
}

export function SchoolCrest({
  size = "md",
  className,
  ...props
}: SchoolCrestProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "")
  const goldGradientId = `crest-gold-${rawId}`
  const shieldGradientId = `crest-shield-${rawId}`
  const starGradientId = `crest-star-${rawId}`

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  }[size]

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(sizeClasses, "shrink-0", className)}
      aria-label="Benwil Model School Crest"
      {...props}
    >
      <defs>
        <linearGradient id={goldGradientId} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="0.45" stopColor="#D97706" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={shieldGradientId} x1="32" y1="6" x2="32" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E293B" />
          <stop offset="1" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id={starGradientId} x1="30" y1="28" x2="34" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Decorative Dashed Outer Aura */}
      <circle
        cx="32"
        cy="32"
        r="30"
        stroke={`url(#${goldGradientId})`}
        strokeWidth="1"
        strokeDasharray="2.5 3"
        opacity="0.6"
      />

      {/* Main Classical Academic Shield Body */}
      <path
        d="M32 6.5C44.5 6.5 52 11 52 18.5C52 35.5 44 49.5 32 58C20 49.5 12 35.5 12 18.5C12 11 19.5 6.5 32 6.5Z"
        fill={`url(#${shieldGradientId})`}
        stroke={`url(#${goldGradientId})`}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />

      {/* Inner Concentric Shield Rim */}
      <path
        d="M32 10.5C41.5 10.5 48 14 48 19.5C48 33.5 42 45.5 32 53C22 45.5 16 33.5 16 19.5C16 14 22.5 10.5 32 10.5Z"
        stroke={`url(#${goldGradientId})`}
        strokeWidth="0.9"
        strokeOpacity="0.6"
      />

      {/* Open Book of Knowledge */}
      <path
        d="M23 37C26.5 35.5 29.5 36 32 37.5C34.5 36 37.5 35.5 41 37V44.5C37.5 43 34.5 43.5 32 45C29.5 43.5 26.5 43 23 44.5V37Z"
        fill="#FDE68A"
        stroke={`url(#${goldGradientId})`}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <line x1="32" y1="37.5" x2="32" y2="45" stroke="#92400E" strokeWidth="1.2" />

      {/* Torch of Enlightenment */}
      <line x1="32" y1="18" x2="32" y2="28" stroke={`url(#${goldGradientId})`} strokeWidth="2.2" strokeLinecap="round" />
      {/* Flame */}
      <path
        d="M32 12C33.5 14 34.5 15.5 34.5 17C34.5 18.38 33.38 19.5 32 19.5C30.62 19.5 29.5 18.38 29.5 17C29.5 15.5 30.5 14 32 12Z"
        fill="#F59E0B"
      />
      <circle cx="32" cy="16.5" r="1.5" fill="#FEF08A" />

      {/* Laurel Wreath Leaves (Left) */}
      <path
        d="M20 23C18 24.5 18 27.5 20 29M19 31C17 33 17 36 19 37.5M21 39.5C19.5 41.5 20 44 22 45"
        stroke={`url(#${goldGradientId})`}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Laurel Wreath Leaves (Right) */}
      <path
        d="M44 23C46 24.5 46 27.5 44 29M45 31C47 33 47 36 45 37.5M43 39.5C44.5 41.5 44 44 42 45"
        stroke={`url(#${goldGradientId})`}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Central Star of Academic Distinction */}
      <polygon
        points="32,27.5 33,30 35.5,30.3 33.6,31.9 34.2,34.3 32,33 29.8,34.3 30.4,31.9 28.5,30.3 31,30"
        fill={`url(#${starGradientId})`}
      />
    </svg>
  )
}
