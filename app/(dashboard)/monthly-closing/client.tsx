"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function MonthlyClosingClient() {
  const currentDate = new Date();
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchClosingData = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/monthly-closing?month=${month}&year=${year}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengambil data");
      
      setIsClosed(json.isClosed);
      setData(json.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosingData();
  }, [month, year]);

  const handleClosing = async () => {
    if (!confirm("Apakah Anda yakin ingin menutup buku untuk bulan ini? Data tidak dapat diubah setelah ditutup.")) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/monthly-closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year, summary: data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menutup buku");

      setSuccessMsg("Tutup buku berhasil!");
      fetchClosingData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRp = (num: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tutup Buku Bulanan</h2>
          <p className="text-muted-foreground">Snapshot laporan keuangan dan operasional bulanan.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Array.from({ length: 12 }).map((_, i) => {
              const date = new Date(2000, i, 1);
              return (
                <option key={i + 1} value={i + 1}>
                  {format(date, "MMMM", { locale: id })}
                </option>
              );
            })}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {Array.from({ length: 5 }).map((_, i) => {
              const y = currentDate.getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="rounded-md bg-success/15 p-4 text-sm text-success">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground animate-pulse">Memuat data...</p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Ringkasan {format(new Date(year, month - 1, 1), "MMMM yyyy", { locale: id })}
            </h3>
            {isClosed ? (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 py-1">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Closed / Sudah Ditutup
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 py-1">
                Open / Belum Ditutup
              </Badge>
            )}
          </div>

          {!isClosed && data.warnings?.length > 0 && (
            <div className="rounded-md border border-warning/50 bg-warning/10 p-4">
              <div className="flex items-center gap-2 text-warning font-semibold mb-2">
                <AlertCircle className="h-5 w-5" />
                Peringatan
              </div>
              <ul className="list-disc pl-5 text-sm text-warning/90 space-y-1">
                {data.warnings.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h4 className="text-sm font-medium text-muted-foreground">Total Pendapatan</h4>
              <p className="mt-2 text-2xl font-bold">{formatRp(data.totalRevenue)}</p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h4 className="text-sm font-medium text-muted-foreground">Total Pengeluaran</h4>
              <p className="mt-2 text-2xl font-bold text-destructive">{formatRp(data.totalExpense)}</p>
            </div>
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h4 className="text-sm font-medium text-muted-foreground">Total Payroll</h4>
              <p className="mt-2 text-2xl font-bold text-warning">{formatRp(data.totalSalary || data.totalPayroll)}</p>
            </div>
            <div className="rounded-xl border bg-primary/10 p-6 shadow-sm border-primary/20">
              <h4 className="text-sm font-medium text-primary">Profit Bersih</h4>
              <p className={`mt-2 text-2xl font-bold ${data.profit < 0 ? "text-destructive" : "text-primary"}`}>
                {formatRp(data.profit)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card shadow-sm p-6">
            <h4 className="font-semibold mb-4">Metrik Operasional</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5 text-center">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Transaksi Lunas</p>
                <p className="text-xl font-semibold">{isClosed ? "-" : data.metrics?.totalTransaction}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total Work Order</p>
                <p className="text-xl font-semibold">{isClosed ? "-" : data.metrics?.totalWorkOrder}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">WO Selesai</p>
                <p className="text-xl font-semibold">{isClosed ? "-" : data.metrics?.completedWorkOrder}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">WO Servis</p>
                <p className="text-xl font-semibold">{isClosed ? "-" : data.metrics?.serviceWorkOrder}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">WO Cuci</p>
                <p className="text-xl font-semibold">{isClosed ? "-" : data.metrics?.carWashWorkOrder}</p>
              </div>
            </div>
            {isClosed && (
              <p className="text-xs text-center text-muted-foreground mt-4">
                Metrik operasional tidak disimpan dalam snapshot historis MVP.
              </p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleClosing}
              disabled={isClosed || submitting}
              className={`inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors ${
                isClosed || submitting ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary hover:bg-primary/90"
              }`}
            >
              {submitting ? "Memproses..." : isClosed ? "Sudah Ditutup" : "Tutup Buku"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
