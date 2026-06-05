"use client";

import { Modal } from "@/components/ui/modal";
import { formatCurrency } from "@/lib/utils";
import { Printer } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any | null;
}

export function ReceiptModal({ isOpen, onClose, transaction }: ReceiptModalProps) {
  if (!transaction) return null;

  const date = new Date(transaction.paidAt || transaction.createdAt || new Date()).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const invoiceNum = `INV-${(transaction.paidAt || transaction.createdAt || "").slice(0, 10).replace(/-/g, "")}-${transaction.workOrder?.trackingToken || ""}`;

  const totalSvc = 
    (transaction.workOrder?.services || []).reduce((s: number, sv: any) => s + Number(sv.price), 0) + 
    (transaction.workOrder?.historyItems || []).reduce((s: number, h: any) => s + Number(h.price), 0);
  
  const totalParts = (transaction.workOrder?.parts || []).reduce((s: number, p: any) => s + Number(p.price) * p.qty, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Struk Pembayaran" size="sm">
      <div className="flex flex-col items-center">
        {/* Receipt Container - Printable Area */}
        <div id="receipt-print-area" className="w-full max-w-[350px] bg-white text-black p-6 font-mono text-xs sm:text-sm shadow-inner rounded-md border border-gray-200">
          <div className="text-center mb-4">
            <p>================================</p>
            <p className="font-bold text-lg">BENGKEL</p>
            <p>================================</p>
          </div>
          
          <div className="mb-4">
            <p>No. Faktur : {invoiceNum}</p>
            <p>Tanggal    : {date}</p>
            <p>Pelanggan  : {transaction.workOrder?.vehicle?.customer?.name || "-"}</p>
            <p>Kendaraan  : {[transaction.workOrder?.vehicle?.brand, transaction.workOrder?.vehicle?.model].filter(Boolean).join(" ")} ({transaction.workOrder?.vehicle?.plateNumber})</p>
            <p>Pembayaran : {transaction.paymentMethod}</p>
          </div>
          <p className="mb-2 text-center">--------------------------------</p>

          {(transaction.workOrder?.services?.length > 0 || transaction.workOrder?.historyItems?.length > 0) && (
            <div className="mb-4">
              <p className="font-bold mb-1">[ JASA LAYANAN ]</p>
              {transaction.workOrder.services?.map((s: any) => (
                <div key={s.id} className="mb-1">
                  <p className="uppercase break-words">{s.service?.name || "Layanan"}</p>
                  <div className="flex justify-between pl-2">
                    <p>-&gt; Biaya:</p>
                    <p>{formatCurrency(parseFloat(s.price))}</p>
                  </div>
                </div>
              ))}
              {transaction.workOrder.historyItems?.map((h: any) => (
                <div key={h.id} className="mb-1">
                  <p className="uppercase break-words">{h.title}</p>
                  <div className="flex justify-between pl-2">
                    <p>-&gt; Biaya:</p>
                    <p>{formatCurrency(parseFloat(h.price))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {transaction.workOrder?.parts?.length > 0 && (
            <div className="mb-4">
              <p className="font-bold mb-1">[ SPAREPART ]</p>
              {transaction.workOrder.parts?.map((p: any) => (
                <div key={p.id} className="mb-1">
                  <p className="uppercase break-words">{p.inventory?.name || "Item"}</p>
                  <div className="flex justify-between pl-2">
                    <p>{p.qty} x {parseFloat(p.price).toLocaleString("id-ID")}</p>
                    <p>{formatCurrency(parseFloat(p.price) * p.qty)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center">================================</p>
          <div className="flex justify-between mt-2">
            <p>TOTAL JASA</p>
            <p>{formatCurrency(totalSvc)}</p>
          </div>
          <div className="flex justify-between mb-2">
            <p>TOTAL PART</p>
            <p>{formatCurrency(totalParts)}</p>
          </div>
          <p className="text-center">================================</p>
          
          <div className="flex justify-between font-bold text-sm sm:text-base mt-2 mb-2">
            <p>GRAND TOTAL</p>
            <p>{formatCurrency(transaction.amount)}</p>
          </div>
          
          <p className="text-center">================================</p>
          <div className="text-center mt-6 text-xs text-gray-500">
            <p>Terima Kasih Atas Kunjungan Anda</p>
          </div>
        </div>

        {/* Actions (Not Printed) */}
        <div className="w-full mt-6 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted font-medium transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 font-medium shadow-sm transition-colors"
          >
            <Printer className="h-4 w-4" />
            Cetak
          </button>
        </div>
      </div>
    </Modal>
  );
}
