"use client";

import { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Wrench,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Car,
  User,
  Receipt,
} from "lucide-react";

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

const statusConfig: Record<
  string,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: typeof Clock;
    description: string;
    step: number;
  }
> = {
  ANTRI: {
    label: "Menunggu Antrian",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
    icon: Clock,
    description: "Kendaraan Anda sedang menunggu untuk diproses.",
    step: 1,
  },
  PROSES: {
    label: "Sedang Dikerjakan",
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    icon: Wrench,
    description: "Kendaraan Anda sedang dalam proses pengerjaan.",
    step: 2,
  },
  SELESAI: {
    label: "Selesai",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
    icon: CheckCircle2,
    description: "Kendaraan Anda sudah selesai! Silakan ambil di bengkel.",
    step: 3,
  },
};

const STEPS = [
  { key: "ANTRI", label: "Antrian", step: 1 },
  { key: "PROSES", label: "Pengerjaan", step: 2 },
  { key: "SELESAI", label: "Selesai", step: 3 },
];

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

  const handleReset = () => {
    setResult(null);
    setError("");
    setToken("");
    setPhone("");
  };

  const config = result ? statusConfig[result.status] : null;
  const StatusIcon = config?.icon || Clock;
  const currentStep = config?.step ?? 0;

  /* ─────────────────────────────────────────────
     VIEW A: Search Form
  ───────────────────────────────────────────── */
  if (!result) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Wrench className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Workshop Management</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tracking</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">© 2026</span>
          </div>
        </header>

        {/* Centered search */}
        <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-md flex-col justify-center px-6 py-12">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Lacak Work Order
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Masukkan kode tracking dan 4 digit terakhir nomor HP Anda untuk melihat status kendaraan.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <form onSubmit={handleTrack} className="space-y-5">
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Kode Tracking
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="AB3K7NP2"
                    maxLength={8}
                    required
                    className="flex h-14 w-full rounded-xl border border-input bg-background px-4 text-center font-mono text-xl font-bold tracking-[0.25em] text-foreground placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    4 Digit Terakhir No. HP
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="7890"
                    maxLength={4}
                    required
                    className="flex h-14 w-full rounded-xl border border-input bg-background px-4 text-center font-mono text-xl font-bold tracking-[0.25em] text-foreground placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || token.length < 4 || phone.length !== 4}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {loading ? "Mencari..." : "Lacak Status"}
                </button>
              </form>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Kode tracking tersedia pada struk atau notifikasi yang diterima saat kendaraan masuk bengkel.
            </p>
          </div>
        </main>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     VIEW B: Result — 2-column layout
     Left  : Vehicle info + Services
     Right : Progress status + Timeline
  ───────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      {/* Header — with back button */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Wrench className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Workshop Management</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Tracking</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-mono text-sm font-semibold text-foreground">
                {result.trackingToken}
              </span>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-95"
          >
            Kembali
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page title row */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Detail Work Order
            </h1>
            <p className="text-sm text-muted-foreground">
              Kode:{" "}
              <span className="font-mono font-semibold text-foreground">
                {result.trackingToken}
              </span>
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 ${config!.bgColor} ${config!.borderColor}`}
          >
            <StatusIcon className={`h-3.5 w-3.5 ${config!.color}`} />
            <span className={`text-xs font-semibold ${config!.color}`}>
              {config!.label}
            </span>
          </div>
        </div>

        {/* 2-column grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* ── Column LEFT: Vehicle info + Services ── */}
          <div className="space-y-5">

            {/* Vehicle Info */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <Car className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Informasi Kendaraan</h2>
              </div>

              {/* 4-col grid info */}
              <div className="grid grid-cols-2 divide-x divide-border border-b border-border sm:grid-cols-4">
                {[
                  { label: "Plat Nomor", value: result.vehiclePlate, mono: true },
                  {
                    label: "Kendaraan",
                    value: [result.vehicleBrand, result.vehicleModel].filter(Boolean).join(" ") || "—",
                  },
                  {
                    label: "Tipe Layanan",
                    value: result.serviceType === "SERVIS" ? "Servis Bengkel" : "Cuci Kendaraan",
                  },
                  { label: "Teknisi", value: result.employeeName || "—" },
                ].map((item, i) => (
                  <div key={i} className="px-5 py-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.label}
                    </p>
                    <p
                      className={`mt-1 text-sm text-foreground ${
                        item.mono ? "font-mono font-bold tracking-wide" : "font-medium"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Owner row */}
              <div className="flex items-center gap-3 px-6 py-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Pemilik
                  </p>
                  <p className="text-sm font-semibold text-foreground">{result.customerName}</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Rincian Layanan</h2>
              </div>

              <div className="px-6 py-5 space-y-3">
                {result.services.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                      <span className="text-sm text-foreground">{s.name}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(s.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border px-6 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Total Biaya</span>
                  <span className="text-lg font-bold tabular-nums text-primary">
                    {formatCurrency(result.totalCost)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Column RIGHT: Progress + Timeline ── */}
          <div className="space-y-5">

            {/* Progress Steps */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status Pengerjaan
              </p>

              <div className="relative flex items-start justify-between">
                <div className="absolute left-3.5 right-3.5 top-3.5 h-px bg-border" />
                <div
                  className="absolute left-3.5 top-3.5 h-px bg-primary transition-all duration-700"
                  style={{
                    width: `calc(${((currentStep - 1) / 2) * 100}% - ${((currentStep - 1) / 2) * 1.75}rem + ${((currentStep - 1) / 2) * 1.75}rem)`,
                    maxWidth: "calc(100% - 1.75rem)",
                  }}
                />

                {STEPS.map((s) => {
                  const done = currentStep > s.step;
                  const active = currentStep === s.step;
                  return (
                    <div key={s.key} className="relative z-10 flex flex-col items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300 ${
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : active
                            ? "border-primary bg-background text-primary ring-4 ring-primary/20"
                            : "border-border bg-background text-muted-foreground"
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.step}
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          done || active ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Status detail */}
              <div
                className={`mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 ${config!.bgColor} ${config!.borderColor}`}
              >
                <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${config!.color}`} />
                <div>
                  <p className={`text-sm font-semibold ${config!.color}`}>{config!.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{config!.description}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-sm font-semibold text-foreground">Riwayat Waktu</h2>
              </div>
              <div className="px-6 py-5">
                {[
                  { label: "Kendaraan Masuk", time: result.createdAt, show: true },
                  { label: "Mulai Dikerjakan", time: result.startedAt, show: !!result.startedAt },
                  { label: "Selesai", time: result.completedAt, show: !!result.completedAt },
                ]
                  .filter((t) => t.show)
                  .map((t, i, arr) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                        {i < arr.length - 1 && (
                          <div className="w-px flex-1 bg-border my-1" style={{ minHeight: "2rem" }} />
                        )}
                      </div>
                      <div className="pb-5">
                        <p className="text-xs font-semibold text-muted-foreground">{t.label}</p>
                        <p className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
                          {formatDateTime(t.time!)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}