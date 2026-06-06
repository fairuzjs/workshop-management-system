import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { handlePrismaError } from "@/lib/prisma-errors";
import { logAudit, getClientIp } from "@/lib/audit";

// POST /api/inventory/[id]/stock — Stock In/Out (atomic)
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

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Atomic read inside transaction — prevents race conditions
      const item = await tx.inventory.findUnique({ where: { id } });
      if (!item) {
        throw new Error("Item tidak ditemukan");
      }

      if (type === "OUT" && item.qty < qty) {
        throw new Error(`Stok tidak cukup. Stok saat ini: ${item.qty}`);
      }

      // Atomic increment/decrement — safe for concurrent access
      const updatedItem = await tx.inventory.update({
        where: { id },
        data: {
          qty: type === "IN" ? { increment: qty } : { decrement: qty },
        },
      });

      // Create inventory log
      await tx.inventoryLog.create({
        data: {
          inventoryId: id,
          qty,
          type,
          notes: notes || null,
        },
      });

      // Auto-record expense for cash stock-in purchases
      if (type === "IN" && recordExpense && Number(item.capitalPrice) > 0) {
        await tx.expense.create({
          data: {
            category: "Pembelian Stok",
            amount: Number(item.capitalPrice) * qty,
            description: `Restock ${item.name} (${qty} ${item.unit}) - CASH`,
          },
        });
      }

      return updatedItem;
    });

    logAudit({
      userId: session.user.id,
      action: type === "IN" ? "STOCK_IN" : "STOCK_OUT",
      entity: "Inventory",
      entityId: id,
      details: { qty, type, notes },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json(result);
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
