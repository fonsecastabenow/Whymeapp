import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon = "◎", title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-2xl border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.6)] p-8 text-center", className)}>
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#3AB0FF]/8 text-xl ring-1 ring-[#3AB0FF]/15">
        {icon}
      </div>
      <p className="font-medium text-muted-foreground">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground/60">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
