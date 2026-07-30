import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  const variantClass = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    neutral: 'badge-neutral',
  }[variant]

  return (
    <div className={cn(variantClass, className)} {...props} />
  )
}

export { Badge }
