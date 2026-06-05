"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Save } from "lucide-react";

interface MechanicCommissionEditorProps {
  initialServicePct: number;
  initialPartPct: number;
}

export function MechanicCommissionEditor({
  initialServicePct,
  initialPartPct,
}: MechanicCommissionEditorProps) {
  const [servicePct, setServicePct] = useState(initialServicePct);
  const [partPct, setPartPct] = useState(initialPartPct);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/mechanic-commission", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceCommissionPct: servicePct,
          partCommissionPct: partPct,
        }),
      });

      alert("Pengaturan komisi mekanik berhasil disimpan");
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground block">
          Komisi Jasa Servis (%)
        </label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={servicePct}
          onChange={(e) => setServicePct(Number(e.target.value))}
          placeholder="55"
        />
        <p className="text-xs text-muted-foreground">
          Persentase dari harga jasa. Jika mekanik &gt; 1, nilai ini akan dibagi rata.
        </p>
      </div>

      <div className="space-y-2 pt-2">
        <label className="text-sm font-medium text-foreground block">
          Komisi Penjualan Sparepart (%)
        </label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={partPct}
          onChange={(e) => setPartPct(Number(e.target.value))}
          placeholder="3"
        />
        <p className="text-xs text-muted-foreground">
          Persentase dari harga total sparepart, diberikan utuh kepada setiap mekanik.
        </p>
      </div>

      <Button onClick={handleSave} loading={loading} className="w-full mt-2">
        <Save className="h-4 w-4" /> Simpan Pengaturan
      </Button>
    </div>
  );
}
