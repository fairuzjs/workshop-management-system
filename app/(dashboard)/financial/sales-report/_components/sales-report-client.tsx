"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { generateSalesReportPDF } from "@/lib/pdf";
import { getPeriodText } from "@/lib/utils";

import { ReportFilter } from "@/components/dashboard/report-filter";

interface ReportItem {
  kode: string;
  keterangan: string;
  jumlah: number;
  totalPenjualan: number;
  hpp: number;
  laba: number;
}

interface Totals {
  totalPenjualan: number;
  totalHpp: number;
  totalLaba: number;
}

interface Props {
  data: ReportItem[];
  totals: Totals;
  period: "daily" | "monthly" | "yearly";
  date: string;
  month: string;
  year: string;
}

export function SalesReportClient({ data, totals, period, date, month, year }: Props) {
  const handleExportPDF = () => {
    generateSalesReportPDF(data, totals, period, date, month, year);
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
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Laporan Total Penjualan</h1>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Sinar Surya Autocare</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Periode: {getPeriodText(period, date, month, year)}
          </p>
        </div>

        <div className="rounded-xl border border-border overflow-hidden mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Kode</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Keterangan</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Jumlah</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Total Penjualan</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">HPP</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider">Laba</th>
                <th className="py-4 px-4 font-semibold text-muted-foreground text-sm uppercase tracking-wider text-right">Total Laba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground italic">Data kosong untuk periode ini</td>
                </tr>
              ) : data.map((item, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4 text-sm">{item.kode}</td>
                  <td className="py-4 px-4 text-sm font-medium uppercase">{item.keterangan}</td>
                  <td className="py-4 px-4 text-sm">{item.jumlah}</td>
                  <td className="py-4 px-4 text-sm">{formatCurrency(item.totalPenjualan)}</td>
                  <td className="py-4 px-4 text-sm">{formatCurrency(item.hpp)}</td>
                  <td className="py-4 px-4 text-sm">{formatCurrency(item.laba)}</td>
                  <td className="py-4 px-4 text-sm text-right font-semibold">{formatCurrency(item.laba)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Boxes Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border border-border p-5 rounded-xl flex flex-col justify-center bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Penjualan</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(totals.totalPenjualan)}</span>
          </div>
          <div className="border border-border p-5 rounded-xl flex flex-col justify-center bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total HPP</span>
            <span className="text-2xl font-bold text-destructive">{formatCurrency(totals.totalHpp)}</span>
          </div>
          <div className="border border-border p-5 rounded-xl flex flex-col justify-center bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Laba</span>
            <span className="text-2xl font-bold text-success">{formatCurrency(totals.totalLaba)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
