"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, getPeriodText } from "@/lib/utils";
import { generateFullFinancialPDF } from "@/lib/pdf";
import { ReportFilter } from "@/components/dashboard/report-filter";

interface MutationItem {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  category: string;
  description: string;
  amount: number;
}

interface Totals {
  totalMasuk: number;
  totalKeluar: number;
  saldoKas: number;
}

interface Props {
  data: MutationItem[];
  totals: Totals;
  salesData: any[];
  salesTotals: any;
  expenseData: any[];
  expenseTotals: any;
  period: "daily" | "monthly" | "yearly";
  date: string;
  month: string;
  year: string;
}

export function CashFlowClient({ data, totals, salesData, salesTotals, expenseData, expenseTotals, period, date, month, year }: Props) {
  const handleExportPDF = () => {
    generateFullFinancialPDF(
      salesData, salesTotals,
      expenseData, expenseTotals,
      data, totals,
      period, date, month, year
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
        <ReportFilter period={period} date={date} month={month} year={year} />

        <button 
          onClick={handleExportPDF}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md shadow-sm transition-colors whitespace-nowrap h-10"
        >
          📄 Cetak Laporan Lengkap (PDF)
        </button>
      </div>

      {/* The Printable Report Container */}
      <div 
        id="report-print-area"
        className="bg-card text-card-foreground p-6 sm:p-8 rounded-2xl border border-border shadow-sm min-w-full overflow-x-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Laporan Mutasi Kas</h1>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Sinar Surya Autocare</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Periode: {getPeriodText(period, date, month, year)}
          </p>
        </div>

        <div className="rounded-xl border border-border overflow-hidden mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Tanggal</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Kategori</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Keterangan</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider text-right">Masuk</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider text-right">Keluar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground italic">Data kosong untuk periode ini</td>
                </tr>
              ) : data.map((item, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 text-sm whitespace-nowrap">
                    {new Date(item.date).toLocaleString('id-ID', { 
                      day: '2-digit', month: 'short', year: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </td>
                  <td className="py-4 px-4 text-sm font-medium uppercase">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${item.type === 'IN' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">{item.description}</td>
                  <td className="py-4 px-4 text-sm text-right font-semibold text-success">
                    {item.type === 'IN' ? formatCurrency(item.amount) : "-"}
                  </td>
                  <td className="py-4 px-4 text-sm text-right font-semibold text-destructive">
                    {item.type === 'OUT' ? formatCurrency(item.amount) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Boxes */}
        <h3 className="text-lg font-bold mb-3 mt-8 border-b pb-2">Ringkasan Keuangan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border border-border p-5 rounded-xl flex flex-col justify-center bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Pemasukan</span>
            <span className="text-2xl font-bold text-success">{formatCurrency(totals.totalMasuk)}</span>
          </div>
          <div className="border border-border p-5 rounded-xl flex flex-col justify-center bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Pengeluaran</span>
            <span className="text-2xl font-bold text-destructive">{formatCurrency(totals.totalKeluar)}</span>
          </div>
          <div className="border border-border p-5 rounded-xl flex flex-col justify-center bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Saldo Akhir / Laba Rugi Sederhana</span>
            <span className={`text-2xl font-bold ${totals.saldoKas >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(totals.saldoKas)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
