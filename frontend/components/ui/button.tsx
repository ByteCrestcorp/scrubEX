import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'ghost';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', asChild = false, ...props }, ref) => {
    const variantClass = {
      primary: 'cta-primary hover:bg-primary-400 hover:shadow-[0_4px_16px_rgba(59,89,152,0.3)] hover:-translate-y-px active:translate-y-0 active:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none',
      accent: 'cta-accent hover:bg-accent-400 hover:shadow-[0_4px_16px_rgba(44,165,184,0.3)] hover:-translate-y-px active:translate-y-0 active:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed',
      outline: 'cta-outline hover:bg-primary-500/10 hover:text-primary-300 hover:border-primary-400/50 active:bg-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed',
      ghost: 'bg-transparent text-text-body hover:text-text-heading hover:bg-surface-mid/60 px-4 py-2 rounded-md transition-all duration-200 cursor-pointer',
    }[variant]

    return (
      <button
        className={cn(variantClass, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
