import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DashboardClient } from "./_components/dashboard-client";

export default async function DashboardPage(props: { searchParams: Promise<{ period?: string }> }) {
  const session = await requireAuth();
  const searchParams = await props.searchParams;
  const period = searchParams.period || "month";

  let dateFilter = {};
  if (period === "today") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    dateFilter = { gte: todayStart, lte: todayEnd };
  } else if (period === "month") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    dateFilter = { gte: start, lte: end };
  }

  // Fetch dashboard stats
  // Fetch dashboard stats sequentially to prevent connection pooling exhaustion
  const totalWorkOrders = await prisma.workOrder.count();
  const activeWorkOrders = await prisma.workOrder.count({
    where: { status: { in: ["ANTRI", "PROSES"] } },
  });
  const completedToday = await prisma.workOrder.count({
    where: {
      status: "SELESAI",
      completedAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });
  const totalRevenue = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: { 
      status: "LUNAS",
      ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
    },
  });
  const totalExpense = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: {
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
    }
  });
  const totalSalary = await prisma.employee.aggregate({
    _sum: { salary: true },
    where: { isActive: true },
  });
  const totalEarning = await prisma.employeeEarning.aggregate({
    _sum: { amount: true },
    where: {
      ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
    }
  });

  const rev = Number(totalRevenue._sum.amount || 0);
  const exp = Number(totalExpense._sum.amount || 0);
  const payroll = Number(totalSalary._sum.salary || 0) + Number(totalEarning._sum.amount || 0);

  // Recent work orders
  const recentWorkOrders = await prisma.workOrder.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: {
        include: { customer: true },
      },
    },
  });

  return (
    <DashboardClient
      stats={{
        totalWorkOrders,
        activeWorkOrders,
        completedToday,
        totalRevenue: rev,
        totalExpense: exp,
        totalPayroll: payroll,
        estimatedProfit: rev - exp - payroll,
      }}
      period={period}
      recentWorkOrders={recentWorkOrders.map((wo) => ({
        id: wo.id,
        trackingToken: wo.trackingToken,
        status: wo.status,
        serviceType: wo.serviceType,
        customerPhone: wo.vehicle.customer.phone ?? "",
        plateNumber: wo.vehicle.plateNumber,
        employeeName: "-",
        totalCost: Number(wo.totalCost),
        createdAt: wo.createdAt.toISOString(),
      }))}
      userRole={(session.user as { role: string }).role}
    />
  );
}
