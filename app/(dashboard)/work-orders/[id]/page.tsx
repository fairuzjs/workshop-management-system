"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import {
  WorkOrderStatusBadge,
  ServiceCategoryBadge,
  PaymentStatusBadge,
} from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Play,
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
  Banknote,
  CreditCard,
  QrCode,
  ClipboardList,
  Users,
  X,
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

  // Assign employee modal
  const [showAssign, setShowAssign] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{
    type: "service" | "part" | "history";
    id: string;
    name: string;
    currentEmployeeIds: string[];
  } | null>(null);
  const [assignSelectedIds, setAssignSelectedIds] = useState<string[]>([]);

  // Add part modal
  const [showAddPart, setShowAddPart] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [partForm, setPartForm] = useState({ inventoryId: "", qty: "1" });

  // Add history item modal
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [historyForm, setHistoryForm] = useState({ title: "", description: "", price: "" });

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
  }, []);

  useEffect(() => {
    fetchWO();
    fetchEmployees();
  }, [fetchWO, fetchEmployees]);

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Ubah status ke ${newStatus}?`)) return;
    setUpdating(true);
    await fetch(`/api/work-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchWO();
    setUpdating(false);
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
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId]
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

  const handleAddPart = async () => {
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

  const handleRemovePart = async (partId: string) => {
    if (!confirm("Hapus part ini? Stok akan dikembalikan.")) return;
    setUpdating(true);
    await fetch(`/api/work-orders/${id}/parts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partId }),
    });
    await fetchWO();
    setUpdating(false);
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!confirm("Hapus layanan ini dari work order?")) return;
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

  const handleAddHistory = async () => {
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

  const handleRemoveHistory = async (itemId: string) => {
    if (!confirm("Hapus catatan riwayat pekerjaan ini?")) return;
    setUpdating(true);
    await fetch(`/api/work-orders/${id}/history-items/${itemId}`, {
      method: "DELETE",
    });
    await fetchWO();
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Work Order tidak ditemukan</p>
      </div>
    );
  }

  const grandTotal = Number(wo.totalCost);
  const currentStep = wo.status === "SELESAI" ? 3 : wo.status === "PROSES" ? 2 : 1;
  const isCuci = wo.serviceType === "CUCI";
  const isProses = wo.status === "PROSES";

  // Check if all layanan items have employees assigned (both SERVIS and CUCI)
  const allServiceItems = [...(wo.services || []), ...(wo.historyItems || [])];
  const hasMissingEmployee = allServiceItems.length > 0 && allServiceItems.some(
    (item) => !((item as { employees?: EmployeeRef[] }).employees || []).length
  );
  const canMarkSelesai = !hasMissingEmployee;

  // Collect all assigned employees across all items
  const allAssignedEmployees: EmployeeRef[] = [];
  const seenIds = new Set<string>();
  [...(wo.services || []), ...(wo.parts || []), ...(wo.historyItems || [])].forEach((item) => {
    ((item as { employees?: EmployeeRef[] }).employees || []).forEach((emp) => {
      if (!seenIds.has(emp.id)) {
        seenIds.add(emp.id);
        allAssignedEmployees.push(emp);
      }
    });
  });

  // Employee badge component
  const EmployeeBadges = ({ emps, targetType, targetId, itemName }: {
    emps: EmployeeRef[];
    targetType: "service" | "part" | "history";
    targetId: string;
    itemName: string;
  }) => {
    const isSingleSelect = isCuci && targetType !== "history";
    return (
      <div className="flex flex-wrap items-center gap-1 mt-1">
        {emps.length > 0 ? (
          emps.map((emp) => (
            <span key={emp.id} className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <User className="h-3 w-3" />
              {emp.name}
            </span>
          ))
        ) : (
          <span className="text-[11px] text-muted-foreground italic">Belum ditugaskan</span>
        )}
        {isProses && !wo.transaction && (
          <button
            onClick={() => openAssignModal(targetType, targetId, itemName, emps)}
            className="inline-flex items-center gap-1 rounded-lg border border-dashed border-primary/30 px-2 py-0.5 text-[11px] font-medium text-primary/70 transition-colors hover:bg-primary/5 hover:text-primary"
          >
            <UserCheck className="h-3 w-3" />
            {emps.length > 0 ? (isSingleSelect ? "Ubah" : "+ Tambah") : "Tugaskan"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/work-orders")}
            className="rounded-xl p-2 text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                Work Order
              </h1>
              <WorkOrderStatusBadge status={wo.status} />
              <ServiceCategoryBadge category={wo.serviceType} />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">
                {wo.trackingToken}
              </span>
              <button
                onClick={copyToken}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
                title="Copy token"
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status Actions - desktop */}
        <div className="hidden gap-2 sm:flex">
          {wo.status === "ANTRI" && (
            <Button size="sm" onClick={() => updateStatus("PROSES")} loading={updating}>
              <Play className="h-4 w-4" />
              Mulai Proses
            </Button>
          )}
          {wo.status === "PROSES" && (
            <div className="relative group">
              <Button
                size="sm"
                onClick={() => updateStatus("SELESAI")}
                loading={updating}
                disabled={!canMarkSelesai}
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle2 className="h-4 w-4" />
                Selesai
              </Button>
              {!canMarkSelesai && (
                <div className="absolute right-0 top-full mt-1 w-56 rounded-lg bg-destructive/90 px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  Semua layanan jasa harus memiliki mekanik yang ditugaskan sebelum bisa diselesaikan.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Progress */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          {statusSteps.map((s, i) => (
            <div key={s.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                    currentStep > s.step
                      ? "bg-success text-success-foreground"
                      : currentStep === s.step
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currentStep > s.step ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    s.step
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    currentStep >= s.step ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < statusSteps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full",
                    currentStep > s.step ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: Details */}
        <div className="space-y-5">
          {/* Customer & Vehicle */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                Kontak & Kendaraan
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Kontak
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {wo.vehicle?.customer?.phone ?? "-"}
                </p>
                {wo.vehicle?.customer?.email && (
                  <p className="text-xs text-muted-foreground">{wo.vehicle.customer.email}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Kendaraan
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {wo.vehicle?.plateNumber ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[wo.vehicle?.brand, wo.vehicle?.model]
                    .filter(Boolean)
                    .join(" — ")}
                </p>
              </div>
            </div>
          </div>

          {/* Services & Parts */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Layanan</h3>
            </div>
            <div className="space-y-2">
              {(wo.services || []).map((ws) => (
                <div
                  key={ws.id}
                  className="rounded-xl bg-muted/50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      {ws.service.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(ws.price)}
                      </span>
                      {wo.status !== "SELESAI" && !wo.transaction && (
                        <button onClick={() => handleRemoveService(ws.id)} className="rounded-lg p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
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
              {(wo.parts?.length || 0) > 0 && (
                <>
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Sparepart
                  </p>
                  {(wo.parts || []).map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl bg-muted/50 px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">
                          {p.inventory.name} × {p.qty}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {formatCurrency(Number(p.price) * p.qty)}
                          </span>
                          {wo.status !== "SELESAI" && (
                            <button onClick={() => handleRemovePart(p.id)} className="rounded-lg p-1 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {wo.status !== "SELESAI" && wo.serviceType === "SERVIS" && (
                <button onClick={openAddPart} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
                  <Plus className="h-4 w-4" /> Tambah Sparepart
                </button>
              )}
              <hr className="border-border" />
              <div className="flex items-center justify-between px-4 py-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* History Items */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Tambah Jasa</h3>
            </div>
            <div className="space-y-3">
              {(wo.historyItems || []).map((h) => (
                <div
                  key={h.id}
                  className="flex flex-col gap-1 rounded-xl bg-muted/50 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{h.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(Number(h.price))}
                      </span>
                      {!wo.transaction && (
                        <button onClick={() => handleRemoveHistory(h.id)} className="rounded-lg p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {h.description && (
                    <span className="text-xs text-muted-foreground">{h.description}</span>
                  )}
                  <EmployeeBadges
                    emps={h.employees || []}
                    targetType="history"
                    targetId={h.id}
                    itemName={h.title}
                  />
                </div>
              ))}
              {(wo.historyItems?.length || 0) === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Belum ada jasa tambahan.</p>
              )}
              
              {!wo.transaction ? (
                <button onClick={() => { setHistoryForm({ title: "", description: "", price: "" }); setShowAddHistory(true); }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
                  <Plus className="h-4 w-4" /> Tambah Jasa Tambahan
                </button>
              ) : (
                <p className="mt-2 text-xs text-center text-warning bg-warning/10 p-2 rounded-lg">
                  Penambahan jasa terkunci karena transaksi sudah dibuat.
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          {wo.notes && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-2 font-semibold text-foreground">Catatan</h3>
              <p className="text-sm text-muted-foreground">{wo.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Info Sidebar */}
        <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          {/* Payment Summary */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Pembayaran</h3>
            </div>
            {wo.transaction ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <PaymentStatusBadge status={wo.transaction.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Metode</span>
                  <span className="text-sm font-medium text-foreground">
                    {wo.transaction.paymentMethod}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Jumlah</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(wo.transaction.amount)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  Belum ada transaksi
                </p>
                {wo.status === "SELESAI" ? (
                  <Button size="sm" className="mt-3 w-full" onClick={() => router.push(`/cashier?woId=${wo.id}`)}>
                    <Receipt className="h-4 w-4" /> Proses Pembayaran
                  </Button>
                ) : (
                  <p className="mt-3 rounded-xl bg-muted/50 p-3 text-center text-xs text-muted-foreground">
                    Transaksi dapat dibuat setelah pekerjaan selesai.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Timeline</h3>
            </div>
            <div className="space-y-0">
              {[
                { label: "Dibuat", time: wo.createdAt, show: true },
                { label: "Diproses", time: wo.startedAt, show: !!wo.startedAt },
                { label: "Selesai", time: wo.completedAt, show: !!wo.completedAt },
              ]
                .filter((t) => t.show)
                .map((t, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      </div>
                      {i < arr.length - 1 && (
                        <div className="my-1 w-px flex-1 bg-border" style={{ minHeight: "1.5rem" }} />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs text-muted-foreground">{t.label}</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatDateTime(t.time!)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Petugas (summary of all assigned employees) */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Petugas</h3>
            </div>
            {allAssignedEmployees.length > 0 ? (
              <div className="space-y-2">
                {allAssignedEmployees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isProses
                  ? "Klik tombol \"Tugaskan\" pada setiap layanan untuk menugaskan petugas."
                  : "Belum ada petugas yang ditugaskan."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md sm:hidden">
        <div className="flex gap-2">
          {wo.status === "ANTRI" && (
            <Button size="sm" className="flex-1" onClick={() => updateStatus("PROSES")} loading={updating}>
              <Play className="h-4 w-4" />
              Mulai
            </Button>
          )}
          {wo.status === "PROSES" && (
            <>
              {wo.serviceType === "SERVIS" && (
                <Button variant="outline" size="sm" className="flex-1" onClick={openAddPart}>
                  <Package className="h-4 w-4" />
                  Part
                </Button>
              )}
              <Button
                size="sm"
                className="flex-1 bg-success hover:bg-success/90"
                onClick={() => updateStatus("SELESAI")}
                loading={updating}
                disabled={!canMarkSelesai}
              >
                <CheckCircle2 className="h-4 w-4" />
                {!canMarkSelesai ? "Pilih Mekanik Dulu" : "Selesai"}
              </Button>
            </>
          )}
          {wo.status === "SELESAI" && !wo.transaction && (
            <Button size="sm" className="flex-1" onClick={() => router.push(`/cashier?woId=${wo.id}`)}>
              <Receipt className="h-4 w-4" />
              Proses Pembayaran
            </Button>
          )}
        </div>
      </div>

      {/* Add bottom padding on mobile for the fixed action bar */}
      <div className="h-20 sm:hidden" />

      {/* Assign Employee Modal */}
      <Modal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        title={`Tugaskan Petugas — ${assignTarget?.name || ""}`}
        description={assignTarget?.type === "service" ? "Cuci mobil: pilih satu karyawan" : "Servis: bisa pilih beberapa mekanik"}
      >
        <div className="space-y-4">
          {assignTarget?.type === "service" ? (
            /* CUCI: Single select dropdown */
            <Select
              label="Petugas"
              value={assignSelectedIds[0] || ""}
              onChange={(e) => selectSingleEmployee(e.target.value)}
              options={employees.filter(e => e.position === "Pencuci Mobil").map((e) => ({ value: e.id, label: `${e.name} — ${e.position}` }))}
              placeholder="Pilih petugas"
            />
          ) : (
            /* SERVIS: Multi-select checkbox list */
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Pilih Mekanik
              </label>
              <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-input p-2">
                {employees.filter(e => e.position === "Mekanik").length === 0 && (
                  <p className="p-3 text-center text-sm text-muted-foreground">Tidak ada mekanik tersedia</p>
                )}
                {employees.filter(e => e.position === "Mekanik").map((emp) => {
                  const isChecked = assignSelectedIds.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleEmployee(emp.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        isChecked
                          ? "bg-primary/10 ring-1 ring-primary/30"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors",
                          isChecked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input"
                        )}
                      >
                        {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.position}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {assignSelectedIds.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {assignSelectedIds.length} mekanik dipilih — komisi jasa 55% dibagi rata
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowAssign(false)} fullWidth className="sm:w-auto">Batal</Button>
            <Button onClick={saveAssignment} loading={updating} fullWidth className="sm:w-auto">Simpan</Button>
          </div>
        </div>
      </Modal>

      {/* Add Part Modal */}
      <Modal isOpen={showAddPart} onClose={() => setShowAddPart(false)} title="Tambah Sparepart" description="Pilih item dari inventory">
        <div className="space-y-4">
          <Select label="Item" value={partForm.inventoryId} onChange={(e) => setPartForm({ ...partForm, inventoryId: e.target.value })}
            options={inventoryItems.map((i) => ({ value: i.id, label: `${i.name} — Stok: ${i.qty} ${i.unit} — ${formatCurrency(i.price)}` }))} placeholder="Pilih item" />
          <Input label="Jumlah" type="number" value={partForm.qty} onChange={(e) => setPartForm({ ...partForm, qty: e.target.value })} min={1} />
          {partForm.inventoryId && (
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">Estimasi biaya:</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(Number(inventoryItems.find(i => i.id === partForm.inventoryId)?.price || 0) * parseInt(partForm.qty || "0"))}
              </p>
            </div>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowAddPart(false)} fullWidth className="sm:w-auto">Batal</Button>
            <Button onClick={handleAddPart} loading={updating} disabled={!partForm.inventoryId} fullWidth className="sm:w-auto">Tambahkan</Button>
          </div>
        </div>
      </Modal>

      {/* Add History Modal */}
      <Modal isOpen={showAddHistory} onClose={() => setShowAddHistory(false)} title="Tambah Pekerjaan Manual" description="Catat pekerjaan tambahan di luar master layanan">
        <div className="space-y-4">
          <Input label="Nama Pekerjaan" placeholder="Contoh: Setel Rem Tangan" value={historyForm.title} onChange={(e) => setHistoryForm({ ...historyForm, title: e.target.value })} />
          <Input label="Deskripsi (Opsional)" placeholder="Keterangan tambahan" value={historyForm.description} onChange={(e) => setHistoryForm({ ...historyForm, description: e.target.value })} />
          <Input 
            label="Harga" 
            value={historyForm.price} 
            onChange={(e) => {
              let raw = e.target.value.replace(/\D/g, "");
              if (raw) {
                setHistoryForm({ ...historyForm, price: new Intl.NumberFormat("id-ID").format(parseInt(raw)) });
              } else {
                setHistoryForm({ ...historyForm, price: "" });
              }
            }} 
          />
          
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowAddHistory(false)} fullWidth className="sm:w-auto">Batal</Button>
            <Button onClick={handleAddHistory} loading={updating} disabled={!historyForm.title || !historyForm.price} fullWidth className="sm:w-auto">Simpan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
