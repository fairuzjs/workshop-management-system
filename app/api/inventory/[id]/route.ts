import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { handlePrismaError } from "@/lib/prisma-errors";

// GET /api/inventory/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const item = await prisma.inventory.findUnique({
      where: { id },
      include: {
        logs: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT /api/inventory/[id] — Update item details (not stock)
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
  const { name, category, unit, minStock, capitalPrice, price, supplierId, rackPosition } = body;

  try {
    const item = await prisma.inventory.update({
      where: { id },
      data: {
        name,
        category,
        unit,
        minStock,
        capitalPrice: capitalPrice || 0,
        price,
        supplierId: supplierId || null,
        rackPosition: rackPosition || null,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/inventory/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    // Check if inventory item is used in any work order part
    const partCount = await prisma.workOrderPart.count({ where: { inventoryId: id } });
    if (partCount > 0) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus item karena masih digunakan di Work Order" },
        { status: 400 }
      );
    }

    await prisma.inventory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
