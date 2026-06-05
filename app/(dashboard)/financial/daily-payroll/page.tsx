"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { Users, Car, BadgeDollarSign, Clock } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface PayrollHistory {
  workOrderId: string;
  trackingToken: string;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  time: string;
  commissionEarned: number;
}

interface DailyPayrollEmployee {
  id: string;
  name: string;
  position: string;
  totalCommission: number;
  totalCarsWashed: number;
  history: PayrollHistory[];
}

export default function DailyPayrollPage() {
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DailyPayrollEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedEmployee, setSelectedEmployee] = useState<DailyPayrollEmployee | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financial/daily-payroll?date=${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalAllCars = data.reduce((acc, emp) => acc + emp.totalCarsWashed, 0);
  const totalAllCommission = data.reduce((acc, emp) => acc + emp.totalCommission, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penggajian Harian (Pencuci Mobil)"
        description="Laporan komisi dan jumlah mobil yang dicuci per hari."
        actions={
          <input 
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Pencuci Mobil Aktif" value={data.length} icon={Users} variant="primary" />
        <StatCard title="Total Mobil Dicuci" value={totalAllCars} icon={Car} variant="warning" />
        <StatCard title="Total Komisi Hari Ini" value={formatCurrency(totalAllCommission)} icon={BadgeDollarSign} variant="success" />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada data" description="Tidak ada karyawan pencuci mobil yang tercatat" />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Karyawan</th>
                    <th className="px-6 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Mobil Dicuci</th>
                    <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Komisi</th>
                    <th className="px-6 py-3.5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.map((emp) => (
                    <tr key={emp.id} className="transition-colors hover:bg-muted/30">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-semibold text-foreground">{emp.name}</div>
                        <div className="text-xs text-muted-foreground">{emp.position}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                          {emp.totalCarsWashed} Mobil
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-success">
                        {formatCurrency(emp.totalCommission)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedEmployee(emp)}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Lihat Histori
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {data.map((emp) => (
              <div key={emp.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm" onClick={() => setSelectedEmployee(emp)}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.totalCarsWashed} Mobil Dicuci</p>
                  </div>
                  <span className="text-sm font-bold text-success">{formatCurrency(emp.totalCommission)}</span>
                </div>
                <div className="mt-3 text-right">
                  <span className="text-xs font-medium text-primary underline">Lihat Histori</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* History Modal */}
      <Modal 
        isOpen={!!selectedEmployee} 
        onClose={() => setSelectedEmployee(null)}
        title={`Histori Cuci: ${selectedEmployee?.name || ''}`}
        size="md"
      >
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
          {selectedEmployee?.history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Belum ada mobil yang dicuci hari ini.
            </div>
          ) : (
            selectedEmployee?.history.map((h, i) => (
              <div key={i} className="rounded-xl border border-border p-3 flex justify-between items-center bg-muted/30">
                <div>
                  <div className="font-bold text-foreground text-sm tracking-wide">
                    {h.plateNumber}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(h.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    <span className="mx-1">•</span>
                    {h.brand} {h.model}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-muted-foreground mb-0.5">Komisi</div>
                  <div className="text-sm font-bold text-success">+{formatCurrency(h.commissionEarned)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

    </div>
  );
}
