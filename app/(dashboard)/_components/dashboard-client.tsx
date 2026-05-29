"use client";

import { useRouter } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  ClipboardList,
  Activity,
  CheckCircle2,
  BadgeDollarSign,
  Car,
  Clock,
  Users,
  Plus,
  Package,
  Wallet,
  ArrowRight,
  Wrench,
} from "lucide-react";

interface DashboardStats {
  totalWorkOrders: number;
  activeWorkOrders: number;
  completedToday: number;
  totalRevenue: number;
  totalExpense: number;
  totalPayroll: number;
  estimatedProfit: number;
}

interface RecentWorkOrder {
  id: string;
  trackingToken: string;
  status: string;
  serviceType: string;
  customerPhone: string;
  plateNumber: string;
  employeeName: string;
  totalCost: number;
  createdAt: string;
}

interface DashboardClientProps {
  stats: DashboardStats;
  recentWorkOrders: RecentWorkOrder[];
  userRole: string;
  period: string;
}

const statusBadge: Record<string, { label: string; variant: "warning" | "primary" | "success" }> = {
  ANTRI: { label: "Antri", variant: "warning" },
  PROSES: { label: "Proses", variant: "primary" },
  SELESAI: { label: "Selesai", variant: "success" },
};

export function DashboardClient({
  stats,
  recentWorkOrders,
  userRole,
  period,
}: DashboardClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg sm:p-8">
        <div className="relative z-10">
          <p className="text-sm font-medium text-primary-foreground/80">
            Selamat datang kembali
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Dashboard</h1>
          <p className="mt-2 max-w-lg text-sm text-primary-foreground/70">
            Ringkasan aktivitas bengkel Anda. Monitor antrian, progress, dan revenue secara real-time.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 -right-5 h-32 w-32 rounded-full bg-white/5" />

        {/* Period selector for superadmin */}
        {userRole === "SUPERADMIN" && (
          <div className="absolute right-6 top-6">
            <select
              value={period}
              onChange={(e) => router.push(`/?period=${e.target.value}`)}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm focus:outline-none"
            >
              <option value="today" className="text-foreground">Hari Ini</option>
              <option value="month" className="text-foreground">Bulan Ini</option>
              <option value="all" className="text-foreground">Semua Waktu</option>
            </select>
          </div>
        )}
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Work Orders"
          value={stats.totalWorkOrders}
          icon={ClipboardList}
          variant="primary"
        />
        <StatCard
          title="Work Order Aktif"
          value={stats.activeWorkOrders}
          subtitle="Antri & dalam proses"
          icon={Activity}
          variant="warning"
        />
        <StatCard
          title="Selesai Hari Ini"
          value={stats.completedToday}
          icon={CheckCircle2}
          variant="success"
        />
        {userRole === "SUPERADMIN" && (
          <StatCard
            title="Total Pemasukan"
            value={formatCurrency(stats.totalRevenue)}
            icon={BadgeDollarSign}
            variant="success"
          />
        )}
      </div>

      {/* Financial Stats - Superadmin Only */}
      {userRole === "SUPERADMIN" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Pengeluaran"
            value={formatCurrency(stats.totalExpense)}
            icon={Activity}
            variant="warning"
          />
          <StatCard
            title="Total Payroll"
            value={formatCurrency(stats.totalPayroll)}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Estimasi Profit"
            value={formatCurrency(stats.estimatedProfit)}
            icon={BadgeDollarSign}
            variant={stats.estimatedProfit >= 0 ? "primary" : "destructive"}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: Recent Work Orders */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Work Order Terbaru
                </h2>
                <p className="text-xs text-muted-foreground">
                  5 work order terakhir
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/work-orders")}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Lihat semua
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {recentWorkOrders.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Car}
                title="Belum ada work order"
                description="Work order akan muncul di sini setelah dibuat"
              />
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Token
                      </th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Kontak
                      </th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Plat
                      </th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Status
                      </th>
                      <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentWorkOrders.map((wo) => {
                      const badge = statusBadge[wo.status];
                      return (
                        <tr
                          key={wo.id}
                          className="cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => router.push(`/work-orders/${wo.id}`)}
                        >
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {wo.trackingToken}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                            {wo.customerPhone}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs font-medium text-foreground">
                              {wo.plateNumber}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <Badge variant={badge?.variant || "default"}>
                              {badge?.label || wo.status}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">
                            {formatDateTime(wo.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="divide-y divide-border md:hidden">
                {recentWorkOrders.map((wo) => {
                  const badge = statusBadge[wo.status];
                  return (
                    <button
                      key={wo.id}
                      onClick={() => router.push(`/work-orders/${wo.id}`)}
                      className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {wo.trackingToken}
                          </span>
                          <Badge variant={badge?.variant || "default"}>
                            {badge?.label || wo.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {wo.customerPhone} · {wo.plateNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(wo.createdAt)}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right: Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            Aksi Cepat
          </h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {[
              {
                label: "Buat Work Order",
                icon: ClipboardList,
                href: "/work-orders/create",
                color: "text-primary bg-primary/10",
              },
              {
                label: "Tambah Kendaraan",
                icon: Car,
                href: "/vehicles",
                color: "text-success bg-success/10",
              },
              {
                label: "Stock In",
                icon: Package,
                href: "/inventory",
                color: "text-warning bg-warning/10",
              },
              {
                label: "Catat Pengeluaran",
                icon: Wallet,
                href: "/expenses",
                color: "text-destructive bg-destructive/10",
              },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => router.push(action.href)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:shadow-md"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.color}`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
