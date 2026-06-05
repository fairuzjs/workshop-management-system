import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/inventory — List inventory items
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const lowStock = req.nextUrl.searchParams.get("lowStock") === "true";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  const items = await prisma.inventory.findMany({
    where,
    orderBy: { name: "asc" },
    include: { supplier: true },
  });

  // Filter low stock in JS since Prisma can't compare columns directly
  const result = lowStock
    ? items.filter((item) => item.qty <= item.minStock)
    : items;

  return NextResponse.json(result);
}

// POST /api/inventory — Create inventory item
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { name, category, qty, unit, minStock, capitalPrice, price, supplierId, rackPosition, paymentMethod } = body;

  if (!name || !unit || price === undefined) {
    return NextResponse.json(
      { error: "Nama, satuan, dan harga wajib diisi" },
      { status: 400 }
    );
  }

  const item = await prisma.inventory.create({
    data: {
      name,
      category: category || null,
      qty: qty || 0,
      unit,
      minStock: minStock || 0,
      capitalPrice: capitalPrice || 0,
      price,
      supplierId: supplierId || null,
      rackPosition: rackPosition || null,
    },
  });

  // Log initial stock if qty > 0
  if (qty > 0) {
    const logs = [];
    logs.push(
      prisma.inventoryLog.create({
        data: {
          inventoryId: item.id,
          qty,
          type: "IN",
          notes: `Stok awal${paymentMethod ? ` (${paymentMethod})` : ""}`,
        },
      })
    );

    if (paymentMethod === "CASH" && capitalPrice > 0) {
      logs.push(
        prisma.expense.create({
          data: {
            category: "Pembelian Stok",
            amount: capitalPrice * qty,
            description: `Pembelian stok awal ${name} (${qty} ${unit}) - CASH`,
          },
        })
      );
    }
    await prisma.$transaction(logs);
  }

  return NextResponse.json(item, { status: 201 });
}
