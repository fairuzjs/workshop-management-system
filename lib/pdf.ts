import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, getPeriodText } from "./utils";

interface ReportItem {
  kode: string;
  keterangan: string;
  jumlah: number;
  totalPenjualan: number;
  hpp: number;
  laba: number;
}

interface Totals {
  totalPenjualan: number;
  totalHpp: number;
  totalLaba: number;
}

export function generateSalesReportPDF(
  data: ReportItem[],
  totals: Totals,
  period: string,
  date: string,
  month: string,
  year: string
) {
  const doc = new jsPDF();
  
  // Define period string
  const periodStr = getPeriodText(period, date, month, year);

  // 1. Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SINAR SURYA AUTOCARE", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Laporan Total Penjualan", doc.internal.pageSize.getWidth() / 2, 28, { align: "center" });
  
  doc.setFontSize(10);
  doc.text(`Periode: ${periodStr}`, doc.internal.pageSize.getWidth() / 2, 35, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(14, 40, doc.internal.pageSize.getWidth() - 14, 40);

  // 2. Table Data
  const tableColumn = ["Kode", "Keterangan", "Jumlah", "Total Penjualan", "HPP", "Laba"];
  const tableRows: any[] = data.map((item) => [
    item.kode,
    item.keterangan.toUpperCase(),
    item.jumlah.toString(),
    formatCurrency(item.totalPenjualan),
    formatCurrency(item.hpp),
    formatCurrency(item.laba),
  ]);

  if (data.length === 0) {
    tableRows.push([{ content: "Data kosong untuk periode ini", colSpan: 6, styles: { halign: "center", fontStyle: "italic" } }]);
  }

  let finalY = 45;

  autoTable(doc, {
    startY: finalY,
    head: [tableColumn],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 25 },
      2: { cellWidth: 15, halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
    didDrawPage: (dataArg) => {
      // Add page number at bottom
      const str = "Halaman " + (doc.internal as any).getNumberOfPages();
      doc.setFontSize(8);
      doc.text(str, dataArg.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
    },
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // 3. Summary Section - check if we need a new page
  const pageHeight = doc.internal.pageSize.height;
  const summaryHeight = 50;
  if (finalY + summaryHeight > pageHeight - 20) {
    doc.addPage();
    finalY = 20;
  }

  // Draw separator line
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(14, finalY, doc.internal.pageSize.getWidth() - 14, finalY);
  finalY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Ringkasan Keuangan", 14, finalY);
  finalY += 10;
  
  doc.setFontSize(10);
  
  const drawSummaryRow = (label: string, value: number, y: number, highlight: boolean = false) => {
    if (highlight) {
      doc.setFillColor(240, 240, 245);
      doc.rect(14, y - 5, doc.internal.pageSize.getWidth() - 28, 8, "F");
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.setTextColor(0);
    doc.text(label, 16, y);
    doc.text(formatCurrency(value), doc.internal.pageSize.getWidth() - 16, y, { align: "right" });
  };

  drawSummaryRow("Total Penjualan", totals.totalPenjualan, finalY);
  finalY += 8;
  drawSummaryRow("Total HPP", totals.totalHpp, finalY);
  finalY += 10;

  // Draw line before final total
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(14, finalY - 3, doc.internal.pageSize.getWidth() - 14, finalY - 3);

  drawSummaryRow("Total Laba (Kotor)", totals.totalLaba, finalY, true);

  // 4. Save PDF
  const filename = `Laporan_Penjualan_${periodStr.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

export function generateExpenseReportPDF(
  data: any[],
  totals: any,
  period: string,
  date: string,
  month: string,
  year: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  const periodStr = getPeriodText(period, date, month, year);

  // 1. Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LAPORAN TOTAL PENGELUARAN", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("SINAR SURYA AUTOCARE", pageWidth / 2, 26, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`Periode: ${periodStr}`, pageWidth / 2, 32, { align: "center" });

  // 2. Table Data
  const tableColumn = ["No", "Kategori Pengeluaran", "Jumlah Transaksi", "Total Pengeluaran"];
  const tableRows: any[] = data.map((item, index) => [
    (index + 1).toString(),
    item.kategori.toUpperCase(),
    item.jumlahTransaksi.toString(),
    formatCurrency(item.totalPengeluaran)
  ]);

  let finalY = 40;

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 45, halign: 'right' }
    },
    didDrawPage: (data) => {
      // Add page number at the bottom
      const str = `Halaman ${(doc.internal as any).getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.text(str, pageWidth / 2, doc.internal.pageSize.height - 10, { align: "center" });
    }
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // 3. Ringkasan - check if we need a new page
  const pageHeight = doc.internal.pageSize.height;
  const summaryHeight = 60;
  if (finalY + summaryHeight > pageHeight - 20) {
    doc.addPage();
    finalY = 20;
  }

  // Draw separator line
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(14, finalY, pageWidth - 14, finalY);
  finalY += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Ringkasan Pengeluaran", 14, finalY);
  finalY += 10;

  doc.setFontSize(10);
  
  const drawSummaryRow = (label: string, value: number, y: number, highlight = false) => {
    if (highlight) {
      doc.setFillColor(240, 240, 245);
      doc.rect(14, y - 5, pageWidth - 28, 8, "F");
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.setTextColor(0);
    doc.text(label, 16, y);
    doc.text(formatCurrency(value), pageWidth - 16, y, { align: "right" });
  };

  drawSummaryRow("Total Biaya Operasional", totals.totalOperasional, finalY);
  finalY += 8;
  drawSummaryRow("Total Pembelian Stok", totals.totalPembelianStok, finalY);
  finalY += 8;
  drawSummaryRow("Total Prive / Pengambilan", totals.totalPrive, finalY);
  finalY += 10;

  // Draw line before final total
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(14, finalY - 3, pageWidth - 14, finalY - 3);

  drawSummaryRow("Total Seluruh Pengeluaran", totals.totalPengeluaran, finalY, true);

  // 4. Save PDF
  const filename = `Laporan_Pengeluaran_${periodStr.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

export function generateCashFlowPDF(
  data: any[],
  totals: any,
  period: string,
  date: string,
  month: string,
  year: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  const periodStr = getPeriodText(period, date, month, year);

  // 1. Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LAPORAN MUTASI KAS", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("SINAR SURYA AUTOCARE", pageWidth / 2, 26, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`Periode: ${periodStr}`, pageWidth / 2, 32, { align: "center" });

  // 2. Table Data
  const tableColumn = ["Tanggal", "Kategori", "Keterangan", "Masuk", "Keluar"];
  const tableRows: any[] = data.map((item) => [
    new Date(item.date).toLocaleString('id-ID', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }),
    item.category.toUpperCase(),
    item.description,
    item.type === 'IN' ? formatCurrency(item.amount) : "-",
    item.type === 'OUT' ? formatCurrency(item.amount) : "-"
  ]);

  let finalY = 40;

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' }
    },
    didDrawPage: (data) => {
      // Add page number at the bottom
      const str = `Halaman ${(doc.internal as any).getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.text(str, pageWidth / 2, doc.internal.pageSize.height - 10, { align: "center" });
    }
  });

  finalY = (doc as any).lastAutoTable.finalY + 10;

  // 3. Ringkasan Keuangan - check if we need a new page
  const pageHeight = doc.internal.pageSize.height;
  const summaryHeight = 50; // approximate height needed for summary
  if (finalY + summaryHeight > pageHeight - 20) {
    doc.addPage();
    finalY = 20;
  }

  // Draw separator line
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(14, finalY, pageWidth - 14, finalY);
  finalY += 8;

  // Section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Ringkasan Keuangan", 14, finalY);
  finalY += 10;

  doc.setFontSize(10);
  
  const drawSummaryRow = (label: string, value: number, y: number, highlight = false) => {
    if (highlight) {
      doc.setFillColor(240, 240, 245);
      doc.rect(14, y - 5, pageWidth - 28, 8, "F");
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.setTextColor(0);
    doc.text(label, 16, y);
    doc.text(formatCurrency(value), pageWidth - 16, y, { align: "right" });
  };

  drawSummaryRow("Total Pemasukan", totals.totalMasuk, finalY);
  finalY += 8;
  drawSummaryRow("Total Pengeluaran", totals.totalKeluar, finalY);
  finalY += 10;

  // Draw a thicker line before final total
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(14, finalY - 3, pageWidth - 14, finalY - 3);

  drawSummaryRow("Saldo Akhir / Laba Rugi Sederhana", totals.saldoKas, finalY, true);

  // 4. Save PDF
  const filename = `Laporan_Mutasi_Kas_${periodStr.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

export function generateFullFinancialPDF(
  salesData: any[],
  salesTotals: any,
  expenseData: any[],
  expenseTotals: any,
  cashFlowData: any[],
  cashFlowTotals: any,
  period: string,
  date: string,
  month: string,
  year: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const periodStr = getPeriodText(period, date, month, year);

  const addPageNumber = () => {
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Halaman ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
    }
  };

  // Helper: draw summary row
  const drawRow = (label: string, value: number, y: number, highlight = false) => {
    if (highlight) {
      doc.setFillColor(240, 240, 245);
      doc.rect(14, y - 5, pageWidth - 28, 8, "F");
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    doc.setTextColor(0);
    doc.text(label, 16, y);
    doc.text(formatCurrency(value), pageWidth - 16, y, { align: "right" });
  };

  // Helper: separator + title
  const drawSectionTitle = (title: string, y: number): number => {
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(title, 14, y);
    return y + 10;
  };

  let finalY = 0;

  // =========================================
  // COVER / HEADER
  // =========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text("LAPORAN KEUANGAN LENGKAP", pageWidth / 2, 25, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text("SINAR SURYA AUTOCARE", pageWidth / 2, 33, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Periode: ${periodStr}`, pageWidth / 2, 40, { align: "center" });

  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(1);
  doc.line(14, 45, pageWidth - 14, 45);

  // =========================================
  // SECTION 1: LAPORAN PENJUALAN
  // =========================================
  finalY = 55;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text("I. LAPORAN TOTAL PENJUALAN", 14, finalY);
  finalY += 8;

  const salesColumns = ["Kode", "Keterangan", "Jumlah", "Total Penjualan", "HPP", "Laba"];
  const salesRows = salesData.map((item: any) => [
    item.kode,
    item.keterangan.toUpperCase(),
    item.jumlah.toString(),
    formatCurrency(item.totalPenjualan),
    formatCurrency(item.hpp),
    formatCurrency(item.laba)
  ]);

  if (salesData.length === 0) {
    salesRows.push([{ content: "Data kosong untuk periode ini", colSpan: 6, styles: { halign: "center", fontStyle: "italic" } } as any]);
  }

  autoTable(doc, {
    startY: finalY,
    head: [salesColumns],
    body: salesRows,
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 15 },
      2: { cellWidth: 15, halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" }
    }
  });

  finalY = (doc as any).lastAutoTable.finalY + 8;

  // Check for new page
  if (finalY + 40 > pageHeight - 20) { doc.addPage(); finalY = 20; }

  finalY = drawSectionTitle("Ringkasan Penjualan", finalY);
  doc.setFontSize(10);
  drawRow("Total Penjualan", salesTotals.totalPenjualan, finalY);
  finalY += 8;
  drawRow("Total HPP", salesTotals.totalHpp, finalY);
  finalY += 10;
  doc.setDrawColor(0); doc.setLineWidth(0.3);
  doc.line(14, finalY - 3, pageWidth - 14, finalY - 3);
  drawRow("Total Laba (Kotor)", salesTotals.totalLaba, finalY, true);

  // =========================================
  // SECTION 2: LAPORAN PENGELUARAN
  // =========================================
  doc.addPage();
  finalY = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text("II. LAPORAN TOTAL PENGELUARAN", 14, finalY);
  finalY += 8;

  const expColumns = ["No", "Kategori Pengeluaran", "Jumlah Transaksi", "Total Pengeluaran"];
  const expRows = expenseData.map((item: any, index: number) => [
    (index + 1).toString(),
    item.kategori.toUpperCase(),
    item.jumlahTransaksi.toString(),
    formatCurrency(item.totalPengeluaran)
  ]);

  if (expenseData.length === 0) {
    expRows.push([{ content: "Data kosong untuk periode ini", colSpan: 4, styles: { halign: "center", fontStyle: "italic" } } as any]);
  }

  autoTable(doc, {
    startY: finalY,
    head: [expColumns],
    body: expRows,
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 15 },
      2: { cellWidth: 35, halign: "center" },
      3: { cellWidth: 45, halign: "right" }
    }
  });

  finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY + 55 > pageHeight - 20) { doc.addPage(); finalY = 20; }

  finalY = drawSectionTitle("Ringkasan Pengeluaran", finalY);
  doc.setFontSize(10);
  drawRow("Total Biaya Operasional", expenseTotals.totalOperasional, finalY);
  finalY += 8;
  drawRow("Total Pembelian Stok", expenseTotals.totalPembelianStok, finalY);
  finalY += 8;
  drawRow("Total Prive / Pengambilan", expenseTotals.totalPrive, finalY);
  finalY += 10;
  doc.setDrawColor(0); doc.setLineWidth(0.3);
  doc.line(14, finalY - 3, pageWidth - 14, finalY - 3);
  drawRow("Total Seluruh Pengeluaran", expenseTotals.totalPengeluaran, finalY, true);

  // =========================================
  // SECTION 3: MUTASI KAS
  // =========================================
  doc.addPage();
  finalY = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(41, 128, 185);
  doc.text("III. LAPORAN MUTASI KAS", 14, finalY);
  finalY += 8;

  const cashColumns = ["Tanggal", "Kategori", "Keterangan", "Masuk", "Keluar"];
  const cashRows = cashFlowData.map((item: any) => [
    new Date(item.date).toLocaleString('id-ID', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    }),
    item.category.toUpperCase(),
    item.description,
    item.type === 'IN' ? formatCurrency(item.amount) : "-",
    item.type === 'OUT' ? formatCurrency(item.amount) : "-"
  ]);

  autoTable(doc, {
    startY: finalY,
    head: [cashColumns],
    body: cashRows,
    theme: "striped",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 7, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 25, halign: "right" },
      4: { cellWidth: 25, halign: "right" }
    }
  });

  finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY + 50 > pageHeight - 20) { doc.addPage(); finalY = 20; }

  // =========================================
  // RINGKASAN KEUANGAN AKHIR
  // =========================================
  finalY = drawSectionTitle("Ringkasan Keuangan", finalY);
  doc.setFontSize(10);
  drawRow("Total Pemasukan", cashFlowTotals.totalMasuk, finalY);
  finalY += 8;
  drawRow("Total Pengeluaran", cashFlowTotals.totalKeluar, finalY);
  finalY += 10;
  doc.setDrawColor(0); doc.setLineWidth(0.3);
  doc.line(14, finalY - 3, pageWidth - 14, finalY - 3);
  drawRow("Saldo Akhir / Laba Rugi Sederhana", cashFlowTotals.saldoKas, finalY, true);

  // Add page numbers to all pages
  addPageNumber();

  // Save
  const filename = `Laporan_Keuangan_Lengkap_${periodStr.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}

