"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Car,
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Phone,
  MoreVertical,
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

  const [form, setForm] = useState({
    customerId: "",
    plateNumber: "",
    type: "",
    brand: "",
    model: "",
    color: "",
  });

  const [customerForm, setCustomerForm] = useState({
    phone: "",
    email: "",
    plateNumber: "",
    type: "",
    brand: "",
    model: "",
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
        phone: customerForm.phone,
        email: customerForm.email || null,
        vehicle: {
          plateNumber: customerForm.plateNumber,
          type: customerForm.type,
          brand: customerForm.brand,
          model: customerForm.model,
        },
      }),
    });
    if (res.ok) {
      setShowCustomerModal(false);
      setCustomerForm({ phone: "", email: "", plateNumber: "", type: "", brand: "", model: "" });
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
      customerId: v.customer?.id ?? "",
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
      <PageHeader
        title="Kendaraan"
        description="Kelola data kendaraan dan pemilik"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={openAddExisting}>
              Tambah Kendaraan
            </Button>
            <Button onClick={() => setShowCustomerModal(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Customer Baru + Kendaraan</span>
              <span className="sm:hidden">Baru</span>
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari plat nomor, merek, atau no HP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:max-w-md"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
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
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Plat Nomor</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Kendaraan</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Kontak</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">WO</th>
                    <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="transition-colors hover:bg-muted/30">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-sm font-semibold text-foreground">
                          {v.plateNumber}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {v.customer?.phone ?? "-"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge variant={v._count.workOrders > 0 ? "primary" : "default"}>
                          {v._count.workOrders}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(v)} className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(v.id)} className="rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
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

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {vehicles.map((v) => (
              <div key={v.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="inline-block rounded-lg bg-primary/10 px-3 py-1 font-mono text-sm font-bold text-primary">
                      {v.plateNumber}
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {[v.brand, v.model].filter(Boolean).join(" ") || "-"}
                    </p>
                  </div>
                  <Badge variant={v._count.workOrders > 0 ? "primary" : "default"}>
                    {v._count.workOrders} WO
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{v.customer?.phone ?? "-"}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(v)}>
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(v.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Vehicle Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Kendaraan" description="Tambahkan kendaraan ke customer yang sudah ada">
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <Select label="Kontak" id="customerId" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            options={customers.map((c) => ({ value: c.id, label: `${c.phone}` }))} placeholder="Pilih kontak" required />
          <Input label="Plat Nomor" id="plate" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} placeholder="B 1234 ABC" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Merek" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Toyota" />
            <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Avanza" />
          </div>
          <div className="grid gap-3 sm:grid-cols-1">
            <Input label="Tipe" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="MPV" />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setShowModal(false)} fullWidth className="sm:w-auto">Batal</Button>
            <Button type="submit" loading={saving} fullWidth className="sm:w-auto">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* New Customer + Vehicle Modal */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Customer Baru + Kendaraan" description="Daftarkan customer baru beserta kendaraannya" size="lg">
        <form onSubmit={handleAddCustomerVehicle} className="space-y-5">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Data Kontak</h3>
            <div className="grid gap-3 sm:grid-cols-1">
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
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input label="Merek" value={customerForm.brand} onChange={(e) => setCustomerForm({ ...customerForm, brand: e.target.value })} placeholder="Toyota" />
              <Input label="Model" value={customerForm.model} onChange={(e) => setCustomerForm({ ...customerForm, model: e.target.value })} placeholder="Avanza" />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-1">
              <Input label="Tipe" value={customerForm.type} onChange={(e) => setCustomerForm({ ...customerForm, type: e.target.value })} placeholder="MPV" />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setShowCustomerModal(false)} fullWidth className="sm:w-auto">Batal</Button>
            <Button type="submit" loading={saving} fullWidth className="sm:w-auto">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal isOpen={!!editVehicle} onClose={() => setEditVehicle(null)} title="Edit Kendaraan">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Plat Nomor" value={form.plateNumber} onChange={(e) => setForm({ ...form, plateNumber: e.target.value })} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Merek" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <Input label="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Tipe" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <Input label="Warna" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setEditVehicle(null)} fullWidth className="sm:w-auto">Batal</Button>
            <Button type="submit" loading={saving} fullWidth className="sm:w-auto">Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
