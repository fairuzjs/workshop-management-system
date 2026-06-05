import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// DELETE /api/work-orders/[id]/services — Remove a service from work order
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
  const { serviceId } = body;

  if (!serviceId) {
    return NextResponse.json({ error: "serviceId wajib diisi" }, { status: 400 });
  }

  const woService = await prisma.workOrderService.findUnique({
    where: { id: serviceId },
    include: { workOrder: { include: { transaction: true } } },
  });

  if (!woService || woService.workOrderId !== id) {
    return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
  }

  if (woService.workOrder.status === "SELESAI") {
    return NextResponse.json(
      { error: "Tidak bisa menghapus layanan dari Work Order yang sudah selesai" },
      { status: 400 }
    );
  }

  if (woService.workOrder.transaction) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus layanan karena transaksi sudah dibuat" },
      { status: 400 }
    );
  }

  const refundAmount = Number(woService.price);

  await prisma.$transaction([
    prisma.workOrderService.delete({ where: { id: serviceId } }),
    prisma.workOrder.update({
      where: { id },
      data: { totalCost: Math.max(0, Number(woService.workOrder.totalCost) - refundAmount) },
    }),
  ]);

  return NextResponse.json({ success: true });
}
