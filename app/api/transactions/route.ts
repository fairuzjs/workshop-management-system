import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/transactions — List all transactions
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const method = req.nextUrl.searchParams.get("method");
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};
  if (method) where.paymentMethod = method;
  if (search) {
    where.workOrder = {
      OR: [
        { trackingToken: { contains: search, mode: "insensitive" } },
        { vehicle: { plateNumber: { contains: search, mode: "insensitive" } } },
        { vehicle: { customer: { name: { contains: search, mode: "insensitive" } } } },
      ],
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        workOrder: {
          select: {
            trackingToken: true,
            serviceType: true,
            vehicle: {
              select: {
                plateNumber: true,
                customer: { select: { phone: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    data: transactions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
