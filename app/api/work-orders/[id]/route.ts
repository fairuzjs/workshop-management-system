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
  const body = await req.json();
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
      updateData.startedAt = new Date();
    } else if (status === "SELESAI") {
      updateData.completedAt = new Date();

      // Auto-create commission earnings for CUCI work orders
      if (existing.serviceType === "CUCI" && existing.employeeId) {
        const woServices = await prisma.workOrderService.findMany({
          where: { workOrderId: id },
          include: {
            service: { include: { commission: true } },
          },
        });

        const commissionEarnings = woServices
          .filter((ws) => ws.service.commission)
          .map((ws) => ({
            employeeId: existing.employeeId!,
            workOrderId: id,
            earningType: "COMMISSION" as const,
            amount:
              (Number(ws.price) * Number(ws.service.commission!.commissionRate)) /
              100,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          }));

        if (commissionEarnings.length > 0) {
          await prisma.employeeEarning.createMany({
            data: commissionEarnings,
          });
        }
      }
    }
  }

  if (employeeId !== undefined) {
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
    },
  });

  return NextResponse.json(updated);
}
