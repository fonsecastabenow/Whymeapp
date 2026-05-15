import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "success" | "warning" | "info" | "danger"

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-zinc-800 text-zinc-300",
  success: "bg-green-900/40 text-green-400",
  warning: "bg-yellow-900/40 text-yellow-400",
  info: "bg-blue-900/40 text-blue-400",
  danger: "bg-red-900/40 text-red-400",
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
