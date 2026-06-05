import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "destructive" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/80",
  primary: "bg-primary/10 text-primary border-primary/20 dark:bg-primary/15 dark:text-primary-foreground/90",
  success: "bg-success/10 text-success border-success/20 dark:bg-success/15 dark:text-emerald-400",
  warning: "bg-warning/10 text-warning border-warning/20 dark:bg-warning/15 dark:text-amber-400",
  destructive: "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15 dark:text-red-400",
  outline: "border-border text-foreground bg-background/50",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Pre-built status badges for work orders
export function WorkOrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    ANTRI: { label: "Antri", variant: "warning" },
    PROSES: { label: "Proses", variant: "primary" },
    SELESAI: { label: "Selesai", variant: "success" },
  };

  const { label, variant } = config[status] || {
    label: status,
    variant: "default" as BadgeVariant,
  };

  return <Badge variant={variant}>{label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    PENDING: { label: "Pending", variant: "warning" },
    LUNAS: { label: "Lunas", variant: "success" },
  };

  const { label, variant } = config[status] || {
    label: status,
    variant: "default" as BadgeVariant,
  };

  return <Badge variant={variant}>{label}</Badge>;
}

export function ServiceCategoryBadge({ category }: { category: string }) {
  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    SERVIS: { label: "Servis", variant: "primary" },
    CUCI: { label: "Cuci", variant: "success" },
  };

  const { label, variant } = config[category] || {
    label: category,
    variant: "default" as BadgeVariant,
  };

  return <Badge variant={variant}>{label}</Badge>;
}

// Queue display badge — derives visual status from WO status + transaction
export function QueueStatusBadge({ status, hasTransaction }: { status: string; hasTransaction?: boolean }) {
  if (status === "SELESAI" && hasTransaction) {
    return <Badge variant="success">Lunas</Badge>;
  }
  if (status === "SELESAI") {
    return <Badge variant="warning" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Siap Bayar</Badge>;
  }

  const config: Record<string, { label: string; variant: BadgeVariant }> = {
    ANTRI: { label: "Antri", variant: "warning" },
    PROSES: { label: "Proses", variant: "primary" },
  };

  const { label, variant } = config[status] || {
    label: status,
    variant: "default" as BadgeVariant,
  };

  return <Badge variant={variant}>{label}</Badge>;
}

