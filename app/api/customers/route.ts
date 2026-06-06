import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createCustomerSchema, parseZodError } from "@/lib/validations";

// GET /api/customers — List all customers with vehicles
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          {
            vehicles: {
              some: { plateNumber: { contains: search, mode: "insensitive" as const } },
            },
          },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        vehicles: true,
        _count: { select: { vehicles: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({
    data: customers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/customers — Create customer (with optional vehicle)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parseZodError(parsed.error) }, { status: 400 });
  }
  const { name, phone, email, vehicle } = parsed.data;

  // Check for duplicate phone number
  const existingCustomers = await prisma.customer.findMany({
    where: { phone },
    select: { id: true, name: true, phone: true },
    take: 3,
  });

  const customer = await prisma.customer.create({
    data: {
      name: name || null,
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

  const response: any = { ...customer };
  if (existingCustomers.length > 0) {
    response._warning = `Nomor HP "${phone}" sudah terdaftar atas nama: ${existingCustomers.map(c => c.name || '(tanpa nama)').join(', ')}. Customer tetap berhasil dibuat.`;
  }

  return NextResponse.json(response, { status: 201 });
}
