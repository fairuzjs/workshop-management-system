"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { PageSection } from "@/components/shared/page-section";
import { FormDrawer } from "@/components/ui/form-drawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Play,
  Check,
  CheckCircle2,
  UserCheck,
  Copy,
  Clock,
  Car,
  Wrench,
  User,
  Receipt,
  Loader2,
  Package,
  Plus,
  Trash2,
  Users,
  AlertTriangle,
  Calendar,
} from "lucide-react";

interface EmployeeRef {
  id: string;
  name: string;
  position: string;
}

interface WorkOrderDetail {
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
    color: string | null;
    customer: { phone: string; email: string | null };
  };
  user: { name: string };
  services: { id: string; price: string; service: { name: string }; employees: EmployeeRef[] }[];
  parts: { id: string; qty: number; price: string; inventory: { name: string }; employees: EmployeeRef[] }[];
  transaction: {
    id: string;
    amount: string;
    paymentMethod: string;
    status: string;
    paidAt: string | null;
  } | null;
  historyItems: { id: string; title: string; description: string | null; price: string; createdAt: string; employees: EmployeeRef[] }[];
}

interface Employee {
  id: string;
  name: string;
  position: string;
}

interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: string;
}

const statusSteps = [
  { key: "ANTRI", label: "Antri", step: 1 },
  { key: "PROSES", label: "Proses", step: 2 },
  { key: "SELESAI", label: "Selesai", step: 3 },
];

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Employees list
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Assign employee drawer
  const [showAssign, setShowAssign] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{
    type: "service" | "part" | "history";
    id: string;
    name: string;
    currentEmployeeIds: string[];
  } | null>(null);
  const [assignSelectedIds, setAssignSelectedIds] = useState<string[]>([]);

  // Add part drawer
  const [showAddPart, setShowAddPart] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [partForm, setPartForm] = useState({ inventoryId: "", qty: "1" });

  // Add history item drawer
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [historyForm, setHistoryForm] = useState({ title: "", description: "", price: "" });

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "destructive" | "warning" | "primary";
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

  const fetchWO = useCallback(async () => {
    try {
      const res = await fetch(`/api/work-orders/${id}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch work order detail: ${res.statusText}`);
      }
      const data = await res.json();
      setWo(data);
    } catch (error) {
      console.error("Error fetching work order detail:", error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch(`/api/employees?availableFor=${id}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    fetchWO();
    fetchEmployees();
  }, [fetchWO, fetchEmployees]);

  const executeStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    await fetch(`/api/work-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchWO();
    setUpdating(false);
  };

  const updateStatus = (newStatus: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Ubah Status Antrean",
      description: `Apakah Anda yakin ingin mengubah status pengerjaan ini menjadi ${newStatus}?`,
      variant: newStatus === "SELESAI" ? "primary" : "warning",
      confirmText: "Ubah Status",
      onConfirm: () => executeStatusUpdate(newStatus),
    });
  };

  // Open assign modal for a specific item
  const openAssignModal = (
    type: "service" | "part" | "history",
    targetId: string,
    name: string,
    currentEmployees: EmployeeRef[]
  ) => {
    setAssignTarget({
      type,
      id: targetId,
      name,
      currentEmployeeIds: currentEmployees.map((e) => e.id),
    });
    setAssignSelectedIds(currentEmployees.map((e) => e.id));
    setShowAssign(true);
  };

  // Save employee assignment
  const saveAssignment = async () => {
    if (!assignTarget) return;
    setUpdating(true);
    await fetch(`/api/work-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeAssignments: [
          {
            targetType: assignTarget.type,
            targetId: assignTarget.id,
            employeeIds: assignSelectedIds,
          },
        ],
      }),
    });
    setShowAssign(false);
    setAssignTarget(null);
    await fetchWO();
    setUpdating(false);
  };

  // Toggle employee in multi-select
  const toggleEmployee = (empId: string) => {
    setAssignSelectedIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // Single-select employee (for CUCI)
  const selectSingleEmployee = (empId: string) => {
    setAssignSelectedIds(empId ? [empId] : []);
  };

  const copyToken = () => {
    if (wo) {
      navigator.clipboard.writeText(wo.trackingToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openAddPart = async () => {
    const res = await fetch("/api/inventory");
    const data = await res.json();
    setInventoryItems(data.filter((i: InventoryItem) => i.qty > 0));
    setPartForm({ inventoryId: "", qty: "1" });
    setShowAddPart(true);
  };

  const executeAddPart = async () => {
    setUpdating(true);
    const res = await fetch(`/api/work-orders/${id}/parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inventoryId: partForm.inventoryId,
        qty: parseInt(partForm.qty),
      }),
    });
    if (res.ok) {
      setShowAddPart(false);
      await fetchWO();
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setUpdating(false);
  };

  const executeRemovePart = async (partId: string) => {
    setUpdating(true);
    await fetch(`/api/work-orders/${id}/parts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partId }),
    });
    await fetchWO();
    setUpdating(false);
  };

  const handleRemovePart = (partId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Sparepart",
      description: "Apakah Anda yakin ingin menghapus sparepart ini? Stok pada inventaris akan dikembalikan.",
      variant: "destructive",
      confirmText: "Hapus",
      onConfirm: () => executeRemovePart(partId),
    });
  };

  const executeRemoveService = async (serviceId: string) => {
    setUpdating(true);
    const res = await fetch(`/api/work-orders/${id}/services`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "Gagal menghapus layanan");
    }
    await fetchWO();
    setUpdating(false);
  };

  const handleRemoveService = (serviceId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Layanan Jasa",
      description: "Apakah Anda yakin ingin menghapus layanan ini dari daftar pengerjaan?",
      variant: "destructive",
      confirmText: "Hapus",
      onConfirm: () => executeRemoveService(serviceId),
    });
  };

  const executeAddHistory = async () => {
    setUpdating(true);
    const res = await fetch(`/api/work-orders/${id}/history-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: historyForm.title,
        description: historyForm.description,
        price: parseInt(historyForm.price.replace(/\D/g, "")) || 0,
      }),
    });
    if (res.ok) {
      setShowAddHistory(false);
      await fetchWO();
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setUpdating(false);
  };

  const executeRemoveHistory = async (itemId: string) => {
    setUpdating(true);
    await fetch(`/api/work-orders/${id}/history-items/${itemId}`, {
      method: "DELETE",
    });
    await fetchWO();
    setUpdating(false);
  };

  const handleRemoveHistory = (itemId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Pekerjaan Tambahan",
      description: "Apakah Anda yakin ingin menghapus pengerjaan jasa tambahan ini?",
      variant: "destructive",
      confirmText: "Hapus",
      onConfirm: () => executeRemoveHistory(itemId),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">Work Order tidak ditemukan</p>
      </div>
    );
  }

  const grandTotal = Number(wo.totalCost);
  const currentStep = wo.status === "SELESAI" ? 3 : wo.status === "PROSES" ? 2 : 1;
  const isCuci = wo.serviceType === "CUCI";
  const isProses = wo.status === "PROSES";

  // Check if all layanan items have employees assigned
  const allServiceItems = [...(wo.services || []), ...(wo.historyItems || [])];
  const hasMissingEmployee =
    allServiceItems.length > 0 &&
    allServiceItems.some((item) => !(item.employees || []).length);
  const canMarkSelesai = !hasMissingEmployee;

  // Collect assigned employees
  const allAssignedEmployees: EmployeeRef[] = [];
  const seenIds = new Set<string>();
  [...(wo.services || []), ...(wo.parts || []), ...(wo.historyItems || [])].forEach((item) => {
    (item.employees || []).forEach((emp) => {
      if (!seenIds.has(emp.id)) {
        seenIds.add(emp.id);
        allAssignedEmployees.push(emp);
      }
    });
  });

  const EmployeeBadges = ({
    emps,
    targetType,
    targetId,
    itemName,
  }: {
    emps: EmployeeRef[];
    targetType: "service" | "part" | "history";
    targetId: string;
    itemName: string;
  }) => {
    const isSingleSelect = isCuci && targetType !== "history";
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {emps.length > 0 ? (
          emps.map((emp) => (
            <span
              key={emp.id}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/10"
            >
              <User className="h-2.5 w-2.5" />
              {emp.name}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-amber-500 font-semibold italic bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10">
            Mekanik belum ditugaskan
          </span>
        )}
        {isProses && !wo.transaction && (
          <button
            onClick={() => openAssignModal(targetType, targetId, itemName, emps)}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-primary/40 px-2.5 py-0.5 text-[10px] font-bold text-primary transition-all hover:bg-primary/5 cursor-pointer active:scale-95"
          >
            <UserCheck className="h-2.5 w-2.5" />
            {emps.length > 0 ? (isSingleSelect ? "Ubah" : "+ Tambah") : "Tugaskan"}
          </button>
        )}
      </div>
    );
  };

  return (
    <AppPage>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/work-orders")}
            className="h-9 w-9 p-0 flex justify-center items-center rounded-xl"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-foreground sm:text-2xl">
                Detail Work Order
              </h1>
              <StatusBadge type="queue" status={wo.status} />
              <StatusBadge type="category" status={wo.serviceType} showDot={false} />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">{wo.trackingToken}</span>
              <button
                onClick={copyToken}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground active:scale-90 transition-all cursor-pointer"
                title="Copy token"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          {wo.status === "ANTRI" && (
            <Button onClick={() => updateStatus("PROSES")} loading={updating}>
              <Play className="h-4 w-4" />
              Mulai Pengerjaan
            </Button>
          )}
          {wo.status === "PROSES" && (
            <Button
              onClick={() => updateStatus("SELESAI")}
              loading={updating}
              disabled={!canMarkSelesai}
              className={cn(!canMarkSelesai && "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600")}
            >
              <CheckCircle2 className="h-4 w-4" />
              Selesai Dikerjakan
            </Button>
          )}
        </div>
      </div>

      {/* Progress Steps bar */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          {statusSteps.map((s, idx) => (
            <div key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                    currentStep > s.step
                      ? "bg-emerald-600 text-white"
                      : currentStep === s.step
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > s.step ? <CheckCircle2 className="h-4.5 w-4.5" /> : s.step}
                </div>
                <span
                  className={cn(
                    "text-xs font-bold tracking-wide",
                    currentStep >= s.step ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {idx < statusSteps.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-0.5 flex-1 rounded-full",
                    currentStep > s.step ? "bg-emerald-600" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Left Column: Job Cards */}
        <div className="space-y-6">
          {/* Customer & Vehicle Info */}
          <PageSection
            title="Kontak & Kendaraan"
            description="Informasi pemilik dan identitas fisik kendaraan"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pelanggan</p>
                <p className="mt-1 text-sm font-bold text-foreground">
                  {wo.vehicle?.customer?.phone ?? "-"}
                </p>
                {wo.vehicle?.customer?.email && (
                  <p className="text-xs text-muted-foreground mt-0.5">{wo.vehicle.customer.email}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kendaraan</p>
                <p className="mt-1 text-sm font-extrabold text-foreground font-mono">
                  {wo.vehicle?.plateNumber ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[wo.vehicle?.brand, wo.vehicle?.model, wo.vehicle?.color]
                    .filter(Boolean)
                    .join(" — ")}
                </p>
              </div>
            </div>
          </PageSection>

          {/* Services Items Section */}
          <PageSection
            title="Rincian Layanan Jasa"
            description="Daftar layanan servis atau cuci utama kendaraan"
            noPadding
          >
            <div className="divide-y divide-border/60">
              {(wo.services || []).map((ws) => (
                <div key={ws.id} className="p-5 hover:bg-slate-500/2 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{ws.service.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground">
                        {formatCurrency(ws.price)}
                      </span>
                      {wo.status !== "SELESAI" && !wo.transaction && (
                        <button
                          onClick={() => handleRemoveService(ws.id)}
                          className="rounded-lg p-1 text-muted-foreground hover:text-destructive active:scale-90 cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <EmployeeBadges
                    emps={ws.employees || []}
                    targetType="service"
                    targetId={ws.id}
                    itemName={ws.service.name}
                  />
                </div>
              ))}
              {(wo.services || []).length === 0 && (
                <p className="p-5 text-sm text-muted-foreground text-center">Belum ada layanan utama.</p>
              )}
            </div>
          </PageSection>

          {/* Spareparts Section */}
          <PageSection
            title="Rincian Penggunaan Sparepart"
            description="Komponen barang inventaris bengkel yang digunakan"
            noPadding
            actions={
              wo.status !== "SELESAI" &&
              wo.serviceType === "SERVIS" && (
                <Button variant="outline" size="sm" onClick={openAddPart} className="h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Part
                </Button>
              )
            }
          >
            <div className="divide-y divide-border/60">
              {(wo.parts || []).map((p) => (
                <div key={p.id} className="p-5 flex items-center justify-between hover:bg-slate-500/2 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-foreground">{p.inventory.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(p.price)} × {p.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-foreground">
                      {formatCurrency(Number(p.price) * p.qty)}
                    </span>
                    {wo.status !== "SELESAI" && (
                      <button
                        onClick={() => handleRemovePart(p.id)}
                        className="rounded-lg p-1 text-muted-foreground hover:text-destructive active:scale-90 cursor-pointer"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {(wo.parts || []).length === 0 && (
                <p className="p-5 text-sm text-muted-foreground text-center">Belum ada sparepart digunakan.</p>
              )}
            </div>
          </PageSection>

          {/* Jasa Tambahan / Manual History items */}
          <PageSection
            title="Jasa Kerja Tambahan"
            description="Pekerjaan di luar master layanan yang dimasukkan manual oleh mekanik"
            noPadding
            actions={
              !wo.transaction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setHistoryForm({ title: "", description: "", price: "" });
                    setShowAddHistory(true);
                  }}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Jasa
                </Button>
              )
            }
          >
            <div className="divide-y divide-border/60">
              {(wo.historyItems || []).map((h) => (
                <div key={h.id} className="p-5 hover:bg-slate-500/2 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold text-foreground">{h.title}</span>
                      {h.description && (
                        <p className="text-xs text-muted-foreground">{h.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-foreground">
                        {formatCurrency(Number(h.price))}
                      </span>
                      {!wo.transaction && (
                        <button
                          onClick={() => handleRemoveHistory(h.id)}
                          className="rounded-lg p-1 text-muted-foreground hover:text-destructive active:scale-90 cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <EmployeeBadges
                    emps={h.employees || []}
                    targetType="history"
                    targetId={h.id}
                    itemName={h.title}
                  />
                </div>
              ))}
              {(wo.historyItems || []).length === 0 && (
                <p className="p-5 text-sm text-muted-foreground text-center">Belum ada jasa kerja tambahan.</p>
              )}
            </div>
          </PageSection>

          {/* Notes */}
          {wo.notes && (
            <PageSection title="Catatan Keluhan Pemilik">
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                &ldquo;{wo.notes}&rdquo;
              </p>
            </PageSection>
          )}
        </div>

        {/* Right Column: Sticky Info Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {/* Payment Summary Box */}
          <PageSection title="Rencana Pembayaran">
            <div className="space-y-4">
              {wo.transaction ? (
                <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-border text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status Bayar</span>
                    <StatusBadge type="payment" status={wo.transaction.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Metode</span>
                    <span className="font-bold text-foreground">{wo.transaction.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2 font-bold">
                    <span className="text-foreground">Jumlah Lunas</span>
                    <span className="text-primary">{formatCurrency(wo.transaction.amount)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-center py-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Total tagihan dihitung berdasarkan akumulasi biaya jasa bengkel, jasa tambahan, dan sparepart.
                  </p>
                  <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">ESTIMASI TOTAL</p>
                    <p className="text-xl font-black text-primary">{formatCurrency(grandTotal)}</p>
                  </div>
                  {wo.status === "SELESAI" ? (
                    <Button
                      className="w-full mt-2"
                      onClick={() => router.push(`/cashier?woId=${wo.id}`)}
                    >
                      <Receipt className="h-4 w-4 mr-1.5" /> Proses Kasir
                    </Button>
                  ) : (
                    <p className="text-[10px] text-amber-500 font-semibold bg-amber-500/5 py-2 px-2.5 rounded-lg border border-amber-500/10">
                      Transaksi pembayaran dibuka setelah status pengerjaan SELESAI.
                    </p>
                  )}
                </div>
              )}
            </div>
          </PageSection>

          {/* Timeline Box */}
          <PageSection title="Timeline Pengerjaan">
            <div className="space-y-4 pt-1">
              {[
                { label: "Unit Terdaftar", time: wo.createdAt, icon: Calendar, color: "bg-amber-500" },
                { label: "Pengerjaan Dimulai", time: wo.startedAt, icon: Play, color: "bg-primary" },
                { label: "Pengerjaan Selesai", time: wo.completedAt, icon: CheckCircle2, color: "bg-emerald-600" },
              ]
                .filter((t) => !!t.time)
                .map((t, idx, arr) => (
                  <div key={idx} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-white shadow-sm shrink-0", t.color)}>
                        <t.icon className="h-3.5 w-3.5" />
                      </div>
                      {idx < arr.length - 1 && <div className="w-px h-8 bg-border/80 my-1" />}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{t.label}</p>
                      <p className="text-muted-foreground mt-0.5">{formatDateTime(t.time!)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </PageSection>

          {/* Assigned Staff Box */}
          <PageSection title="Daftar Petugas">
            <div className="space-y-3">
              {allAssignedEmployees.length > 0 ? (
                allAssignedEmployees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl p-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{emp.name}</p>
                      <p className="text-[10px] text-muted-foreground">{emp.position}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p>Belum ada staf mekanik/cuci ditugaskan pada baris pekerjaan.</p>
                </div>
              )}
            </div>
          </PageSection>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3.5 backdrop-blur-md sm:hidden">
        <div className="flex gap-2">
          {wo.status === "ANTRI" && (
            <Button className="flex-1" onClick={() => updateStatus("PROSES")} loading={updating}>
              <Play className="h-4 w-4 mr-1" /> Mulai
            </Button>
          )}
          {wo.status === "PROSES" && (
            <>
              {wo.serviceType === "SERVIS" && (
                <Button variant="outline" className="flex-1" onClick={openAddPart}>
                  <Package className="h-4 w-4 mr-1" /> + Part
                </Button>
              )}
              <Button
                className={cn("flex-2 bg-emerald-600 hover:bg-emerald-700 text-white")}
                onClick={() => updateStatus("SELESAI")}
                loading={updating}
                disabled={!canMarkSelesai}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {!canMarkSelesai ? "Pilih Mekanik" : "Selesai"}
              </Button>
            </>
          )}
          {wo.status === "SELESAI" && !wo.transaction && (
            <Button className="flex-1" onClick={() => router.push(`/cashier?woId=${wo.id}`)}>
              <Receipt className="h-4 w-4 mr-1" /> Bayar Kasir
            </Button>
          )}
        </div>
      </div>
      <div className="h-16 sm:hidden" />

      {/* Assign Employee Form Drawer */}
      <FormDrawer
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        title={`Penugasan Staf`}
        description={`Item: ${assignTarget?.name || ""}`}
        size="sm"
      >
        <div className="space-y-5">
          {assignTarget?.type === "service" && isCuci ? (
            /* CUCI: Single select pencuci */
            <Select
              label="Staf Pencuci"
              value={assignSelectedIds[0] || ""}
              onChange={(e) => selectSingleEmployee(e.target.value)}
              options={employees
                .filter((e) => e.position === "Pencuci Mobil")
                .map((e) => ({ value: e.id, label: `${e.name} (${e.position})` }))}
              placeholder="Pilih petugas cuci"
            />
          ) : (
            /* SERVIS: Multi-select checkbox pencari mekanik */
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Pilih Staf Mekanik
              </label>
              <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-border p-2 bg-muted/20">
                {employees.filter((e) => e.position === "Mekanik").length === 0 && (
                  <p className="p-4 text-center text-xs text-muted-foreground">Tidak ada staf mekanik tersedia.</p>
                )}
                {employees
                  .filter((e) => e.position === "Mekanik")
                  .map((emp) => {
                    const isChecked = assignSelectedIds.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => toggleEmployee(emp.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors cursor-pointer",
                          isChecked ? "bg-primary/10 border border-primary/30" : "hover:bg-card border border-transparent"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                            isChecked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {isChecked && <Check className="h-3 w-3" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{emp.name}</p>
                          <p className="text-[10px] text-muted-foreground">{emp.position}</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
              {assignSelectedIds.length > 0 && (
                <p className="text-[10px] text-muted-foreground italic">
                  {assignSelectedIds.length} mekanik dipilih. Komisi jasa mekanik akan dibagi rata.
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowAssign(false)}>
              Batal
            </Button>
            <Button onClick={saveAssignment} loading={updating}>
              Simpan Penugasan
            </Button>
          </div>
        </div>
      </FormDrawer>

      {/* Add Part Form Drawer */}
      <FormDrawer
        isOpen={showAddPart}
        onClose={() => setShowAddPart(false)}
        title="Tambah Sparepart"
        description="Gunakan sparepart dari inventaris gudang"
        size="sm"
      >
        <div className="space-y-5">
          <Select
            label="Pilih Barang"
            value={partForm.inventoryId}
            onChange={(e) => setPartForm({ ...partForm, inventoryId: e.target.value })}
            options={inventoryItems.map((i) => ({
              value: i.id,
              label: `${i.name} (Stok: ${i.qty} ${i.unit}) — ${formatCurrency(i.price)}`,
            }))}
            placeholder="Pilih item sparepart"
          />
          <Input
            label="Jumlah (Qty)"
            type="number"
            value={partForm.qty}
            onChange={(e) => setPartForm({ ...partForm, qty: e.target.value })}
            min={1}
          />
          {partForm.inventoryId && (
            <div className="rounded-xl bg-muted/40 p-4 border border-border text-sm flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Estimasi Biaya Tambahan:</span>
              <span className="font-bold text-primary">
                {formatCurrency(
                  Number(inventoryItems.find((i) => i.id === partForm.inventoryId)?.price || 0) *
                    parseInt(partForm.qty || "0")
                )}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowAddPart(false)}>
              Batal
            </Button>
            <Button onClick={executeAddPart} loading={updating} disabled={!partForm.inventoryId}>
              Tambahkan Sparepart
            </Button>
          </div>
        </div>
      </FormDrawer>

      {/* Add Manual History Form Drawer */}
      <FormDrawer
        isOpen={showAddHistory}
        onClose={() => setShowAddHistory(false)}
        title="Tambah Jasa Manual"
        description="Catat jenis pekerjaan manual di luar layanan bawaan"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Nama Pekerjaan Jasa"
            placeholder="misal: Setel Rem Tangan"
            value={historyForm.title}
            onChange={(e) => setHistoryForm({ ...historyForm, title: e.target.value })}
            required
          />
          <Input
            label="Deskripsi Detail (Opsional)"
            placeholder="Keterangan tambahan keluhan/hasil pengerjaan"
            value={historyForm.description}
            onChange={(e) => setHistoryForm({ ...historyForm, description: e.target.value })}
          />
          <Input
            label="Biaya Jasa (Rp)"
            placeholder="Biaya pekerjaan"
            value={historyForm.price}
            onChange={(e) => {
              let raw = e.target.value.replace(/\D/g, "");
              setHistoryForm({
                ...historyForm,
                price: raw ? new Intl.NumberFormat("id-ID").format(parseInt(raw)) : "",
              });
            }}
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowAddHistory(false)}>
              Batal
            </Button>
            <Button
              onClick={executeAddHistory}
              loading={updating}
              disabled={!historyForm.title || !historyForm.price}
            >
              Simpan Jasa
            </Button>
          </div>
        </div>
      </FormDrawer>

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
