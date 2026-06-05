"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface CuciService {
  id: string;
  name: string;
  price: number;
}

export function CuciPriceEditor({ initialServices }: { initialServices: CuciService[] }) {
  const router = useRouter();
  const [services, setServices] = useState<CuciService[]>(initialServices);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const startEdit = (svc: CuciService) => {
    setEditingId(svc.id);
    setEditPrice(String(svc.price));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice("");
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: parseFloat(editPrice) }),
      });
      if (res.ok) {
        const updated = await res.json();
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, price: Number(updated.price) } : s))
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
            <th className="px-6 py-3 text-right font-medium text-muted-foreground">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc) => (
            <tr key={svc.id} className="border-b border-border transition-colors hover:bg-muted/50 last:border-0">
              <td className="px-6 py-3.5 font-medium text-foreground">{svc.name}</td>
              <td className="px-6 py-3.5">
                {editingId === svc.id ? (
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="h-8 w-32 rounded-lg border border-primary bg-background px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    autoFocus
                  />
                ) : (
                  <span className="text-foreground font-semibold">
                    {formatCurrency(svc.price)}
                  </span>
                )}
              </td>
              <td className="px-6 py-3.5 text-right">
                {editingId === svc.id ? (
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => saveEdit(svc.id)}
                      disabled={saving}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {saving ? "..." : "Simpan"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(svc)}
                    className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                  >
                    Edit Harga
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
