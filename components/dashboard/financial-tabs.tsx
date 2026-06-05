import Link from "next/link";
import { cn } from "@/lib/utils";

interface FinancialTabsProps {
  activeTab: "dashboard" | "sales-report" | "payroll-report" | "expense-report" | "cash-flow";
  userRole?: string;
}

export function FinancialTabs({ activeTab, userRole }: FinancialTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border pb-4">
      <Link
        href="/financial"
        className={cn(
          "px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors",
          activeTab === "dashboard"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        Dashboard Keuangan
      </Link>
      <Link
        href="/financial/sales-report"
        className={cn(
          "px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors",
          activeTab === "sales-report"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        Laporan Total Penjualan
      </Link>
      <Link
        href="/financial/expense-report"
        className={cn(
          "px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors",
          activeTab === "expense-report"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        Laporan Pengeluaran
      </Link>
      <Link
        href="/financial/cash-flow"
        className={cn(
          "px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors",
          activeTab === "cash-flow"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        Mutasi Kas
      </Link>
      {userRole === "SUPERADMIN" && (
        <Link
          href="/financial/payroll-report"
          className={cn(
            "px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors",
            activeTab === "payroll-report"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Laporan Penggajian
        </Link>
      )}
    </div>
  );
}
