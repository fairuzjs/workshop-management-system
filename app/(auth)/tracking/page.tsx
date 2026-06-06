"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  Wrench,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Car,
  User,
  Receipt,
  Sparkles,
  ShieldCheck,
  Smartphone,
  ArrowLeft,
  Phone,
  Package,
  PlusCircle,
  Activity,
  Check
} from "lucide-react";

interface TrackingResult {
  trackingToken: string;
  status: string;
  serviceType: string;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  customerPhone: string;
  employeeName: string | null;
  services: { name: string; price: number; employees?: { name: string; position: string }[] }[];
  parts?: { name: string; qty: number; price: number }[];
  historyItems?: { name: string; price: number; employees?: { name: string }[] }[];
  totalCost: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedCompletionAt?: string | null;
  isPaid: boolean;
  paidAt: string | null;
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
    label: "Kendaraan Masuk Antrian",
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/10",
    borderColor: "border-amber-500/20 dark:border-amber-500/30",
    icon: Clock,
    description: "Kendaraan Anda sedang menunggu giliran pengerjaan.",
    step: 1,
  },
  PROSES: {
    label: "Kendaraan Sedang Dikerjakan",
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/10",
    borderColor: "border-blue-500/20 dark:border-blue-500/30",
    icon: Wrench,
    description: "Teknisi kami sedang menangani kendaraan Anda.",
    step: 2,
  },
  SELESAI: {
    label: "Kendaraan Anda Sudah Selesai",
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/10",
    borderColor: "border-emerald-500/20 dark:border-emerald-500/30",
    icon: CheckCircle2,
    description: "Kendaraan Anda sudah selesai. Silakan ambil di bengkel.",
    step: 3,
  },
};

const STEPS = [
  { key: "ANTRI", label: "Antrian", step: 1, desc: "Menunggu Giliran" },
  { key: "PROSES", label: "Dikerjakan", step: 2, desc: "Sedang Ditangani" },
  { key: "SELESAI", label: "Selesai", step: 3, desc: "Siap Diambil" },
  { key: "LUNAS", label: "Lunas", step: 4, desc: "Pembayaran Selesai" },
];

