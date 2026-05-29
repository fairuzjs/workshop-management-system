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
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  minStock: number;
  price: string;
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

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [stockModal, setStockModal] = useState<{
    item: InventoryItem;
    type: "IN" | "OUT";
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", unit: "pcs", qty: "", minStock: "5", price: "",
  });
  const [stockForm, setStockForm] = useState({ qty: "" });

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
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  }, [search, pagination.page, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        unit: form.unit,
        qty: parseInt(form.qty),
        minStock: parseInt(form.minStock),
        price: parseFloat(form.price),
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", unit: "pcs", qty: "", minStock: "5", price: "" });
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
        unit: form.unit,
        minStock: parseInt(form.minStock),
        price: parseFloat(form.price),
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
      }),
    });
    setStockModal(null);
    setStockForm({ qty: "" });
    fetchData();
    setSaving(false);
  };

  const openEdit = (item: InventoryItem) => {
    setForm({
      name: item.name,
      unit: item.unit,
      qty: String(item.qty),
      minStock: String(item.minStock),
      price: String(item.price),
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
          <Button onClick={() => {
            setForm({ name: "", unit: "pcs", qty: "", minStock: "5", price: "" });
            setShowCreate(true);
          }}>
            <Plus className="h-4 w-4" />
            Tambah Item
          </Button>
        }
      />

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
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Harga</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nilai</th>
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
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                          {formatCurrency(item.qty * Number(item.price))}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setStockForm({ qty: "" }); setStockModal({ item, type: "IN" }); }}
                              className="rounded-xl p-2 text-success hover:bg-success/10" title="Stock In">
                              <ArrowDownToLine className="h-4 w-4" />
                            </button>
                            <button onClick={() => { setStockForm({ qty: "" }); setStockModal({ item, type: "OUT" }); }}
                              className="rounded-xl p-2 text-warning hover:bg-warning/10" title="Stock Out">
                              <ArrowUpFromLine className="h-4 w-4" />
                            </button>
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
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setStockForm({ qty: "" }); setStockModal({ item, type: "IN" }); }}>
                      <ArrowDownToLine className="h-3.5 w-3.5" /> In
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setStockForm({ qty: "" }); setStockModal({ item, type: "OUT" }); }}>
                      <ArrowUpFromLine className="h-3.5 w-3.5" /> Out
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tambah Item" description="Tambahkan item baru ke inventory">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nama Item" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Oli Mesin" required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Satuan" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs" required />
            <Input label="Stok Awal" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Stok Minimum" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="5" required />
            <Input label="Harga Satuan (Rp)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="50000" required />
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)} fullWidth className="sm:w-auto">Batal</Button>
            <Button type="submit" loading={saving} fullWidth className="sm:w-auto">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Item">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Nama Item" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Satuan" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
            <Input label="Stok Minimum" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} required />
          </div>
          <Input label="Harga Satuan (Rp)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
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
          <Input label="Jumlah" type="number" value={stockForm.qty} onChange={(e) => setStockForm({ qty: e.target.value })} placeholder="0" min={1} required />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setStockModal(null)} fullWidth className="sm:w-auto">Batal</Button>
            <Button onClick={handleStockUpdate} loading={saving} disabled={!stockForm.qty} fullWidth className="sm:w-auto">
              {stockModal?.type === "IN" ? "Stock In" : "Stock Out"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
