import { cn } from "@/lib/utils"

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
  as?: "h2" | "h3" | "h4" | "p"
}

export function SectionLabel({ children, className, as: Tag = "h3" }: SectionLabelProps) {
  return (
    <Tag className={cn("mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500", className)}>
      {children}
    </Tag>
  )
}
