import { cn } from "@/lib/utils"

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: "sm" | "md" | "lg"
}

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
}

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div className={cn("rounded-2xl border border-zinc-800 bg-zinc-900", paddingMap[padding], className)}>
      {children}
    </div>
  )
}
