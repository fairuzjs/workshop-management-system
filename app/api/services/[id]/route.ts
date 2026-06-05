import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PATCH /api/services/[id] — Update service price (SUPERADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden — hanya SUPERADMIN" }, { status: 403 });
  }

  const { id } = await params;
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { price, name } = body;

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) {
    return NextResponse.json({ error: "Layanan tidak ditemukan" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (price !== undefined) updateData.price = parseFloat(price);
  if (name !== undefined) updateData.name = name;

  const updated = await prisma.service.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
