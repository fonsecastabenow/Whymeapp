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
    <div className={cn("rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center", className)}>
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-xl opacity-50">
        {icon}
      </div>
      <p className="font-medium text-zinc-400">{title}</p>
      {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
