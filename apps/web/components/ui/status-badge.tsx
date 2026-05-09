import { cn } from "@/lib/utils"

// 5 estados CodeDesign + aliases de compatibilidad
type StatusKey =
  | "new" | "contacted" | "interview" | "advanced" | "declined"
  | "pending" | "accepted" | "rejected" | "bilateral"

const STATUS_MAP: Record<string, { label: string; pill: string; dot: string }> = {
  // estados CodeDesign (canónicos)
  new:        { label: "Novo",         pill: "status-new",       dot: "bg-[#3AB0FF]" },
  contacted:  { label: "Contactado",   pill: "status-contacted", dot: "bg-[#f5b454]" },
  interview:  { label: "Entrevista",   pill: "status-interview", dot: "bg-[#8B5CF6]" },
  advanced:   { label: "Avançado",     pill: "status-advanced",  dot: "bg-[#38d391]" },
  declined:   { label: "Recusado",     pill: "status-declined",  dot: "bg-[#f06b6b]" },
  // aliases backwards-compat
  pending:    { label: "Pendente",     pill: "status-new",       dot: "bg-[#3AB0FF]" },
  accepted:   { label: "Aceito",       pill: "status-advanced",  dot: "bg-[#38d391]" },
  rejected:   { label: "Recusado",     pill: "status-declined",  dot: "bg-[#f06b6b]" },
  bilateral:  { label: "Match!",       pill: "status-interview", dot: "bg-[#8B5CF6]" },
}

interface StatusBadgeProps {
  status: StatusKey | string
  className?: string
  /** Mostrar punto de color (default true) */
  showDot?: boolean
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] ?? {
    label: status,
    pill: "",
    dot: "bg-white/30",
  }

  return (
    <span className={cn("status-pill", cfg.pill, className)}>
      {showDot && <span className={cn("dot", cfg.dot)} />}
      {cfg.label}
    </span>
  )
}
