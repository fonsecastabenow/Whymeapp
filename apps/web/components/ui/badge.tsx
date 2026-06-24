import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info"

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-zinc-800 text-zinc-300 border-zinc-700",
  success: "bg-emerald-950 text-emerald-400 border-emerald-800",
  warning: "bg-amber-950 text-amber-400 border-amber-800",
  danger: "bg-red-950 text-red-400 border-red-800",
  info: "bg-blue-950 text-blue-400 border-blue-800",
}

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
