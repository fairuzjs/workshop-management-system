"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  History,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  category: string | null;
  qty: number;
  unit: string;
  minStock: number;
  price: string;
}

interface StockLog {
  id: string;
  qty: number;
  type: "IN" | "OUT";
  notes: string | null;
  createdAt: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
  const [logItem, setLogItem] = useState<InventoryItem | null>(null);
  const [logs, setLogs] = useState<StockLog[]>([]);

  // Forms
  const [form, setForm] = useState({
    name: "", category: "", qty: "", unit: "", minStock: "", price: "",
  });
  const [stockForm, setStockForm] = useState({
    qty: "", type: "IN" as "IN" | "OUT", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (showLowStock) params.set("lowStock", "true");
    const res = await fetch(`/api/inventory?${params}`);
    setItems(await res.json());
    setLoading(false);
  }, [search, showLowStock]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        qty: parseInt(form.qty) || 0,
        minStock: parseInt(form.minStock) || 0,
        price: parseFloat(form.price) || 0,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", category: "", qty: "", unit: "", minStock: "", price: "" });
      fetchItems();
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
        category: form.category || null,
        unit: form.unit,
        minStock: parseInt(form.minStock) || 0,
        price: parseFloat(form.price) || 0,
      }),
    });
    setEditItem(null);
    fetchItems();
    setSaving(false);
  };

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItem) return;
    setSaving(true);
    const res = await fetch(`/api/inventory/${stockItem.id}/stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        qty: parseInt(stockForm.qty),
        type: stockForm.type,
        notes: stockForm.notes || null,
      }),
    });
    if (res.ok) {
      setStockItem(null);
      setStockForm({ qty: "", type: "IN", notes: "" });
      fetchItems();
    } else {
      const err = await res.json();
      alert(err.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus item ini?")) return;
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    fetchItems();
  };

  const openEdit = (item: InventoryItem) => {
    setForm({
      name: item.name,
      category: item.category || "",
      qty: String(item.qty),
      unit: item.unit,
      minStock: String(item.minStock),
      price: String(item.price),
    });
    setEditItem(item);
  };

  const openLogs = async (item: InventoryItem) => {
    setLogItem(item);
    const res = await fetch(`/api/inventory/${item.id}`);
    const data = await res.json();
    setLogs(data.logs || []);
  };

  const lowStockCount = items.filter((i) => i.qty <= i.minStock).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola stok sparepart dan bahan
          </p>
        </div>
        <Button onClick={() => { setForm({ name: "", category: "", qty: "", unit: "", minStock: "", price: "" }); setShowCreate(true); }}>
          <Plus className="h-4 w-4" /> Tambah Item
        </Button>
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && !showLowStock && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {lowStockCount} item memiliki stok rendah
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowLowStock(true)}>
            Lihat
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama atau kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={() => setShowLowStock(!showLowStock)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            showLowStock
              ? "border-warning bg-warning/10 text-warning"
              : "border-input text-muted-foreground hover:bg-accent"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Stok Rendah
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Belum ada item inventory"
          description="Tambahkan sparepart atau bahan untuk mulai"
          action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Tambah Item</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Kategori</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Stok</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Min</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Harga</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const isLow = item.qty <= item.minStock;
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-muted/30">
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm font-medium text-foreground">{item.name}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {item.category ? (
                          <Badge variant="default">{item.category}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className={`text-sm font-bold ${isLow ? "text-destructive" : "text-foreground"}`}>
                          {item.qty}
                        </span>
                        <span className="ml-1 text-xs text-muted-foreground">{item.unit}</span>
                        {isLow && <AlertTriangle className="inline-block ml-1.5 h-3.5 w-3.5 text-destructive" />}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-muted-foreground">
                        {item.minStock}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">
                        {formatCurrency(item.price)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setStockForm({ qty: "", type: "IN", notes: "" }); setStockItem(item); }} className="rounded-lg p-2 text-success hover:bg-success/10" title="Stok Masuk">
                            <ArrowDownToLine className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setStockForm({ qty: "", type: "OUT", notes: "" }); setStockItem(item); }} className="rounded-lg p-2 text-warning hover:bg-warning/10" title="Stok Keluar">
                            <ArrowUpFromLine className="h-4 w-4" />
                          </button>
                          <button onClick={() => openLogs(item)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent" title="Riwayat">
                            <History className="h-4 w-4" />
                          </button>
                          <button onClick={() => openEdit(item)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent" title="Edit">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Hapus">
                            <Trash2 className="h-4 w-4" />
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
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tambah Item Baru" description="Masukkan data sparepart atau bahan">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nama Item" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Oli Mesin 1L" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kategori" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Oli" />
            <Input label="Satuan" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="liter, pcs, set" required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Stok Awal" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" />
            <Input label="Min. Stok" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="5" />
            <Input label="Harga Satuan" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="85000" required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Batal</Button>
            <Button type="submit" loading={saving}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Edit Item">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Nama Item" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kategori" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Satuan" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min. Stok" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
            <Input label="Harga Satuan" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setEditItem(null)}>Batal</Button>
            <Button type="submit" loading={saving}>Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Stock In/Out Modal */}
      <Modal isOpen={!!stockItem} onClose={() => setStockItem(null)} title={`Stok ${stockForm.type === "IN" ? "Masuk" : "Keluar"} — ${stockItem?.name}`}>
        <form onSubmit={handleStockUpdate} className="space-y-4">
          <div className="flex rounded-lg border border-border p-1">
            <button type="button" onClick={() => setStockForm({ ...stockForm, type: "IN" })}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${stockForm.type === "IN" ? "bg-success text-success-foreground" : "text-muted-foreground"}`}>
              Stok Masuk
            </button>
            <button type="button" onClick={() => setStockForm({ ...stockForm, type: "OUT" })}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${stockForm.type === "OUT" ? "bg-warning text-warning-foreground" : "text-muted-foreground"}`}>
              Stok Keluar
            </button>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Stok saat ini</p>
            <p className="text-2xl font-bold text-foreground">{stockItem?.qty} <span className="text-sm text-muted-foreground">{stockItem?.unit}</span></p>
          </div>
          <Input label="Jumlah" type="number" value={stockForm.qty} onChange={(e) => setStockForm({ ...stockForm, qty: e.target.value })} placeholder="10" required min={1} />
          <Input label="Catatan (opsional)" value={stockForm.notes} onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })} placeholder="Beli dari supplier" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => setStockItem(null)}>Batal</Button>
            <Button type="submit" loading={saving}>{stockForm.type === "IN" ? "Tambah Stok" : "Kurangi Stok"}</Button>
          </div>
        </form>
      </Modal>

      {/* Stock Log Modal */}
      <Modal isOpen={!!logItem} onClose={() => setLogItem(null)} title={`Riwayat Stok — ${logItem?.name}`} size="lg">
        {logs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada riwayat stok</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Tipe</th>
                  <th className="px-4 py-2 text-center text-xs font-medium uppercase text-muted-foreground">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Catatan</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3">
                      <Badge variant={log.type === "IN" ? "success" : "warning"}>
                        {log.type === "IN" ? "Masuk" : "Keluar"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-foreground">{log.qty}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{log.notes || "-"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
