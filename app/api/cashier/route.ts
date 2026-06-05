import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/cashier — List work orders ready for payment (SELESAI + no transaction)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {
    status: "SELESAI",
    transaction: null, // No transaction yet
  };

  if (search) {
    where.OR = [
      { trackingToken: { contains: search, mode: "insensitive" } },
      { vehicle: { plateNumber: { contains: search, mode: "insensitive" } } },
      { vehicle: { customer: { phone: { contains: search, mode: "insensitive" } } } },
      { vehicle: { customer: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [workOrders, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: {
        vehicle: {
          include: {
            customer: { select: { name: true, phone: true } },
          },
        },
        services: {
          include: {
            service: { select: { name: true } },
            employees: { select: { id: true, name: true, position: true } },
          },
        },
        parts: {
          include: {
            inventory: { select: { name: true } },
            employees: { select: { id: true, name: true, position: true } },
          },
        },
        historyItems: {
          include: {
            employees: { select: { id: true, name: true, position: true } },
          },
        },
      },
      orderBy: { completedAt: "asc" }, // Oldest completed first
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workOrder.count({ where }),
  ]);

  return NextResponse.json({
    data: workOrders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
