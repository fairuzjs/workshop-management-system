"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
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
  ArrowRight,
  Clock,
  Activity,
  Check,
  Loader2,
  Wrench,
  Package,
  Car,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    customer: { phone: string };
  };
  employee: { name: string; position: string } | null;
  services?: Array<{
    id: string;
    price: string;
    service: {
      name: string;
      price: string;
    };
  }>;
  parts?: Array<{
    id: string;
    price: string;
    qty: number;
    inventory: {
      name: string;
    };
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusTabs = [
  { label: "Semua", value: "" },
  { label: "Antri", value: "ANTRI" },
  { label: "Proses", value: "PROSES" },
  { label: "Selesai", value: "SELESAI" },
];

const formatTimeOnly = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch (e) {
    return "--:--";
  }
};

export default function WorkOrdersPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"BOARD" | "TABLE">("BOARD");
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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      
      if (viewMode === "TABLE") {
        if (statusFilter) params.set("status", statusFilter);
        params.set("page", String(pagination.page));
        params.set("limit", "20");
      } else {
        // In Board mode, fetch 100 latest orders so we can display active queues properly
        params.set("page", "1");
        params.set("limit", "100");
      }
      
      if (typeFilter) params.set("serviceType", typeFilter);

      const res = await fetch(`/api/work-orders?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch work orders: ${res.statusText}`);
      }
      const data = await res.json();
      setWorkOrders(data.data || []);
      
      if (viewMode === "TABLE") {
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error("Error fetching work orders:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, pagination.page, viewMode, router]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/work-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal memperbarui status");
      } else {
        await fetchWorkOrders();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter lists for board columns
  const waitingOrders = workOrders.filter((wo) => wo.status === "ANTRI");
  const inProgressOrders = workOrders.filter((wo) => wo.status === "PROSES");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pantau Work Order</h1>
          <p className="text-sm text-muted-foreground font-medium">Board antrean dan progres servis</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-all hover:shadow-sm">
            <Bell className="h-5 w-5" />
          </button>
          <Button
            onClick={() => router.push("/work-orders/create")}
            className="h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-5 transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="h-4.5 w-4.5" />
            Buat WO Baru
          </Button>
        </div>
      </div>

      {/* View Mode & Filter Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setViewMode("BOARD");
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
              viewMode === "BOARD"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            Board Antrean
          </button>
          <button
            onClick={() => {
              setViewMode("TABLE");
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
              viewMode === "TABLE"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            Semua Riwayat (Tabel)
          </button>
        </div>

        {/* Global Search & Type Filters */}
        <div className="flex flex-col gap-3 w-full sm:w-auto sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari token, plat, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-xl border border-input bg-card px-4 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Tipe</option>
            <option value="SERVIS">Servis</option>
            <option value="CUCI">Cuci</option>
          </select>
        </div>
      </div>

      {loading && workOrders.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : viewMode === "BOARD" ? (
        /* Board Queue Layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sedang Menunggu Column */}
          <div className="flex flex-col space-y-4 rounded-2xl border border-border bg-card/40 p-4">
            <div className="flex items-center justify-between border-b border-border pb-3 px-1">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-foreground text-sm sm:text-base">Sedang Menunggu</h3>
              </div>
              <span className="rounded-full bg-amber-500/10 text-amber-500 px-3 py-1 text-xs font-bold font-mono">
                {waitingOrders.length} Unit
              </span>
            </div>

            <div className="flex-1 space-y-4 min-h-[400px] max-h-[800px] overflow-y-auto pr-1">
              {waitingOrders.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-border text-center">
                  <p className="text-xs text-muted-foreground">Tidak ada kendaraan di antrean</p>
                </div>
              ) : (
                waitingOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="group relative rounded-2xl border border-border/80 bg-card p-5 transition-all hover:border-amber-500/30 hover:shadow-md cursor-pointer"
                    onClick={() => router.push(`/work-orders/${wo.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                          <Car className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-base sm:text-lg tracking-wide uppercase">
                            {wo.vehicle?.plateNumber || "-"}
                          </h4>
                          <p className="text-xs text-muted-foreground font-medium">
                            {[wo.vehicle?.brand, wo.vehicle?.model].filter(Boolean).join(" ")}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-[10px] font-bold text-muted-foreground uppercase">
                        {wo.trackingToken}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-muted/40 p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Wrench className="h-3.5 w-3.5" /> Jasa
                        </span>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {wo.services && wo.services.length > 0
                            ? wo.services.map((s) => s.service.name).join(", ")
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" /> Parts
                        </span>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {wo.parts && wo.parts.length > 0
                            ? wo.parts.map((p) => p.inventory.name).join(", ")
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Masuk: {formatTimeOnly(wo.createdAt)}
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(wo.id, "PROSES");
                        }}
                        disabled={updatingId !== null}
                        className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1 transition-all"
                      >
                        {updatingId === wo.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            Kerjakan <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sedang Diproses Column */}
          <div className="flex flex-col space-y-4 rounded-2xl border border-border bg-card/40 p-4">
            <div className="flex items-center justify-between border-b border-border pb-3 px-1">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <h3 className="font-bold text-foreground text-sm sm:text-base">Sedang Diproses</h3>
              </div>
              <span className="rounded-full bg-blue-500/10 text-blue-500 px-3 py-1 text-xs font-bold font-mono">
                {inProgressOrders.length} Unit
              </span>
            </div>

            <div className="flex-1 space-y-4 min-h-[400px] max-h-[800px] overflow-y-auto pr-1">
              {inProgressOrders.length === 0 ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-border text-center">
                  <p className="text-xs text-muted-foreground">Tidak ada kendaraan yang sedang diproses</p>
                </div>
              ) : (
                inProgressOrders.map((wo) => (
                  <div
                    key={wo.id}
                    className="group relative rounded-2xl border border-border/80 bg-card p-5 transition-all hover:border-blue-500/30 hover:shadow-md cursor-pointer"
                    onClick={() => router.push(`/work-orders/${wo.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                          <Car className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground text-base sm:text-lg tracking-wide uppercase">
                            {wo.vehicle?.plateNumber || "-"}
                          </h4>
                          <p className="text-xs text-muted-foreground font-medium">
                            {[wo.vehicle?.brand, wo.vehicle?.model].filter(Boolean).join(" ")}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-[10px] font-bold text-muted-foreground uppercase">
                        {wo.trackingToken}
                      </span>
                    </div>

                    <div className="mt-4 rounded-xl bg-muted/40 p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Wrench className="h-3.5 w-3.5" /> Jasa
                        </span>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {wo.services && wo.services.length > 0
                            ? wo.services.map((s) => s.service.name).join(", ")
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5" /> Parts
                        </span>
                        <p className="mt-1 text-xs font-semibold text-foreground">
                          {wo.parts && wo.parts.length > 0
                            ? wo.parts.map((p) => p.inventory.name).join(", ")
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Masuk: {formatTimeOnly(wo.createdAt)}
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(wo.id, "SELESAI");
                        }}
                        disabled={updatingId !== null}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-1 transition-all"
                      >
                        {updatingId === wo.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            Selesai <Check className="h-3.5 w-3.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Classic Audit/History Table Layout */
        <>
          {/* Status Tabs */}
          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={cn(
                  "flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {workOrders.length === 0 ? (
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
                        <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tipe</th>
                        <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Petugas</th>
                        <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                        <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tanggal</th>
                        <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Aksi</th>
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
                            {wo.vehicle?.customer?.phone ?? "-"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <div>
                              <span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                                {wo.vehicle?.plateNumber ?? "-"}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {[wo.vehicle?.brand, wo.vehicle?.model].filter(Boolean).join(" ")}
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
                              className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
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
                        className="rounded-xl p-2 text-muted-foreground hover:bg-accent disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                        disabled={pagination.page >= pagination.totalPages}
                        className="rounded-xl p-2 text-muted-foreground hover:bg-accent disabled:opacity-50"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Card List */}
              <div className="space-y-3 md:hidden">
                {workOrders.map((wo) => (
                  <button
                    key={wo.id}
                    onClick={() => router.push(`/work-orders/${wo.id}`)}
                    className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-foreground">
                            {wo.trackingToken}
                          </span>
                          <WorkOrderStatusBadge status={wo.status} />
                        </div>
                        <p className="text-sm text-foreground">
                          {wo.vehicle?.customer?.phone ?? "-"}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-lg bg-muted px-2 py-0.5 font-mono font-medium text-foreground">
                        {wo.vehicle?.plateNumber ?? "-"}
                      </span>
                      <span>·</span>
                      <ServiceCategoryBadge category={wo.serviceType} />
                      <span>·</span>
                      <span>{wo.employee?.name || "Belum ditugaskan"}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">
                        {formatCurrency(wo.totalCost)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(wo.createdAt)}
                      </span>
                    </div>
                  </button>
                ))}

                {/* Mobile Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                      {pagination.page}/{pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
