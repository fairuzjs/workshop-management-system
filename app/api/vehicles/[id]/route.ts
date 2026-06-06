import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { handlePrismaError } from "@/lib/prisma-errors";
import { updateVehicleSchema, parseZodError } from "@/lib/validations";

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

  const parsed = updateVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parseZodError(parsed.error) }, { status: 400 });
  }
  const { plateNumber, type, brand, model, color } = parsed.data;

  try {
    // Check for duplicate plate number (case-insensitive, exclude self)
    if (plateNumber) {
      const existing = await prisma.vehicle.findFirst({
        where: {
          plateNumber: plateNumber.toUpperCase(),
          NOT: { id },
        },
        select: { id: true, customer: { select: { name: true } } },
      });
      if (existing) {
        return NextResponse.json(
          { error: `Plat nomor "${plateNumber.toUpperCase()}" sudah terdaftar atas nama ${existing.customer?.name || 'customer lain'}` },
          { status: 400 }
        );
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(plateNumber && { plateNumber: plateNumber.toUpperCase() }),
        ...(type !== undefined && { type }),
        ...(brand !== undefined && { brand }),
        ...(model !== undefined && { model }),
        ...(color !== undefined && { color }),
      },
      include: { customer: true },
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
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

  try {
    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
