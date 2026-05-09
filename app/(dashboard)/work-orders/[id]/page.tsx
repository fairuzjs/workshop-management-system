"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
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

  const fetchWO = useCallback(async () => {
    const res = await fetch(`/api/work-orders/${id}`);
    const data = await res.json();
    setWo(data);
    setLoading(false);
  }, [id]);

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

  const partsTotal = wo.parts.reduce(
    (sum, p) => sum + Number(p.price) * p.qty,
    0
  );
  const grandTotal = Number(wo.totalCost) + partsTotal;

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
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(Number(p.price) * p.qty)}
                      </span>
                    </div>
                  ))}
                </>
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
              <p className="text-sm text-muted-foreground">
                Belum ada transaksi
              </p>
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
      <Modal
        isOpen={showAssign}
        onClose={() => setShowAssign(false)}
        title="Tugaskan Petugas"
      >
        <div className="space-y-4">
          <Select
            label="Petugas"
            value={assignId}
            onChange={(e) => setAssignId(e.target.value)}
            options={employees.map((e) => ({
              value: e.id,
              label: `${e.name} — ${e.position}`,
            }))}
            placeholder="Pilih petugas"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAssign(false)}
            >
              Batal
            </Button>
            <Button onClick={assignEmployee} loading={updating}>
              Simpan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
