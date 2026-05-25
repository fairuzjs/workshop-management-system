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

  const body = await req.json();
  const { name, category, qty, unit, minStock, price } = body;

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
      price,
    },
  });

  // Log initial stock if qty > 0
  if (qty > 0) {
    await prisma.inventoryLog.create({
      data: {
        inventoryId: item.id,
        qty,
        type: "IN",
        notes: "Stok awal",
      },
    });
  }

  return NextResponse.json(item, { status: 201 });
}
