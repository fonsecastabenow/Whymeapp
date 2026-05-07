import { cn } from "@/lib/utils"

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: "sm" | "md" | "lg"
  glass?: boolean
}

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
}

export function Card({ children, className, padding = "md", glass = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        glass
          ? "glass-card"
          : "border border-[#3AB0FF]/10 bg-[rgba(16,34,68,0.8)] shadow-lg shadow-black/20",
        paddingMap[padding],
        className,
      )}
    >
      {children}
    </div>
  )
}
