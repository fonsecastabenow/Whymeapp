"use client"

import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "gold" | "gold-outline"
  size?: "sm" | "md" | "lg" | "xl"
  loading?: boolean
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  gold:         "bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] text-white shadow-lg shadow-[#3AB0FF]/20 hover:shadow-[#3AB0FF]/40 hover:opacity-90",
  "gold-outline": "border border-[#3AB0FF]/40 text-[#3AB0FF] hover:border-[#3AB0FF] hover:bg-[#3AB0FF]/10",
  primary:      "bg-gradient-to-r from-[#3AB0FF] to-[#1a8fdb] text-white shadow-lg shadow-[#3AB0FF]/20 hover:opacity-90",
  secondary:    "bg-white/5 border border-white/10 text-foreground hover:bg-white/10",
  ghost:        "text-muted-foreground hover:text-foreground hover:bg-white/5",
  outline:      "border border-white/15 text-muted-foreground hover:border-white/30 hover:text-foreground",
  danger:       "bg-red-600/90 text-white hover:bg-red-600",
}

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm:  "px-3 py-1.5 text-xs",
  md:  "px-4 py-2.5 text-sm",
  lg:  "px-6 py-3 text-base",
  xl:  "px-10 py-3.5 text-lg",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3AB0FF]/60",
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
