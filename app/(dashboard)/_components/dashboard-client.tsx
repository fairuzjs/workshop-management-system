"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  ClipboardList,
  Activity,
  CheckCircle2,
  BadgeDollarSign,
  Car,
  Clock,
} from "lucide-react";

interface DashboardStats {
  totalWorkOrders: number;
  activeWorkOrders: number;
  completedToday: number;
  totalRevenue: number;
}

interface RecentWorkOrder {
  id: string;
  trackingToken: string;
  status: string;
  serviceType: string;
  customerName: string;
  plateNumber: string;
  employeeName: string;
  totalCost: number;
  createdAt: string;
}

interface DashboardClientProps {
  stats: DashboardStats;
  recentWorkOrders: RecentWorkOrder[];
  userRole: string;
}

const statusBadge: Record<string, { label: string; className: string }> = {
  ANTRI: {
    label: "Antri",
    className:
      "bg-warning/10 text-warning border-warning/20",
  },
  PROSES: {
    label: "Proses",
    className:
      "bg-primary/10 text-primary border-primary/20",
  },
  SELESAI: {
    label: "Selesai",
    className:
      "bg-success/10 text-success border-success/20",
  },
};

export function DashboardClient({
  stats,
  recentWorkOrders,
  userRole,
}: DashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ringkasan aktivitas bengkel hari ini
        </p>
      </div>

      {/* Stat Cards */}
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
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon={BadgeDollarSign}
            variant="primary"
          />
        )}
      </div>

      {/* Recent Work Orders */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Token
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Plat
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Karyawan
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
                      className="transition-colors hover:bg-muted/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {wo.trackingToken}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                        {wo.customerName}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium text-foreground">
                          {wo.plateNumber}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-xs font-medium text-muted-foreground">
                          {wo.serviceType === "SERVIS"
                            ? "🔧 Servis"
                            : "🚿 Cuci"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                        {wo.employeeName}
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
        )}
      </div>
    </div>
  );
}
