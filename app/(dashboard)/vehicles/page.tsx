"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Car,
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  type: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
  customer: Customer;
  _count: { workOrders: number };
}

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Form state for new vehicle
  const [form, setForm] = useState({
    customerId: "",
    plateNumber: "",
    type: "",
    brand: "",
    model: "",
    color: "",
  });

  // Form state for new customer + vehicle
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    plateNumber: "",
    type: "",
    brand: "",
    model: "",
    color: "",
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles?search=${encodeURIComponent(search)}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch vehicles: ${res.statusText}`);
      }
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  }, [search, router]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch customers: ${res.statusText}`);
      }
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ customerId: "", plateNumber: "", type: "", brand: "", model: "", color: "" });
      fetchVehicles();
    }
    setSaving(false);
  };

  const handleAddCustomerVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email || null,
        vehicle: {
          plateNumber: customerForm.plateNumber,
          type: customerForm.type,
          brand: customerForm.brand,
          model: customerForm.model,
          color: customerForm.color,
        },
      }),
    });
    if (res.ok) {
      setShowCustomerModal(false);
      setCustomerForm({ name: "", phone: "", email: "", plateNumber: "", type: "", brand: "", model: "", color: "" });
      fetchVehicles();
    }
    setSaving(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editVehicle) return;
    setSaving(true);
    const res = await fetch(`/api/vehicles/${editVehicle.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setEditVehicle(null);
      setForm({ customerId: "", plateNumber: "", type: "", brand: "", model: "", color: "" });
      fetchVehicles();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kendaraan ini?")) return;
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    fetchVehicles();
  };

  const openEdit = (v: Vehicle) => {
    setEditVehicle(v);
    setForm({
      customerId: v.customer.id,
      plateNumber: v.plateNumber,
      type: v.type || "",
      brand: v.brand || "",
      model: v.model || "",
      color: v.color || "",
    });
  };

  const openAddExisting = () => {
    fetchCustomers();
    setForm({ customerId: "", plateNumber: "", type: "", brand: "", model: "", color: "" });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kendaraan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola data kendaraan dan pemilik
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openAddExisting}>
            Tambah Kendaraan
          </Button>
          <Button onClick={() => setShowCustomerModal(true)}>
            Customer Baru + Kendaraan
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari plat nomor, merek, atau nama customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="Belum ada kendaraan"
          description="Mulai tambahkan kendaraan customer"
          action={
            <Button onClick={() => setShowCustomerModal(true)}>
              <Plus className="h-4 w-4" /> Tambah Customer + Kendaraan
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Plat Nomor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Kendaraan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Pemilik
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Kontak
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    WO
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vehicles.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm font-semibold text-foreground">
                        {v.plateNumber}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                      <div>
                        {[v.brand, v.model].filter(Boolean).join(" ") || "-"}
                      </div>
                      {v.color && (
                        <span className="text-xs text-muted-foreground">
                          {v.color}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {v.customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {v.customer.phone}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge variant={v._count.workOrders > 0 ? "primary" : "default"}>
                        {v._count.workOrders}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(v)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Vehicle to Existing Customer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tambah Kendaraan"
        description="Tambahkan kendaraan ke customer yang sudah ada"
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <Select
            label="Customer"
            id="customerId"
            value={form.customerId}
            onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            options={customers.map((c) => ({ value: c.id, label: `${c.name} — ${c.phone}` }))}
            placeholder="Pilih customer"
            required
          />
          <Input label="Plat Nomor" id="plate" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} placeholder="B 1234 ABC" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Merek" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Toyota" />
            <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Avanza" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tipe" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="MPV" />
            <Input label="Warna" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Hitam" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={saving}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Add New Customer + Vehicle Modal */}
      <Modal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Customer Baru + Kendaraan"
        description="Daftarkan customer baru beserta kendaraannya"
        size="lg"
      >
        <form onSubmit={handleAddCustomerVehicle} className="space-y-5">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Data Customer</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Nama" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} placeholder="Nama lengkap" required />
              <Input label="No. HP" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="08xxxxxxxxxx" required />
            </div>
            <div className="mt-3">
              <Input label="Email (opsional)" value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} placeholder="email@contoh.com" />
            </div>
          </div>
          <hr className="border-border" />
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Data Kendaraan</h3>
            <Input label="Plat Nomor" value={customerForm.plateNumber} onChange={(e) => setCustomerForm({ ...customerForm, plateNumber: e.target.value })} placeholder="B 1234 ABC" required />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Input label="Merek" value={customerForm.brand} onChange={(e) => setCustomerForm({ ...customerForm, brand: e.target.value })} placeholder="Toyota" />
              <Input label="Model" value={customerForm.model} onChange={(e) => setCustomerForm({ ...customerForm, model: e.target.value })} placeholder="Avanza" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Input label="Tipe" value={customerForm.type} onChange={(e) => setCustomerForm({ ...customerForm, type: e.target.value })} placeholder="MPV" />
              <Input label="Warna" value={customerForm.color} onChange={(e) => setCustomerForm({ ...customerForm, color: e.target.value })} placeholder="Hitam" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCustomerModal(false)}>Batal</Button>
            <Button type="submit" loading={saving}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        isOpen={!!editVehicle}
        onClose={() => setEditVehicle(null)}
        title="Edit Kendaraan"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Plat Nomor" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Merek" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tipe" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <Input label="Warna" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditVehicle(null)}>Batal</Button>
            <Button type="submit" loading={saving}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
