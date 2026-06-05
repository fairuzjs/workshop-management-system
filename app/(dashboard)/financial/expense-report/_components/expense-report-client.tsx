"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, getPeriodText } from "@/lib/utils";
import { generateExpenseReportPDF } from "@/lib/pdf";
import { ReportFilter } from "@/components/dashboard/report-filter";

interface ReportItem {
  kategori: string;
  jumlahTransaksi: number;
  totalPengeluaran: number;
}

interface Totals {
  totalPengeluaran: number;
  totalOperasional: number;
  totalPembelianStok: number;
  totalPrive: number;
}

interface Props {
  data: ReportItem[];
  totals: Totals;
  period: "daily" | "monthly" | "yearly";
  date: string;
  month: string;
  year: string;
}

export function ExpenseReportClient({ data, totals, period, date, month, year }: Props) {
  const handleExportPDF = () => {
    generateExpenseReportPDF(data, totals, period, date, month, year);
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions (Not exported to PDF) */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
        <ReportFilter period={period} date={date} month={month} year={year} />

        <button 
          onClick={handleExportPDF}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md shadow-sm transition-colors whitespace-nowrap h-10"
        >
          Cetak PDF
        </button>
      </div>

      {/* The Printable Report Container */}
      <div 
        id="report-print-area"
        className="bg-card text-card-foreground p-6 sm:p-8 rounded-2xl border border-border shadow-sm min-w-full overflow-x-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Laporan Total Pengeluaran</h1>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Sinar Surya Autocare</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Periode: {getPeriodText(period, date, month, year)}
          </p>
        </div>

        <div className="rounded-xl border border-border overflow-hidden mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">No</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Kategori Pengeluaran</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider text-center">Jumlah Transaksi</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider text-right">Total Pengeluaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground italic">Data kosong untuk periode ini</td>
                </tr>
              ) : data.map((item, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 text-sm">{i + 1}</td>
                  <td className="py-4 px-4 text-sm font-medium uppercase">{item.kategori}</td>
                  <td className="py-4 px-4 text-sm text-center">{item.jumlahTransaksi}</td>
                  <td className="py-4 px-4 text-sm text-right font-semibold text-destructive">{formatCurrency(item.totalPengeluaran)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Boxes Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="border border-border p-5 rounded-xl flex flex-col justify-center bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Biaya Operasional</span>
            <span className="text-2xl font-bold text-warning">{formatCurrency(totals.totalOperasional)}</span>
          </div>
          <div className="border border-border p-5 rounded-xl flex flex-col justify-center bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Pembelian Stok</span>
            <span className="text-xl font-bold text-destructive">{formatCurrency(totals.totalPembelianStok)}</span>
          </div>
          <div className="border border-border p-5 rounded-xl flex flex-col justify-center bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Prive / Pengambilan</span>
            <span className="text-xl font-bold text-destructive">{formatCurrency(totals.totalPrive)}</span>
          </div>
          <div className="border border-border p-5 rounded-xl flex flex-col justify-center bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Seluruh Pengeluaran</span>
            <span className="text-2xl font-bold text-destructive">{formatCurrency(totals.totalPengeluaran)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
