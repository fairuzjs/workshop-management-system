import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DashboardClient } from "./_components/dashboard-client";

export default async function DashboardPage() {
  const session = await requireAuth();

  // Fetch dashboard stats
  const [
    totalWorkOrders,
    activeWorkOrders,
    completedToday,
    totalRevenue,
  ] = await Promise.all([
    prisma.workOrder.count(),
    prisma.workOrder.count({
      where: { status: { in: ["ANTRI", "PROSES"] } },
    }),
    prisma.workOrder.count({
      where: {
        status: "SELESAI",
        completedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { status: "LUNAS" },
    }),
  ]);

  // Recent work orders
  const recentWorkOrders = await prisma.workOrder.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: {
        include: { customer: true },
      },
      employee: true,
    },
  });

  return (
    <DashboardClient
      stats={{
        totalWorkOrders,
        activeWorkOrders,
        completedToday,
        totalRevenue: Number(totalRevenue._sum.amount || 0),
      }}
      recentWorkOrders={recentWorkOrders.map((wo) => ({
        id: wo.id,
        trackingToken: wo.trackingToken,
        status: wo.status,
        serviceType: wo.serviceType,
        customerName: wo.vehicle.customer.name ?? "",
        plateNumber: wo.vehicle.plateNumber,
        employeeName: wo.employee?.name || "-",
        totalCost: Number(wo.totalCost),
        createdAt: wo.createdAt.toISOString(),
      }))}
      userRole={(session.user as { role: string }).role}
    />
  );
}
