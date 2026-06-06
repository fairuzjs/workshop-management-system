"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  QueueStatusBadge,
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
    customer: { phone: string; name?: string | null };
  };
  employee: { name: string; position: string } | null;
  services?: Array<{
    id: string;
    price: string;
    service: { name: string };
    employees?: Array<{ name: string }>;
  }>;
  historyItems?: Array<{
    id: string;
    title: string;
    employees?: Array<{ name: string }>;
  }>;
  parts?: Array<{
    id: string;
    employees?: Array<{ name: string }>;
  }>;
  transaction?: { id: string; status: string } | null;
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

export default function WorkOrdersPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"BOARD" | "TABLE">("BOARD");

  // Board mode data
  const [activeOrders, setActiveOrders] = useState<WorkOrderListItem[]>([]);
  const [completedOrders, setCompletedOrders] = useState<WorkOrderListItem[]>([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true);

  // Table mode data
  const [tableOrders, setTableOrders] = useState<WorkOrderListItem[]>([]);
  const [tablePagination, setTablePagination] = useState<PaginationInfo>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [loadingTable, setLoadingTable] = useState(true);

  // Shared
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch active queue (ANTRI + PROSES)
  const fetchActiveOrders = useCallback(async () => {
    setLoadingActive(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("serviceType", typeFilter);
      params.set("page", "1");
      params.set("limit", "100");
      // Only fetch ANTRI and PROSES
      const res1 = await fetch(`/api/work-orders?status=ANTRI&${params}`);
      const res2 = await fetch(`/api/work-orders?status=PROSES&${params}`);
      if (res1.ok && res2.ok) {
        const d1 = await res1.json();
        const d2 = await res2.json();
        // Combine and sort by createdAt ASC (FIFO)
        const combined = [...(d1.data || []), ...(d2.data || [])];
        combined.sort((a: WorkOrderListItem, b: WorkOrderListItem) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setActiveOrders(combined);
      }
    } catch (error) {
      console.error("Error fetching active orders:", error);
    } finally {
      setLoadingActive(false);
    }
  }, [search, typeFilter]);

  // Fetch completed today
  const fetchCompletedOrders = useCallback(async () => {
    setLoadingCompleted(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("serviceType", typeFilter);
      params.set("completedToday", "true");
      params.set("page", "1");
      params.set("limit", "100");

      const res = await fetch(`/api/work-orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCompletedOrders(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching completed orders:", error);
    } finally {
      setLoadingCompleted(false);
    }
  }, [search, typeFilter]);

  // Fetch table mode
  const fetchTableOrders = useCallback(async () => {
    setLoadingTable(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("serviceType", typeFilter);
      params.set("page", String(tablePagination.page));
      params.set("limit", "20");

      const res = await fetch(`/api/work-orders?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTableOrders(data.data || []);
        setTablePagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error("Error fetching table orders:", error);
    } finally {
      setLoadingTable(false);
    }
  }, [search, statusFilter, typeFilter, tablePagination.page]);

  useEffect(() => {
    if (viewMode === "BOARD") {
      fetchActiveOrders();
      fetchCompletedOrders();
    } else {
      fetchTableOrders();
    }
  }, [viewMode, fetchActiveOrders, fetchCompletedOrders, fetchTableOrders]);

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
        // Refresh both tables
        fetchActiveOrders();
        fetchCompletedOrders();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatTimeOnly = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "--:--";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Papan Antrean & Proses</h1>
          <p className="text-sm text-muted-foreground font-medium">Pantau antrean kendaraan secara realtime</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push("/work-orders/create")}
            className="h-11 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-5 transition-all shadow-sm flex items-center gap-1.5"
          >
            <Plus className="h-4.5 w-4.5" />
            Buat WO Baru
          </Button>
        </div>
      </div>

      {/* View Mode & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("BOARD")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-all",
              viewMode === "BOARD"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            Papan Antrean
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
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

      {viewMode === "BOARD" ? (
        /* ===== BOARD MODE: Two Tables ===== */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT TABLE: Antrean Aktif */}
          <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
            {/* Header with colored top border */}
            <div className="border-b-2 border-blue-500 bg-blue-500/5 px-5 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <h3 className="font-bold text-foreground text-sm sm:text-base">ANTREAN AKTIF</h3>
                </div>
                <span className="rounded-full bg-blue-500/10 text-blue-500 px-3 py-1 text-xs font-bold font-mono">
                  {activeOrders.length} Unit
                </span>
              </div>
            </div>

            {/* Table content */}
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              {loadingActive ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-center">
                  <p className="text-xs text-muted-foreground">Tidak ada kendaraan di antrean</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                    <tr className="border-b border-border">
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Token</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Merk Mobil</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plat Nomor</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Layanan</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Karyawan</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {activeOrders.map((wo) => (
                      <tr
                        key={wo.id}
                        className="transition-colors hover:bg-muted/30 cursor-pointer"
                        onClick={() => router.push(`/work-orders/${wo.id}`)}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{wo.trackingToken}</td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          {[wo.vehicle?.brand, wo.vehicle?.model].filter(Boolean).join(" ") || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                            {wo.vehicle?.plateNumber || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ServiceCategoryBadge category={wo.serviceType} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">
                          {[
                            ...(wo.services?.flatMap(s => s.employees || []) || []),
                            ...(wo.historyItems?.flatMap(h => h.employees || []) || []),
                            ...(wo.parts?.flatMap(p => p.employees || []) || [])
                          ].map(e => e.name).filter((v, i, a) => a.indexOf(v) === i).join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <QueueStatusBadge status={wo.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {wo.status === "ANTRI" && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleUpdateStatus(wo.id, "PROSES"); }}
                              disabled={updatingId !== null}
                              className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-[10px] rounded-lg px-3 py-1.5 h-auto"
                            >
                              {updatingId === wo.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <>Kerjakan <ArrowRight className="h-3 w-3 ml-0.5" /></>}
                            </Button>
                          )}
                          {wo.status === "PROSES" && (() => {
                            // Setiap item layanan (services + historyItems) harus punya minimal 1 karyawan
                            const allServiceItems = [
                              ...(wo.services || []),
                              ...(wo.historyItems || []),
                            ];
                            const hasMissingEmployee =
                              allServiceItems.length > 0 &&
                              allServiceItems.some(
                                (item) => !((item as { employees?: { name: string }[] }).employees || []).length
                              );
                            const canComplete = !hasMissingEmployee;

                            return (
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus(wo.id, "SELESAI"); }}
                                disabled={updatingId !== null || !canComplete}
                                title={!canComplete ? "Semua layanan jasa harus memiliki mekanik yang ditugaskan" : ""}
                                className={`font-bold text-[10px] rounded-lg px-3 py-1.5 h-auto ${
                                  !canComplete 
                                    ? "bg-muted text-muted-foreground cursor-not-allowed" 
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                }`}
                              >
                                {updatingId === wo.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <>Selesai <Check className="h-3 w-3 ml-0.5" /></>}
                              </Button>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* RIGHT TABLE: Selesai Dikerjakan */}
          <div className="rounded-2xl border border-border bg-card/40 overflow-hidden">
            {/* Header with colored top border */}
            <div className="border-b-2 border-amber-500 bg-amber-500/5 px-5 py-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-amber-500" />
                  <h3 className="font-bold text-foreground text-sm sm:text-base">SELESAI DIKERJAKAN</h3>
                  <span className="text-[10px] text-muted-foreground">(Hari Ini)</span>
                </div>
                <span className="rounded-full bg-amber-500/10 text-amber-500 px-3 py-1 text-xs font-bold font-mono">
                  {completedOrders.length} Unit
                </span>
              </div>
            </div>

            {/* Table content */}
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              {loadingCompleted ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : completedOrders.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-center">
                  <p className="text-xs text-muted-foreground">Belum ada kendaraan selesai hari ini</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                    <tr className="border-b border-border">
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Token</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Merk Mobil</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Plat Nomor</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Layanan</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Karyawan</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {completedOrders.map((wo) => (
                      <tr
                        key={wo.id}
                        className="transition-colors hover:bg-muted/30 cursor-pointer"
                        onClick={() => router.push(`/work-orders/${wo.id}`)}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-bold text-foreground">{wo.trackingToken}</td>
                        <td className="px-4 py-3 text-xs text-foreground">
                          {[wo.vehicle?.brand, wo.vehicle?.model].filter(Boolean).join(" ") || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                            {wo.vehicle?.plateNumber || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ServiceCategoryBadge category={wo.serviceType} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">
                          {[
                            ...(wo.services?.flatMap(s => s.employees || []) || []),
                            ...(wo.historyItems?.flatMap(h => h.employees || []) || []),
                            ...(wo.parts?.flatMap(p => p.employees || []) || [])
                          ].map(e => e.name).filter((v, i, a) => a.indexOf(v) === i).join(", ") || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <QueueStatusBadge status={wo.status} hasTransaction={!!wo.transaction} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ===== TABLE MODE: Full History ===== */
        <>
          {/* Status Tabs */}
          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setTablePagination((p) => ({ ...p, page: 1 }));
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

          {loadingTable ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : tableOrders.length === 0 ? (
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
                      {tableOrders.map((wo) => (
                        <tr key={wo.id} className="transition-colors hover:bg-muted/30">
                          <td className="whitespace-nowrap px-6 py-4 font-mono text-sm font-semibold text-foreground">{wo.trackingToken}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">{wo.vehicle?.customer?.phone ?? "-"}</td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">{wo.vehicle?.plateNumber ?? "-"}</span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4"><ServiceCategoryBadge category={wo.serviceType} /></td>
                          <td className="whitespace-nowrap px-6 py-4"><QueueStatusBadge status={wo.status} hasTransaction={!!wo.transaction} /></td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                            {[
                              ...(wo.services?.flatMap(s => s.employees || []) || []),
                              ...(wo.historyItems?.flatMap(h => h.employees || []) || []),
                              ...(wo.parts?.flatMap(p => p.employees || []) || [])
                            ].map(e => e.name).filter((v, i, a) => a.indexOf(v) === i).join(", ") || "-"}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{formatCurrency(wo.totalCost)}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">{formatDateTime(wo.createdAt)}</td>
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

                {tablePagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border px-6 py-3">
                    <p className="text-sm text-muted-foreground">
                      {(tablePagination.page - 1) * tablePagination.limit + 1}–
                      {Math.min(tablePagination.page * tablePagination.limit, tablePagination.total)} dari {tablePagination.total}
                    </p>
                    <div className="flex gap-1">
                      <button onClick={() => setTablePagination(p => ({ ...p, page: p.page - 1 }))} disabled={tablePagination.page <= 1} className="rounded-xl p-2 text-muted-foreground hover:bg-accent disabled:opacity-50">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button onClick={() => setTablePagination(p => ({ ...p, page: p.page + 1 }))} disabled={tablePagination.page >= tablePagination.totalPages} className="rounded-xl p-2 text-muted-foreground hover:bg-accent disabled:opacity-50">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Card List */}
              <div className="space-y-3 md:hidden">
                {tableOrders.map((wo) => (
                  <button
                    key={wo.id}
                    onClick={() => router.push(`/work-orders/${wo.id}`)}
                    className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-foreground">{wo.trackingToken}</span>
                          <QueueStatusBadge status={wo.status} hasTransaction={!!wo.transaction} />
                        </div>
                        <p className="text-sm text-foreground">{wo.vehicle?.customer?.phone ?? "-"}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(wo.totalCost)}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(wo.createdAt)}</span>
                    </div>
                  </button>
                ))}

                {tablePagination.totalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">{tablePagination.page}/{tablePagination.totalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setTablePagination(p => ({ ...p, page: p.page - 1 }))} disabled={tablePagination.page <= 1}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setTablePagination(p => ({ ...p, page: p.page + 1 }))} disabled={tablePagination.page >= tablePagination.totalPages}>
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
