import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/work-orders/[id]/parts — Add part to work order (auto-reduce stock)
export async function POST(
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
  const { inventoryId, qty } = body;

  if (!inventoryId || !qty || qty <= 0) {
    return NextResponse.json(
      { error: "Item dan jumlah wajib diisi" },
      { status: 400 }
    );
  }

  // Validate work order exists and is not completed
  const workOrder = await prisma.workOrder.findUnique({ where: { id } });
  if (!workOrder) {
    return NextResponse.json({ error: "Work Order tidak ditemukan" }, { status: 404 });
  }
  if (workOrder.status === "SELESAI") {
    return NextResponse.json(
      { error: "Tidak bisa menambah part ke Work Order yang sudah selesai" },
      { status: 400 }
    );
  }

  // Validate stock availability
  const inventory = await prisma.inventory.findUnique({ where: { id: inventoryId } });
  if (!inventory) {
    return NextResponse.json({ error: "Item inventory tidak ditemukan" }, { status: 404 });
  }
  if (inventory.qty < qty) {
    return NextResponse.json(
      { error: `Stok tidak cukup. Tersedia: ${inventory.qty} ${inventory.unit}` },
      { status: 400 }
    );
  }

  const partPrice = Number(inventory.price) * qty;

  // Transaction: create part, reduce stock, log, update WO total
  await prisma.$transaction([
    // Add part to work order
    prisma.workOrderPart.create({
      data: {
        workOrderId: id,
        inventoryId,
        qty,
        price: inventory.price,
      },
    }),
    // Reduce inventory stock
    prisma.inventory.update({
      where: { id: inventoryId },
      data: { qty: inventory.qty - qty },
    }),
    // Log stock out
    prisma.inventoryLog.create({
      data: {
        inventoryId,
        qty,
        type: "OUT",
        notes: `Digunakan untuk WO: ${workOrder.trackingToken}`,
      },
    }),
    // Update work order total cost
    prisma.workOrder.update({
      where: { id },
      data: { totalCost: Number(workOrder.totalCost) + partPrice },
    }),
  ]);

  // Return updated work order
  const updated = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      vehicle: { include: { customer: true } },
      services: { include: { service: true } },
      parts: { include: { inventory: true } },
      transaction: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/work-orders/[id]/parts — Remove part (restore stock)
export async function DELETE(
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
  const { partId } = body;

  const part = await prisma.workOrderPart.findUnique({
    where: { id: partId },
    include: { workOrder: true },
  });

  if (!part || part.workOrderId !== id) {
    return NextResponse.json({ error: "Part tidak ditemukan" }, { status: 404 });
  }

  if (part.workOrder.status === "SELESAI") {
    return NextResponse.json(
      { error: "Tidak bisa menghapus part dari Work Order yang sudah selesai" },
      { status: 400 }
    );
  }

  const refundAmount = Number(part.price) * part.qty;

  await prisma.$transaction([
    prisma.workOrderPart.delete({ where: { id: partId } }),
    prisma.inventory.update({
      where: { id: part.inventoryId },
      data: { qty: { increment: part.qty } },
    }),
    prisma.inventoryLog.create({
      data: {
        inventoryId: part.inventoryId,
        qty: part.qty,
        type: "IN",
        notes: `Dikembalikan dari WO: ${part.workOrder.trackingToken}`,
      },
    }),
    prisma.workOrder.update({
      where: { id },
      data: { totalCost: Math.max(0, Number(part.workOrder.totalCost) - refundAmount) },
    }),
  ]);

  return NextResponse.json({ success: true });
}
