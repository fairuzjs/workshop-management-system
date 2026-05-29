import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/work-orders/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      vehicle: { include: { customer: true } },
      employee: true,
      user: { select: { id: true, name: true } },
      services: { include: { service: true } },
      parts: { include: { inventory: true } },
      transaction: true,
      historyItems: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work Order tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(workOrder);
}

// PATCH /api/work-orders/[id] — Update status or assign employee
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { status, employeeId } = body;

  const existing = await prisma.workOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Work Order tidak ditemukan" }, { status: 404 });
  }

  // Status transition validation
  const validTransitions: Record<string, string[]> = {
    ANTRI: ["PROSES"],
    PROSES: ["SELESAI"],
    SELESAI: [],
  };

  const updateData: Record<string, unknown> = {};

  if (status) {
    if (!validTransitions[existing.status]?.includes(status)) {
      return NextResponse.json(
        {
          error: `Tidak bisa mengubah status dari ${existing.status} ke ${status}`,
        },
        { status: 400 }
      );
    }

    updateData.status = status;

    if (status === "PROSES") {
      if (!existing.startedAt) updateData.startedAt = new Date();
    } else if (status === "SELESAI") {
      if (!existing.completedAt) updateData.completedAt = new Date();
      
      // Auto-commission for CUCI
      if (existing.serviceType === "CUCI") {
        const empId = employeeId !== undefined ? employeeId : existing.employeeId;
        if (empId) {
          try {
            // Check existing earning
            const existingEarning = await prisma.employeeEarning.findFirst({
              where: { workOrderId: id, earningType: "COMMISSION" }
            });
            
            if (!existingEarning) {
              // Try to find commission rate from services
              const woServices = await prisma.workOrderService.findMany({
                where: { workOrderId: id },
                include: { service: { include: { commission: true } } }
              });
              
              let totalCommission = 0;
              woServices.forEach(ws => {
                if (ws.service.commission) {
                  const rate = Number(ws.service.commission.commissionRate) / 100;
                  totalCommission += Number(ws.price) * rate;
                }
              });
              
              if (totalCommission > 0) {
                const now = new Date();
                await prisma.employeeEarning.create({
                  data: {
                    employeeId: empId,
                    workOrderId: id,
                    earningType: "COMMISSION",
                    amount: totalCommission,
                    month: now.getMonth() + 1,
                    year: now.getFullYear()
                  }
                });
              }
            }
          } catch (e) {
            console.error("Failed to generate commission:", e);
          }
        }
      }
    }
  }

  if (employeeId !== undefined) {
    if (employeeId) {
      const activeWoCount = await prisma.workOrder.count({
        where: {
          employeeId,
          status: { in: ["ANTRI", "PROSES"] },
          id: { not: id } // exclude the current work order
        }
      });
      if (activeWoCount > 0) {
        return NextResponse.json(
          { error: "Karyawan ini sedang mengerjakan Work Order lain" },
          { status: 400 }
        );
      }
    }
    updateData.employeeId = employeeId || null;
  }

  const updated = await prisma.workOrder.update({
    where: { id },
    data: updateData,
    include: {
      vehicle: { include: { customer: true } },
      employee: true,
      services: { include: { service: true } },
      parts: { include: { inventory: true } },
      transaction: true,
      historyItems: { orderBy: { createdAt: 'asc' } },
    },
  });

  return NextResponse.json(updated);
}
