import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/vehicles — List all vehicles with customer info
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";

  const vehicles = await prisma.vehicle.findMany({
    where: search
      ? {
          OR: [
            { plateNumber: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
            { customer: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      customer: true,
      _count: { select: { workOrders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vehicles);
}

// POST /api/vehicles — Add vehicle to existing customer
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { customerId, plateNumber, type, brand, model, color } = body;

  if (!customerId || !plateNumber) {
    return NextResponse.json(
      { error: "Customer dan plat nomor wajib diisi" },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      customerId,
      plateNumber: plateNumber.toUpperCase(),
      type: type || null,
      brand: brand || null,
      model: model || null,
      color: color || null,
    },
    include: { customer: true },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
