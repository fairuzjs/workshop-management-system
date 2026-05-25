"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  WorkOrderStatusBadge,
  ServiceCategoryBadge,
} from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  ClipboardList,
  Plus,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

interface WorkOrderListItem {
  id: string;
  trackingToken: string;
  status: string;
  serviceType: string;
  totalCost: string;
  notes: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  vehicle: {
    plateNumber: string;
    brand: string | null;
    model: string | null;
    customer: { name: string; phone: string };
  };
  employee: { name: string; position: string } | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function WorkOrdersPage() {
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("serviceType", typeFilter);
    params.set("page", String(pagination.page));
    params.set("limit", "20");

    const res = await fetch(`/api/work-orders?${params.toString()}`);
    const data = await res.json();
    setWorkOrders(data.data);
    setPagination(data.pagination);
    setLoading(false);
  }, [search, statusFilter, typeFilter, pagination.page]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Work Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola work order servis dan pencucian
          </p>
        </div>
        <Button onClick={() => router.push("/work-orders/create")}>
          <Plus className="h-4 w-4" />
          Buat Work Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari token, plat nomor, atau customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Semua Status</option>
              <option value="ANTRI">Antri</option>
              <option value="PROSES">Proses</option>
              <option value="SELESAI">Selesai</option>
            </select>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Tipe</option>
            <option value="SERVIS">Servis</option>
            <option value="CUCI">Cuci</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : workOrders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum ada work order"
          description="Buat work order pertama untuk mulai"
          action={
            <Button onClick={() => router.push("/work-orders/create")}>
              <Plus className="h-4 w-4" /> Buat Work Order
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Token</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Kendaraan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Petugas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tanggal</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {wo.trackingToken}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      {wo.vehicle.customer.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                          {wo.vehicle.plateNumber}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {[wo.vehicle.brand, wo.vehicle.model].filter(Boolean).join(" ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <ServiceCategoryBadge category={wo.serviceType} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <WorkOrderStatusBadge status={wo.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                      {wo.employee?.name || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                      {formatCurrency(wo.totalCost)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">
                      {formatDateTime(wo.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        onClick={() => router.push(`/work-orders/${wo.id}`)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-sm text-muted-foreground">
                Menampilkan {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
                {pagination.total}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
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
