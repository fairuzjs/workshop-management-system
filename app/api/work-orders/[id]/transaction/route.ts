import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/work-orders/[id]/transaction — Create payment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { paymentMethod } = body;

  if (!paymentMethod) {
    return NextResponse.json(
      { error: "Metode pembayaran wajib dipilih" },
      { status: 400 }
    );
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: { transaction: true },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work Order tidak ditemukan" }, { status: 404 });
  }

  if (workOrder.transaction) {
    return NextResponse.json(
      { error: "Transaksi sudah ada untuk Work Order ini" },
      { status: 400 }
    );
  }

  if (workOrder.status !== "SELESAI") {
    return NextResponse.json(
      { error: "Work Order harus berstatus SELESAI sebelum pembayaran" },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.create({
    data: {
      workOrderId: id,
      amount: workOrder.totalCost,
      paymentMethod,
      status: "LUNAS",
      paidAt: new Date(),
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
