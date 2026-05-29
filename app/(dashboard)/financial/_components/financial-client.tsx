"use client";

import { useRouter } from "next/navigation";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { formatCurrency } from "@/lib/utils";
import {
  BadgeDollarSign,
  Wallet,
  Users,
  ClipboardList,
  CheckCircle2,
  Receipt,
  Car,
  Wrench,
  CreditCard,
  Banknote,
  QrCode
} from "lucide-react";

interface FinancialClientProps {
  role: string;
  period: string;
  dateStr: string;
  stats: {
    revenue: number;
    expense: number;
    payroll: number;
    profit: number;
    totalTransactions: number;
    totalWorkOrders: number;
    completedWorkOrders: number;
  };
  breakdowns: {
    revenueByMethod: { method: string; amount: number }[];
    woByType: { type: string; count: number }[];
    expenseByCategory: { category: string; amount: number }[];
  };
}

export function FinancialClient({ role, period, dateStr, stats, breakdowns }: FinancialClientProps) {
  const router = useRouter();
  const isAdmin = role === "ADMIN";

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "CASH": return <Banknote className="h-4 w-4 text-success" />;
      case "TRANSFER": return <CreditCard className="h-4 w-4 text-primary" />;
      case "QRIS": return <QrCode className="h-4 w-4 text-warning" />;
      default: return <Wallet className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "SERVIS": return <Wrench className="h-4 w-4 text-primary" />;
      case "CUCI": return <Car className="h-4 w-4 text-primary" />;
      default: return <ClipboardList className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Keuangan & Operasional"
        description="Ringkasan performa bengkel"
        actions={
          <div className="flex items-center gap-2">
            {isAdmin || period === "daily" ? (
              <input 
                type="date"
                value={dateStr}
                onChange={(e) => router.push(`/financial?period=daily&date=${e.target.value}`)}
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : null}
            {!isAdmin && (
              <select
                value={period}
                onChange={(e) => router.push(`/financial?period=${e.target.value}`)}
                className="h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="daily">Harian</option>
                <option value="month">Bulanan</option>
                <option value="all">Semua Waktu</option>
              </select>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Pemasukan" value={formatCurrency(stats.revenue)} icon={BadgeDollarSign} variant="success" />
        <StatCard title="Total Pengeluaran" value={formatCurrency(stats.expense)} icon={Wallet} variant="warning" />
        {!isAdmin && (
          <>
            <StatCard title="Total Payroll" value={formatCurrency(stats.payroll)} icon={Users} variant="primary" />
            <StatCard title="Estimasi Profit" value={formatCurrency(stats.profit)} icon={BadgeDollarSign} variant={stats.profit >= 0 ? "primary" : "destructive"} />
          </>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Transaksi (Lunas)" value={stats.totalTransactions} icon={Receipt} variant="success" />
        <StatCard title="Total Work Orders" value={stats.totalWorkOrders} icon={ClipboardList} variant="primary" />
        <StatCard title="Work Orders Selesai" value={stats.completedWorkOrders} icon={CheckCircle2} variant="success" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Revenue by Method */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Revenue per Metode</h2>
          </div>
          <div className="p-5 space-y-3">
            {breakdowns.revenueByMethod.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Data kosong</p>
            ) : breakdowns.revenueByMethod.map(r => (
              <div key={r.method} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  {getPaymentIcon(r.method)}
                  <span className="text-sm font-medium text-foreground">{r.method}</span>
                </div>
                <span className="text-sm font-bold text-success">{formatCurrency(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WO by Type */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Work Order per Tipe</h2>
          </div>
          <div className="p-5 space-y-3">
            {breakdowns.woByType.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Data kosong</p>
            ) : breakdowns.woByType.map(w => (
              <div key={w.type} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  {getServiceIcon(w.type)}
                  <span className="text-sm font-medium capitalize text-foreground">{w.type.toLowerCase()}</span>
                </div>
                <span className="text-sm font-bold text-foreground">{w.count} WO</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expense by Category */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Expense per Kategori</h2>
          </div>
          <div className="p-5 space-y-3">
            {breakdowns.expenseByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Data kosong</p>
            ) : breakdowns.expenseByCategory.map(e => (
              <div key={e.category} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                <span className="text-sm font-medium text-foreground">{e.category}</span>
                <span className="text-sm font-bold text-warning">{formatCurrency(e.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
