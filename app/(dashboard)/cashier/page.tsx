"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumberInput, parseNumberInput } from "@/lib/utils";
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  Banknote,
  CreditCard,
  QrCode,
  Package,
  Wrench,
  Receipt,
  CheckCircle2,
  Loader2,
  Calendar,
  Filter,
  FileText,
} from "lucide-react";
import { ReceiptModal } from "@/components/receipt-modal";

// ===== Types =====
interface CashierWO {
  id: string;
  trackingToken: string;
  totalCost: string;
  serviceType: string;
  vehicle: {
    plateNumber: string;
    brand: string | null;
    model: string | null;
    customer: { name: string | null; phone: string };
  };
  services: { id: string; serviceId: string; price: string; service: { name: string }; employees: { id: string; name: string; position: string }[] }[];
  parts: { id: string; qty: number; price: string; inventory: { name: string }; employees: { id: string; name: string; position: string }[] }[];
  historyItems: { id: string; title: string; price: string; employees: { id: string; name: string; position: string }[] }[];
}

interface CuciService {
  id: string;
  name: string;
  price: string;
}

interface InventoryItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: string;
}

interface JasaItem {
  tempId: string;
  name: string;
  price: number;
  employeeIds: string[];
  serviceId?: string;
}

interface PartItem {
  tempId: string;
  inventoryId: string;
  name: string;
  price: number;
  qty: number;
  unit: string;
  maxQty: number;
  employeeIds: string[];
}

interface DailyTx {
  id: string;
  amount: string;
  paymentMethod: string;
  paidAt: string;
  workOrder: {
    trackingToken: string;
    vehicle: { plateNumber: string; brand: string | null; model: string | null; customer?: { name: string | null } };
    services: { price: string; service: { name: string } }[];
    parts: { qty: number; price: string }[];
    historyItems: { price: string }[];
  };
}

