"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Car,
  Wrench,
  UserCheck,
  ClipboardCheck,
  Plus,
  Search,
} from "lucide-react";

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  customer: { id: string; name: string; phone: string };
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: string;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  _count?: { workOrders: number };
}

const steps = [
  { id: 1, title: "Kendaraan", icon: Car },
  { id: 2, title: "Layanan", icon: Wrench },
  { id: 3, title: "Konfirmasi", icon: ClipboardCheck },
];

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState("");

  // Form
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [serviceType, setServiceType] = useState<"SERVIS" | "CUCI">("SERVIS");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [manualServices, setManualServices] = useState([{ id: Date.now().toString(), name: "", price: "" }]);
  const [notes, setNotes] = useState("");
  const [vehicleHistory, setVehicleHistory] = useState<{ id: string, name: string, price: number, date: string }[]>([]);

  // ETA Form
  const [etaType, setEtaType] = useState<"preset" | "manual">("preset");
  const [etaPreset, setEtaPreset] = useState<number>(60); // Default 60 minutes
  const [etaManual, setEtaManual] = useState<string>("");

  // New customer inline form
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    phone: "", plateNumber: "", brand: "", model: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  useEffect(() => {
    fetch("/api/vehicles?search=" + encodeURIComponent(vehicleSearch))
      .then((r) => r.json())
      .then((data) => setVehicles(Array.isArray(data) ? data : (data.data || [])));
  }, [vehicleSearch]);

  useEffect(() => {
    if (selectedVehicle) {
      fetch(`/api/vehicles/${selectedVehicle.id}/history`)
        .then(r => r.json())
        .then(data => {
          const past: { id: string, name: string, price: number, date: string }[] = [];
          data.forEach((wo: any) => {
            if (wo.status === "SELESAI" && wo.completedAt) {
              wo.services.forEach((s: any) => {
                past.push({ id: Math.random().toString(), name: s.service.name, price: Number(s.price), date: wo.completedAt });
              });
              wo.historyItems.forEach((h: any) => {
                past.push({ id: Math.random().toString(), name: h.title, price: Number(h.price), date: wo.completedAt });
              });
            }
          });
          setVehicleHistory(past);
        })
        .catch(() => setVehicleHistory([]));
    } else {
      setVehicleHistory([]);
    }
  }, [selectedVehicle]);

  useEffect(() => {
    fetch("/api/services?category=CUCI")
      .then((r) => r.json())
      .then(setServices);
  }, []);


  const selectedServices = services.filter((s) =>
    selectedServiceIds.includes(s.id)
  );
  
  const totalCost = serviceType === "CUCI"
    ? selectedServices.reduce((sum, s) => sum + Number(s.price), 0)
    : manualServices.reduce((sum, ms) => sum + (parseInt(ms.price.replace(/\D/g, "")) || 0), 0) + selectedServices.reduce((sum, s) => sum + Number(s.price), 0);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? [] : [id]
    );
  };

  const handleCreateCustomer = async () => {
    setCreatingCustomer(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: newCustomer.phone,
        vehicle: {
          plateNumber: newCustomer.plateNumber,
          brand: newCustomer.brand,
          model: newCustomer.model,
        },
      }),
    });
    if (res.ok) {
      const customer = await res.json();
      const vRes = await fetch("/api/vehicles");
      const vJson = await vRes.json();
      const vData = Array.isArray(vJson) ? vJson : (vJson.data || []);
      setVehicles(vData);
      const newVehicle = vData.find(
        (v: Vehicle) => v.customer.id === customer.id
      );
      if (newVehicle) setSelectedVehicle(newVehicle);
      setShowNewCustomer(false);
      setNewCustomer({ phone: "", plateNumber: "", brand: "", model: "" });
    }
    setCreatingCustomer(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicle?.id,
          serviceType,
          serviceIds: selectedServiceIds,
          manualServices: serviceType === "SERVIS" 
            ? manualServices.filter(ms => ms.name.trim() !== "").map(ms => ({ name: ms.name, price: parseInt(ms.price.replace(/\D/g, "")) || 0 }))
            : [],
          notes: notes || null,
          estimatedCompletionAt: (() => {
            if (etaType === "preset" && etaPreset > 0) {
              const d = new Date();
              d.setMinutes(d.getMinutes() + etaPreset);
              return d.toISOString();
            } else if (etaType === "manual" && etaManual) {
              return new Date(etaManual).toISOString();
            }
            return undefined;
          })(),
        }),
      });
      
      if (res.ok) {
        const wo = await res.json();
        router.push(`/work-orders/${wo.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal membuat work order. Silakan coba lagi.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan atau server.");
    } finally {
      setSaving(false);
    }
  };

  const canNext =
    (step === 1 && selectedVehicle) ||
    (step === 2 && serviceType === "CUCI" && selectedServiceIds.length > 0) ||
    (step === 2 && serviceType === "SERVIS" && manualServices.some(ms => ms.name.trim() !== "")) ||
    step === 3; // Konfirmasi is always valid

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-xl p-2 text-muted-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Buat Work Order</h1>
          <p className="text-sm text-muted-foreground">
            Ikuti langkah-langkah di bawah
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="rounded-2xl border border-border bg-card p-4">
        {/* Desktop stepper */}
        <div className="hidden items-center justify-between sm:flex">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all",
                    step > s.id
                      ? "bg-success text-success-foreground"
                      : step === s.id
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s.id ? <Check className="h-4 w-4" /> : s.id}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    step >= s.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.title}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-0.5 flex-1 rounded-full",
                    step > s.id ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile progress bar */}
        <div className="sm:hidden">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Step {step}: {steps[step - 1].title}
            </span>
            <span className="text-muted-foreground">{step}/3</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        {/* Step 1: Select Vehicle */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Pilih Kendaraan
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewCustomer(!showNewCustomer)}
              >
                <Plus className="h-4 w-4" />
                Customer Baru
              </Button>
            </div>

            {showNewCustomer && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Daftar Customer Baru</h3>
                <div className="grid gap-3 sm:grid-cols-1">
                  <Input label="No. HP" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} required />
                </div>
                <Input label="Plat Nomor" maxLength={9} value={newCustomer.plateNumber} onChange={(e) => setNewCustomer({ ...newCustomer, plateNumber: e.target.value.toUpperCase().replace(/\s+/g, "") })} required />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="Merek" value={newCustomer.brand} onChange={(e) => setNewCustomer({ ...newCustomer, brand: e.target.value.toUpperCase() })} />
                  <Input label="Model" value={newCustomer.model} onChange={(e) => setNewCustomer({ ...newCustomer, model: e.target.value.toUpperCase() })} />
                </div>
                <Button size="sm" loading={creatingCustomer} onClick={handleCreateCustomer}>
                  Simpan & Pilih
                </Button>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari plat nomor atau merk..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="max-h-[350px] space-y-2 overflow-y-auto">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-all",
                    selectedVehicle?.id === v.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30 hover:bg-accent/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-sm font-bold text-foreground">
                        {v.plateNumber}
                      </span>
                      <span className="ml-3 text-sm text-muted-foreground">
                        {[v.brand, v.model].filter(Boolean).join(" ")}
                      </span>
                    </div>
                    {selectedVehicle?.id === v.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {v.brand || "-"} {v.model || "-"} — {v.customer.phone}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Services */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Pilih Layanan
            </h2>

            {/* Service Type Toggle */}
            <div className="flex rounded-xl border border-border p-1">
              <button
                onClick={() => setServiceType("SERVIS")}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                  serviceType === "SERVIS"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Servis Bengkel
              </button>
              <button
                onClick={() => setServiceType("CUCI")}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                  serviceType === "CUCI"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Cuci Kendaraan
              </button>
            </div>

            {serviceType === "CUCI" ? (
              <div className="space-y-2">
                {services.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <p className="text-sm font-medium text-foreground">Belum ada layanan cuci</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Silakan tambahkan layanan cuci di menu Pengaturan terlebih dahulu.
                    </p>
                  </div>
                ) : (
                  services.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left transition-all",
                        selectedServiceIds.includes(s.id)
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/30 hover:bg-accent/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {s.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(s.price)}
                          </span>
                          {selectedServiceIds.includes(s.id) && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {manualServices.map((ms, index) => (
                  <div key={ms.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input 
                        placeholder="Contoh: Ganti Kampas Rem" 
                        value={ms.name}
                        onChange={(e) => {
                          const newMs = [...manualServices];
                          newMs[index].name = e.target.value;
                          setManualServices(newMs);
                        }}
                      />
                    </div>
                    <div className="w-1/3">
                      <Input 
                        placeholder="Rp 0" 
                        value={ms.price}
                        onChange={(e) => {
                          const newMs = [...manualServices];
                          // Simple number format logic for manual UI
                          let raw = e.target.value.replace(/\D/g, "");
                          if (raw) {
                            newMs[index].price = new Intl.NumberFormat("id-ID").format(parseInt(raw));
                          } else {
                            newMs[index].price = "";
                          }
                          setManualServices(newMs);
                        }}
                      />
                    </div>
                    {manualServices.length > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 w-10 p-0 flex justify-center items-center shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          setManualServices(manualServices.filter(item => item.id !== ms.id));
                        }}
                      >
                        <Wrench className="h-4 w-4" style={{ transform: "rotate(45deg)" }} /> {/* acts like an X if we don't import Trash/X */}
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  onClick={() => setManualServices([...manualServices, { id: Date.now().toString(), name: "", price: "" }])}
                  className="w-full mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah Baris Jasa
                </Button>

                <div className="pt-6 border-t border-border mt-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Layanan Cuci Tambahan (Opsional)</h3>
                  <div className="space-y-2">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-all",
                          selectedServiceIds.includes(s.id)
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/30 hover:bg-accent/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {s.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-foreground">
                              {formatCurrency(s.price)}
                            </span>
                            {selectedServiceIds.includes(s.id) && (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                <Check className="h-3 w-3 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {(serviceType === "CUCI" ? selectedServiceIds.length > 0 : (manualServices.some(m => m.name.trim() !== "") || selectedServiceIds.length > 0)) && (
              <div className="rounded-xl bg-muted/50 p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {serviceType === "CUCI" ? `${selectedServiceIds.length} layanan dipilih` : "Total Biaya Jasa & Cuci"}
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              </div>
            )}

            {/* Estimasi Waktu Selesai (ETA) Section */}
            <div className="pt-6 border-t border-border mt-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Estimasi Waktu Selesai</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      checked={etaType === "preset"} 
                      onChange={() => setEtaType("preset")} 
                      className="accent-primary" 
                    />
                    Pilih Durasi
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      checked={etaType === "manual"} 
                      onChange={() => setEtaType("manual")} 
                      className="accent-primary" 
                    />
                    Waktu Spesifik
                  </label>
                </div>

                {etaType === "preset" ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {[15, 30, 45, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setEtaPreset(mins)}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          etaPreset === mins
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {mins} mnt
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="w-full sm:w-1/2">
                    <Input 
                      type="datetime-local" 
                      value={etaManual} 
                      onChange={(e) => setEtaManual(e.target.value)} 
                    />
                  </div>
                )}
              </div>
            </div>

            {serviceType === "SERVIS" && vehicleHistory.length > 0 && (
              <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <h3 className="mb-3 text-sm font-semibold text-primary">Histori Servis Sebelumnya</h3>
                <div className="space-y-2">
                  {vehicleHistory.map((h) => (
                     <div key={h.id} className="flex items-center justify-between rounded-lg bg-background p-3 text-sm border border-border">
                       <div>
                         <p className="font-medium text-foreground">{h.name}</p>
                         <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString("id-ID")}</p>
                       </div>
                       <div className="text-right flex items-center gap-3">
                         <p className="font-semibold">{formatCurrency(h.price)}</p>
                         <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-7 text-xs" 
                            onClick={() => {
                               const newMs = [...manualServices];
                               if (newMs.length === 1 && !newMs[0].name) {
                                 newMs[0] = { id: Date.now().toString(), name: h.name, price: new Intl.NumberFormat("id-ID").format(h.price) };
                               } else {
                                 newMs.push({ id: Date.now().toString(), name: h.name, price: new Intl.NumberFormat("id-ID").format(h.price) });
                               }
                               setManualServices(newMs);
                            }}
                         >
                           Gunakan Lagi
                         </Button>
                       </div>
                     </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-foreground">
              Konfirmasi Work Order
            </h2>

            <div className="space-y-4 rounded-xl border border-border p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Customer
                  </p>
                  <div className="font-medium text-foreground">
                  {selectedVehicle?.brand || "-"} {selectedVehicle?.model || "-"}
                </div>
                <div className="text-muted-foreground">
                  {selectedVehicle?.customer.phone}
                </div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Kendaraan
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedVehicle?.plateNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[selectedVehicle?.brand, selectedVehicle?.model]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                </div>
              </div>

              <hr className="border-border" />

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Tipe Layanan
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {serviceType === "SERVIS" ? "Servis Bengkel" : "Cuci Kendaraan"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Layanan Dipilih
                </p>
                <div className="mt-2 space-y-1">
                  {serviceType === "CUCI" ? (
                    selectedServices.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-foreground">{s.name}</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(s.price)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      {manualServices.filter(m => m.name.trim() !== "").map((ms) => (
                        <div
                          key={ms.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">{ms.name}</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(parseInt(ms.price.replace(/\D/g, "")) || 0)}
                          </span>
                        </div>
                      ))}
                      {selectedServices.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">{s.name} <span className="text-xs text-muted-foreground">(Cuci Tambahan)</span></span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(s.price)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  <hr className="border-border" />
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-lg text-primary">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              {notes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Catatan
                  </p>
                  <p className="mt-1 text-sm text-foreground">{notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation - Sticky on mobile */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-between bg-background px-4 py-4 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0">
        <Button
          variant="outline"
          onClick={() => (step === 1 ? router.back() : setStep(step - 1))}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{step === 1 ? "Batal" : "Sebelumnya"}</span>
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
          >
            <span className="hidden sm:inline">Selanjutnya</span>
            <span className="sm:hidden">Lanjut</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={saving}>
            <Check className="h-4 w-4" />
            Buat Work Order
          </Button>
        )}
      </div>
    </div>
  );
}
