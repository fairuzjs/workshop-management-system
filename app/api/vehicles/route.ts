import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createVehicleSchema, parseZodError } from "@/lib/validations";

// GET /api/vehicles — List all vehicles with customer info
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

  const where = search
    ? {
        OR: [
          { plateNumber: { contains: search, mode: "insensitive" as const } },
          { brand: { contains: search, mode: "insensitive" as const } },
          { customer: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: {
        customer: true,
        _count: { select: { workOrders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return NextResponse.json({
    data: vehicles,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/vehicles — Add vehicle to existing customer
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parseZodError(parsed.error) }, { status: 400 });
  }
  const { customerId, plateNumber, type, brand, model, color } = parsed.data;

  // Check for duplicate plate number
  const existing = await prisma.vehicle.findFirst({
    where: { plateNumber: plateNumber.toUpperCase() },
    select: { id: true, customer: { select: { name: true } } },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Plat nomor "${plateNumber.toUpperCase()}" sudah terdaftar atas nama ${existing.customer?.name || 'customer lain'}` },
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
