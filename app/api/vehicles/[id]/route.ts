import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/vehicles/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { plateNumber, type, brand, model, color } = body;

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      plateNumber: plateNumber?.toUpperCase(),
      type,
      brand,
      model,
      color,
    },
    include: { customer: true },
  });

  return NextResponse.json(vehicle);
}

// DELETE /api/vehicles/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
