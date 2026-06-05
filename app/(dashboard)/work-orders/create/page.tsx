"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { PageSection } from "@/components/shared/page-section";
import { FilterBar } from "@/components/shared/filter-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Car,
  Wrench,
  ClipboardCheck,
  User,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

interface Customer {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string | null;
  model: string | null;
  color: string | null;
  type: string | null;
  customer: { id: string; name: string | null; phone: string };
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: string;
}

const steps = [
  { id: 1, title: "Customer", icon: User },
  { id: 2, title: "Kendaraan", icon: Car },
  { id: 3, title: "Layanan", icon: Wrench },
  { id: 4, title: "Review", icon: ClipboardCheck },
];

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Lists
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Search Queries
  const [customerSearch, setCustomerSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");

  // Stepper Selection States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Form States
  const [serviceType, setServiceType] = useState<"SERVIS" | "CUCI">("SERVIS");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [manualServices, setManualServices] = useState([
    { id: Date.now().toString(), name: "", price: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [vehicleHistory, setVehicleHistory] = useState<
    { id: string; name: string; price: number; date: string }[]
  >([]);

  // Inline forms toggles and states
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    phone: "",
    name: "",
    email: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: "",
    brand: "",
    model: "",
    type: "",
    color: "",
  });
  const [creatingVehicle, setCreatingVehicle] = useState(false);

  // Fetch initial data
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch("/api/vehicles");
      if (res.ok) {
        const data = await res.json();
        setVehicles(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/services?category=CUCI");
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchVehicles();
    fetchServices();
  }, [fetchCustomers, fetchVehicles, fetchServices]);

  // Fetch history when vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      fetch(`/api/vehicles/${selectedVehicle.id}/history`)
        .then((r) => r.json())
        .then((data) => {
          const past: { id: string; name: string; price: number; date: string }[] = [];
          data.forEach((wo: any) => {
            if (wo.status === "SELESAI" && wo.completedAt) {
              wo.services.forEach((s: any) => {
                past.push({
                  id: Math.random().toString(),
                  name: s.service.name,
                  price: Number(s.price),
                  date: wo.completedAt,
                });
              });
              wo.historyItems.forEach((h: any) => {
                past.push({
                  id: Math.random().toString(),
                  name: h.title,
                  price: Number(h.price),
                  date: wo.completedAt,
                });
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

  // Calculate totals
  const selectedServices = services.filter((s) => selectedServiceIds.includes(s.id));
  const totalCost =
    serviceType === "CUCI"
      ? selectedServices.reduce((sum, s) => sum + Number(s.price), 0)
      : manualServices.reduce((sum, ms) => sum + (parseInt(ms.price.replace(/\D/g, "")) || 0), 0) +
        selectedServices.reduce((sum, s) => sum + Number(s.price), 0);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => (prev.includes(id) ? [] : [id]));
  };

  // Create new customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.phone) return;
    setCreatingCustomer(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: newCustomer.phone,
          email: newCustomer.email || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchCustomers();
        setSelectedCustomer(data);
        setShowNewCustomerForm(false);
        setNewCustomer({ phone: "", name: "", email: "" });
        setStep(2); // Auto advance to vehicle step
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Create new vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newVehicle.plateNumber) return;
    setCreatingVehicle(true);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          plateNumber: newVehicle.plateNumber,
          brand: newVehicle.brand || null,
          model: newVehicle.model || null,
          type: newVehicle.type || null,
          color: newVehicle.color || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchVehicles();
        setSelectedVehicle(data);
        setShowNewVehicleForm(false);
        setNewVehicle({ plateNumber: "", brand: "", model: "", type: "", color: "" });
        setStep(3); // Auto advance to services step
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingVehicle(false);
    }
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
          manualServices: manualServices
            .filter((ms) => ms.name.trim() !== "")
            .map((ms) => ({
              name: ms.name,
              price: parseInt(ms.price.replace(/\D/g, "")) || 0,
            })),
          notes: notes || null,
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

  // Filtering lists in memory
  const filteredCustomers = customers.filter(
    (c) =>
      c.phone.includes(customerSearch) ||
      (c.name && c.name.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const filteredVehicles = selectedCustomer
    ? vehicles.filter((v) => v.customer.id === selectedCustomer.id)
    : vehicles;

  const canNext =
    (step === 1 && selectedCustomer) ||
    (step === 2 && selectedVehicle) ||
    (step === 3 && serviceType === "CUCI" && selectedServiceIds.length > 0) ||
    (step === 3 && serviceType === "SERVIS" && (manualServices.some((ms) => ms.name.trim() !== "") || selectedServiceIds.length > 0)) ||
    step === 4;

  return (
    <AppPage>
      {/* Header */}
      <PageHeader
        title="Buat Work Order Baru"
        description="Pendaftaran antrean jasa servis dan cuci kendaraan baru"
        backUrl="/work-orders"
      />

      {/* Stepper Steps */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        {/* Desktop Stepper */}
        <div className="hidden sm:flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all",
                    step > s.id
                      ? "bg-emerald-600 text-white"
                      : step === s.id
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s.id ? <Check className="h-4.5 w-4.5" /> : s.id}
                </div>
                <span
                  className={cn(
                    "text-xs font-bold tracking-wide",
                    step >= s.id ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {s.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-0.5 flex-1 rounded-full",
                    step > s.id ? "bg-emerald-600" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Mobile Stepper Progress */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span>
              Langkah {step}: {steps[step - 1].title}
            </span>
            <span className="text-muted-foreground">{step} / 4</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stepper Content */}
      <PageSection>
        {/* STEP 1: CUSTOMER */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base font-bold text-foreground">1. Pilih / Daftarkan Kontak</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Customer Baru
              </Button>
            </div>

            {showNewCustomerForm && (
              <form onSubmit={handleCreateCustomer} className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Registrasi Kontak Customer</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Nomor HP (WhatsApp)"
                    placeholder="08xxxxxxxxxx"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    required
                  />
                  <Input
                    label="Email (Opsional)"
                    placeholder="email@contoh.com"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => setShowNewCustomerForm(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" size="sm" loading={creatingCustomer}>
                    Simpan & Pilih
                  </Button>
                </div>
              </form>
            )}

            <FilterBar
              searchVal={customerSearch}
              onSearchChange={setCustomerSearch}
              searchPlaceholder="Cari kontak customer..."
            />

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {filteredCustomers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Customer tidak ditemukan.</p>
              ) : (
                filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setSelectedVehicle(null); // Reset vehicle on customer change
                    }}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all flex items-center justify-between cursor-pointer",
                      selectedCustomer?.id === c.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-slate-500/5"
                    )}
                  >
                    <div>
                      <p className="text-sm font-bold text-foreground">{c.phone}</p>
                      {c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                    </div>
                    {selectedCustomer?.id === c.id && <Check className="h-5 w-5 text-primary shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 2: VEHICLE */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Terpilih</p>
                <p className="text-sm font-bold text-foreground">{selectedCustomer?.phone}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                Ubah Customer
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base font-bold text-foreground">2. Pilih / Daftarkan Kendaraan</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewVehicleForm(!showNewVehicleForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Kendaraan Baru
              </Button>
            </div>

            {showNewVehicleForm && (
              <form onSubmit={handleCreateVehicle} className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Registrasi Kendaraan Baru</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Plat Nomor"
                    placeholder="B 1234 ABC"
                    value={newVehicle.plateNumber}
                    onChange={(e) =>
                      setNewVehicle({
                        ...newVehicle,
                        plateNumber: e.target.value.toUpperCase().replace(/\s+/g, ""),
                      })
                    }
                    required
                  />
                  <Input
                    label="Merek"
                    placeholder="Toyota"
                    value={newVehicle.brand}
                    onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                  />
                  <Input
                    label="Model"
                    placeholder="Avanza"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  />
                  <Input
                    label="Tipe (MPV, Sedan, etc.)"
                    placeholder="MPV"
                    value={newVehicle.type}
                    onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                  />
                  <Input
                    label="Warna"
                    placeholder="Hitam"
                    value={newVehicle.color}
                    onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    onClick={() => setShowNewVehicleForm(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit" size="sm" loading={creatingVehicle}>
                    Simpan & Pilih
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredVehicles.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-border rounded-xl text-center">
                  <p className="text-xs text-muted-foreground mb-3">Belum ada kendaraan terdaftar untuk customer ini.</p>
                  <Button size="sm" onClick={() => setShowNewVehicleForm(true)}>
                    Daftarkan Kendaraan Baru
                  </Button>
                </div>
              ) : (
                filteredVehicles.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVehicle(v)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all flex items-center justify-between cursor-pointer",
                      selectedVehicle?.id === v.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-slate-500/5"
                    )}
                  >
                    <div>
                      <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-sm font-bold text-foreground">
                        {v.plateNumber}
                      </span>
                      <p className="mt-2 text-xs text-muted-foreground font-semibold">
                        {[v.brand, v.model].filter(Boolean).join(" ") || "Tanpa Merek"}
                        {v.color && ` — Warna ${v.color}`}
                        {v.type && ` (${v.type})`}
                      </p>
                    </div>
                    {selectedVehicle?.id === v.id && <Check className="h-5 w-5 text-primary shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 3: SERVICES */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-foreground">3. Pilih Layanan Jasa & Cuci</h2>

            {/* Toggle Category */}
            <div className="flex rounded-xl border border-border p-1 bg-muted/20">
              <button
                type="button"
                onClick={() => setServiceType("SERVIS")}
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-bold transition-all cursor-pointer",
                  serviceType === "SERVIS"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Servis Bengkel
              </button>
              <button
                type="button"
                onClick={() => setServiceType("CUCI")}
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-bold transition-all cursor-pointer",
                  serviceType === "CUCI"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Cuci Kendaraan
              </button>
            </div>

            {serviceType === "CUCI" ? (
              <div className="space-y-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all flex items-center justify-between cursor-pointer",
                      selectedServiceIds.includes(s.id)
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30 hover:bg-slate-500/5"
                    )}
                  >
                    <span className="text-sm font-bold text-foreground">{s.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-foreground">
                        {formatCurrency(s.price)}
                      </span>
                      {selectedServiceIds.includes(s.id) && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Manual lines for Servis */}
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Baris Jasa Bengkel</h3>
                {manualServices.map((ms, index) => (
                  <div key={ms.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Nama Jasa (misal: Ganti Kampas Rem)"
                        value={ms.name}
                        onChange={(e) => {
                          const newMs = [...manualServices];
                          newMs[index].name = e.target.value;
                          setManualServices(newMs);
                        }}
                      />
                    </div>
                    <div className="w-36">
                      <Input
                        placeholder="Biaya Jasa (Rp)"
                        value={ms.price}
                        onChange={(e) => {
                          const newMs = [...manualServices];
                          let raw = e.target.value.replace(/\D/g, "");
                          newMs[index].price = raw
                            ? new Intl.NumberFormat("id-ID").format(parseInt(raw))
                            : "";
                          setManualServices(newMs);
                        }}
                      />
                    </div>
                    {manualServices.length > 1 && (
                      <Button
                        variant="outline"
                        type="button"
                        className="h-11 w-11 p-0 shrink-0 text-destructive border-border/80 hover:bg-destructive/10 hover:border-destructive/30"
                        onClick={() => {
                          setManualServices(manualServices.filter((item) => item.id !== ms.id));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  type="button"
                  onClick={() =>
                    setManualServices([
                      ...manualServices,
                      { id: Date.now().toString(), name: "", price: "" },
                    ])
                  }
                  className="w-full border-dashed"
                >
                  <Plus className="mr-1.5 h-4 w-4" /> Tambah Jasa Bengkel
                </Button>

                {/* Additional Wash category (Optional) */}
                <div className="pt-5 border-t border-border mt-6">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Layanan Cuci Tambahan (Opsional)</h3>
                  <div className="space-y-2">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-all flex items-center justify-between cursor-pointer",
                          selectedServiceIds.includes(s.id)
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/30 hover:bg-slate-500/5"
                        )}
                      >
                        <span className="text-sm font-bold text-foreground">{s.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-extrabold text-foreground">
                            {formatCurrency(s.price)}
                          </span>
                          {selectedServiceIds.includes(s.id) && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sum Indicator */}
            {totalCost > 0 && (
              <div className="rounded-2xl bg-muted/40 border border-border/50 p-4 flex items-center justify-between mt-4">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subtotal Biaya</span>
                <span className="text-lg font-black text-primary">{formatCurrency(totalCost)}</span>
              </div>
            )}

            {/* Past History */}
            {serviceType === "SERVIS" && vehicleHistory.length > 0 && (
              <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Histori Servis Sebelumnya</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {vehicleHistory.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between rounded-xl bg-card border border-border/80 p-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{h.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Selesai: {new Date(h.date).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-foreground">{formatCurrency(h.price)}</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs font-bold"
                          onClick={() => {
                            const newMs = [...manualServices];
                            if (newMs.length === 1 && !newMs[0].name) {
                              newMs[0] = {
                                id: Date.now().toString(),
                                name: h.name,
                                price: new Intl.NumberFormat("id-ID").format(h.price),
                              };
                            } else {
                              newMs.push({
                                id: Date.now().toString(),
                                name: h.name,
                                price: new Intl.NumberFormat("id-ID").format(h.price),
                              });
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

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-foreground">4. Review Akhir & Konfirmasi</h2>

            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-inner">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data Customer</p>
                  <p className="mt-1 text-sm font-bold text-foreground">
                    {selectedCustomer?.name || "Customer Bengkel"}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedCustomer?.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data Kendaraan</p>
                  <p className="mt-1 text-sm font-extrabold text-primary font-mono">
                    {selectedVehicle?.plateNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[selectedVehicle?.brand, selectedVehicle?.model].filter(Boolean).join(" — ")}
                  </p>
                </div>
              </div>

              <hr className="border-border/60" />

              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kategori Pengerjaan</p>
                <div className="mt-1">
                  <StatusBadge type="category" status={serviceType} showDot={false} />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Item Layanan Jasa</p>
                <div className="mt-2 space-y-2">
                  {serviceType === "CUCI" ? (
                    selectedServices.map((s) => (
                      <div key={s.id} className="flex justify-between text-sm text-foreground/90">
                        <span>{s.name}</span>
                        <span className="font-semibold">{formatCurrency(s.price)}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      {manualServices
                        .filter((m) => m.name.trim() !== "")
                        .map((ms) => (
                          <div key={ms.id} className="flex justify-between text-sm text-foreground/90">
                            <span>{ms.name}</span>
                            <span className="font-semibold">
                              {formatCurrency(parseInt(ms.price.replace(/\D/g, "")) || 0)}
                            </span>
                          </div>
                        ))}
                      {selectedServices.map((s) => (
                        <div key={s.id} className="flex justify-between text-sm text-foreground/90">
                          <span>
                            {s.name} <span className="text-xs text-muted-foreground">(Cuci Tambahan)</span>
                          </span>
                          <span className="font-semibold">{formatCurrency(s.price)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  <hr className="border-border/50 my-2" />
                  <div className="flex justify-between items-center text-sm font-extrabold pt-1">
                    <span className="text-foreground">Total Tagihan Jasa</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>

              <hr className="border-border/60" />

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                  Catatan Tambahan (Keluhan/Instruksi)
                </label>
                <Textarea
                  placeholder="Masukkan instruksi khusus atau keluhan pemilik kendaraan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl border border-input min-h-[80px]"
                />
              </div>
            </div>
          </div>
        )}
      </PageSection>

      {/* Navigation Actions */}
      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <Button
          variant="outline"
          onClick={() => (step === 1 ? router.back() : setStep(step - 1))}
          disabled={saving}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {step === 1 ? "Batal" : "Sebelumnya"}
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
            Lanjut
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={saving} disabled={saving}>
            <Check className="h-4 w-4 mr-1" />
            Buat Work Order
          </Button>
        )}
      </div>
    </AppPage>
  );
}
