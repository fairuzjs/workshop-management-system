import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function getPeriodParams(searchParams: any) {
  const now = new Date();
  const period = searchParams.period || "monthly";
  const date = searchParams.date || now.toISOString().split('T')[0];
  const month = searchParams.month ? searchParams.month : now.getMonth().toString();
  const year = searchParams.year ? searchParams.year : now.getFullYear().toString();
  
  return { period, date, month, year };
}

export function getDateFilter(period: string, dateStr: string, monthStr: string, yearStr: string) {
  let dateFilter = {};
  if (period === "daily") {
    const targetDate = new Date(dateStr);
    const start = new Date(targetDate.setHours(0, 0, 0, 0));
    const end = new Date(targetDate.setHours(23, 59, 59, 999));
    dateFilter = { gte: start, lte: end };
  } else if (period === "monthly") {
    if (monthStr !== "all" && yearStr !== "all") {
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }
  } else if (period === "yearly") {
    if (yearStr !== "all") {
      const year = parseInt(yearStr);
      const start = new Date(year, 0, 1);
      const end = new Date(year, 12, 0, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    }
  }
  return dateFilter;
}

export function getPeriodText(period: string, dateStr: string, monthStr: string, yearStr: string) {
  if (period === "daily") {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } else if (period === "monthly") {
    if (monthStr === "all" && yearStr === "all") return "Semua Waktu";
    const monthName = monthStr !== "all" ? new Date(0, parseInt(monthStr)).toLocaleString('id-ID', { month: 'long' }) : 'Semua Bulan';
    return `${monthName} ${yearStr === "all" ? "" : yearStr}`.trim();
  } else if (period === "yearly") {
    if (yearStr === "all") return "Semua Waktu";
    return `Tahun ${yearStr}`;
  }
  return "Semua Waktu";
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function generateTrackingToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 8; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function formatNumberInput(value: string | number): string {
  if (!value && value !== 0) return "";
  const digits = String(value).replace(/\D/g, "");
  return digits ? parseInt(digits, 10).toLocaleString("id-ID") : "";
}

export function parseNumberInput(value: string | number): number {
  if (!value) return 0;
  const digits = String(value).replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}