export default function TrackingPage() {
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"status" | "billing">("status");

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
        setActiveTab("status"); // Reset to status tab on load
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

  useEffect(() => {
    if (!result || (result.status === "SELESAI" && result.isPaid)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/tracking?token=${encodeURIComponent(token)}&phone=${encodeURIComponent(phone)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [result, token, phone]);

  // Dynamically update document title for SEO & context
  useEffect(() => {
    if (result) {
      document.title = `Lacak - ${result.trackingToken} | Workshop Management`;
    } else {
      document.title = "Cek Status Kendaraan | Workshop Management";
    }
  }, [result]);

  const config = result ? statusConfig[result.status] || statusConfig["ANTRI"] : null;
  const StatusIcon = config?.icon || Clock;
  
  let currentStep = config?.step ?? 0;
  let headerLabel = config?.label ?? "";
  let headerDesc = config?.description ?? "";
  
  if (result && result.status === "SELESAI" && result.isPaid) {
    currentStep = 4;
    headerLabel = "Transaksi Selesai & Lunas";
    headerDesc = "Pembayaran telah diterima. Terima kasih atas kunjungan Anda!";
  }

  const lastUpdate = result ? (result.completedAt || result.startedAt || result.createdAt) : "";

  // License plate rendering helper
  const PlateMock = ({ plate }: { plate: string }) => {
    return (
      <div className="inline-flex flex-col items-center justify-center rounded-xl border-2 border-slate-950 bg-slate-900 px-4 py-1 text-white shadow-md font-mono dark:border-slate-800 dark:bg-slate-800">
        <span className="text-[12px] font-black tracking-widest leading-tight">{plate.toUpperCase()}</span>
        <div className="w-full h-[1px] bg-white/20 my-0.5" />
        <span className="text-[8px] tracking-[0.2em] font-semibold text-slate-400 leading-none">WORKSHOP ID</span>
      </div>
    );
  };

  /* ── Search Form (Page Awal Tracking) ── */
  if (!result) {
    return (
      <div className="min-h-screen bg-background relative flex flex-col justify-between overflow-x-hidden">
        {/* Dynamic elegant decorative background blobs */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl opacity-60" />
          <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl opacity-40" />
        </div>

        {/* Header Branding */}
        <header className="border-b border-border bg-card/65 backdrop-blur-md sticky top-0 z-50 transition-all">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-foreground">Workshop Management</span>
                <span className="text-[10px] text-muted-foreground font-medium -mt-0.5">Portal Pelanggan</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Pelacakan Aktif</span>
            </div>
          </div>
        </header>

        {/* Main Section */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid w-full gap-12 lg:grid-cols-12 lg:items-center">
            
            {/* Kolom Kiri: Hero & Benefits */}
            <div className="space-y-8 lg:col-span-6 xl:col-span-7">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3 w-3" />
                  <span>Pelacakan Terintegrasi</span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight">
                  Cek Status <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">Kendaraan Anda</span>
                </h1>
                <p className="max-w-xl text-sm text-muted-foreground sm:text-base leading-relaxed">
                  Masukkan kode tracking dan 4 digit terakhir nomor HP untuk melihat status kendaraan Anda secara real-time.
                </p>
              </div>

              {/* Benefits Cards */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                {[
                  {
                    icon: Clock,
                    title: "Status Real-Time",
                    desc: "Pantau tiap tahap pengerjaan langsung.",
                    color: "text-blue-500 bg-blue-500/10",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Aman & Rahasia",
                    desc: "Keamanan data dengan validasi nomor HP.",
                    color: "text-emerald-500 bg-emerald-500/10",
                  },
                  {
                    icon: Smartphone,
                    title: "Mudah Diakses",
                    desc: "Cek langsung dari gadget Anda kapan saja.",
                    color: "text-amber-500 bg-amber-500/10",
                  },
                ].map((benefit, i) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={i}
                      className="flex flex-col gap-2.5 rounded-2xl border border-border/50 bg-card/40 p-4 transition-all hover:border-border hover:shadow-md hover:shadow-slate-100/10 dark:hover:shadow-none"
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${benefit.color}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground">{benefit.title}</h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{benefit.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Decorative Visual Preview */}
              <div className="hidden lg:block relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-tr from-slate-50 to-white p-6 shadow-sm dark:from-slate-900/50 dark:to-slate-900/10">
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-bold text-foreground font-mono">ESTIMASI PREVIEW</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Online
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">Kendaraan Anda</span>
                    <span className="text-muted-foreground font-mono text-[10px]">Sedang Dikerjakan (Step 2)</span>
                  </div>
                  {/* Miniature progress simulator */}
                  <div className="flex items-center gap-2 py-1">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <div className="h-1 flex-1 rounded-full bg-primary" />
                    <div className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20" />
                    <div className="h-1 flex-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Status terbaru diperbarui langsung oleh mekanik kami di area workshop.
                  </p>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Form Tracking */}
            <div className="lg:col-span-6 xl:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-xl shadow-slate-100/50 dark:shadow-none sm:p-8">
                <div className="absolute top-0 right-0 h-32 w-32 -mr-8 -mt-8 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
                
                <div className="relative space-y-6">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-foreground">Cek Status Kendaraan</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Masukkan data pelacakan yang diberikan oleh pihak bengkel kami.
                    </p>
                  </div>

                  <form onSubmit={handleTrack} className="space-y-5">
                    {error && (
                      <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3.5 animate-slide-up">
                        <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-destructive" />
                        <p className="text-xs font-semibold text-destructive leading-normal">{error}</p>
                      </div>
                    )}

                    {/* Input Kode Tracking */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Kode Tracking
                        </label>
                        <span className="text-[10px] text-muted-foreground font-mono">Max 8 Karakter</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={token}
                          onChange={(e) => setToken(e.target.value.toUpperCase())}
                          placeholder="AB3K7NP2"
                          maxLength={8}
                          required
                          className="flex h-14 w-full rounded-2xl border border-input bg-background/50 px-4 text-center font-mono text-xl font-bold tracking-[0.2em] text-foreground placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/30 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all uppercase"
                        />
                      </div>
                    </div>

                    {/* Input 4 Digit Nomor HP */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          4 Digit Terakhir No. HP
                        </label>
                        <span className="text-[10px] text-muted-foreground font-mono">Hanya Angka</span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          placeholder="7890"
                          maxLength={4}
                          required
                          className="flex h-14 w-full rounded-2xl border border-input bg-background/50 px-4 text-center font-mono text-xl font-bold tracking-[0.2em] text-foreground placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-muted-foreground/30 focus:border-primary focus:bg-background focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                      </div>
                    </div>

                    {/* Button Submit */}
                    <button
                      type="submit"
                      disabled={loading || token.length < 4 || phone.length !== 4}
                      className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/95 hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          <span>Mencari Data...</span>
                        </>
                      ) : (
                        <>
                          <Search className="h-4.5 w-4.5" />
                          <span>Cek Status Kendaraan</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/40 p-4 border border-border/40 text-center">
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Kode tracking tersedia pada struk pendaftaran atau notifikasi digital yang Anda terima saat kendaraan masuk bengkel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ── Result View (Detail Tracking) ── */
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#080B12] flex flex-col justify-between overflow-x-hidden">
      
      {/* Elegant background blobs in detail view */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 right-0 h-96 w-96 rounded-full blur-3xl opacity-20 ${config!.bgColor}`} />
        <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-slate-500/5 blur-3xl opacity-20" />
      </div>

      <div>
        {/* 1. Header Compact */}
        <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-md transition-all">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="group flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95"
                title="Kembali"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground leading-none">Workshop Portal</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-mono text-[9px] font-bold text-muted-foreground uppercase leading-none bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {result.trackingToken}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
              <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${config!.bgColor} ${config!.borderColor}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${config!.color.includes("emerald") ? "bg-emerald-500" : config!.color.includes("blue") ? "bg-blue-500" : "bg-amber-500"} ${result.status === "SELESAI" ? "" : "animate-pulse"}`} />
                <span className={`text-[10px] font-extrabold ${config!.color}`}>
                  {result.status}
                </span>
              </div>
              {result.isPaid && (
                <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-extrabold text-emerald-500">LUNAS</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          
          {/* 2. Hero Status Card */}
          <div className="animate-fade-in relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-md sm:p-8">
            <div className="absolute top-0 right-0 h-32 w-32 -mr-8 -mt-8 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative">
              <div className="flex items-start gap-4">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 ${config!.bgColor} ${config!.borderColor} shadow-sm`}>
                  <StatusIcon className={`h-7 w-7 ${config!.color}`} />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block">
                    Kondisi Pelacakan
                  </span>
                  <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
                    {headerLabel}
                  </h1>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                    {headerDesc}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end justify-center pt-4 sm:pt-0 border-t sm:border-t-0 border-border/40 gap-2.5 shrink-0">
                <div className="text-left sm:text-right">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">KODE PELACAKAN</span>
                  <span className="font-mono text-base font-extrabold text-foreground tracking-wider">{result.trackingToken}</span>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">UPDATE TERAKHIR</span>
                  <span className="text-xs font-semibold text-foreground font-mono">{formatDateTime(lastUpdate)}</span>
                </div>
              </div>
            </div>

            {/* ETA Section */}
            {result.estimatedCompletionAt && result.status !== "SELESAI" && (
              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">
                    Estimasi Selesai
                  </p>
                  <p className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300">
                    {formatDateTime(result.estimatedCompletionAt)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. Progress Status */}
          <div className="animate-fade-in rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
            <div className="relative flex items-center justify-between">
              {/* Line background */}
              <div className="absolute left-6 right-6 top-5 h-1 -translate-y-1/2 bg-slate-100 dark:bg-slate-800 rounded-full" />
              
              {/* Completed line progress bar */}
              <div
                className="absolute left-6 top-5 h-1 -translate-y-1/2 bg-primary rounded-full transition-all duration-700"
                style={{
                  width: `calc(${((currentStep - 1) / 3) * 100}% - ${((currentStep - 1) / 3) * 12}px)`,
                  maxWidth: "100%",
                }}
              />

              {STEPS.map((s) => {
                const isFinalStepAndActive = currentStep === s.step && s.step === 4;
                const done = currentStep > s.step || isFinalStepAndActive;
                const active = currentStep === s.step;
                
                let stepBadgeColor = "border-slate-200 bg-background text-muted-foreground dark:border-slate-800";
                if (done) {
                  stepBadgeColor = "border-primary bg-primary text-primary-foreground";
                } else if (active) {
                  stepBadgeColor = "border-primary bg-background text-primary ring-4 ring-primary/10 dark:bg-[#101624]";
                }

                return (
                  <div key={s.key} className="relative z-10 flex flex-col items-center gap-2 text-center flex-1">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${stepBadgeColor}`}
                    >
                      {done ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : <span>{s.step}</span>}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-bold ${done || active ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>
                        {s.label}
                      </span>
                      <span className="hidden sm:inline-block text-[9px] text-muted-foreground mt-0.5">
                        {s.desc}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Tab Navigation */}
          <div className="animate-fade-in flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-900 transition-all">
            <button
              onClick={() => setActiveTab("status")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold tracking-wide transition-all ${
                activeTab === "status"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="h-4 w-4 shrink-0" />
              <span>Status & Kendaraan</span>
            </button>
            <button
              onClick={() => setActiveTab("billing")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold tracking-wide transition-all ${
                activeTab === "billing"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Receipt className="h-4 w-4 shrink-0" />
              <span>Ringkasan Biaya</span>
            </button>
          </div>

          {/* 5. Tab Content */}
          <div className="animate-fade-in space-y-6">
            {activeTab === "status" ? (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-12 items-start">
                
                {/* Timeline (Left side on desktop/large, full on mobile) */}
                <div className="md:col-span-5 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
                  <div className="flex items-center gap-2 pb-4 border-b border-border/40">
                    <Clock className="h-4.5 w-4.5 text-muted-foreground" />
                    <h2 className="text-sm font-bold text-foreground">Riwayat Status</h2>
                  </div>

                  <div className="mt-6 pl-1 space-y-6">
                    {[
                      { label: "Kendaraan Masuk", time: result.createdAt, show: true, subtitle: "Penerimaan bengkel" },
                      { 
                        label: "Mulai Dikerjakan", 
                        time: result.startedAt, 
                        show: !!result.startedAt, 
                        subtitle: result.employeeName ? `Dikerjakan oleh: ${result.employeeName}` : "Teknisi melakukan pengerjaan" 
                      },
                      { label: "Selesai", time: result.completedAt, show: !!result.completedAt, subtitle: "Siap diserahkan kembali" },
                      { label: "Pembayaran Lunas", time: result.paidAt, show: result.isPaid, subtitle: "Transaksi selesai" },
                    ]
                      .filter((t) => t.show)
                      .map((t, i, arr) => {
                        const isLast = i === arr.length - 1;
                        return (
                          <div key={i} className="flex gap-4">
                            <div className="flex flex-col items-center shrink-0">
                              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              </div>
                              {!isLast && (
                                <div className="w-px flex-1 bg-border/80 my-2" style={{ minHeight: "1.75rem" }} />
                              )}
                            </div>
                            <div className="pb-1">
                              <p className="text-xs font-bold text-foreground">{t.label}</p>
                              <p className="text-[10px] text-muted-foreground">{t.subtitle}</p>
                              <p className="mt-1.5 text-[11px] font-bold font-mono text-primary tabular-nums">
                                {formatDateTime(t.time!)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Informasi Kendaraan (Right side on desktop/large, full on mobile) */}
                <div className="md:col-span-7 rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2 pb-4 border-b border-border/40">
                    <Car className="h-4.5 w-4.5 text-muted-foreground" />
                    <h2 className="text-sm font-bold text-foreground">Informasi Kendaraan</h2>
                  </div>

                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    
                    {/* Plat Nomor */}
                    <div className="sm:col-span-2 rounded-2xl border border-border/50 bg-slate-50/50 p-4 dark:bg-slate-900/30 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Plat Nomor</span>
                        <span className="text-[10px] text-muted-foreground">Plat terdaftar</span>
                      </div>
                      <PlateMock plate={result.vehiclePlate} />
                    </div>

                    {/* Spesifikasi Kendaraan */}
                    <div className="rounded-2xl border border-border/50 bg-slate-50/50 p-4 dark:bg-slate-900/30 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                        <Car className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Kendaraan</span>
                        <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                          {[result.vehicleBrand, result.vehicleModel].filter(Boolean).join(" ") || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Layanan */}
                    <div className="rounded-2xl border border-border/50 bg-slate-50/50 p-4 dark:bg-slate-900/30 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Tipe Layanan</span>
                        <span className="text-xs font-bold text-foreground">
                          {result.serviceType === "SERVIS" ? "Servis" : "Cuci"}
                        </span>
                      </div>
                    </div>

                    {/* Teknisi */}
                    <div className="rounded-2xl border border-border/50 bg-slate-50/50 p-4 dark:bg-slate-900/30 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Mekanik</span>
                        <span className="text-xs font-bold text-foreground">
                          {result.employeeName || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Kontak */}
                    <div className="rounded-2xl border border-border/50 bg-slate-50/50 p-4 dark:bg-slate-900/30 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Telepon</span>
                        <span className="text-xs font-bold text-foreground font-mono">
                          {result.customerPhone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: Ringkasan Biaya */
              <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm animate-fade-in">
                {/* Billing Header */}
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4.5 w-4.5 text-muted-foreground" />
                    <h2 className="text-sm font-bold text-foreground">Rincian Estimasi Biaya</h2>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${
                    result.status === "SELESAI" 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                  }`}>
                    {result.status === "SELESAI" ? "TOTAL FINAL" : "ESTIMASI SEMENTARA"}
                  </span>
                </div>

                {/* Billing Content */}
                <div className="p-6 space-y-6">
                  {/* Services */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 pb-1 border-b border-border/20">
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Layanan Utama / Jasa</span>
                    </div>
                    {result.services.map((s, i) => (
                      <div key={i} className="flex flex-col py-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-foreground">{s.name}</span>
                          <span className="font-bold font-mono text-foreground tabular-nums">
                            {formatCurrency(s.price)}
                          </span>
                        </div>
                        {s.employees && s.employees.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {s.employees.map((emp, idx) => (
                              <span key={idx} className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground">
                                <User className="h-2.5 w-2.5 mr-1" />
                                {emp.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Spareparts */}
                  {result.parts && result.parts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-border/20">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Suku Cadang / Sparepart</span>
                      </div>
                      {result.parts.map((p, i) => (
                        <div key={`p-${i}`} className="flex items-center justify-between text-xs py-0.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-foreground">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground">Jumlah: {p.qty} × {formatCurrency(p.price / p.qty)}</span>
                          </div>
                          <span className="font-bold font-mono text-foreground tabular-nums">
                            {formatCurrency(p.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pekerjaan Tambahan / Riwayat Items */}
                  {result.historyItems && result.historyItems.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-border/20">
                        <PlusCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pekerjaan Tambahan</span>
                      </div>
                      {result.historyItems.map((h, i) => (
                        <div key={`h-${i}`} className="flex flex-col py-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">{h.name}</span>
                            <span className="font-bold font-mono text-foreground tabular-nums">
                              {formatCurrency(h.price)}
                            </span>
                          </div>
                          {h.employees && h.employees.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {h.employees.map((emp, idx) => (
                                <span key={idx} className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground">
                                  <User className="h-2.5 w-2.5 mr-1" />
                                  {emp.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Billing Summary Footer */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-border/80 px-6 py-5 flex items-center justify-between relative overflow-hidden">
                  {result.isPaid && (
                    <div className="absolute inset-0 bg-emerald-500/5 flex items-center justify-center opacity-30 pointer-events-none">
                      <div className="rotate-[-10deg] border-4 border-emerald-500 text-emerald-500 font-black text-2xl px-6 py-1 tracking-widest rounded-lg">
                        LUNAS
                      </div>
                    </div>
                  )}
                  <div className="space-y-0.5 relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
                      {result.status === "SELESAI" ? "Total Final" : "Total Sementara"}
                    </span>
                    <span className="text-[9px] text-muted-foreground">Pajak sudah termasuk</span>
                  </div>
                  <span className="text-xl font-black font-mono text-primary tracking-wide tabular-nums">
                    {formatCurrency(result.totalCost)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}