"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
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
  ArrowRight,
} from "lucide-react";
import { ReceiptModal } from "@/components/receipt-modal";

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
      brand: string | null;
      model: string | null;
      customer: { name: string | null; phone: string };
    };
    employee?: { name: string };
    services: { price: string; service: { name: string } }[];
    parts: { qty: number; price: string; inventory: { name: string } }[];
    historyItems: { title: string; price: string }[];
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
  const [receiptModalTx, setReceiptModalTx] = useState<any | null>(null);

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
      <PageHeader
        title="Transaksi"
        description="Riwayat pembayaran work order"
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Cari token, plat, atau customer..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
            className="h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Semua Metode</option>
            <option value="CASH">Cash</option>
            <option value="TRANSFER">Transfer</option>
            <option value="QRIS">QRIS</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : transactions.length === 0 ? (
        <EmptyState icon={Receipt} title="Belum ada transaksi" description="Transaksi akan muncul setelah work order dibayar" />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Token</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Kontak</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Kendaraan</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Metode</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Jumlah</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tanggal</th>
                    <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => {
                    const MethodIcon = methodIcon[tx.paymentMethod] || Banknote;
                    const date = formatDateTime(tx.paidAt || tx.createdAt);
                    const totalSvc = (tx.workOrder?.services || []).reduce((s: number, sv: any) => s + Number(sv.price), 0)
                      + (tx.workOrder?.historyItems || []).reduce((s: number, h: any) => s + Number(h.price), 0);
                    const totalParts = (tx.workOrder?.parts || []).reduce((s: number, p: any) => s + Number(p.price) * p.qty, 0);

                    return (
                      <React.Fragment key={tx.id}>
                        <tr className="transition-colors hover:bg-muted/30">
                          <td className="whitespace-nowrap px-6 py-4 font-mono text-sm font-semibold text-foreground">{tx.workOrder?.trackingToken ?? "-"}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">{tx.workOrder?.vehicle?.customer?.phone ?? "-"}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">{tx.workOrder?.vehicle?.plateNumber ?? "-"}</span>
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
                          <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">{date}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <button
                              onClick={() => setReceiptModalTx(tx)}
                              className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                              Detail Struk
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
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
                  <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1} className="rounded-xl p-2 text-muted-foreground hover:bg-accent disabled:opacity-50">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages} className="rounded-xl p-2 text-muted-foreground hover:bg-accent disabled:opacity-50">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {transactions.map((tx) => {
              const MethodIcon = methodIcon[tx.paymentMethod] || Banknote;
              const date = formatDateTime(tx.paidAt || tx.createdAt);
              const totalSvc = (tx.workOrder?.services || []).reduce((s: number, sv: any) => s + Number(sv.price), 0)
                + (tx.workOrder?.historyItems || []).reduce((s: number, h: any) => s + Number(h.price), 0);
              const totalParts = (tx.workOrder?.parts || []).reduce((s: number, p: any) => s + Number(p.price) * p.qty, 0);

              return (
                <div key={tx.id} className="w-full rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md">
                  <button
                    onClick={() => setReceiptModalTx(tx)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-foreground">
                            {tx.workOrder?.trackingToken ?? "-"}
                          </span>
                          <Badge variant={tx.status === "LUNAS" ? "success" : "warning"}>
                            {tx.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tx.workOrder?.vehicle?.customer?.phone ?? "-"} · {tx.workOrder?.vehicle?.plateNumber ?? "-"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform text-muted-foreground" />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MethodIcon className="h-3.5 w-3.5" />
                        {tx.paymentMethod}
                      </div>
                      <span className="text-sm font-bold text-foreground">{formatCurrency(tx.amount)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{date}</p>
                  </button>
                </div>
              );
            })}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">{pagination.page}/{pagination.totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <ReceiptModal 
        isOpen={!!receiptModalTx}
        onClose={() => setReceiptModalTx(null)}
        transaction={receiptModalTx}
      />
    </div>
  );
}
