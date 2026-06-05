"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import { formatNumberInput, parseNumberInput } from "@/lib/utils";
import {
  Package,
  Plus,
  Minus,
  Search,
  Edit,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  History,
} from "lucide-react";
import { SupplierManager, Supplier } from "./suppliers";

interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  minStock: number;
  price: string;
  supplier?: Supplier | null;
  supplierId?: string | null;
  capitalPrice?: string | number | null;
  rackPosition?: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"barang" | "supplier" | "riwayat_stok">("barang");
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showGlobalStock, setShowGlobalStock] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [stockModal, setStockModal] = useState<{
    item: InventoryItem;
    type: "IN" | "OUT";
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", category: "SPAREPART", unit: "pcs", qty: "", minStock: "5", capitalPrice: "", price: "",
    supplierId: "",
    rackPosition: "",
    paymentMethod: "CASH",
  });
  const [stockForm, setStockForm] = useState({ qty: "", recordExpense: true });
  const [globalStockForm, setGlobalStockForm] = useState({ inventoryId: "", qty: "", recordExpense: true });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(pagination.page));

      const res = await fetch(`/api/inventory?${params}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error(`Failed to fetch inventory: ${res.statusText}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
        setPagination({ page: 1, limit: 20, total: data.length, totalPages: 1 });
      } else {
        setItems(data.data);
        setPagination(data.pagination);
      }
      // Fetch suppliers
      const supRes = await fetch("/api/suppliers");
      if (supRes.ok) {
        const supData = await supRes.json();
        setSuppliersList(supData);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, router]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "barang") {
      fetchData();
    } else if (activeTab === "riwayat_stok") {
      fetchLogs();
    }
  }, [fetchData, fetchLogs, activeTab]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        unit: form.unit,
        qty: parseInt(form.qty),
        minStock: parseInt(form.minStock),
        capitalPrice: parseNumberInput(form.capitalPrice) || 0,
        price: parseNumberInput(form.price) || 0,
        supplierId: form.supplierId || null,
        rackPosition: form.rackPosition || null,
        paymentMethod: form.paymentMethod,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", category: "SPAREPART", unit: "pcs", qty: "", minStock: "5", capitalPrice: "", price: "", supplierId: "", rackPosition: "", paymentMethod: "CASH" });
      fetchData();
    }
    setSaving(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSaving(true);
    await fetch(`/api/inventory/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        unit: form.unit,
        minStock: parseInt(form.minStock),
        capitalPrice: parseNumberInput(form.capitalPrice) || 0,
        price: parseNumberInput(form.price) || 0,
        supplierId: form.supplierId || null,
        rackPosition: form.rackPosition || null,
        paymentMethod: form.paymentMethod,
      }),
    });
    setEditItem(null);
    fetchData();
    setSaving(false);
  };

  const handleStockUpdate = async () => {
    if (!stockModal) return;
    setSaving(true);
    await fetch(`/api/inventory/${stockModal.item.id}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: stockModal.type,
        qty: parseInt(stockForm.qty),
        recordExpense: stockForm.recordExpense,
      }),
    });
    setStockModal(null);
    setStockForm({ qty: "", recordExpense: true });
    fetchData();
    setSaving(false);
  };

  const handleGlobalStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalStockForm.inventoryId) return;
    setSaving(true);
    await fetch(`/api/inventory/${globalStockForm.inventoryId}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "IN",
        qty: parseInt(globalStockForm.qty),
        recordExpense: globalStockForm.recordExpense,
      }),
    });
    setShowGlobalStock(false);
    setGlobalStockForm({ inventoryId: "", qty: "", recordExpense: true });
    fetchData();
    setSaving(false);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({
      name: item.name,
      category: (item as any).category || "SPAREPART",
      unit: item.unit,
      qty: String(item.qty),
      minStock: String(item.minStock),
      capitalPrice: item.capitalPrice ? formatNumberInput(String(item.capitalPrice)) : "",
      price: formatNumberInput(String(item.price)),
      supplierId: item.supplierId || "",
      rackPosition: item.rackPosition || "",
      paymentMethod: "CASH",
    });
    setEditItem(item);
  };

  const lowStockItems = items.filter((i) => i.qty <= i.minStock);
  const totalValue = items.reduce(
    (sum, i) => sum + i.qty * Number(i.price),
    0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Kelola stok sparepart dan bahan"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "barang" ? "primary" : "outline"}
              onClick={() => setActiveTab("barang")}
            >
              <Package className="mr-2 h-4 w-4" /> Form Barang
            </Button>
            <Button
              variant={activeTab === "supplier" ? "primary" : "outline"}
              onClick={() => setActiveTab("supplier")}
            >
              <Truck className="mr-2 h-4 w-4" /> Form Supplier
            </Button>
            <Button
              variant={activeTab === "riwayat_stok" ? "primary" : "outline"}
              onClick={() => setActiveTab("riwayat_stok")}
            >
              <History className="mr-2 h-4 w-4" /> Riwayat Stok
            </Button>
            {activeTab === "barang" && (
              <>
                <Button onClick={() => setShowGlobalStock(true)} variant="secondary" className="hidden sm:flex">
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  Tambah Stok (Lama)
                </Button>
                <Button onClick={() => {
                  setForm({ name: "", category: "SPAREPART", unit: "pcs", qty: "", minStock: "5", capitalPrice: "", price: "", supplierId: "", rackPosition: "", paymentMethod: "CASH" });
                  setShowCreate(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Barang Baru
                </Button>
              </>
            )}
          </div>
        }
      />

      {activeTab === "supplier" ? (
        <SupplierManager />
      ) : activeTab === "riwayat_stok" ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase text-muted-foreground">
                  <th className="px-6 py-3.5">Tanggal & Waktu</th>
                  <th className="px-6 py-3.5">Item</th>
                  <th className="px-6 py-3.5">Jenis</th>
                  <th className="px-6 py-3.5">Jumlah</th>
                  <th className="px-6 py-3.5">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada riwayat stok</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{log.inventory.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant={log.type === "IN" ? "success" : "warning"}>{log.type === "IN" ? "Masuk" : "Keluar"}</Badge>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">{log.qty} <span className="text-muted-foreground text-xs font-normal">{log.inventory.unit}</span></td>
                      <td className="px-6 py-4 text-muted-foreground">{log.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Item"
          value={items.length}
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Stok Rendah"
          value={lowStockItems.length}
          icon={AlertTriangle}
          variant={lowStockItems.length > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Total Nilai Stok"
          value={formatCurrency(totalValue)}
          icon={Package}
          variant="success"
        />
      </div>

      {/* Low Stock Warning */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" />
            {lowStockItems.length} item stok rendah
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {lowStockItems.slice(0, 5).map((i) => (
              <span key={i.id} className="rounded-lg bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                {i.name} ({i.qty}/{i.minStock} {i.unit})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative sm:max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari item..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada item inventory"
          description="Tambahkan item sparepart atau bahan"
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Tambah Item
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
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Item</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Stok</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Min</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Harga Modal</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Harga Jual</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nilai</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Supplier</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Posisi Rak</th>
                    <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => {
                    const isLow = item.qty <= item.minStock;
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-muted/30">
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm font-medium text-foreground">
                            {item.name}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isLow ? "text-destructive" : "text-foreground"}`}>
                              {item.qty}
                            </span>
                            <span className="text-xs text-muted-foreground">{item.unit}</span>
                            {isLow && (
                              <Badge variant="warning">Low</Badge>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                          {formatCurrency(Number(item.capitalPrice) || 0)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                          {formatCurrency(item.qty * (Number(item.capitalPrice) || 0))}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                          {item.supplier?.name || "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                          {item.rackPosition ? (
                            <span className="rounded bg-muted px-2 py-1 font-mono text-xs">{item.rackPosition}</span>
                          ) : "-"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(item)}
                              className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {items.map((item) => {
              const isLow = item.qty <= item.minStock;
              const pct = Math.min((item.qty / Math.max(item.minStock * 3, 1)) * 100, 100);
              return (
                <div key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}/{item.unit}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-lg font-bold ${isLow ? "text-destructive" : "text-foreground"}`}>
                        {item.qty}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">{item.unit}</span>
                      {isLow && <Badge variant="warning" className="ml-2">Low</Badge>}
                    </div>
                  </div>
                  {/* Stock bar */}
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isLow ? "bg-destructive" : pct > 60 ? "bg-success" : "bg-warning"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="flex-1">
                      <Edit className="h-3.5 w-3.5 mr-2" /> Edit Item
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
        </>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tambah Item" description="Tambahkan item baru ke inventory">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nama Item" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })} placeholder="Oli Mesin" required />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Kategori <span className="text-destructive">*</span></label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              <option value="SPAREPART">SPAREPART</option>
              <option value="OLI">OLI</option>
              <option value="BAN">BAN</option>
              <option value="AKSESORIS">AKSESORIS</option>
              <option value="LAINNYA">LAINNYA</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Satuan <span className="text-destructive">*</span></label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                <option value="pcs">PCS</option>
                <option value="set">SET</option>
                <option value="botol">BOTOL</option>
                <option value="liter">LITER</option>
              </select>
            </div>
            <Input label="Stok Awal" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Stok Minimum" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="5" required />
            <Input label="Harga Modal (Rp)" type="text" value={form.capitalPrice} onChange={(e) => setForm({ ...form, capitalPrice: formatNumberInput(e.target.value) })} placeholder="40.000" />
            <Input label="Harga Jual (Rp)" type="text" value={form.price} onChange={(e) => setForm({ ...form, price: formatNumberInput(e.target.value) })} placeholder="50.000" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Supplier (Opsional)</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Pilih Supplier</option>
                {suppliersList.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Pembayaran</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="CASH">CASH</option>
                <option value="KREDIT">KREDIT</option>
              </select>
            </div>
          </div>
          <Input label="Posisi Rak (Opsional)" value={form.rackPosition} onChange={(e) => setForm({ ...form, rackPosition: e.target.value })} placeholder="Cth: A1-02" />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)} fullWidth className="sm:w-auto">Batal</Button>
            <Button type="submit" loading={saving} fullWidth className="sm:w-auto">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Item">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Nama Item" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })} required />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Kategori <span className="text-destructive">*</span></label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
            >
              <option value="SPAREPART">SPAREPART</option>
              <option value="OLI">OLI</option>
              <option value="BAN">BAN</option>
              <option value="AKSESORIS">AKSESORIS</option>
              <option value="LAINNYA">LAINNYA</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Satuan <span className="text-destructive">*</span></label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                <option value="pcs">PCS</option>
                <option value="set">SET</option>
                <option value="botol">BOTOL</option>
                <option value="liter">LITER</option>
              </select>
            </div>
            <Input label="Stok Minimum" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Harga Modal (Rp)" type="text" value={form.capitalPrice} onChange={(e) => setForm({ ...form, capitalPrice: formatNumberInput(e.target.value) })} />
            <Input label="Harga Jual (Rp)" type="text" value={form.price} onChange={(e) => setForm({ ...form, price: formatNumberInput(e.target.value) })} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Supplier</label>
            <select
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Tanpa Supplier</option>
              {suppliersList.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>
          <Input label="Posisi Rak (Opsional)" value={form.rackPosition} onChange={(e) => setForm({ ...form, rackPosition: e.target.value })} placeholder="Cth: A1-02" />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setEditItem(null)} fullWidth className="sm:w-auto">Batal</Button>
            <Button type="submit" loading={saving} fullWidth className="sm:w-auto">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Stock Update Modal */}
      <Modal isOpen={!!stockModal} onClose={() => setStockModal(null)} title={`Stock ${stockModal?.type === "IN" ? "Masuk" : "Keluar"}`}
        description={stockModal ? `${stockModal.item.name} — Stok saat ini: ${stockModal.item.qty} ${stockModal.item.unit}` : ""}>
        <div className="space-y-4">
          <Input label="Jumlah" type="number" value={stockForm.qty} onChange={(e) => setStockForm({ ...stockForm, qty: e.target.value })} placeholder="0" min={1} required />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setStockModal(null)} fullWidth className="sm:w-auto">Batal</Button>
            <Button onClick={handleStockUpdate} loading={saving} disabled={!stockForm.qty} fullWidth className="sm:w-auto">
              {stockModal?.type === "IN" ? "Stock In" : "Stock Out"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Global Stock In Modal */}
      <Modal isOpen={showGlobalStock} onClose={() => setShowGlobalStock(false)} title="Tambah Stok Barang Lama" description="Cari barang dan tambahkan stoknya">
        <form onSubmit={handleGlobalStockUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Pilih Barang (Ketik untuk mencari)</label>
            <input 
              list="inventory-list" 
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Cari nama barang..."
              value={items.find(i => i.id === globalStockForm.inventoryId)?.name || ""}
              onChange={(e) => {
                const selected = items.find(i => i.name === e.target.value);
                if (selected) {
                  setGlobalStockForm({ ...globalStockForm, inventoryId: selected.id });
                } else {
                  setGlobalStockForm({ ...globalStockForm, inventoryId: "" });
                }
              }}
              required
            />
            <datalist id="inventory-list">
              {items.map((item) => (
                <option key={item.id} value={item.name} />
              ))}
            </datalist>
          </div>
          <Input label="Jumlah Stok Ditambahkan" type="number" value={globalStockForm.qty} onChange={(e) => setGlobalStockForm({ ...globalStockForm, qty: e.target.value })} placeholder="Cth: 10" min={1} required />
          
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setShowGlobalStock(false)} fullWidth className="sm:w-auto">Batal</Button>
            <Button type="submit" loading={saving} disabled={!globalStockForm.inventoryId || !globalStockForm.qty} fullWidth className="sm:w-auto">
              Simpan Stok
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
