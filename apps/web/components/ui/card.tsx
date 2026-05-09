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
      className={cn("rounded-[18px]", paddingMap[padding], className)}
      style={
        glass
          ? {
              background: "rgba(16,34,68,0.70)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(58,176,255,0.12)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.30)",
            }
          : {
              background: "rgba(16,34,68,0.80)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(58,176,255,0.12)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.28)",
            }
      }
    >
      {children}
    </div>
  )
}
