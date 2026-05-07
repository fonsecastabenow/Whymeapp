import { cn } from "@/lib/utils"

type MatchStatus = "pending" | "accepted" | "rejected" | "bilateral"

const STATUS_CONFIG: Record<MatchStatus, { label: string; className: string }> = {
  pending:   { label: "Pendente", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  accepted:  { label: "Aceito",   className: "text-green-400 bg-green-400/10 border-green-400/20" },
  rejected:  { label: "Recusado", className: "text-red-400 bg-red-400/10 border-red-400/20" },
  bilateral: { label: "Match!",   className: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
}

interface StatusBadgeProps {
  status: MatchStatus | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as MatchStatus] ?? {
    label: status,
    className: "text-muted-foreground bg-white/5 border-white/10",
  }

  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", config.className, className)}>
      {config.label}
    </span>
  )
}
