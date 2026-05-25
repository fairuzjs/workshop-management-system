"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Receipt,
  Search,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Banknote,
  QrCode,
  Filter,
} from "lucide-react";

interface TransactionItem {
  id: string;
  amount: string;
  paymentMethod: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  workOrder: {
    trackingToken: string;
    serviceType: string;
    vehicle: {
      plateNumber: string;
      customer: { name: string };
    };
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const methodIcon: Record<string, typeof Banknote> = {
  CASH: Banknote,
  TRANSFER: CreditCard,
  QRIS: QrCode,
};

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (methodFilter) params.set("method", methodFilter);
      params.set("page", String(pagination.page));

      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch transactions: ${res.statusText}`);
      }
      const data = await res.json();
      setTransactions(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [search, methodFilter, pagination.page, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transaksi</h1>
        <p className="mt-1 text-sm text-muted-foreground">Riwayat pembayaran work order</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Cari token, plat, atau customer..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Metode</option>
            <option value="CASH">Cash</option>
            <option value="TRANSFER">Transfer</option>
            <option value="QRIS">QRIS</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />)}</div>
      ) : transactions.length === 0 ? (
        <EmptyState icon={Receipt} title="Belum ada transaksi" description="Transaksi akan muncul setelah work order dibayar" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Token</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Kendaraan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Metode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => {
                  const MethodIcon = methodIcon[tx.paymentMethod] || Banknote;
                  return (
                    <tr key={tx.id} className="transition-colors hover:bg-muted/30">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm font-semibold text-foreground">{tx.workOrder.trackingToken}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">{tx.workOrder.vehicle.customer.name}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">{tx.workOrder.vehicle.plateNumber}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <MethodIcon className="h-4 w-4 text-muted-foreground" />
                          {tx.paymentMethod}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge variant={tx.status === "LUNAS" ? "success" : "warning"}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-foreground">{formatCurrency(tx.amount)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">{formatDateTime(tx.paidAt || tx.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-muted-foreground">
                {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1} className="rounded-lg p-2 text-muted-foreground hover:bg-accent disabled:opacity-50">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages} className="rounded-lg p-2 text-muted-foreground hover:bg-accent disabled:opacity-50">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
