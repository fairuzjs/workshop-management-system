import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, itemId } = await params;

    // Cek work order existence and transaction lock
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { transaction: true },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work Order tidak ditemukan" }, { status: 404 });
    }

    if (workOrder.transaction) {
      return NextResponse.json({ error: "Tidak dapat menghapus riwayat: Transaksi sudah selesai dibayar." }, { status: 400 });
    }

    const historyItem = await prisma.workOrderHistoryItem.findUnique({
      where: { id: itemId },
    });

    if (!historyItem) {
      return NextResponse.json({ error: "Catatan riwayat tidak ditemukan" }, { status: 404 });
    }

    // Gunakan Prisma Transaction untuk menghapus & update totalCost
    await prisma.$transaction(async (tx) => {
      // 1. Hapus item
      await tx.workOrderHistoryItem.delete({
        where: { id: itemId },
      });

      // 2. Kalkulasi ulang
      const services = await tx.workOrderService.findMany({ where: { workOrderId: id } });
      const parts = await tx.workOrderPart.findMany({ where: { workOrderId: id } });
      const histories = await tx.workOrderHistoryItem.findMany({ where: { workOrderId: id } });

      const totalService = services.reduce((sum, s) => sum + Number(s.price), 0);
      const totalParts = parts.reduce((sum, p) => sum + (Number(p.price) * p.qty), 0);
      const totalHistory = histories.reduce((sum, h) => sum + Number(h.price), 0);
      
      const newTotalCost = totalService + totalParts + totalHistory;

      // 3. Update totalCost pada WorkOrder
      await tx.workOrder.update({
        where: { id },
        data: { totalCost: newTotalCost },
      });
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
