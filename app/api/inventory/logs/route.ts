import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = await prisma.inventoryLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to recent 100 logs for performance
    include: {
      inventory: {
        select: {
          name: true,
          unit: true,
        },
      },
    },
  });

  return NextResponse.json(logs);
}
