import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const dateStr = url.searchParams.get("date") || new Date().toISOString().split('T')[0];

  const targetDate = new Date(dateStr);
  const start = new Date(targetDate.setHours(0, 0, 0, 0));
  const end = new Date(targetDate.setHours(23, 59, 59, 999));

  try {
    const employees = await prisma.employee.findMany({
      where: { 
        position: "Pencuci Mobil"
      },
      include: {
        earnings: {
          where: {
            earningType: "COMMISSION",
            createdAt: { gte: start, lte: end },
          },
          include: {
            workOrder: {
              include: {
                vehicle: true,
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const result = employees.map(emp => {
      let totalCommission = 0;
      const uniqueWorkOrders = new Set<string>();
      const history: any[] = [];

      emp.earnings.forEach(earning => {
        totalCommission += Number(earning.amount);
        if (earning.workOrderId && earning.workOrder) {
          if (!uniqueWorkOrders.has(earning.workOrderId)) {
            uniqueWorkOrders.add(earning.workOrderId);
            history.push({
              workOrderId: earning.workOrderId,
              trackingToken: earning.workOrder.trackingToken,
              plateNumber: earning.workOrder.vehicle.plateNumber,
              brand: earning.workOrder.vehicle.brand,
              model: earning.workOrder.vehicle.model,
              time: earning.createdAt.toISOString(),
              commissionEarned: Number(earning.amount)
            });
          } else {
            // If they got multiple commissions for the same WO (e.g. multiple services on same car)
            // just add to the commissionEarned of that existing history entry
            const existing = history.find(h => h.workOrderId === earning.workOrderId);
            if (existing) {
              existing.commissionEarned += Number(earning.amount);
            }
          }
        }
      });

      return {
        id: emp.id,
        name: emp.name,
        position: emp.position,
        totalCommission,
        totalCarsWashed: uniqueWorkOrders.size,
        history
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Daily Payroll Error:", error);
    return NextResponse.json({ error: "Gagal memuat data penggajian harian" }, { status: 500 });
  }
}
