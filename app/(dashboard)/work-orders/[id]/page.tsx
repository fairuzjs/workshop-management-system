"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  WorkOrderStatusBadge,
  ServiceCategoryBadge,
  PaymentStatusBadge,
} from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
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
} from "lucide-react";

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
    customer: { name: string; phone: string; email: string | null };
  };
  employee: { id: string; name: string; position: string } | null;
  user: { name: string };
  services: { id: string; price: string; service: { name: string } }[];
  parts: { id: string; qty: number; price: string; inventory: { name: string } }[];
  transaction: {
    id: string;
    amount: string;
    paymentMethod: string;
    status: string;
    paidAt: string | null;
  } | null;
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

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [wo, setWo] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Assign employee modal
  const [showAssign, setShowAssign] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignId, setAssignId] = useState("");

  // Add part modal
  const [showAddPart, setShowAddPart] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [partForm, setPartForm] = useState({ inventoryId: "", qty: "1" });

  // Payment modal
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");

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

  useEffect(() => {
    fetchWO();
  }, [fetchWO]);

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

  const assignEmployee = async () => {
    setUpdating(true);
    await fetch(`/api/work-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: assignId }),
    });
    setShowAssign(false);
    await fetchWO();
    setUpdating(false);
  };

  const openAssignModal = async () => {
    const res = await fetch("/api/employees");
    const data = await res.json();
    setEmployees(data);
    setAssignId(wo?.employee?.id || "");
    setShowAssign(true);
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

  const handlePayment = async () => {
    if (!paymentMethod) return;
    setUpdating(true);
    const res = await fetch(`/api/work-orders/${id}/transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod }),
    });
    if (res.ok) {
      setShowPayment(false);
      await fetchWO();
    } else {
      const err = await res.json();
      alert(err.error);
    }
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/work-orders")}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
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
                className="rounded p-1 text-muted-foreground hover:text-foreground"
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

        {/* Status Actions */}
        <div className="flex gap-2">
          {wo.status === "ANTRI" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={openAssignModal}
              >
                <UserCheck className="h-4 w-4" />
                {wo.employee ? "Ganti Petugas" : "Tugaskan"}
              </Button>
              <Button
                size="sm"
                onClick={() => updateStatus("PROSES")}
                loading={updating}
              >
                <Play className="h-4 w-4" />
                Mulai Proses
              </Button>
            </>
          )}
          {wo.status === "PROSES" && (
            <Button
              size="sm"
              onClick={() => updateStatus("SELESAI")}
              loading={updating}
              className="bg-success hover:bg-success/90"
            >
              <CheckCircle2 className="h-4 w-4" />
              Selesai
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer & Vehicle */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Car className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                Customer & Kendaraan
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Customer
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {wo.vehicle.customer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {wo.vehicle.customer.phone}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Kendaraan
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {wo.vehicle.plateNumber}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[wo.vehicle.brand, wo.vehicle.model, wo.vehicle.color]
                    .filter(Boolean)
                    .join(" — ")}
                </p>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wrench className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Layanan</h3>
            </div>
            <div className="space-y-2">
              {wo.services.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                >
                  <span className="text-sm text-foreground">
                    {ws.service.name}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(ws.price)}
                  </span>
                </div>
              ))}
              {wo.parts.length > 0 && (
                <>
                  <p className="mt-4 text-xs uppercase text-muted-foreground font-medium">
                    Sparepart
                  </p>
                  {wo.parts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
                    >
                      <span className="text-sm text-foreground">
                        {p.inventory.name} × {p.qty}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(Number(p.price) * p.qty)}
                        </span>
                        {wo.status !== "SELESAI" && (
                          <button onClick={() => handleRemovePart(p.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
              {wo.status !== "SELESAI" && wo.serviceType === "SERVIS" && (
                <button onClick={openAddPart} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
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
        </div>

        {/* Right: Info Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Timeline</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                  <div className="h-2.5 w-2.5 rounded-full bg-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dibuat</p>
                  <p className="text-sm text-foreground">
                    {formatDateTime(wo.createdAt)}
                  </p>
                </div>
              </div>
              {wo.startedAt && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Diproses</p>
                    <p className="text-sm text-foreground">
                      {formatDateTime(wo.startedAt)}
                    </p>
                  </div>
                </div>
              )}
              {wo.completedAt && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <div className="h-2.5 w-2.5 rounded-full bg-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Selesai</p>
                    <p className="text-sm text-foreground">
                      {formatDateTime(wo.completedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Employee */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Petugas</h3>
            </div>
            {wo.employee ? (
              <div>
                <p className="text-sm font-medium text-foreground">
                  {wo.employee.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {wo.employee.position}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ditugaskan</p>
            )}
          </div>

          {/* Transaction */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Pembayaran</h3>
            </div>
            {wo.transaction ? (
              <div className="space-y-2">
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
                {wo.status === "SELESAI" && (
                  <Button size="sm" className="mt-3 w-full" onClick={() => { setPaymentMethod(""); setShowPayment(true); }}>
                    <Receipt className="h-4 w-4" /> Proses Pembayaran
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {wo.notes && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 font-semibold text-foreground">Catatan</h3>
              <p className="text-sm text-muted-foreground">{wo.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Assign Employee Modal */}
      <Modal isOpen={showAssign} onClose={() => setShowAssign(false)} title="Tugaskan Petugas">
        <div className="space-y-4">
          <Select label="Petugas" value={assignId} onChange={(e) => setAssignId(e.target.value)}
            options={employees.map((e) => ({ value: e.id, label: `${e.name} — ${e.position}` }))} placeholder="Pilih petugas" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAssign(false)}>Batal</Button>
            <Button onClick={assignEmployee} loading={updating}>Simpan</Button>
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
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">Estimasi biaya:</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(Number(inventoryItems.find(i => i.id === partForm.inventoryId)?.price || 0) * parseInt(partForm.qty || "0"))}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddPart(false)}>Batal</Button>
            <Button onClick={handleAddPart} loading={updating} disabled={!partForm.inventoryId}>Tambahkan</Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Proses Pembayaran" description={`Total: ${formatCurrency(grandTotal)}`}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Pilih metode pembayaran</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "CASH", label: "Cash", icon: Banknote },
              { id: "TRANSFER", label: "Transfer", icon: CreditCard },
              { id: "QRIS", label: "QRIS", icon: QrCode },
            ].map((method) => (
              <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                  paymentMethod === method.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"
                }`}>
                <method.icon className={`h-6 w-6 ${paymentMethod === method.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-sm font-medium">{method.label}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowPayment(false)}>Batal</Button>
            <Button onClick={handlePayment} loading={updating} disabled={!paymentMethod}>Bayar {formatCurrency(grandTotal)}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
