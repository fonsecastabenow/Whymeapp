"use client"

import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:   "bg-blue-600 text-white hover:opacity-90",
  secondary: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
  ghost:     "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
  outline:   "border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100",
  danger:    "bg-red-600 text-white hover:opacity-90",
}

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {children}
        </span>
      ) : children}
    </button>
  )
)
Button.displayName = "Button"
