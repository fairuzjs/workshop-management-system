"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface CommissionRule {
  id: string; // This is the serviceId actually, we will update by serviceId
  name: string;
  price: number;
  commissionNominal: number;
}

export function CuciCommissionEditor({ initialCommissions }: { initialCommissions: CommissionRule[] }) {
  const router = useRouter();
  const [rules, setRules] = useState<CommissionRule[]>(initialCommissions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNominal, setEditNominal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRules(initialCommissions);
  }, [initialCommissions]);

  const startEdit = (rule: CommissionRule) => {
    setEditingId(rule.id);
    setEditNominal(String(rule.commissionNominal));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNominal("");
  };

  const saveEdit = async (serviceId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${serviceId}/commission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionNominal: parseFloat(editNominal) }),
      });
      if (res.ok) {
        const updated = await res.json();
        setRules((prev) =>
          prev.map((r) => (r.id === serviceId ? { ...r, commissionNominal: Number(updated.commissionNominal) } : r))
        );
        setEditingId(null);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/50">
          <tr>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Layanan Cuci</th>
            <th className="px-6 py-3 text-left font-medium text-muted-foreground">Harga</th>
            <th className="px-6 py-3 text-right font-medium text-muted-foreground">Komisi Washer (Rp)</th>
            <th className="px-6 py-3 text-right font-medium text-muted-foreground">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id} className="border-b border-border transition-colors hover:bg-muted/50 last:border-0">
              <td className="px-6 py-3.5 font-medium text-foreground">{rule.name}</td>
              <td className="px-6 py-3.5 text-muted-foreground">{formatCurrency(rule.price)}</td>
              <td className="px-6 py-3.5 text-right font-semibold text-success">
                {editingId === rule.id ? (
                  <input
                    type="number"
                    value={editNominal}
                    onChange={(e) => setEditNominal(e.target.value)}
                    className="h-8 w-32 rounded-lg border border-success bg-background px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-success/20 ml-auto block"
                    autoFocus
                  />
                ) : (
                  formatCurrency(rule.commissionNominal)
                )}
              </td>
              <td className="px-6 py-3.5 text-right">
                {editingId === rule.id ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => saveEdit(rule.id)}
                      disabled={saving}
                      className="rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-success-foreground hover:bg-success/90 disabled:opacity-50"
                    >
                      {saving ? "..." : "Simpan"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(rule)}
                    className="rounded-lg bg-success/10 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/20"
                  >
                    Edit Komisi
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
