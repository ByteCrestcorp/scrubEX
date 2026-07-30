import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'glass' | 'panel' | 'light' }
>(({ className, variant = 'panel', ...props }, ref) => {
  const variantClass = {
    glass: 'glass-card',
    panel: 'card-panel',
    light: 'card-light',
  }[variant]

  return (
    <div
      ref={ref}
      className={cn(variantClass, className)}
      {...props}
    />
  )
})
Card.displayName = "Card"

export { Card }
