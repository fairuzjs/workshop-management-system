"use client";

import { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Wrench, Search, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface TrackingResult {
  trackingToken: string;
  status: string;
  serviceType: string;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  customerName: string;
  employeeName: string | null;
  services: { name: string; price: number }[];
  totalCost: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock; description: string }> = {
  ANTRI: {
    label: "Menunggu Antrian",
    color: "text-warning",
    icon: Clock,
    description: "Kendaraan Anda sedang menunggu untuk diproses.",
  },
  PROSES: {
    label: "Sedang Dikerjakan",
    color: "text-primary",
    icon: Wrench,
    description: "Kendaraan Anda sedang dalam proses pengerjaan.",
  },
  SELESAI: {
    label: "Selesai",
    color: "text-success",
    icon: CheckCircle2,
    description: "Kendaraan Anda sudah selesai! Silakan ambil di bengkel.",
  },
};

export default function TrackingPage() {
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/tracking?token=${encodeURIComponent(token)}&phone=${encodeURIComponent(phone)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal melacak work order");
      } else {
        setResult(data);
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    }

    setLoading(false);
  };

  const config = result ? statusConfig[result.status] : null;
  const StatusIcon = config?.icon || Clock;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Workshop Management
            </h1>
            <p className="text-xs text-muted-foreground">Lacak status kendaraan Anda</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Search Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">Lacak Work Order</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Masukkan kode tracking dan 4 digit terakhir nomor HP Anda
          </p>

          <form onSubmit={handleTrack} className="mt-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Kode Tracking
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="Contoh: AB3K7NP2"
                maxLength={8}
                required
                className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-center font-mono text-lg font-bold tracking-widest text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                4 Digit Terakhir No. HP
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Contoh: 7890"
                maxLength={4}
                required
                className="flex h-12 w-full rounded-lg border border-input bg-background px-4 text-center font-mono text-lg font-bold tracking-widest text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading || token.length < 4 || phone.length !== 4}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? "Mencari..." : "Lacak"}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && config && (
          <div className="mt-6 space-y-4">
            {/* Status Card */}
            <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                  result.status === "SELESAI"
                    ? "bg-success/10"
                    : result.status === "PROSES"
                    ? "bg-primary/10"
                    : "bg-warning/10"
                }`}
              >
                <StatusIcon className={`h-8 w-8 ${config.color}`} />
              </div>
              <h3 className={`mt-4 text-xl font-bold ${config.color}`}>
                {config.label}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {config.description}
              </p>
            </div>

            {/* Details */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Kendaraan
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-foreground">
                    {result.vehiclePlate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[result.vehicleBrand, result.vehicleModel]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Pemilik
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {result.customerName}
                  </p>
                </div>
                {result.employeeName && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">
                      Dikerjakan Oleh
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {result.employeeName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase text-muted-foreground">
                    Tipe
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {result.serviceType === "SERVIS"
                      ? "🔧 Servis Bengkel"
                      : "🚿 Cuci Kendaraan"}
                  </p>
                </div>
              </div>

              <hr className="my-4 border-border" />

              {/* Services */}
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-2">
                  Layanan
                </p>
                <div className="space-y-1.5">
                  {result.services.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">{s.name}</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(s.price)}
                      </span>
                    </div>
                  ))}
                  <hr className="border-border" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(result.totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="my-4 border-border" />

              {/* Timeline */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Masuk</span>
                  <span className="text-foreground">
                    {formatDateTime(result.createdAt)}
                  </span>
                </div>
                {result.startedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mulai Dikerjakan</span>
                    <span className="text-foreground">
                      {formatDateTime(result.startedAt)}
                    </span>
                  </div>
                )}
                {result.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Selesai</span>
                    <span className="text-foreground">
                      {formatDateTime(result.completedAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          © 2026 Workshop Management System
        </p>
      </div>
    </div>
  );
}
