"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Users, BadgeDollarSign, Wallet, Activity } from "lucide-react";
import { FinancialTabs } from "@/components/dashboard/financial-tabs";

interface PayrollSummary {
  totalSalary: number;
  totalCommission: number;
  totalPayroll: number;
  totalEmployees: number;
}

interface PayrollEmployee {
  id: string;
  name: string;
  position: string;
  salary: number;
  commission: number;
  total: number;
}

export default function PayrollPageClient({ userRole }: { userRole: string }) {
  const [data, setData] = useState<PayrollEmployee[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
      const json = await res.json();
      setData(json.data || []);
      setSummary(json.summary || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <FinancialTabs activeTab="payroll-report" userRole={userRole} />

      <PageHeader
        title="Penggajian Karyawan"
        description="Laporan gaji dan komisi bulanan"
        actions={
          <div className="flex items-center gap-2">
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
            <select 
              value={year} 
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        }
      />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Karyawan Aktif" value={summary.totalEmployees} icon={Users} variant="primary" />
          <StatCard title="Total Gaji Pokok" value={formatCurrency(summary.totalSalary)} icon={Wallet} variant="warning" />
          <StatCard title="Total Komisi" value={formatCurrency(summary.totalCommission)} icon={Activity} variant="success" />
          <StatCard title="Total Penggajian" value={formatCurrency(summary.totalPayroll)} icon={BadgeDollarSign} variant="primary" />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada data" description="Tidak ada karyawan aktif untuk bulan ini" />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Karyawan</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Posisi</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Gaji Pokok</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Komisi Earning</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Diterima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((emp) => (
                    <tr key={emp.id} className="transition-colors hover:bg-muted/30">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-foreground">{emp.name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">{emp.position}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{formatCurrency(emp.salary)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-success">{formatCurrency(emp.commission)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-primary">{formatCurrency(emp.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {data.map((emp) => (
              <div key={emp.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.position}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatCurrency(emp.total)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Gaji: {formatCurrency(emp.salary)}</span>
                  <span className="text-success">Komisi: {formatCurrency(emp.commission)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
