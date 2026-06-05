"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  position: string;
  email: string | null;
  phone: string | null;
  salary: string;
  isActive: boolean;
}

const EmployeeForm = ({
  form,
  setForm,
  onSubmit,
  onCancel,
  saving,
}: {
  form: { name: string; position: string; email: string; phone: string; salary: string };
  setForm: (val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  saving: boolean;
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <Input
      label="Nama Lengkap"
      value={form.name}
      onChange={(e) => setForm({ ...form, name: e.target.value })}
      required
    />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col space-y-1.5">
        <label className="text-sm font-medium text-foreground">Posisi</label>
        <select
          value={form.position}
          onChange={(e) => setForm({ ...form, position: e.target.value })}
          className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          required
        >
          <option value="Mekanik">Mekanik</option>
          <option value="Pencuci Mobil">Pencuci Mobil</option>
        </select>
      </div>
      <Input
        label="Gaji Pokok"
        type="number"
        value={form.salary}
        onChange={(e) => setForm({ ...form, salary: e.target.value })}
        min={0}
        required
      />
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Input
        label="No. Telepon (opsional)"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <Input
        label="Email (opsional)"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
    </div>
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button variant="outline" type="button" onClick={onCancel} fullWidth className="sm:w-auto">
        Batal
      </Button>
      <Button type="submit" loading={saving} fullWidth className="sm:w-auto">
        Simpan
      </Button>
    </div>
  </form>
);

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", position: "Mekanik", email: "", phone: "", salary: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        salary: parseFloat(form.salary) || 0,
      }),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ name: "", position: "Mekanik", email: "", phone: "", salary: "" });
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "Gagal membuat karyawan");
    }
    setSaving(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;
    setSaving(true);
    const res = await fetch(`/api/employees/${editEmployee.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        salary: parseFloat(form.salary) || 0,
      }),
    });
    if (res.ok) {
      setEditEmployee(null);
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "Gagal mengupdate karyawan");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menonaktifkan karyawan ini?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    fetchData();
  };

  const openEdit = (emp: Employee) => {
    setForm({
      name: emp.name,
      position: emp.position,
      email: emp.email || "",
      phone: emp.phone || "",
      salary: String(emp.salary),
    });
    setEditEmployee(emp);
  };

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Karyawan"
        description="Kelola data mekanik dan karyawan"
        actions={
          <Button onClick={() => { setForm({ name: "", position: "Mekanik", email: "", phone: "", salary: "" }); setShowCreate(true); }}>
            <Plus className="h-4 w-4" /> Tambah Karyawan
          </Button>
        }
      />

      <div className="relative sm:max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Cari nama atau posisi..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : filteredEmployees.length === 0 ? (
        <EmptyState icon={Users} title="Data Karyawan Kosong" description="Silakan tambahkan data mekanik atau karyawan baru" action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Tambah Karyawan</Button>} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Nama</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Posisi</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Gaji Pokok</th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Kontak</th>
                    <th className="px-6 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="transition-colors hover:bg-muted/30">
                      <td className="whitespace-nowrap px-6 py-4">
                        <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                        {!emp.isActive && <Badge variant="destructive" className="mt-1 text-[10px]">Nonaktif</Badge>}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Badge variant="outline">{emp.position}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-primary">{formatCurrency(emp.salary)}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-muted-foreground">
                        <div className="space-y-0.5">
                          {emp.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{emp.phone}</div>}
                          {emp.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{emp.email}</div>}
                          {!emp.phone && !emp.email && "-"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(emp)} className="rounded-xl p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Edit className="h-4 w-4" /></button>
                          {emp.isActive && (
                            <button onClick={() => handleDelete(emp.id)} className="rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                          )}
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
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{emp.name}</p>
                      {!emp.isActive && <Badge variant="destructive" className="text-[10px]">Nonaktif</Badge>}
                    </div>
                    <Badge variant="outline" className="mt-1">{emp.position}</Badge>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatCurrency(emp.salary)}</span>
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {emp.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{emp.phone}</div>}
                  {emp.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{emp.email}</div>}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(emp)}>
                    <Edit className="h-3.5 w-3.5" /> Edit
                  </Button>
                  {emp.isActive && (
                    <Button variant="outline" size="sm" onClick={() => handleDelete(emp.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tambah Karyawan" description="Data mekanik atau karyawan baru">
        <EmployeeForm form={form} setForm={setForm} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} saving={saving} />
      </Modal>

      <Modal isOpen={!!editEmployee} onClose={() => setEditEmployee(null)} title="Edit Karyawan">
        <EmployeeForm form={form} setForm={setForm} onSubmit={handleEdit} onCancel={() => setEditEmployee(null)} saving={saving} />
      </Modal>
    </div>
  );
}
