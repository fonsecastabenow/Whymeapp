import { cn } from "@/lib/utils"

interface AvatarProps {
  name: string
  size?: "sm" | "md" | "lg"
  variant?: "blue" | "violet" | "zinc"
  className?: string
}

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-xl",
}

const variantMap = {
  blue:   "bg-blue-600/20 text-blue-300",
  violet: "bg-violet-600/20 text-violet-300",
  zinc:   "bg-zinc-700 text-zinc-300",
}

export function Avatar({ name, size = "md", variant = "blue", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        sizeMap[size],
        variantMap[variant],
        className,
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
