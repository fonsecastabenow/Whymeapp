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

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn("text-lg font-semibold text-zinc-100", className)}>
      {children}
    </h3>
  )
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export function CardContent({ children, className }: CardContentProps) {
  return (
    <div className={cn("text-zinc-300", className)}>
      {children}
    </div>
  )
}
