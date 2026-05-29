"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Wallet,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
} from "lucide-react";

interface ExpenseItem {
  id: string;
  category: string;
  amount: string;
  description: string | null;
  date: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const expenseCategories = [
  "Listrik", "Air", "Sewa", "Gaji", "Transport", "Perlengkapan",
  "Maintenance", "Marketing", "Internet", "Lain-lain",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    category: "", amount: "", description: "", date: new Date().toISOString().split("T")[0],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(pagination.page));

    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.data);
    setTotalAmount(data.totalAmount);
    setPagination(data.pagination);
    setLoading(false);
  }, [search, pagination.page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description || null,
        date: form.date,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ category: "", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
      fetchData();
    }
    setSaving(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExpense) return;
    setSaving(true);
    await fetch(`/api/expenses/${editExpense.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description || null,
        date: form.date,
      }),
    });
    setEditExpense(null);
    fetchData();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pengeluaran ini?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (item: ExpenseItem) => {
    setForm({
      category: item.category,
      amount: String(item.amount),
      description: item.description || "",
      date: new Date(item.date).toISOString().split("T")[0],
    });
    setEditExpense(item);
  };

  const openCreate = () => {
    setForm({ category: "", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
    setShowCreate(true);
  };

  const ExpenseForm = ({ onSubmit, onCancel }: { onSubmit: (e: React.FormEvent) => void; onCancel: () => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Kategori</label>
        <div className="flex flex-wrap gap-2">
          {expenseCategories.map((cat) => (
            <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                form.category === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {!form.category && (
          <Input placeholder="Atau ketik kategori lain..." value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Jumlah (Rp)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="100000" required />
        <Input label="Tanggal" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
      </div>
      <Textarea label="Keterangan (opsional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detail pengeluaran..." />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button variant="outline" type="button" onClick={onCancel} fullWidth className="sm:w-auto">Batal</Button>
        <Button type="submit" loading={saving} fullWidth className="sm:w-auto">Simpan</Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengeluaran"
        description="Kelola pengeluaran operasional"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Tambah Pengeluaran
          </Button>
        }
      />

      {/* Summary Card */}
      <StatCard
        title="Total Pengeluaran"
        value={formatCurrency(totalAmount)}
        icon={TrendingDown}
        variant="destructive"
      />

      {/* Search */}
      <div className="relative sm:max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Cari kategori atau keterangan..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : expenses.length === 0 ? (
        <EmptyState icon={Wallet} title="Belum ada pengeluaran" description="Catat pengeluaran operasional bengkel" action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Tambah</Button>} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Tanggal</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Kategori</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Keterangan</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Jumlah</th>
                    <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-muted/30">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-foreground">{formatDate(item.date)}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="rounded-xl border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">{item.category}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{item.description || "-"}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-destructive">{formatCurrency(item.amount)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(item)} className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <p className="text-sm text-muted-foreground">{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total}</p>
                <div className="flex gap-1">
                  <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1} className="rounded-xl p-2 text-muted-foreground hover:bg-accent disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
                  <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages} className="rounded-xl p-2 text-muted-foreground hover:bg-accent disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Card List */}
          <div className="space-y-3 md:hidden">
            {expenses.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="rounded-xl border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-foreground">{item.category}</span>
                    <p className="text-sm text-muted-foreground">{item.description || "-"}</p>
                  </div>
                  <span className="text-sm font-bold text-destructive">{formatCurrency(item.amount)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">{pagination.page}/{pagination.totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tambah Pengeluaran" description="Catat pengeluaran operasional">
        <ExpenseForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
      </Modal>

      <Modal isOpen={!!editExpense} onClose={() => setEditExpense(null)} title="Edit Pengeluaran">
        <ExpenseForm onSubmit={handleEdit} onCancel={() => setEditExpense(null)} />
      </Modal>
    </div>
  );
}
