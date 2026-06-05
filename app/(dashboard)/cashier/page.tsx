"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { AppPage } from "@/components/shared/app-page";
import { PageHeader } from "@/components/shared/page-header";
import { PageSection } from "@/components/shared/page-section";
import { FilterBar } from "@/components/shared/filter-bar";
import { DataTable, Column } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn, formatCurrency, formatNumberInput, parseNumberInput } from "@/lib/utils";
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
  FileText,
  AlertTriangle,
  User,
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

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // Fetch available WOs
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

  // Employees list for selection
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

  // Pre-load existing services/parts into carts when WO changes
  useEffect(() => {
    if (!selectedWO) {
      setJasaCart([]);
      setPartCart([]);
      return;
    }
    const existingJasa: JasaItem[] = (selectedWO.services || []).map((s) => ({
      tempId: `wo-svc-${s.id}`,
      name: s.service.name,
      price: Number(s.price),
      employeeIds: (s.employees || []).map((e) => e.id),
      serviceId: s.serviceId || undefined,
    }));
    const existingHistory: JasaItem[] = (selectedWO.historyItems || []).map((h) => ({
      tempId: `wo-hist-${h.id}`,
      name: h.title,
      price: Number(h.price),
      employeeIds: (h.employees || []).map((e) => e.id),
    }));
    setJasaCart([...existingJasa, ...existingHistory]);

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
  }, [selectedWO, isDirectSale]);

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

  // Check missing mechanic
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
        jasaItems: jasaCart.map((j) => ({
          tempId: j.tempId,
          name: j.name,
          price: j.price,
          employeeIds: j.employeeIds,
          serviceId: j.serviceId,
        })),
        partItems: partCart.map((p) => ({
          tempId: p.tempId,
          inventoryId: p.inventoryId,
          qty: p.qty,
          price: p.price,
          employeeIds: p.employeeIds,
        })),
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

  const invoiceNo = isDirectSale
    ? `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-DIRECT`
    : selectedWO
    ? `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${selectedWO.trackingToken}`
    : "-";

  // DataTable columns for report
  const reportColumns: Column<DailyTx>[] = [
    {
      header: "No. Faktur",
      render: (tx) => (
        <span className="font-mono text-foreground font-bold">
          INV-{tx.paidAt?.slice(0, 10).replace(/-/g, "")}-{tx.workOrder.trackingToken}
        </span>
      ),
    },
    {
      header: "Plat",
      render: (tx) => (
        <span className="rounded-lg bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground border border-border/50">
          {tx.workOrder.vehicle.plateNumber}
        </span>
      ),
    },
    {
      header: "Merk",
      render: (tx) => (
        <span className="text-xs text-muted-foreground">
          {[tx.workOrder.vehicle.brand, tx.workOrder.vehicle.model].filter(Boolean).join(" ") || "-"}
        </span>
      ),
    },
    {
      header: "Metode",
      render: (tx) => <StatusBadge type="payment" status={tx.paymentMethod} showDot={false} />,
    },
    {
      header: "Total Jasa",
      align: "right",
      render: (tx) => {
        const totalSvc =
          (tx.workOrder.services || []).reduce((s: number, sv: any) => s + Number(sv.price), 0) +
          (tx.workOrder.historyItems || []).reduce((s: number, h: any) => s + Number(h.price), 0);
        return <span>{formatCurrency(totalSvc)}</span>;
      },
    },
    {
      header: "Total Part",
      align: "right",
      render: (tx) => {
        const totalParts = (tx.workOrder.parts || []).reduce(
          (s: number, p: any) => s + Number(p.price) * p.qty,
          0
        );
        return <span>{formatCurrency(totalParts)}</span>;
      },
    },
    {
      header: "Grand Total",
      align: "right",
      render: (tx) => <span className="font-bold text-foreground">{formatCurrency(tx.amount)}</span>,
    },
  ];

  return (
    <AppPage>
      {/* Header */}
      <PageHeader
        title="Kasir & Pembayaran"
        description="Pencatatan kasir dan pelunasan transaksi pengerjaan kendaraan"
        actions={
          <Button variant="outline" onClick={() => setShowReport(true)} className="h-10">
            <FileText className="h-4.5 w-4.5" />
            Rekap Transaksi
          </Button>
        }
      />

      {/* 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Left Column: WO selection & Carts */}
        <div className="space-y-6">
          <PageSection
            title="1. Pemilihan Kendaraan"
            description="Pilih antrean selesai atau pembelian sparepart langsung"
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                  Pencarian Plat Nomor / Kode Token
                </label>
                <div className="flex gap-2.5 items-center">
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
                          const display = `${wo.vehicle.plateNumber} (${wo.trackingToken}) — ${[
                            wo.vehicle.brand,
                            wo.vehicle.model,
                          ]
                            .filter(Boolean)
                            .join(" ")}`;
                          return display === val;
                        });
                        if (found) {
                          setSelectedWOId(found.id);
                        } else {
                          setSelectedWOId("");
                        }
                      }}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary disabled:opacity-50 disabled:bg-muted/80 transition-all duration-150"
                    />
                  </div>
                  <Button
                    type="button"
                    variant={isDirectSale ? "primary" : "outline"}
                    onClick={() => {
                      setIsDirectSale(!isDirectSale);
                      if (!isDirectSale) {
                        setSelectedWOId("");
                        setSearchQuery("");
                        setJasaCart([]);
                        setPartCart([]);
                      }
                    }}
                    className={cn("h-11 rounded-xl font-bold shrink-0 shadow-sm transition-all")}
                  >
                    Beli Langsung
                  </Button>
                </div>
                <datalist id="wo-options">
                  {availableWOs.map((wo) => (
                    <option
                      key={wo.id}
                      value={`${wo.vehicle.plateNumber} (${wo.trackingToken}) — ${[
                        wo.vehicle.brand,
                        wo.vehicle.model,
                      ]
                        .filter(Boolean)
                        .join(" ")}`}
                    />
                  ))}
                </datalist>
              </div>

              {/* Selected WO Details Info Card */}
              {(selectedWO || isDirectSale) && (
                <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2 text-sm leading-relaxed">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">Nomor Invoice</span>
                    <span className="font-mono font-bold text-primary">{invoiceNo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">Nomor Plat</span>
                    <span className="font-mono font-bold text-foreground">
                      {isDirectSale ? "PART-DIRECT" : selectedWO?.vehicle.plateNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">Merk Kendaraan</span>
                    <span className="text-foreground font-medium">
                      {isDirectSale
                        ? "PEMBELIAN SPAREPART"
                        : [selectedWO?.vehicle.brand, selectedWO?.vehicle.model]
                            .filter(Boolean)
                            .join(" ") || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold">Nama Pemilik</span>
                    <span className="text-foreground font-medium">
                      {isDirectSale
                        ? "Pelanggan Umum"
                        : selectedWO?.vehicle.customer.name || selectedWO?.vehicle.customer.phone}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </PageSection>

          {/* Carts Sections: Jasa & Parts */}
          {(selectedWO || isDirectSale) && (
            <div className="space-y-6">
              {/* Jasa Section */}
              <PageSection
                title="Layanan Jasa Kasir"
                description="Edit petugas dan tambahkan pengerjaan jasa manual"
                noPadding
              >
                <div className="p-5 border-b border-border/60 bg-muted/10 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Masukkan nama jasa tambahan..."
                        value={jasaName}
                        onChange={(e) => setJasaName(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        placeholder="Biaya (Rp)"
                        value={jasaPrice}
                        onChange={(e) => setJasaPrice(formatNumberInput(e.target.value))}
                        className="h-10 text-right font-semibold"
                      />
                    </div>
                    <Button size="sm" onClick={addJasa} disabled={!jasaName.trim() || !jasaPrice} className="h-10 px-4 shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {cuciServices.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center pt-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Quick Cuci:</span>
                      {cuciServices.map((svc) => (
                        <button
                          key={svc.id}
                          onClick={() => addCuciPreset(svc)}
                          className="rounded-lg border border-border/80 px-2.5 py-1 text-xs font-semibold hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                        >
                          {svc.name} (<span className="text-primary">{formatCurrency(svc.price)}</span>)
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="divide-y divide-border/60">
                  {jasaCart.map((j) => {
                    const isCuci = j.tempId.startsWith("cuci-");
                    const showMechanicSelector = !isCuci;
                    const availableMechanics = employees.filter(
                      (e) => e.position === "Mekanik" && !j.employeeIds.includes(e.id)
                    );
                    return (
                      <div key={j.tempId} className="p-5 flex justify-between items-start hover:bg-slate-500/2 transition-colors gap-3">
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-bold text-foreground">{j.name}</p>
                          {showMechanicSelector ? (
                            <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                              <span className="text-[10px] text-muted-foreground mr-1.5 font-medium">Mekanik:</span>
                              {j.employeeIds.map((empId) => {
                                const emp = employees.find((e) => e.id === empId);
                                return (
                                  <Badge key={empId} variant="primary" className="text-[9px] py-0 h-5 px-1.5 gap-1 font-bold">
                                    {emp?.name || empId.slice(0, 6)}
                                    <button
                                      onClick={() =>
                                        updateItemEmployees(
                                          "jasa",
                                          j.tempId,
                                          j.employeeIds.filter((id) => id !== empId)
                                        )
                                      }
                                      className="ml-1 text-primary-foreground/75 hover:text-primary-foreground font-black cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                );
                              })}
                              <select
                                className="text-[10px] h-5 border border-dashed rounded px-1.5 bg-transparent text-muted-foreground focus:outline-none focus:border-primary cursor-pointer"
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    updateItemEmployees("jasa", j.tempId, [...j.employeeIds, e.target.value]);
                                  }
                                }}
                              >
                                <option value="">+ Mekanik</option>
                                {availableMechanics.map((e) => (
                                  <option key={e.id} value={e.id}>
                                    {e.name}
                                  </option>
                                ))}
                              </select>
                              {j.employeeIds.length === 0 && (
                                <span className="text-[10px] text-amber-500 font-bold ml-1">⚠ Staf wajib diisi</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic font-medium">
                              Layanan Cuci — Otomatis dikelola petugas cuci
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 align-top shrink-0">
                          <span className="text-sm font-extrabold text-foreground">{formatCurrency(j.price)}</span>
                          {(j.tempId.startsWith("manual-") || j.tempId.startsWith("cuci-")) && (
                            <button
                              onClick={() => removeJasa(j.tempId)}
                              className="text-muted-foreground hover:text-destructive p-1 rounded active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {jasaCart.length === 0 && (
                    <p className="p-5 text-sm text-muted-foreground text-center">Belum ada layanan jasa ditambahkan.</p>
                  )}
                  <div className="bg-muted/30 p-4 border-t border-border flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subtotal Layanan Jasa</span>
                    <span className="text-base font-extrabold text-primary">{formatCurrency(totalJasa)}</span>
                  </div>
                </div>
              </PageSection>

              {/* Spareparts Section */}
              <PageSection
                title="Keranjang Belanja Sparepart"
                description="Masukkan part inventaris bengkel yang terjual"
                noPadding
              >
                <div className="p-5 border-b border-border/60 bg-muted/10">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        list="part-options"
                        value={partSearchQuery}
                        placeholder="— Cari nama sparepart / stok —"
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
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition-all duration-150"
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
                      className="h-10 w-16 rounded-xl border border-input bg-background px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
                    />
                    <Button size="sm" onClick={addPart} disabled={!partInventoryId} className="h-10 px-4 shrink-0 bg-emerald-600 hover:bg-emerald-700">
                      Tambah
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border/60">
                  {partCart.map((p) => (
                    <div key={p.tempId} className="p-5 flex justify-between items-center hover:bg-slate-500/2 transition-colors gap-3">
                      <div className="space-y-0.5 flex-1">
                        <p className="text-sm font-bold text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(p.price)} × {p.qty} {p.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-extrabold text-foreground">{formatCurrency(p.price * p.qty)}</span>
                        {p.tempId.startsWith("part-") && (
                          <button
                            onClick={() => removePart(p.tempId)}
                            className="text-muted-foreground hover:text-destructive p-1 rounded active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {partCart.length === 0 && (
                    <p className="p-5 text-sm text-muted-foreground text-center">Belum ada sparepart ditambahkan.</p>
                  )}
                  <div className="bg-muted/30 p-4 border-t border-border flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subtotal Sparepart</span>
                    <span className="text-base font-extrabold text-emerald-600">{formatCurrency(totalPart)}</span>
                  </div>
                </div>
              </PageSection>
            </div>
          )}
        </div>

        {/* Right Column: Checkout & Payment details */}
        <div className="space-y-6">
          {(selectedWO || isDirectSale) ? (
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Payment Info Card */}
              <PageSection
                title="2. Proses Pembayaran"
                description="Detail tagihan akhir, pilihan metode bayar, dan nominal kembalian"
              >
                {/* Total tagihan */}
                <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 text-center space-y-1 mb-5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">TOTAL TAGIHAN AKHIR</span>
                  <p className="text-3xl font-black text-primary">{formatCurrency(grandTotal)}</p>
                </div>

                <div className="space-y-5">
                  {/* Payment Methods selector */}
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                      Pilih Metode Pembayaran
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "CASH", label: "Tunai", icon: Banknote, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
                        { id: "TRANSFER", label: "Transfer", icon: CreditCard, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
                        { id: "QRIS", label: "QRIS QR", icon: QrCode, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
                      ].map((m) => {
                        const isSelected = paymentMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setPaymentMethod(m.id);
                              if (m.id !== "CASH") setUangBayar(new Intl.NumberFormat("id-ID").format(grandTotal));
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 cursor-pointer active:scale-95",
                              isSelected
                                ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20 font-bold"
                                : "border-border bg-card text-muted-foreground hover:bg-slate-500/5 hover:text-foreground"
                            )}
                          >
                            <m.icon className={cn("h-6 w-6 mb-1.5 shrink-0", !isSelected && "text-muted-foreground/60")} />
                            <span className="text-xs">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cash received Input */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Jumlah Uang Bayar (Rp)
                    </label>
                    <Input
                      type="text"
                      value={uangBayar}
                      onChange={(e) => setUangBayar(formatNumberInput(e.target.value))}
                      placeholder="0"
                      className="text-lg font-bold h-12"
                      disabled={paymentMethod !== "CASH"}
                    />
                  </div>

                  {/* Change returned details */}
                  {paymentMethod === "CASH" && (
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nominal Kembalian:</span>
                      <span
                        className={cn(
                          "text-lg font-black transition-colors",
                          kembali >= 0 ? "text-emerald-600" : "text-destructive"
                        )}
                      >
                        {formatCurrency(Math.max(kembali, 0))}
                      </span>
                    </div>
                  )}

                  {/* Submit checkout button */}
                  <div className="pt-2">
                    <Button
                      onClick={handlePayment}
                      loading={processing}
                      disabled={
                        grandTotal <= 0 ||
                        (paymentMethod === "CASH" && uangBayarNum < grandTotal) ||
                        jasaMissingMechanic ||
                        processing
                      }
                      className="w-full h-12 rounded-xl text-base font-extrabold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Receipt className="h-5 w-5 mr-1.5" />
                      SIMPAN & LUNAS
                    </Button>
                    {jasaMissingMechanic && (
                      <p className="text-[10px] text-amber-500 font-bold text-center mt-2.5 leading-normal">
                        ⚠ Mohon tugaskan mekanik pada semua item jasa servis sebelum checkout.
                      </p>
                    )}
                    {paymentMethod === "CASH" && uangBayarNum < grandTotal && !jasaMissingMechanic && (
                      <p className="text-[10px] text-red-500 font-bold text-center mt-2.5">
                        ⚠ Uang pembayaran tunai yang dimasukkan masih kurang dari total tagihan.
                      </p>
                    )}
                  </div>
                </div>
              </PageSection>
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-border/80 rounded-3xl bg-card/40 backdrop-blur-sm flex flex-col items-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <h3 className="text-sm font-bold text-foreground">Pembayaran Belum Siap</h3>
              <p className="text-xs text-muted-foreground max-w-[240px] mt-1.5 leading-normal">
                Silakan pilih plat nomor kendaraan siap bayar di kolom kiri untuk memuat rincian transaksi.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Daily report rekapitulasi modal */}
      <Modal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        title="Laporan Rekapitulasi Transaksi Kasir"
        size="3xl"
      >
        <div className="space-y-5">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="h-9 rounded-lg border border-border/80 bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/25"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border/80 bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="w-40">
              <Select
                options={[
                  { value: "", label: "Semua Metode" },
                  { value: "CASH", label: "Tunai (Cash)" },
                  { value: "TRANSFER", label: "Transfer Bank" },
                  { value: "QRIS", label: "QRIS QR Code" },
                ]}
                value={reportMethod}
                onChange={(e) => setReportMethod(e.target.value)}
              />
            </div>
          </div>

          {/* Transactions DataTable */}
          <DataTable
            columns={reportColumns}
            data={reportData}
            isLoading={loadingReport}
            emptyTitle="Belum ada transaksi hari ini"
            emptyDescription="Semua penyelesaian pembayaran transaksi kasir pada tanggal terpilih akan terdaftar di sini."
            mobileRender={(tx) => {
              const totalSvc =
                (tx.workOrder.services || []).reduce((s: number, sv: any) => s + Number(sv.price), 0) +
                (tx.workOrder.historyItems || []).reduce((s: number, h: any) => s + Number(h.price), 0);
              const totalParts = (tx.workOrder.parts || []).reduce(
                (s: number, p: any) => s + Number(p.price) * p.qty,
                0
              );
              return (
                <div
                  key={tx.id}
                  onClick={() => setReceiptModalTx(tx)}
                  className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">
                      INV-{tx.paidAt?.slice(0, 10).replace(/-/g, "")}-{tx.workOrder.trackingToken}
                    </span>
                    <StatusBadge type="payment" status={tx.paymentMethod} showDot={false} />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Plat: {tx.workOrder.vehicle.plateNumber} —{" "}
                    <span className="text-muted-foreground">
                      {[tx.workOrder.vehicle.brand, tx.workOrder.vehicle.model].filter(Boolean).join(" ")}
                    </span>
                  </p>
                  <div className="flex justify-between items-center border-t border-border/50 pt-2.5 mt-1">
                    <div className="text-[10px] text-muted-foreground">
                      Jasa: {formatCurrency(totalSvc)} | Part: {formatCurrency(totalParts)}
                    </div>
                    <span className="text-xs font-bold text-primary">{formatCurrency(tx.amount)}</span>
                  </div>
                </div>
              );
            }}
          />

          {/* Summary Box row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Cash</p>
              <p className="text-sm font-extrabold text-emerald-600">{formatCurrency(reportSummary.totalCash)}</p>
            </div>
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Total Transfer</p>
              <p className="text-sm font-extrabold text-blue-600">{formatCurrency(reportSummary.totalTransfer)}</p>
            </div>
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Total QRIS</p>
              <p className="text-sm font-extrabold text-purple-600">{formatCurrency(reportSummary.totalQris)}</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Total Omzet</p>
              <p className="text-sm font-extrabold text-primary">{formatCurrency(reportSummary.totalOmzet)}</p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Success Animation Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl text-center space-y-4 animate-scale-up">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200/50 shadow-inner">
              <CheckCircle2 className="h-8 w-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Pembayaran Berhasil!</h3>
              <p className="text-xs text-muted-foreground leading-normal">
                Transaksi telah disimpan dan lunas. Faktur pembayaran siap dicetak.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant="primary"
        confirmText="Lanjutkan"
      />

      <ReceiptModal
        isOpen={!!receiptModalTx}
        onClose={() => setReceiptModalTx(null)}
        transaction={receiptModalTx}
      />
    </AppPage>
  );
}
