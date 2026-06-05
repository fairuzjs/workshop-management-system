import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { CashFlowClient } from "./_components/cash-flow-client";
import { FinancialTabs } from "@/components/dashboard/financial-tabs";
import { getPeriodParams, getDateFilter } from "@/lib/utils";

export default async function CashFlowPage(props: { searchParams: Promise<{ period?: string, date?: string, month?: string, year?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const userRole = (session.user as any)?.role || "ADMIN";
  
  const resolvedParams = await props.searchParams;
  const { period, date, month, year } = getPeriodParams(resolvedParams);
  const dateFilter = getDateFilter(period, date, month, year);

  // 1. Fetch Inflows (Transactions)
  const transactions = await prisma.transaction.findMany({
    where: {
      status: "LUNAS",
      ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
    },
    include: {
      workOrder: {
        include: {
          vehicle: {
            include: {
              customer: true
            }
          }
        }
      }
    }
  });

  // 2. Fetch Outflows (Expenses)
  const expenses = await prisma.expense.findMany({
    where: {
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
    }
  });

  // 3. Map to Mutations Array
  const mutations = [
    ...transactions.map(t => ({
      id: `in_${t.id}`,
      date: t.paidAt || t.createdAt,
      type: 'IN' as const,
      category: 'Pendapatan Jasa & Penjualan',
      description: `Pembayaran WO: ${t.workOrder.trackingToken} - ${t.workOrder.vehicle?.customer?.name || t.workOrder.vehicle?.plateNumber || 'Pelanggan'}`,
      amount: Number(t.amount)
    })),
    ...expenses.map(e => ({
      id: `out_${e.id}`,
      date: e.date,
      type: 'OUT' as const,
      category: e.category,
      description: e.description || e.category,
      amount: Number(e.amount)
    }))
  ];

  // 4. Sort by Date Descending
  mutations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 5. Calculate Totals
  let totalMasuk = 0;
  let totalKeluar = 0;
  
  mutations.forEach(m => {
    if (m.type === 'IN') totalMasuk += m.amount;
    if (m.type === 'OUT') totalKeluar += m.amount;
  });

  const saldoKas = totalMasuk - totalKeluar;

  // ===== SALES REPORT DATA =====
  const woServices = await prisma.workOrderService.findMany({
    where: {
      workOrder: {
        status: "SELESAI",
        transaction: {
          status: "LUNAS",
          ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
        }
      }
    },
    include: { service: true }
  });

  const servicesMap = new Map();
  woServices.forEach(ws => {
    let name = ws.service.name.toUpperCase();
    if (name.includes('CUCI')) name = 'JASA CUCI MOBIL';
    if (!servicesMap.has(name)) {
      servicesMap.set(name, { kode: 'JS', keterangan: name, jumlah: 0, totalPenjualan: 0, hpp: 0, laba: 0 });
    }
    const item = servicesMap.get(name);
    item.jumlah += 1;
    item.totalPenjualan += Number(ws.price);
    item.laba += Number(ws.price);
  });

  const woParts = await prisma.workOrderPart.findMany({
    where: {
      workOrder: {
        status: "SELESAI",
        transaction: {
          status: "LUNAS",
          ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
        }
      }
    },
    include: { inventory: true }
  });

  const partsMap = new Map();
  woParts.forEach(wp => {
    const category = (wp.inventory.category || 'LAINNYA').toUpperCase();
    const name = `PENJUALAN ${category}`;
    if (!partsMap.has(name)) {
      partsMap.set(name, { kode: 'IN', keterangan: name, jumlah: 0, totalPenjualan: 0, hpp: 0, laba: 0 });
    }
    const item = partsMap.get(name);
    const qty = wp.qty;
    const totalSales = Number(wp.price) * qty;
    const hpp = Number(wp.inventory.capitalPrice) * qty;
    item.jumlah += qty;
    item.totalPenjualan += totalSales;
    item.hpp += hpp;
    item.laba += (totalSales - hpp);
  });

  const salesData = [...Array.from(servicesMap.values()), ...Array.from(partsMap.values())];
  const totalPenjualan = salesData.reduce((sum: number, item: any) => sum + item.totalPenjualan, 0);
  const totalHpp = salesData.reduce((sum: number, item: any) => sum + item.hpp, 0);
  const totalLaba = salesData.reduce((sum: number, item: any) => sum + item.laba, 0);

  // ===== EXPENSE REPORT DATA =====
  const expenseGroups = await prisma.expense.groupBy({
    by: ['category'],
    _sum: { amount: true },
    _count: { id: true },
    where: {
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
    }
  });

  const expenseData = expenseGroups.map(exp => ({
    kategori: exp.category,
    jumlahTransaksi: exp._count.id,
    totalPengeluaran: Number(exp._sum.amount || 0)
  })).sort((a, b) => b.totalPengeluaran - a.totalPengeluaran);

  const totalExpKeseluruhan = expenseData.reduce((sum, item) => sum + item.totalPengeluaran, 0);
  let totalOperasional = 0;
  let totalPembelianStok = 0;
  let totalPrive = 0;
  expenseData.forEach(item => {
    const cat = item.kategori.toUpperCase();
    if (cat.includes('PEMBELIAN STOK') || cat.includes('PEMBELIAN STOCK') || cat.includes('RESTOCK') || cat.includes('INVENTORY')) {
      totalPembelianStok += item.totalPengeluaran;
    } else if (cat.includes('PRIVE') || cat.includes('PENGAMBILAN')) {
      totalPrive += item.totalPengeluaran;
    } else {
      totalOperasional += item.totalPengeluaran;
    }
  });

  return (
    <div className="space-y-6">
      <FinancialTabs activeTab="cash-flow" userRole={userRole} />
      <CashFlowClient 
        data={mutations.map(m => ({ ...m, date: m.date.toISOString() }))}
        totals={{ totalMasuk, totalKeluar, saldoKas }}
        salesData={salesData}
        salesTotals={{ totalPenjualan, totalHpp, totalLaba }}
        expenseData={expenseData}
        expenseTotals={{ totalPengeluaran: totalExpKeseluruhan, totalOperasional, totalPembelianStok, totalPrive }}
        period={period}
        date={date}
        month={month}
        year={year}
      />
    </div>
  );
}
