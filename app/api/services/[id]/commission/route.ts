import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { commissionNominal } = body;

    if (commissionNominal === undefined || commissionNominal < 0) {
      return NextResponse.json(
        { error: "Invalid commission nominal" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const updated = await prisma.serviceCommission.upsert({
      where: { serviceId: id },
      update: { commissionNominal },
      create: { serviceId: id, commissionNominal },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating commission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
