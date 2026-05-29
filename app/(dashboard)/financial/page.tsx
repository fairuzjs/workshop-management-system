import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { FinancialClient } from "./_components/financial-client";

export default async function FinancialPage(props: { searchParams: Promise<{ period?: string, date?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const userRole = (session.user as any)?.role || "ADMIN";
  const isAdmin = userRole === "ADMIN";
  
  const searchParams = await props.searchParams;
  const period = searchParams.period || (isAdmin ? "daily" : "month");
  const dateStr = searchParams.date || new Date().toISOString().split('T')[0];

  let dateFilter = {};
  if (isAdmin || period === "daily") {
    const targetDate = new Date(dateStr);
    const start = new Date(targetDate.setHours(0, 0, 0, 0));
    const end = new Date(targetDate.setHours(23, 59, 59, 999));
    dateFilter = { gte: start, lte: end };
  } else if (period === "month") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  }

  // 1. Basic Stats
  const [
    totalWorkOrders,
    completedWorkOrders,
    totalTransactions,
    totalRevenue,
    totalExpense,
    totalSalary,
    totalEarning,
  ] = await Promise.all([
    prisma.workOrder.count({
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
    }),
    prisma.workOrder.count({
      where: {
        status: "SELESAI",
        ...(Object.keys(dateFilter).length > 0 ? { completedAt: dateFilter } : {})
      }
    }),
    prisma.transaction.count({
      where: {
        status: "LUNAS",
        ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
      }
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { 
        status: "LUNAS",
        ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
      }
    }),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
      }
    }),
    isAdmin ? { _sum: { salary: 0 } } : prisma.employee.aggregate({
      _sum: { salary: true },
      where: { isActive: true }
    }),
    isAdmin ? { _sum: { amount: 0 } } : prisma.employeeEarning.aggregate({
      _sum: { amount: true },
      where: {
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
      }
    })
  ]);

  // 2. Breakdowns
  const [revenueByMethod, woByType, expenseByCategory] = await Promise.all([
    prisma.transaction.groupBy({
      by: ['paymentMethod'],
      _sum: { amount: true },
      where: { 
        status: "LUNAS",
        ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
      }
    }),
    prisma.workOrder.groupBy({
      by: ['serviceType'],
      _count: true,
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
    }),
    prisma.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: {
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
      }
    })
  ]);

  const rev = Number(totalRevenue._sum.amount || 0);
  const exp = Number(totalExpense._sum.amount || 0);
  const payroll = Number(totalSalary._sum.salary || 0) + Number(totalEarning._sum.amount || 0);

  return (
    <FinancialClient 
      role={userRole}
      period={period}
      dateStr={dateStr}
      stats={{
        revenue: rev,
        expense: exp,
        payroll: payroll,
        profit: rev - exp - payroll,
        totalTransactions,
        totalWorkOrders,
        completedWorkOrders
      }}
      breakdowns={{
        revenueByMethod: revenueByMethod.map(r => ({
          method: r.paymentMethod,
          amount: Number(r._sum.amount || 0)
        })),
        woByType: woByType.map(w => ({
          type: w.serviceType,
          count: w._count
        })),
        expenseByCategory: expenseByCategory.map(e => ({
          category: e.category,
          amount: Number(e._sum.amount || 0)
        }))
      }}
    />
  );
}
