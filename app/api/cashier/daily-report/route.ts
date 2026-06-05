import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/cashier/daily-report — Daily transaction recap
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dateStr = req.nextUrl.searchParams.get("date");
  
  let targetDateStr = dateStr;
  if (!targetDateStr) {
    // Get current date in WIB (UTC+7)
    const now = new Date();
    now.setUTCHours(now.getUTCHours() + 7);
    targetDateStr = now.toISOString().split("T")[0];
  }

  const search = req.nextUrl.searchParams.get("search") || "";
  const method = req.nextUrl.searchParams.get("method") || "";

  // Set boundaries explicitly in UTC+7 (WIB)
  const startOfDay = new Date(`${targetDateStr}T00:00:00.000+07:00`);
  const endOfDay = new Date(`${targetDateStr}T23:59:59.999+07:00`);

  const where: Record<string, unknown> = {
    paidAt: { gte: startOfDay, lte: endOfDay },
    status: "LUNAS",
  };

  if (method) where.paymentMethod = method;
  if (search) {
    where.workOrder = {
      OR: [
        { trackingToken: { contains: search, mode: "insensitive" } },
        { vehicle: { plateNumber: { contains: search, mode: "insensitive" } } },
      ],
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      workOrder: {
        include: {
          vehicle: {
            include: { customer: { select: { name: true, phone: true } } },
          },
          services: { include: { service: true } },
          parts: { include: { inventory: true } },
          historyItems: true,
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  // Calculate summaries
  let totalCash = 0;
  let totalTransfer = 0;
  let totalQris = 0;

  transactions.forEach((tx) => {
    const amount = Number(tx.amount);
    switch (tx.paymentMethod) {
      case "CASH":
        totalCash += amount;
        break;
      case "TRANSFER":
        totalTransfer += amount;
        break;
      case "QRIS":
        totalQris += amount;
        break;
    }
  });

  return NextResponse.json({
    data: transactions,
    summary: {
      totalCash,
      totalTransfer,
      totalQris,
      totalOmzet: totalCash + totalTransfer + totalQris,
      count: transactions.length,
    },
  });
}
