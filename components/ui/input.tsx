import { cn } from "@/lib/utils";
import { forwardRef, InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-foreground block"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-4 text-muted-foreground pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "flex h-11 w-full rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary",
              leftIcon ? "pl-11" : "px-4",
              rightIcon ? "pr-11" : "px-4",
              error
                ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
                : "border-input hover:border-muted-foreground/30",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 text-muted-foreground pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
