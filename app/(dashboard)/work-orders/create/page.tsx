"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
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
}

const steps = [
  { id: 1, title: "Kendaraan", icon: Car },
  { id: 2, title: "Layanan", icon: Wrench },
  { id: 3, title: "Petugas", icon: UserCheck },
  { id: 4, title: "Konfirmasi", icon: ClipboardCheck },
];

export default function CreateWorkOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicleSearch, setVehicleSearch] = useState("");

  // Form
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [serviceType, setServiceType] = useState<"SERVIS" | "CUCI">("SERVIS");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [notes, setNotes] = useState("");

  // New customer inline form
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "", phone: "", plateNumber: "", brand: "", model: "", color: "",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  useEffect(() => {
    fetch("/api/vehicles?search=" + encodeURIComponent(vehicleSearch))
      .then((r) => r.json())
      .then(setVehicles);
  }, [vehicleSearch]);

  useEffect(() => {
    fetch(`/api/services?category=${serviceType}`)
      .then((r) => r.json())
      .then(setServices);
    setSelectedServiceIds([]);
  }, [serviceType]);

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then(setEmployees);
  }, []);

  const selectedServices = services.filter((s) =>
    selectedServiceIds.includes(s.id)
  );
  const totalCost = selectedServices.reduce(
    (sum, s) => sum + Number(s.price),
    0
  );

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCreateCustomer = async () => {
    setCreatingCustomer(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCustomer.name,
        phone: newCustomer.phone,
        vehicle: {
          plateNumber: newCustomer.plateNumber,
          brand: newCustomer.brand,
          model: newCustomer.model,
          color: newCustomer.color,
        },
      }),
    });
    if (res.ok) {
      const customer = await res.json();
      // Refresh vehicles
      const vRes = await fetch("/api/vehicles");
      const vData = await vRes.json();
      setVehicles(vData);
      // Auto-select the new vehicle
      const newVehicle = vData.find(
        (v: Vehicle) => v.customer.id === customer.id
      );
      if (newVehicle) setSelectedVehicle(newVehicle);
      setShowNewCustomer(false);
      setNewCustomer({ name: "", phone: "", plateNumber: "", brand: "", model: "", color: "" });
    }
    setCreatingCustomer(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const res = await fetch("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: selectedVehicle?.id,
        employeeId: selectedEmployee || null,
        serviceType,
        serviceIds: selectedServiceIds,
        notes: notes || null,
      }),
    });
    if (res.ok) {
      const wo = await res.json();
      router.push(`/work-orders/${wo.id}`);
    }
    setSaving(false);
  };

  const canNext =
    (step === 1 && selectedVehicle) ||
    (step === 2 && selectedServiceIds.length > 0) ||
    step === 3;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Buat Work Order</h1>
          <p className="text-sm text-muted-foreground">
            Ikuti langkah-langkah di bawah
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                step > s.id
                  ? "bg-success text-success-foreground"
                  : step === s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > s.id ? <Check className="h-4 w-4" /> : s.id}
            </div>
            <span
              className={`hidden text-sm font-medium sm:block ${
                step >= s.id ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.title}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`mx-2 hidden h-px w-8 sm:block ${
                  step > s.id ? "bg-success" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-border bg-card p-6">
        {/* Step 1: Select Vehicle */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
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
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Daftar Customer Baru</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Nama" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} required />
                  <Input label="No. HP" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} required />
                </div>
                <Input label="Plat Nomor" value={newCustomer.plateNumber} onChange={(e) => setNewCustomer({ ...newCustomer, plateNumber: e.target.value })} required />
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Merek" value={newCustomer.brand} onChange={(e) => setNewCustomer({ ...newCustomer, brand: e.target.value })} />
                  <Input label="Model" value={newCustomer.model} onChange={(e) => setNewCustomer({ ...newCustomer, model: e.target.value })} />
                  <Input label="Warna" value={newCustomer.color} onChange={(e) => setNewCustomer({ ...newCustomer, color: e.target.value })} />
                </div>
                <Button size="sm" loading={creatingCustomer} onClick={handleCreateCustomer}>
                  Simpan & Pilih
                </Button>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari plat nomor atau nama customer..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="max-h-[350px] space-y-2 overflow-y-auto">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v)}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    selectedVehicle?.id === v.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm font-bold text-foreground">
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
                    {v.customer.name} — {v.customer.phone}
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
            <div className="flex rounded-lg border border-border p-1">
              <button
                onClick={() => setServiceType("SERVIS")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  serviceType === "SERVIS"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Servis Bengkel
              </button>
              <button
                onClick={() => setServiceType("CUCI")}
                className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  serviceType === "CUCI"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Cuci Kendaraan
              </button>
            </div>

            <div className="space-y-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    selectedServiceIds.includes(s.id)
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30 hover:bg-accent/50"
                  }`}
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
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selectedServiceIds.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedServiceIds.length} layanan dipilih
                  </span>
                  <span className="text-lg font-bold text-foreground">
                    {formatCurrency(totalCost)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Assign Employee */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Pilih Petugas (Opsional)
            </h2>
            <p className="text-sm text-muted-foreground">
              Anda bisa menugaskan petugas sekarang atau nanti
            </p>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedEmployee("")}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  !selectedEmployee
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <span className="text-sm font-medium text-muted-foreground">
                  — Belum ditentukan —
                </span>
              </button>
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployee(emp.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    selectedEmployee === emp.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {emp.name}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {emp.position}
                      </span>
                    </div>
                    {selectedEmployee === emp.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <Textarea
              label="Catatan (opsional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan untuk work order ini..."
            />
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-foreground">
              Konfirmasi Work Order
            </h2>

            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Customer
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {selectedVehicle?.customer.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedVehicle?.customer.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
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
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Tipe Layanan
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {serviceType === "SERVIS" ? "Servis Bengkel" : "Cuci Kendaraan"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Layanan Dipilih
                </p>
                <div className="mt-2 space-y-1">
                  {selectedServices.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">{s.name}</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(s.price)}
                      </span>
                    </div>
                  ))}
                  <hr className="border-border" />
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-lg text-primary">
                      {formatCurrency(totalCost)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedEmployee && (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Petugas
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {employees.find((e) => e.id === selectedEmployee)?.name}
                  </p>
                </div>
              )}

              {notes && (
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Catatan
                  </p>
                  <p className="mt-1 text-sm text-foreground">{notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => (step === 1 ? router.back() : setStep(step - 1))}
        >
          <ArrowLeft className="h-4 w-4" />
          {step === 1 ? "Batal" : "Sebelumnya"}
        </Button>

        {step < 4 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
          >
            Selanjutnya
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
