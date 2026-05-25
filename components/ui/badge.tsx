import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "destructive" | "outline";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  outline: "border-border text-foreground",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
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
