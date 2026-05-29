"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  Receipt,
  Car,
  User,
  Wrench,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  Loader2,
} from "lucide-react";

interface TransactionDetail {
  id: string;
  amount: string;
  paymentMethod: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  workOrder: {
    id: string;
    trackingToken: string;
    serviceType: string;
    totalCost: string;
    vehicle: {
      plateNumber: string;
      brand: string | null;
      model: string | null;
      color: string | null;
      customer: { phone: string; email: string | null } | null;
    };
    employee: { id: string; name: string; position: string } | null;
    services: { id: string; price: string; service: { name: string } }[];
    parts: { id: string; qty: number; price: string; inventory: { name: string } }[];
    historyItems: { id: string; title: string; price: string }[];
  };
}

const methodIcon: Record<string, typeof Banknote> = {
  CASH: Banknote,
  TRANSFER: CreditCard,
  QRIS: QrCode,
};

export default function TransactionDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [tx, setTx] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTransaction = useCallback(async () => {
    try {
      const res = await fetch(`/api/transactions/${id}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Gagal mengambil detail transaksi");
      }
      const data = await res.json();
      setTx(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Transaksi tidak ditemukan</p>
      </div>
    );
  }

  const wo = tx.workOrder;
  const MethodIcon = methodIcon[tx.paymentMethod] || Banknote;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/transactions")}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detail Transaksi</h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {tx.id}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Col: WO & Customer */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Customer & Vehicle */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Car className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Kendaraan & Kontak</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Kendaraan</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {wo.vehicle?.plateNumber ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[wo.vehicle?.brand, wo.vehicle?.model].filter(Boolean).join(" ") || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Kontak</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {wo.vehicle?.customer?.phone ?? "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {wo.vehicle?.customer?.email ?? "-"}
                </p>
              </div>
            </div>
            <hr className="my-4 border-border" />
            <div className="flex items-center gap-3">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Work Order:</span>
              <span className="font-mono text-sm font-bold text-primary">{wo.trackingToken}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                {wo.serviceType}
              </span>
            </div>
          </div>

          {/* Rincian Layanan & Sparepart */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Rincian Tagihan</h3>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Layanan</p>
              {(wo.services || []).map((ws) => (
                <div key={ws.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2">
                  <span className="text-sm text-foreground">{ws.service.name}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(ws.price)}</span>
                </div>
              ))}
              
              {(wo.parts?.length || 0) > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-2">Sparepart</p>
                  {(wo.parts || []).map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2">
                      <span className="text-sm text-foreground">{p.inventory.name} × {p.qty}</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(Number(p.price) * p.qty)}
                      </span>
                    </div>
                  ))}
                </>
              )}

              {(wo.historyItems?.length || 0) > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase text-muted-foreground mt-4 mb-2">Pekerjaan Tambahan</p>
                  {(wo.historyItems || []).map((h) => (
                    <div key={h.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2">
                      <span className="text-sm text-foreground">{h.title}</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatCurrency(Number(h.price))}
                      </span>
                    </div>
                  ))}
                </>
              )}
              
              <div className="mt-6 border-t border-border pt-4 flex items-center justify-between">
                <span className="font-bold text-foreground">Total Keseluruhan</span>
                <span className="text-lg font-bold text-primary">{formatCurrency(tx.amount)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Col: Payment Summary */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Pembayaran</h3>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-lg bg-success/10 p-4 border border-success/20">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-success font-medium">Status</span>
                  <Badge variant="success" className="uppercase text-xs">{tx.status}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">{formatCurrency(tx.amount)}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Metode Pembayaran</p>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
                  <MethodIcon className="h-5 w-5 text-foreground" />
                  <span className="text-sm font-semibold text-foreground">{tx.paymentMethod}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Waktu Pelunasan</p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(tx.paidAt || tx.createdAt)}</span>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-muted-foreground mb-1">Petugas (Teknisi)</p>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{wo.employee?.name ?? "Tidak ada data"}</span>
                </div>
              </div>

            </div>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="w-full rounded-xl bg-primary text-primary-foreground font-semibold h-12 hover:bg-primary/90 transition-colors"
          >
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
}
