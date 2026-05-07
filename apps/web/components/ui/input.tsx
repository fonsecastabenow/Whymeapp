import { cn } from "@/lib/utils"
import { InputHTMLAttributes, forwardRef } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "w-full rounded-xl border border-[#3AB0FF]/15 bg-[rgba(16,34,68,0.7)] px-4 py-2.5 text-sm text-foreground",
          "placeholder-muted-foreground/50 transition-colors",
          "focus:border-[#3AB0FF]/50 focus:outline-none focus:ring-1 focus:ring-[#3AB0FF]/30",
          error && "border-red-500/50 focus:border-red-500/70",
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
)
Input.displayName = "Input"
