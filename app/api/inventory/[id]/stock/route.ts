import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/inventory/[id]/stock — Stock In/Out
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
  const { qty, type, notes, recordExpense } = body;

  if (!qty || qty <= 0 || !type) {
    return NextResponse.json(
      { error: "Jumlah dan tipe (IN/OUT) wajib diisi" },
      { status: 400 }
    );
  }

  if (type !== "IN" && type !== "OUT") {
    return NextResponse.json(
      { error: "Tipe harus IN atau OUT" },
      { status: 400 }
    );
  }

  const item = await prisma.inventory.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
  }

  if (type === "OUT" && item.qty < qty) {
    return NextResponse.json(
      { error: `Stok tidak cukup. Stok saat ini: ${item.qty}` },
      { status: 400 }
    );
  }

  // Update stock and create log in transaction
  const queries: any[] = [
    prisma.inventory.update({
      where: { id },
      data: {
        qty: type === "IN" ? item.qty + qty : item.qty - qty,
      },
    }),
    prisma.inventoryLog.create({
      data: {
        inventoryId: id,
        qty,
        type,
        notes: notes || null,
      },
    }),
  ];

  if (type === "IN" && recordExpense && Number(item.capitalPrice) > 0) {
    queries.push(
      prisma.expense.create({
        data: {
          category: "Pembelian Stok",
          amount: Number(item.capitalPrice) * qty,
          description: `Restock ${item.name} (${qty} ${item.unit}) - CASH`,
        },
      })
    );
  }

  const results = await prisma.$transaction(queries);
  const updatedItem = results[0];

  return NextResponse.json(updatedItem);
}
