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
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Phone,
  MoreVertical,
  ClipboardList,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryVehicle, setSelectedHistoryVehicle] = useState<Vehicle | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [historyDateFilter, setHistoryDateFilter] = useState<string>("");
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

  const fetchVehicleHistory = async (vehicleId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/history`);
      if (res.ok) {
        const data = await res.json();
        setVehicleHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

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
                        <div className="text-sm text-foreground font-medium">
                          {[v.brand, v.model].filter(Boolean).join(" ") || "-"}
                        </div>
                        {v.type && <div className="text-xs text-muted-foreground">{v.type}</div>}
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
                          <button 
                            onClick={() => {
                              setSelectedHistoryVehicle(v);
                              setHistoryDateFilter("");
                              setHistoryModalOpen(true);
                              fetchVehicleHistory(v.id);
                            }} 
                            className="rounded-xl p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            title="Riwayat Servis"
                          >
                            <ClipboardList className="h-4 w-4" />
                          </button>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1" 
                    onClick={() => {
                      setSelectedHistoryVehicle(v);
                      setHistoryDateFilter("");
                      setHistoryModalOpen(true);
                      fetchVehicleHistory(v.id);
                    }}
                  >
                    <ClipboardList className="h-3.5 w-3.5 mr-1" /> Histori
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(v)}>
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

      {/* History Modal */}
      <Modal 
        isOpen={historyModalOpen} 
        onClose={() => setHistoryModalOpen(false)} 
        title={`Riwayat Servis & Transaksi: ${selectedHistoryVehicle?.plateNumber || ""}`}
        description="Histori pengerjaan dan tagihan untuk kendaraan ini"
        size="xl"
      >
        {(() => {
          const availableDates = Array.from(new Set(vehicleHistory.map(wo => new Date(wo.createdAt).toISOString().split('T')[0]))).sort((a, b) => b.localeCompare(a));
          const currentIndex = availableDates.indexOf(historyDateFilter);
          
          const handlePrevDate = () => {
            if (!historyDateFilter && availableDates.length > 0) {
              setHistoryDateFilter(availableDates[0]);
              return;
            }
            if (currentIndex < availableDates.length - 1) {
              setHistoryDateFilter(availableDates[currentIndex + 1]);
            }
          };

          const handleNextDate = () => {
            if (!historyDateFilter && availableDates.length > 0) {
              setHistoryDateFilter(availableDates[0]);
              return;
            }
            if (currentIndex > 0) {
              setHistoryDateFilter(availableDates[currentIndex - 1]);
            }
          };
          
          const canGoPrev = currentIndex < availableDates.length - 1 || (!historyDateFilter && availableDates.length > 0);
          const canGoNext = currentIndex > 0 || (!historyDateFilter && availableDates.length > 0);

          return (
            <>
              <div className="px-1 mb-4 flex items-center justify-between">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Cari Berdasarkan Tanggal</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 w-[200px]">
                      <Input 
                        type="date" 
                        value={historyDateFilter} 
                        onChange={(e) => setHistoryDateFilter(e.target.value)} 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button type="button" variant="outline" size="sm" className="h-6 w-8 px-0 py-0 bg-muted/50 flex justify-center items-center" onClick={handleNextDate} title="Tanggal Lebih Baru" disabled={!canGoNext}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-6 w-8 px-0 py-0 bg-muted/50 flex justify-center items-center" onClick={handlePrevDate} title="Tanggal Lebih Lama" disabled={!canGoPrev}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4 max-h-[65vh] overflow-y-auto px-1 pb-4">
                {(() => {
                  const filteredHistory = vehicleHistory.filter(wo => {
                    if (!historyDateFilter) return true;
                    const woDate = new Date(wo.createdAt).toISOString().split('T')[0];
                    return woDate === historyDateFilter;
                  });

                  if (loadingHistory) {
                    return (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
                        ))}
                      </div>
                    );
                  }

                  if (filteredHistory.length === 0) {
                    return (
                      <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                        <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-2" />
                        <p>Belum ada riwayat servis untuk kendaraan ini pada tanggal tersebut.</p>
                      </div>
                    );
                  }

                  return filteredHistory.map((wo) => {
                    const date = new Date(wo.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                    const isExpanded = expandedHistoryId === wo.id;
                    const hasTransaction = !!wo.transaction;
                    
                    const servicesNames = [
                      ...(wo.services || []).map((s: any) => s.service?.name || "Layanan"),
                      ...(wo.historyItems || []).map((h: any) => h.title)
                    ];
                    const summary = servicesNames.length > 0 
                      ? servicesNames.join(", ").slice(0, 50) + (servicesNames.join(", ").length > 50 ? "..." : "")
                      : "Servis Umum";

                    let gTotal = 0;
                    if (hasTransaction) {
                      gTotal = parseFloat(wo.transaction.amount);
                    } else {
                      const totalJasa = (wo.services || []).reduce((sum: number, s: any) => sum + parseFloat(s.price), 0);
                      const totalManual = (wo.historyItems || []).reduce((sum: number, h: any) => sum + parseFloat(h.price), 0);
                      const totalPart = (wo.parts || []).reduce((sum: number, p: any) => sum + (parseFloat(p.price) * p.qty), 0);
                      gTotal = totalJasa + totalManual + totalPart;
                    }

                    return (
                      <div key={wo.id} className="rounded-xl border border-border overflow-hidden bg-card">
                        <div 
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedHistoryId(isExpanded ? null : wo.id)}
                        >
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Tanggal</p>
                              <p className="text-sm font-medium">{date}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">No Faktur</p>
                              <p className="text-sm font-medium font-mono text-primary">
                                {hasTransaction ? `INV-${wo.id.split("-")[0].toUpperCase()}` : wo.trackingToken}
                              </p>
                            </div>
                            <div className="col-span-2 hidden md:block">
                              <p className="text-xs text-muted-foreground mb-0.5">Layanan</p>
                              <p className="text-sm font-medium truncate">{summary}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 ml-4">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground mb-0.5">Status / Total</p>
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                                  {wo.status}
                                </span>
                                <span className="text-sm font-bold">{formatCurrency(gTotal)}</span>
                              </div>
                            </div>
                            <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="bg-muted/30 p-4 border-t border-border">
                            <div className="space-y-4">
                              {(wo.services?.length > 0 || wo.historyItems?.length > 0) && (
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">DAFTAR LAYANAN</h4>
                                  <div className="space-y-2">
                                    {wo.services?.map((s: any, i: number) => (
                                      <div key={i} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-sm">
                                          <span>{s.service?.name}</span>
                                          <span className="font-medium">{formatCurrency(parseFloat(s.price))}</span>
                                        </div>
                                        {s.employees?.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-0.5">
                                            {s.employees.map((emp: any) => (
                                              <span key={emp.id} className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                                                <User className="h-3 w-3 mr-1" />
                                                {emp.name}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {wo.historyItems?.map((h: any, i: number) => (
                                      <div key={i} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-sm">
                                          <span>{h.title}</span>
                                          <span className="font-medium">{formatCurrency(parseFloat(h.price))}</span>
                                        </div>
                                        {h.employees?.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-0.5">
                                            {h.employees.map((emp: any) => (
                                              <span key={emp.id} className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                                                <User className="h-3 w-3 mr-1" />
                                                {emp.name}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {wo.parts?.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">DAFTAR SPAREPART</h4>
                                  <div className="space-y-2">
                                    {wo.parts.map((p: any, i: number) => (
                                      <div key={i} className="flex flex-col gap-1">
                                        <div className="flex justify-between text-sm">
                                          <span>{p.inventory?.name} x{p.qty}</span>
                                          <span className="font-medium">{formatCurrency(parseFloat(p.price) * p.qty)}</span>
                                        </div>
                                        {p.employees?.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-0.5">
                                            {p.employees.map((emp: any) => (
                                              <span key={emp.id} className="inline-flex items-center rounded-md bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                                                <User className="h-3 w-3 mr-1" />
                                                {emp.name}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="pt-4 border-t border-border flex justify-between items-center mt-2">
                                <span className="font-bold text-base">Total Tagihan</span>
                                <span className="font-bold text-lg text-primary">{formatCurrency(gTotal)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}
