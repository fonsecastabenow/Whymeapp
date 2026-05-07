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
  blue:   "bg-[#3AB0FF]/15 text-[#3AB0FF] ring-1 ring-[#3AB0FF]/20",
  violet: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20",
  zinc:   "bg-white/8 text-white/70 ring-1 ring-white/10",
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
