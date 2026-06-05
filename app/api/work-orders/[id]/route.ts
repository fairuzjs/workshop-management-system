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
      user: { select: { id: true, name: true } },
      services: {
        include: {
          service: true,
          employees: { select: { id: true, name: true, position: true } },
        },
      },
      parts: {
        include: {
          inventory: true,
          employees: { select: { id: true, name: true, position: true } },
        },
      },
      transaction: true,
      historyItems: {
        orderBy: { createdAt: "asc" },
        include: {
          employees: { select: { id: true, name: true, position: true } },
        },
      },
    },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work Order tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(workOrder);
}

// PATCH /api/work-orders/[id] — Update status or assign employees per item
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
  const { status, employeeAssignments } = body;

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
      // Validasi: semua layanan jasa harus sudah memiliki mekanik yang ditugaskan
      const servicesWithEmployees = await prisma.workOrderService.findMany({
        where: { workOrderId: id },
        include: { employees: { select: { id: true } } },
      });
      const historyWithEmployees = await prisma.workOrderHistoryItem.findMany({
        where: { workOrderId: id },
        include: { employees: { select: { id: true } } },
      });

      const allServiceItems = [...servicesWithEmployees, ...historyWithEmployees];
      if (allServiceItems.length > 0) {
        const missingEmployee = allServiceItems.some((item) => item.employees.length === 0);
        if (missingEmployee) {
          return NextResponse.json(
            { error: "Semua layanan jasa harus memiliki mekanik yang ditugaskan sebelum bisa diselesaikan" },
            { status: 400 }
          );
        }
      }

      if (!existing.completedAt) updateData.completedAt = new Date();
    }
  }

  // Handle employee assignments per item (only when PROSES)
  if (employeeAssignments && Array.isArray(employeeAssignments)) {
    if (existing.status !== "PROSES" && status !== "PROSES") {
      return NextResponse.json(
        { error: "Penugasan karyawan hanya bisa dilakukan saat status PROSES" },
        { status: 400 }
      );
    }

    for (const assignment of employeeAssignments) {
      const { targetType, targetId, employeeIds } = assignment as {
        targetType: "service" | "part" | "history";
        targetId: string;
        employeeIds: string[];
      };

      const connectData = employeeIds.map((empId: string) => ({ id: empId }));

      if (targetType === "service") {
        await prisma.workOrderService.update({
          where: { id: targetId },
          data: { employees: { set: connectData } },
        });
      } else if (targetType === "part") {
        await prisma.workOrderPart.update({
          where: { id: targetId },
          data: { employees: { set: connectData } },
        });
      } else if (targetType === "history") {
        await prisma.workOrderHistoryItem.update({
          where: { id: targetId },
          data: { employees: { set: connectData } },
        });
      }
    }
  }

  // Update the work order itself (status change, etc.)
  if (Object.keys(updateData).length > 0) {
    await prisma.workOrder.update({
      where: { id },
      data: updateData,
    });
  }

  // Re-fetch and return the full work order
  const updated = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      vehicle: { include: { customer: true } },
      services: {
        include: {
          service: true,
          employees: { select: { id: true, name: true, position: true } },
        },
      },
      parts: {
        include: {
          inventory: true,
          employees: { select: { id: true, name: true, position: true } },
        },
      },
      transaction: true,
      historyItems: {
        orderBy: { createdAt: "asc" },
        include: {
          employees: { select: { id: true, name: true, position: true } },
        },
      },
    },
  });

  return NextResponse.json(updated);
}
