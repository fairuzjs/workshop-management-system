import { LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 backdrop-blur-sm px-6 py-16 text-center transition-all duration-300 hover:border-primary/30",
        className
      )}
    >
      {/* Icon Container with Gradient Backdrop */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-primary/10 to-primary/5 text-primary border border-primary/15 shadow-inner mb-6">
        <div className="absolute inset-0 rounded-2xl bg-primary/5 blur-sm" />
        <Icon className="relative h-7 w-7 text-primary/95 shrink-0" />
      </div>

      {/* Typography */}
      <h3 className="text-lg font-bold text-foreground tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}

      {/* Action CTA */}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
