import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createInventorySchema, parseZodError } from "@/lib/validations";
import { handlePrismaError } from "@/lib/prisma-errors";

// GET /api/inventory — List inventory items
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const lowStock = req.nextUrl.searchParams.get("lowStock") === "true";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { category: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        orderBy: { name: "asc" },
        include: { supplier: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.inventory.count({ where }),
    ]);

    // Filter low stock in JS since Prisma can't compare columns directly
    const result = lowStock
      ? items.filter((item) => item.qty <= item.minStock)
      : items;

    return NextResponse.json({
      data: result,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
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

  const parsed = createInventorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parseZodError(parsed.error) }, { status: 400 });
  }
  const { name, category, qty, unit, minStock, capitalPrice, price, supplierId, rackPosition, paymentMethod } = parsed.data;

  try {
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
    if (qty && qty > 0) {
      await prisma.$transaction([
        prisma.inventoryLog.create({
          data: {
            inventoryId: item.id,
            qty,
            type: "IN",
            notes: `Stok awal${paymentMethod ? ` (${paymentMethod})` : ""}`,
          },
        }),
        ...(paymentMethod === "CASH" && capitalPrice && capitalPrice > 0
          ? [
              prisma.expense.create({
                data: {
                  category: "Pembelian Stok",
                  amount: capitalPrice * qty,
                  description: `Pembelian stok awal ${name} (${qty} ${unit}) - CASH`,
                },
              }),
            ]
          : []),
      ]);
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
