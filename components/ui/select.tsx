import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { forwardRef, SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
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
          <select
            ref={ref}
            id={id}
            className={cn(
              "flex h-11 w-full rounded-xl border bg-background pl-4 pr-10 text-sm text-foreground transition-all duration-150 appearance-none cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary",
              error
                ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
                : "border-input hover:border-muted-foreground/30",
              className
            )}
            {...props}
          >
            {placeholder !== undefined && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 text-muted-foreground pointer-events-none flex items-center justify-center">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
