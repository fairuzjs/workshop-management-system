"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { PageSection } from "@/components/shared/page-section";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable, Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  ClipboardList,
  Plus,
  Eye,
  ArrowRight,
  Clock,
  Activity,
  Check,
  Loader2,
  Car,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
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
  { label: "Semua Status", value: "" },
  { label: "Antrean", value: "ANTRI" },
  { label: "Diproses", value: "PROSES" },
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

  // Shared Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "primary" | "warning" | "destructive";
    confirmText: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "primary",
    confirmText: "Yakin",
    onConfirm: () => {},
  });

  // Fetch active queue (ANTRI + PROSES)
  const fetchActiveOrders = useCallback(async () => {
    setLoadingActive(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("serviceType", typeFilter);
      params.set("page", "1");
      params.set("limit", "100");
      const res1 = await fetch(`/api/work-orders?status=ANTRI&${params}`);
      const res2 = await fetch(`/api/work-orders?status=PROSES&${params}`);
      if (res1.ok && res2.ok) {
        const d1 = await res1.json();
        const d2 = await res2.json();
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

  const executeStatusUpdate = async (id: string, newStatus: string) => {
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
        fetchActiveOrders();
        fetchCompletedOrders();
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    const actionLabel = newStatus === "PROSES" ? "Kerjakan" : "Selesaikan";
    const descriptionText = newStatus === "PROSES"
      ? "Apakah Anda yakin ingin memulai proses pengerjaan untuk kendaraan ini?"
      : "Apakah Anda yakin semua pengerjaan selesai dan siap untuk pembayaran?";

    setConfirmDialog({
      isOpen: true,
      title: `${actionLabel} Kendaraan`,
      description: descriptionText,
      variant: newStatus === "PROSES" ? "primary" : "warning",
      confirmText: actionLabel,
      onConfirm: () => executeStatusUpdate(id, newStatus),
    });
  };

  // Helper counting for counters
  const antriCount = activeOrders.filter((o) => o.status === "ANTRI").length;
  const prosesCount = activeOrders.filter((o) => o.status === "PROSES").length;
  const selesaiCount = completedOrders.length;

  // Table Columns definition for DataTable component
  const columns: Column<WorkOrderListItem>[] = [
    {
      header: "Token",
      render: (wo) => (
        <span className="font-mono text-sm font-bold text-primary">{wo.trackingToken}</span>
      ),
    },
    {
      header: "Kontak",
      render: (wo) => <span className="text-sm text-foreground">{wo.vehicle?.customer?.phone ?? "-"}</span>,
    },
    {
      header: "Kendaraan",
      render: (wo) => (
        <span className="rounded-lg bg-muted px-2 py-1 font-mono text-xs font-semibold text-foreground">
          {wo.vehicle?.plateNumber ?? "-"}
        </span>
      ),
    },
    {
      header: "Tipe",
      render: (wo) => <StatusBadge type="category" status={wo.serviceType} showDot={false} />,
    },
    {
      header: "Status",
      render: (wo) => (
        <StatusBadge
          type="queue"
          status={wo.status === "SELESAI" && !wo.transaction ? "SIAP_BAYAR" : wo.status}
        />
      ),
    },
    {
      header: "Petugas",
      render: (wo) => {
        const names = [
          ...(wo.services?.flatMap((s) => s.employees || []) || []),
          ...(wo.historyItems?.flatMap((h) => h.employees || []) || []),
          ...(wo.parts?.flatMap((p) => p.employees || []) || []),
        ]
          .map((e) => e.name)
          .filter((v, i, a) => a.indexOf(v) === i);
        return (
          <span className="text-xs text-muted-foreground truncate block max-w-[150px]">
            {names.join(", ") || "-"}
          </span>
        );
      },
    },
    {
      header: "Total",
      render: (wo) => <span className="text-sm font-bold text-foreground">{formatCurrency(wo.totalCost)}</span>,
    },
    {
      header: "Tanggal",
      render: (wo) => <span className="text-xs text-muted-foreground">{formatDateTime(wo.createdAt)}</span>,
    },
    {
      header: "Aksi",
      align: "right",
      render: (wo) => (
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 flex justify-center items-center rounded-lg"
          onClick={() => router.push(`/work-orders/${wo.id}`)}
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
        </Button>
      ),
    },
  ];

  return (
    <AppPage>
      {/* Header */}
      <PageHeader
        title="Papan Antrean & Proses"
        description="Pantau antrean pengerjaan bengkel dan kendaraan secara realtime"
        actions={
          <Button
            onClick={() => router.push("/work-orders/create")}
            className="shadow-md"
          >
            <Plus className="h-4.5 w-4.5" />
            Buat WO Baru
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Antrean */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">ANTREAN UNIT</span>
            <p className="text-3xl font-black text-amber-500">{antriCount}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Sedang Dikerjakan */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SEDANG DIPROSES</span>
            <p className="text-3xl font-black text-primary">{prosesCount}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
        </div>

        {/* Selesai Hari Ini */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SELESAI HARI INI</span>
            <p className="text-3xl font-black text-emerald-600">{selesaiCount}</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter & View Mode Controls */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Tabs */}
          <div className="flex rounded-xl border border-border bg-card p-1.5 shadow-sm shrink-0">
            <button
              onClick={() => setViewMode("BOARD")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
                viewMode === "BOARD"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Papan Antrean
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
                viewMode === "TABLE"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              Semua Riwayat (Tabel)
            </button>
          </div>

          {/* Filters Bar */}
          <FilterBar
            searchVal={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari token, plat nomor, atau kontak..."
            className="md:w-auto flex-1 md:flex-initial"
            filters={
              <div className="w-40 shrink-0">
                <Select
                  options={[
                    { value: "", label: "Semua Layanan" },
                    { value: "SERVIS", label: "Servis Bengkel" },
                    { value: "CUCI", label: "Cuci Mobil" },
                  ]}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                />
              </div>
            }
          />
        </div>
      </div>

      {/* Board Mode view */}
      {viewMode === "BOARD" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Antrean Aktif */}
          <PageSection
            title="ANTREAN AKTIF"
            description="Daftar kendaraan yang sedang menunggu antrean atau dalam pengerjaan"
            noPadding
            actions={
              <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold font-mono">
                {activeOrders.length} Unit aktif
              </span>
            }
            className="border-t-4 border-t-primary"
          >
            <div className="overflow-x-auto">
              {loadingActive ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
                  <Car className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">Tidak ada kendaraan di antrean aktif</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Token</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Kendaraan</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Plat</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Layanan</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {activeOrders.map((wo) => (
                      <tr
                        key={wo.id}
                        className="transition-colors hover:bg-slate-500/5 cursor-pointer"
                        onClick={() => router.push(`/work-orders/${wo.id}`)}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-foreground">{wo.trackingToken}</td>
                        <td className="px-5 py-3.5 text-xs text-foreground font-medium">
                          {[wo.vehicle?.brand, wo.vehicle?.model].filter(Boolean).join(" ") || "-"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                            {wo.vehicle?.plateNumber || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-[120px] truncate">
                          {[
                            ...(wo.services?.map((s) => s.service.name) || []),
                            ...(wo.historyItems?.map((h) => h.title) || []),
                          ].join(", ") || "-"}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge type="queue" status={wo.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          {wo.status === "ANTRI" && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(wo.id, "PROSES")}
                              disabled={updatingId !== null}
                              className="rounded-lg text-xs font-bold px-3 py-1.5 h-auto bg-amber-500 hover:bg-amber-600 text-amber-950"
                            >
                              {updatingId === wo.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <span className="flex items-center gap-1">
                                  Kerjakan <ArrowRight className="h-3.5 w-3.5" />
                                </span>
                              )}
                            </Button>
                          )}
                          {wo.status === "PROSES" && (() => {
                            const allItems = [...(wo.services || []), ...(wo.historyItems || [])];
                            const missingEmployee = allItems.length > 0 && allItems.some(
                              (item) => !(item.employees || []).length
                            );
                            const canComplete = !missingEmployee;

                            return (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(wo.id, "SELESAI")}
                                disabled={updatingId !== null || !canComplete}
                                title={!canComplete ? "Semua layanan jasa harus memiliki mekanik yang ditugaskan" : ""}
                                className={cn(
                                  "rounded-lg text-xs font-bold px-3 py-1.5 h-auto",
                                  !canComplete
                                    ? "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                )}
                              >
                                {updatingId === wo.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <span className="flex items-center gap-1">
                                    Selesai <Check className="h-3.5 w-3.5" />
                                  </span>
                                )}
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
          </PageSection>

          {/* Selesai Dikerjakan */}
          <PageSection
            title="SELESAI HARI INI"
            description="Kendaraan yang sudah selesai dikerjakan hari ini dan menunggu proses pembayaran"
            noPadding
            actions={
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-3 py-1 text-xs font-bold font-mono">
                {completedOrders.length} Unit selesai
              </span>
            }
            className="border-t-4 border-t-emerald-500"
          >
            <div className="overflow-x-auto">
              {loadingCompleted ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              ) : completedOrders.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
                  <Check className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">Belum ada kendaraan selesai hari ini</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Token</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Kendaraan</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Plat</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Layanan</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {completedOrders.map((wo) => (
                      <tr
                        key={wo.id}
                        className="transition-colors hover:bg-slate-500/5 cursor-pointer"
                        onClick={() => router.push(`/work-orders/${wo.id}`)}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-foreground">{wo.trackingToken}</td>
                        <td className="px-5 py-3.5 text-xs text-foreground font-medium">
                          {[wo.vehicle?.brand, wo.vehicle?.model].filter(Boolean).join(" ") || "-"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                            {wo.vehicle?.plateNumber || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-[140px] truncate">
                          {[
                            ...(wo.services?.map((s) => s.service.name) || []),
                            ...(wo.historyItems?.map((h) => h.title) || []),
                          ].join(", ") || "-"}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge
                            type="queue"
                            status={wo.status === "SELESAI" && !wo.transaction ? "SIAP_BAYAR" : wo.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </PageSection>
        </div>
      ) : (
        /* Table Mode (All History) */
        <>
          {/* Sub tabs status */}
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1.5 max-w-max mb-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setTablePagination((p) => ({ ...p, page: 1 }));
                }}
                className={cn(
                  "rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  statusFilter === tab.value
                    ? "bg-card text-foreground shadow-sm border border-border/50"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <DataTable
            columns={columns}
            data={tableOrders}
            isLoading={loadingTable}
            emptyTitle="Belum ada data work order"
            emptyDescription="Silakan buat work order pertama untuk memonitor kendaraan bengkel."
            emptyIcon={ClipboardList}
            emptyAction={
              <Button onClick={() => router.push("/work-orders/create")}>
                <Plus className="h-4 w-4" /> Buat Work Order
              </Button>
            }
            mobileRender={(wo) => (
              <button
                key={wo.id}
                onClick={() => router.push(`/work-orders/${wo.id}`)}
                className="w-full rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md flex flex-col gap-3"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-foreground">{wo.trackingToken}</span>
                      <StatusBadge
                        type="queue"
                        status={wo.status === "SELESAI" && !wo.transaction ? "SIAP_BAYAR" : wo.status}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Kontak: {wo.vehicle?.customer?.phone ?? "-"}</p>
                    <p className="text-xs font-semibold text-foreground">
                      Plat: <span className="font-mono">{wo.vehicle?.plateNumber}</span> — {wo.vehicle?.brand}
                    </p>
                  </div>
                  <StatusBadge type="category" status={wo.serviceType} showDot={false} />
                </div>
                <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-1">
                  <span className="text-sm font-extrabold text-primary">{formatCurrency(wo.totalCost)}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDateTime(wo.createdAt)}</span>
                </div>
              </button>
            )}
            pagination={
              tablePagination.totalPages > 1 ? (
                <div className="flex items-center justify-between px-2">
                  <p className="text-xs text-muted-foreground">
                    Menampilkan {(tablePagination.page - 1) * tablePagination.limit + 1}–
                    {Math.min(tablePagination.page * tablePagination.limit, tablePagination.total)} dari {tablePagination.total} WO
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTablePagination((p) => ({ ...p, page: p.page - 1 }))}
                      disabled={tablePagination.page <= 1}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-bold text-foreground mx-1">
                      {tablePagination.page} / {tablePagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTablePagination((p) => ({ ...p, page: p.page + 1 }))}
                      disabled={tablePagination.page >= tablePagination.totalPages}
                      className="h-8 px-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : undefined
            }
          />
        </>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmText={confirmDialog.confirmText}
      />
    </AppPage>
  );
}
