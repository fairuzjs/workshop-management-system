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
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
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

  // Check if vehicle has work orders
  const woCount = await prisma.workOrder.count({ where: { vehicleId: id } });
  if (woCount > 0) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus kendaraan karena masih memiliki Work Order terkait" },
      { status: 400 }
    );
  }

  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
