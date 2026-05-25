import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/customers — List all customers with vehicles
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";

  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
            {
              vehicles: {
                some: { plateNumber: { contains: search, mode: "insensitive" } },
              },
            },
          ],
        }
      : undefined,
    include: {
      vehicles: true,
      _count: { select: { vehicles: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}

// POST /api/customers — Create customer (with optional vehicle)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, phone, email, vehicle } = body;

  if (!name || !phone) {
    return NextResponse.json(
      { error: "Nama dan nomor telepon wajib diisi" },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      phone,
      email: email || null,
      ...(vehicle?.plateNumber
        ? {
            vehicles: {
              create: {
                plateNumber: vehicle.plateNumber.toUpperCase(),
                type: vehicle.type || null,
                brand: vehicle.brand || null,
                model: vehicle.model || null,
                color: vehicle.color || null,
              },
            },
          }
        : {}),
    },
    include: { vehicles: true },
  });

  return NextResponse.json(customer, { status: 201 });
}