// ===== Component =====
export default function CashierPage() {
  const router = useRouter();

  // WO selection
  const [availableWOs, setAvailableWOs] = useState<CashierWO[]>([]);
  const [selectedWOId, setSelectedWOId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingWOs, setLoadingWOs] = useState(true);
  const [isDirectSale, setIsDirectSale] = useState(false);

  // Set initial selected WO from URL if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const woId = params.get("woId");
      if (woId) setSelectedWOId(woId);
    }
  }, []);

  // Cuci services (preset prices)
  const [cuciServices, setCuciServices] = useState<CuciService[]>([]);

  // Inventory
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Carts
  const [jasaCart, setJasaCart] = useState<JasaItem[]>([]);
  const [partCart, setPartCart] = useState<PartItem[]>([]);

  // Jasa form
  const [jasaName, setJasaName] = useState("");
  const [jasaPrice, setJasaPrice] = useState("");

  // Part form
  const [partSearchQuery, setPartSearchQuery] = useState("");
  const [partInventoryId, setPartInventoryId] = useState("");
  const [partQty, setPartQty] = useState("1");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [uangBayar, setUangBayar] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Daily report modal
  const [showReport, setShowReport] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [reportData, setReportData] = useState<DailyTx[]>([]);
  const [reportSummary, setReportSummary] = useState({ totalCash: 0, totalTransfer: 0, totalQris: 0, totalOmzet: 0, count: 0 });
  const [reportSearch, setReportSearch] = useState("");
  const [reportMethod, setReportMethod] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const [receiptModalTx, setReceiptModalTx] = useState<any | null>(null);

  // Fetch available WOs (SELESAI + no transaction)
  const fetchWOs = useCallback(async () => {
    setLoadingWOs(true);
    try {
      const res = await fetch("/api/cashier");
      if (res.ok) {
        const data = await res.json();
        setAvailableWOs(data.data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingWOs(false);
    }
  }, []);

  // Employees
  const [employees, setEmployees] = useState<{ id: string; name: string; position: string }[]>([]);

  // Fetch Cuci services
  const fetchCuciServices = useCallback(async () => {
    try {
      const res = await fetch("/api/services?category=CUCI");
      if (res.ok) {
        const data = await res.json();
        setCuciServices(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  // Fetch inventory
  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setInventoryItems(data.filter((i: InventoryItem) => i.qty > 0));
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }, []);

  useEffect(() => {
    fetchWOs();
    fetchCuciServices();
    fetchInventory();
    fetchEmployees();
  }, [fetchWOs, fetchCuciServices, fetchInventory, fetchEmployees]);

  // Selected WO details
  const selectedWO = availableWOs.find((wo) => wo.id === selectedWOId) || null;

  // Sync search input with selected WO
  useEffect(() => {
    if (selectedWO) {
      setSearchQuery(
        `${selectedWO.vehicle.plateNumber} (${selectedWO.trackingToken}) — ${[selectedWO.vehicle.brand, selectedWO.vehicle.model].filter(Boolean).join(" ")}`
      );
    } else {
      setSearchQuery("");
    }
  }, [selectedWO]);

  // When WO is selected, pre-load existing services/parts/historyItems into carts
  useEffect(() => {
    if (!selectedWO) {
      setJasaCart([]);
      setPartCart([]);
      return;
    }
    // Pre-load existing WO services as jasa items (with pre-assigned employees from WO)
    const existingJasa: JasaItem[] = (selectedWO.services || []).map((s) => ({
      tempId: `wo-svc-${s.id}`,
      name: s.service.name,
      price: Number(s.price),
      employeeIds: (s.employees || []).map((e) => e.id),
      serviceId: s.serviceId || undefined,
    }));
    // Pre-load existing history items (with pre-assigned employees from WO)
    const existingHistory: JasaItem[] = (selectedWO.historyItems || []).map((h) => ({
      tempId: `wo-hist-${h.id}`,
      name: h.title,
      price: Number(h.price),
      employeeIds: (h.employees || []).map((e) => e.id),
    }));
    setJasaCart([...existingJasa, ...existingHistory]);

    // Pre-load existing parts (employees for parts are assigned at cashier)
    const existingParts: PartItem[] = (selectedWO.parts || []).map((p) => ({
      tempId: `wo-part-${p.id}`,
      inventoryId: "",
      name: p.inventory.name,
      price: Number(p.price),
      qty: p.qty,
      unit: "pcs",
      maxQty: 999,
      employeeIds: (p.employees || []).map((e) => e.id),
    }));
    setPartCart(existingParts);
  }, [selectedWO, isDirectSale]); // Depend on selectedWO object so it runs when data is fetched

  // Update employee for item
  const updateItemEmployees = (
    type: "jasa" | "part",
    tempId: string,
    employeeIds: string[]
  ) => {
    if (type === "jasa") {
      setJasaCart((prev) =>
        prev.map((j) => (j.tempId === tempId ? { ...j, employeeIds } : j))
      );
    } else {
      setPartCart((prev) =>
        prev.map((p) => (p.tempId === tempId ? { ...p, employeeIds } : p))
      );
    }
  };

  // Cart calculations
  const totalJasa = jasaCart.reduce((sum, j) => sum + j.price, 0);
  const totalPart = partCart.reduce((sum, p) => sum + p.price * p.qty, 0);
  const grandTotal = totalJasa + totalPart;
  const uangBayarNum = parseNumberInput(uangBayar);
  const kembali = uangBayarNum - grandTotal;

  // Check if any non-cuci jasa item is missing mechanic assignment
  const jasaMissingMechanic = jasaCart.some(
    (j) => !j.tempId.startsWith("cuci-") && j.employeeIds.length === 0
  );

  // Add jasa manually
  const addJasa = () => {
    if (!jasaName.trim() || !jasaPrice) return;
    setJasaCart((prev) => [
      ...prev,
      { tempId: `manual-${Date.now()}`, name: jasaName.trim(), price: parseNumberInput(jasaPrice), employeeIds: [] },
    ]);
    setJasaName("");
    setJasaPrice("");
  };

  // Add cuci preset
  const addCuciPreset = (svc: CuciService) => {
    setJasaCart((prev) => [
      ...prev,
      { tempId: `cuci-${Date.now()}`, name: svc.name, price: Number(svc.price), employeeIds: [] },
    ]);
  };

  // Remove jasa
  const removeJasa = (tempId: string) => {
    setJasaCart((prev) => prev.filter((j) => j.tempId !== tempId));
  };

  // Add part
  const addPart = () => {
    if (!partInventoryId) return;
    const item = inventoryItems.find((i) => i.id === partInventoryId);
    if (!item) return;
    const qty = parseInt(partQty) || 1;

    // Check if already in cart
    const existing = partCart.find((p) => p.inventoryId === partInventoryId);
    if (existing) {
      setPartCart((prev) =>
        prev.map((p) =>
          p.inventoryId === partInventoryId
            ? { ...p, qty: Math.min(p.qty + qty, p.maxQty) }
            : p
        )
      );
    } else {
      setPartCart((prev) => [
        ...prev,
        {
          tempId: `part-${Date.now()}`,
          inventoryId: item.id,
          name: item.name,
          price: Number(item.price),
          qty: Math.min(qty, item.qty),
          unit: item.unit,
          maxQty: item.qty,
          employeeIds: [],
        },
      ]);
    }
    setPartSearchQuery("");
    setPartInventoryId("");
    setPartQty("1");
  };

  // Remove part
  const removePart = (tempId: string) => {
    setPartCart((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  // Process payment
  const handlePayment = async () => {
    if (!isDirectSale && !selectedWO) return;
    if (grandTotal <= 0) return;
    if (paymentMethod === "CASH" && uangBayarNum < grandTotal) {
      alert("Uang bayar kurang dari total tagihan");
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        paymentMethod,
        jasaItems: jasaCart.map(j => ({
          tempId: j.tempId,
          name: j.name,
          price: j.price,
          employeeIds: j.employeeIds,
          serviceId: j.serviceId,
        })),
        partItems: partCart.map(p => ({
          tempId: p.tempId,
          inventoryId: p.inventoryId,
          qty: p.qty,
          price: p.price,
          employeeIds: p.employeeIds
        }))
      };

      const endpoint = isDirectSale 
        ? "/api/cashier/direct-sale" 
        : `/api/work-orders/${selectedWO!.id}/transaction`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setPaymentSuccess(true);
        setTimeout(() => {
          setPaymentSuccess(false);
          setSelectedWOId("");
          setJasaCart([]);
          setPartCart([]);
          setUangBayar("");
          fetchWOs();
          fetchInventory();
        }, 2000);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal memproses pembayaran");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Terjadi kesalahan saat memproses pembayaran");
    } finally {
      setProcessing(false);
    }
  };

  // Fetch daily report
  const fetchReport = useCallback(async () => {
    setLoadingReport(true);
    try {
      const params = new URLSearchParams();
      params.set("date", reportDate);
      if (reportSearch) params.set("search", reportSearch);
      if (reportMethod) params.set("method", reportMethod);

      const res = await fetch(`/api/cashier/daily-report?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data.data || []);
        setReportSummary(data.summary || { totalCash: 0, totalTransfer: 0, totalQris: 0, totalOmzet: 0, count: 0 });
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoadingReport(false);
    }
  }, [reportDate, reportSearch, reportMethod]);

  useEffect(() => {
    if (showReport) fetchReport();
  }, [showReport, fetchReport]);

  // Generate invoice number
  const invoiceNo = isDirectSale
    ? `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-DIRECT`
    : selectedWO
    ? `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${selectedWO.trackingToken}`
    : "-";

  return (
    <div className="space-y-6 pb-40 lg:pb-32">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kasir & Pembayaran</h1>
          <p className="text-sm text-muted-foreground font-medium">Proses pembayaran work order yang telah selesai</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowReport(true)}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Laporan Rekapitulasi
        </Button>
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== LEFT COLUMN: Pilih Kendaraan + Cart Jasa ===== */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b-2 border-primary bg-primary/5 px-5 py-3.5">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                1. Pilih Kendaraan / Transaksi
              </h2>
            </div>

            <div className="p-5 space-y-4">
              {/* WO Selector */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                  Kendaraan Siap Bayar
                </label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <input
                      list="wo-options"
                      value={isDirectSale ? "Pembelian Sparepart Langsung" : searchQuery}
                      disabled={isDirectSale}
                      placeholder="— Ketik Plat Nomor atau Token —"
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchQuery(val);
                        const found = availableWOs.find((wo) => {
                          const display = `${wo.vehicle.plateNumber} (${wo.trackingToken}) — ${[wo.vehicle.brand, wo.vehicle.model].filter(Boolean).join(" ")}`;
                          return display === val;
                        });
                        if (found) {
                          setSelectedWOId(found.id);
                        } else {
                          setSelectedWOId("");
                        }
                      }}
                      className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:bg-muted"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setIsDirectSale(!isDirectSale);
                      if (!isDirectSale) {
                        setSelectedWOId("");
                        setSearchQuery("");
                        setJasaCart([]);
                        setPartCart([]);
                      }
                    }}
                    className={`h-11 px-4 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                      isDirectSale 
                        ? "bg-warning text-warning-foreground border border-warning hover:bg-warning/90"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                    }`}
                  >
                    Beli Langsung
                  </button>
                </div>
                <datalist id="wo-options">
                  {availableWOs.map((wo) => (
                    <option
                      key={wo.id}
                      value={`${wo.vehicle.plateNumber} (${wo.trackingToken}) — ${[wo.vehicle.brand, wo.vehicle.model].filter(Boolean).join(" ")}`}
                    />
                  ))}
                </datalist>
              </div>

              {/* Selected WO Details */}
              {(selectedWO || isDirectSale) && (
                <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No. Faktur</span>
                    <span className="font-mono font-bold text-primary">{invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plat Nomor</span>
                    <span className="font-mono font-semibold text-foreground">
                      {isDirectSale ? "PART-DIRECT" : selectedWO?.vehicle.plateNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Merk Mobil</span>
                    <span className="text-foreground">
                      {isDirectSale ? "PEMBELIAN SPAREPART" : [selectedWO?.vehicle.brand, selectedWO?.vehicle.model].filter(Boolean).join(" ") || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="text-foreground">
                      {isDirectSale ? "Pelanggan Umum" : (selectedWO?.vehicle.customer.name || selectedWO?.vehicle.customer.phone)}
                    </span>
                  </div>
                </div>
              )}

              {/* Jasa Input */}
              {(selectedWO || isDirectSale) && (
                <>
                  <hr className="border-border" />
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      <Wrench className="h-3 w-3 inline mr-1" />
                      Tambah Jasa Manual
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nama jasa..."
                        value={jasaName}
                        onChange={(e) => setJasaName(e.target.value)}
                        className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <input
                        type="text"
                        placeholder="Harga"
                        value={jasaPrice}
                        onChange={(e) => setJasaPrice(formatNumberInput(e.target.value))}
                        className="h-10 w-28 rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <Button size="sm" onClick={addJasa} disabled={!jasaName.trim() || !jasaPrice} className="h-10 rounded-xl px-4">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Cuci Presets */}
                  {cuciServices.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Quick: Cuci Mobil
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {cuciServices.map((svc) => (
                          <button
                            key={svc.id}
                            onClick={() => addCuciPreset(svc)}
                            className="rounded-xl border border-border px-3 py-2 text-xs font-medium transition-all hover:border-primary/30 hover:bg-primary/5"
                          >
                            {svc.name} — <span className="font-bold text-primary">{formatCurrency(svc.price)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Jasa Cart Table */}
              {jasaCart.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Layanan Jasa</span>
                    <span className="text-xs font-bold text-foreground">Biaya (Rp)</span>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-border/50">
                        {jasaCart.map((j) => {
                          const isCuci = j.tempId.startsWith("cuci-");
                          const showMechanicSelector = !isCuci;
                          // Filter employees: for service items, show Mekanik and Hybrid only
                          const availableMechanics = employees.filter(
                            (e) => e.position === "Mekanik" && !j.employeeIds.includes(e.id)
                          );
                          return (
                          <tr key={j.tempId} className="hover:bg-muted/30">
                            <td className="px-4 py-2.5">
                              <div className="text-foreground font-medium">{j.name}</div>
                              {showMechanicSelector ? (
                                <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                                  <span className="text-[10px] text-muted-foreground mr-1">Mekanik:</span>
                                  {j.employeeIds.map(empId => {
                                    const emp = employees.find(e => e.id === empId);
                                    return (
                                      <Badge key={empId} variant="outline" className="text-[10px] py-0 h-5 px-1.5 bg-primary/5">
                                        {emp?.name || empId.slice(0,6)}
                                        <button onClick={() => updateItemEmployees('jasa', j.tempId, j.employeeIds.filter(id => id !== empId))} className="ml-1 text-muted-foreground hover:text-destructive">×</button>
                                      </Badge>
                                    );
                                  })}
                                  <select
                                    className="text-[10px] h-5 border border-dashed rounded px-1 bg-transparent text-muted-foreground focus:outline-none focus:border-primary"
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        updateItemEmployees('jasa', j.tempId, [...j.employeeIds, e.target.value]);
                                      }
                                    }}
                                  >
                                    <option value="">+ Mekanik</option>
                                    {availableMechanics.map(e => (
                                      <option key={e.id} value={e.id}>{e.name} ({e.position})</option>
                                    ))}
                                  </select>
                                  {j.employeeIds.length === 0 && (
                                    <span className="text-[10px] text-amber-500 font-medium ml-1">⚠ Pilih mekanik</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic mt-1 block">Cuci mobil — tanpa mekanik</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-foreground w-28 align-top pt-3">{formatCurrency(j.price)}</td>
                            <td className="px-2 py-2.5 w-10 align-top pt-3">
                              {(j.tempId.startsWith("manual-") || j.tempId.startsWith("cuci-")) && (
                                <button onClick={() => removeJasa(j.tempId)} className="text-muted-foreground hover:text-destructive p-1 rounded">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-muted/50">
                        <tr>
                          <td className="px-4 py-2.5 font-semibold text-foreground">Subtotal Jasa</td>
                          <td className="px-4 py-2.5 text-right font-bold text-primary">{formatCurrency(totalJasa)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== RIGHT COLUMN: Cart Sparepart ===== */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="border-b-2 border-emerald-500 bg-emerald-500/5 px-5 py-3.5">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-500" />
                2. Keranjang Sparepart
              </h2>
            </div>

            <div className="p-5 space-y-4">
              {(selectedWO || isDirectSale) ? (
                <>
                  {/* Part selector */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      Tambah Sparepart
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          list="part-options"
                          value={partSearchQuery}
                          placeholder="— Ketik nama sparepart —"
                          onChange={(e) => {
                            const val = e.target.value;
                            setPartSearchQuery(val);
                            const found = inventoryItems.find(
                              (i) => `${i.name} — Stok: ${i.qty} ${i.unit} — ${formatCurrency(i.price)}` === val
                            );
                            if (found) {
                              setPartInventoryId(found.id);
                            } else {
                              setPartInventoryId("");
                            }
                          }}
                          className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <datalist id="part-options">
                          {inventoryItems.map((item) => (
                            <option
                              key={item.id}
                              value={`${item.name} — Stok: ${item.qty} ${item.unit} — ${formatCurrency(item.price)}`}
                            />
                          ))}
                        </datalist>
                      </div>
                      <input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={partQty}
                        onChange={(e) => setPartQty(e.target.value)}
                        className="h-10 w-16 rounded-xl border border-input bg-background px-3 text-sm text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <Button size="sm" onClick={addPart} disabled={!partInventoryId} className="h-10 rounded-xl px-4 bg-emerald-600 hover:bg-emerald-700">
                        Tambah
                      </Button>
                    </div>
                  </div>

                  {/* Part Cart Table */}
                  {partCart.length > 0 ? (
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="border-b border-border">
                            <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nama</th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Harga</th>
                            <th className="px-4 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qty</th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subtotal</th>
                            <th className="px-2 py-2 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {partCart.map((p) => (
                            <tr key={p.tempId} className="hover:bg-muted/30">
                              <td className="px-4 py-2.5">
                                <div className="text-foreground font-medium">{p.name}</div>
                              </td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground align-top pt-3">{formatCurrency(p.price)}</td>
                              <td className="px-4 py-2.5 text-center font-medium text-foreground align-top pt-3">{p.qty}</td>
                              <td className="px-4 py-2.5 text-right font-medium text-foreground align-top pt-3">{formatCurrency(p.price * p.qty)}</td>
                              <td className="px-2 py-2.5 align-top pt-3">
                                {p.tempId.startsWith("part-") && (
                                  <button onClick={() => removePart(p.tempId)} className="text-muted-foreground hover:text-destructive p-1 rounded">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-muted/50">
                          <tr>
                            <td colSpan={3} className="px-4 py-2.5 font-semibold text-foreground">Subtotal Part</td>
                            <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{formatCurrency(totalPart)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-border py-10 text-center">
                      <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Belum ada sparepart ditambahkan</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border py-16 text-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Pilih kendaraan terlebih dahulu</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== FOOTER: Payment Bar (Fixed) ===== */}
      {(selectedWO || isDirectSale) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-primary/20 bg-card/95 backdrop-blur-md shadow-2xl">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            {/* Payment Success Overlay */}
            {paymentSuccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/95 rounded-t-xl z-50">
                <div className="text-center text-white">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 animate-bounce" />
                  <p className="text-lg font-bold">Pembayaran Berhasil!</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Total */}
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Total</p>
                  <p className="text-2xl sm:text-3xl font-black text-primary">{formatCurrency(grandTotal)}</p>
                </div>
              </div>

              {/* Payment inputs */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                {/* Metode */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Metode</label>
                  <div className="flex rounded-xl border border-border overflow-hidden">
                    {[
                      { id: "CASH", label: "Cash", icon: Banknote },
                      { id: "TRANSFER", label: "Transfer", icon: CreditCard },
                      { id: "QRIS", label: "QRIS", icon: QrCode },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all ${
                          paymentMethod === m.id
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <m.icon className="h-3.5 w-3.5" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Uang Bayar */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Uang Bayar (Rp)
                  </label>
                  <input
                    type="text"
                    value={uangBayar}
                    onChange={(e) => setUangBayar(formatNumberInput(e.target.value))}
                    placeholder="0"
                    className="h-10 w-40 rounded-xl border border-input bg-background px-4 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Kembali */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Kembali</label>
                  <p className={`text-xl font-black ${kembali >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {formatCurrency(Math.max(kembali, 0))}
                  </p>
                </div>

                {/* Submit */}
                <div className="flex flex-col items-end gap-1">
                  <Button
                    onClick={handlePayment}
                    loading={processing}
                    disabled={grandTotal <= 0 || (paymentMethod === "CASH" && uangBayarNum < grandTotal) || jasaMissingMechanic}
                    className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 text-sm shadow-lg"
                  >
                    <Receipt className="h-4 w-4" />
                    SIMPAN & LUNAS
                  </Button>
                  {jasaMissingMechanic && (
                    <p className="text-[10px] text-amber-500 font-medium">⚠ Pilih mekanik untuk semua jasa service terlebih dahulu</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Daily Report Modal ===== */}
      <Modal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        title="Laporan Rekapitulasi Transaksi"
        size="3xl"
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <select
              value={reportMethod}
              onChange={(e) => setReportMethod(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Semua Metode</option>
              <option value="CASH">Cash</option>
              <option value="TRANSFER">Transfer</option>
              <option value="QRIS">QRIS</option>
            </select>
          </div>

          {/* Table */}
          {loadingReport ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Tidak ada transaksi</div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">No. Faktur</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Plat</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Merk</th>
                    <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Metode</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Total Jasa</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Total Part</th>
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {reportData.map((tx) => {
                    const totalSvc = (tx.workOrder.services || []).reduce((s: number, sv: any) => s + Number(sv.price), 0)
                      + (tx.workOrder.historyItems || []).reduce((s: number, h: any) => s + Number(h.price), 0);
                    const totalParts = (tx.workOrder.parts || []).reduce((s: number, p: any) => s + Number(p.price) * p.qty, 0);
                    return (
                      <React.Fragment key={tx.id}>
                        <tr 
                          onClick={() => setReceiptModalTx(tx)}
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-2 font-mono text-foreground">
                            INV-{tx.paidAt?.slice(0, 10).replace(/-/g, "")}-{tx.workOrder.trackingToken}
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold text-foreground">{tx.workOrder.vehicle.plateNumber}</td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {[tx.workOrder.vehicle.brand, tx.workOrder.vehicle.model].filter(Boolean).join(" ") || "-"}
                          </td>
                          <td className="px-3 py-2">
                            <Badge variant={tx.paymentMethod === "CASH" ? "default" : "primary"} className="text-[10px]">
                              {tx.paymentMethod}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-right text-foreground">{formatCurrency(totalSvc)}</td>
                          <td className="px-3 py-2 text-right text-foreground">{formatCurrency(totalParts)}</td>
                          <td className="px-3 py-2 text-right font-bold text-foreground">{formatCurrency(tx.amount)}</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Cash</p>
              <p className="text-sm font-bold text-emerald-600">{formatCurrency(reportSummary.totalCash)}</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Total Transfer</p>
              <p className="text-sm font-bold text-blue-600">{formatCurrency(reportSummary.totalTransfer)}</p>
            </div>
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Total QRIS</p>
              <p className="text-sm font-bold text-purple-600">{formatCurrency(reportSummary.totalQris)}</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Total Omzet</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(reportSummary.totalOmzet)}</p>
            </div>
          </div>
        </div>
      </Modal>

      <ReceiptModal 
        isOpen={!!receiptModalTx}
        onClose={() => setReceiptModalTx(null)}
        transaction={receiptModalTx}
      />
    </div>
  );
}
