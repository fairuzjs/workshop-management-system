import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, price } = body;

    if (!title) {
      return NextResponse.json({ error: "Judul pekerjaan wajib diisi" }, { status: 400 });
    }

    if (price === undefined || price < 0) {
      return NextResponse.json({ error: "Harga tidak boleh negatif" }, { status: 400 });
    }

    // Cek work order existence and transaction lock
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { transaction: true },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work Order tidak ditemukan" }, { status: 404 });
    }

    if (workOrder.transaction) {
      return NextResponse.json({ error: "Tidak dapat menambah riwayat: Transaksi sudah selesai dibayar." }, { status: 400 });
    }

    // Gunakan Prisma Transaction untuk menyimpan item & mengupdate totalCost
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat History Item
      const historyItem = await tx.workOrderHistoryItem.create({
        data: {
          workOrderId: id,
          title,
          description: description || null,
          price: Number(price),
        },
      });

      // 2. Kalkulasi ulang totalCost
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

      return historyItem;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan sistem" }, { status: 500 });
  }
}
