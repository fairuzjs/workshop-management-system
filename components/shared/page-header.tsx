import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backUrl?: string;
  badge?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  backUrl,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2", className)}>
      <div className="space-y-1">
        {/* Back navigation if URL is provided */}
        {backUrl && (
          <Link
            href={backUrl}
            className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors gap-1 mb-1"
          >
            <ChevronLeft className="h-3 w-3" />
            Kembali
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {badge && <div className="flex items-center">{badge}</div>}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
