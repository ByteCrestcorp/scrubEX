import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full rounded-[2px] border border-[var(--vr-border)] bg-[var(--vr-bg)] px-[10px] py-2 text-[12px] text-[var(--vr-text)] outline-none",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
