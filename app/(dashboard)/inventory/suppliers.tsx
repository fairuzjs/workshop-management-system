"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/shared/empty-state";
import { Users, Plus, Edit, Trash2, Search } from "lucide-react";

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  _count?: { items: number };
}

export function SupplierManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", address: "" });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers");
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", phone: "", address: "" });
      fetchSuppliers();
    } else {
      const err = await res.json();
      alert(err.error || "Gagal menyimpan supplier");
    }
    setSaving(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSupplier) return;
    setSaving(true);
    const res = await fetch(`/api/suppliers/${editSupplier.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setEditSupplier(null);
      fetchSuppliers();
    } else {
      const err = await res.json();
      alert(err.error || "Gagal mengubah supplier");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    const res = await fetch(`/api/suppliers/${deleteId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteId(null);
      fetchSuppliers();
    } else {
      alert("Gagal menghapus supplier");
    }
    setSaving(false);
  };

  const openEdit = (sup: Supplier) => {
    setForm({
      name: sup.name,
      phone: sup.phone || "",
      address: sup.address || "",
    });
    setEditSupplier(sup);
  };

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-md w-full">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button onClick={() => { setForm({ name: "", phone: "", address: "" }); setShowCreate(true); }}>
          <Plus className="h-4 w-4" />
          Tambah Supplier
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tidak ada supplier"
          description={search ? "Tidak ada yang cocok dengan pencarian" : "Mulai tambahkan daftar supplier Anda"}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3.5 text-left font-medium text-muted-foreground">Nama Supplier</th>
                  <th className="px-6 py-3.5 text-left font-medium text-muted-foreground">No Telepon</th>
                  <th className="px-6 py-3.5 text-left font-medium text-muted-foreground">Alamat</th>
                  <th className="px-6 py-3.5 text-right font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="transition-colors hover:bg-muted/30">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-foreground">
                      {sup.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-muted-foreground">
                      {sup.phone || "-"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {sup.address || "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(sup)} className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(sup.id)} className="rounded-xl p-2 text-destructive hover:bg-destructive/10">
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

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tambah Supplier">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nama Supplier" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="No Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Alamat" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setShowCreate(false)} fullWidth className="sm:w-auto">Batal</Button>
            <Button type="submit" loading={saving} fullWidth className="sm:w-auto">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editSupplier} onClose={() => setEditSupplier(null)} title="Edit Supplier">
        <form onSubmit={handleEdit} className="space-y-4">
          <Input label="Nama Supplier" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="No Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Alamat" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={() => setEditSupplier(null)} fullWidth className="sm:w-auto">Batal</Button>
            <Button type="submit" loading={saving} fullWidth className="sm:w-auto">Simpan</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Hapus Supplier" description="Apakah Anda yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan.">
        <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setDeleteId(null)} fullWidth className="sm:w-auto">Batal</Button>
          <Button variant="destructive" onClick={handleDelete} loading={saving} fullWidth className="sm:w-auto">Hapus</Button>
        </div>
      </Modal>
    </div>
  );
}
