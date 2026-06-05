"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface ReportFilterProps {
  period: "daily" | "monthly" | "yearly";
  date: string;
  month: string;
  year: string;
}

export function ReportFilter({ period, date, month, year }: ReportFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePeriodChange = (newPeriod: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", newPeriod);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const years = [2024, 2025, 2026, 2027, 2028];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="flex flex-col gap-1.5 w-full sm:w-auto">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mode Laporan</label>
        <select
          className="h-10 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
          value={period}
          onChange={(e) => handlePeriodChange(e.target.value)}
        >
          <option value="daily">Harian</option>
          <option value="monthly">Bulanan</option>
          <option value="yearly">Tahunan</option>
        </select>
      </div>

      {period === "daily" && (
        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal</label>
          <input
            type="date"
            className="h-10 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            value={date}
            onChange={handleDateChange}
          />
        </div>
      )}

      {period === "monthly" && (
        <>
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bulan</label>
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={month}
              onChange={handleMonthChange}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i} value={i.toString()}>
                  {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tahun</label>
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={year}
              onChange={handleYearChange}
            >
              {years.map(y => (
                <option key={y} value={y.toString()}>{y}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {period === "yearly" && (
        <div className="flex flex-col gap-1.5 w-full sm:w-auto">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tahun</label>
          <select
            className="h-10 px-3 rounded-md border border-input bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            value={year}
            onChange={handleYearChange}
          >
            {years.map(y => (
              <option key={y} value={y.toString()}>{y}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
