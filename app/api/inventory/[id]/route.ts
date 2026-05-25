import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/inventory/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const item = await prisma.inventory.findUnique({
    where: { id },
    include: {
      logs: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(item);
}

// PUT /api/inventory/[id] — Update item details (not stock)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, category, unit, minStock, price } = body;

  const item = await prisma.inventory.update({
    where: { id },
    data: { name, category, unit, minStock, price },
  });

  return NextResponse.json(item);
}

// DELETE /api/inventory/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.inventory.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
