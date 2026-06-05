import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const vehicleId = id;

  try {
    const workOrders = await prisma.workOrder.findMany({
      where: { vehicleId },
      include: {
        transaction: true,
        services: {
          include: { service: true, employees: { select: { id: true, name: true } } }
        },
        parts: {
          include: { inventory: true, employees: { select: { id: true, name: true } } }
        },
        historyItems: {
          include: { employees: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(workOrders);
  } catch (error) {
    console.error("Error fetching vehicle history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
