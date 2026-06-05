import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { ExpenseReportClient } from "./_components/expense-report-client";
import { FinancialTabs } from "@/components/dashboard/financial-tabs";
import { getPeriodParams, getDateFilter } from "@/lib/utils";

export default async function ExpenseReportPage(props: { searchParams: Promise<{ period?: string, date?: string, month?: string, year?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const userRole = (session.user as any)?.role || "ADMIN";
  
  const resolvedParams = await props.searchParams;
  const { period, date, month, year } = getPeriodParams(resolvedParams);
  const dateFilter = getDateFilter(period, date, month, year);

  // Fetch Expenses
  const expenses = await prisma.expense.groupBy({
    by: ['category'],
    _sum: { amount: true },
    _count: { id: true },
    where: {
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
    }
  });

  const reportData = expenses.map(exp => ({
    kategori: exp.category,
    jumlahTransaksi: exp._count.id,
    totalPengeluaran: Number(exp._sum.amount || 0)
  })).sort((a, b) => b.totalPengeluaran - a.totalPengeluaran);

  const totalKeseluruhan = reportData.reduce((sum, item) => sum + item.totalPengeluaran, 0);

  let totalOperasional = 0;
  let totalPembelianStok = 0;
  let totalPrive = 0;

  reportData.forEach(item => {
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
      <FinancialTabs activeTab="expense-report" userRole={userRole} />
      <ExpenseReportClient 
        data={reportData}
        totals={{ 
          totalPengeluaran: totalKeseluruhan,
          totalOperasional,
          totalPembelianStok,
          totalPrive
        }}
        period={period}
        date={date}
        month={month}
        year={year}
      />
    </div>
  );
}
