import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateTrackingToken } from "@/lib/utils";

// GET /api/work-orders — List work orders
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const serviceType = req.nextUrl.searchParams.get("serviceType");
  const search = req.nextUrl.searchParams.get("search") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (serviceType) where.serviceType = serviceType;
  if (search) {
    where.OR = [
      { trackingToken: { contains: search, mode: "insensitive" } },
      { vehicle: { plateNumber: { contains: search, mode: "insensitive" } } },
      { vehicle: { customer: { name: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [workOrders, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: {
        vehicle: { include: { customer: true } },
        employee: { select: { id: true, name: true, position: true } },
        services: { include: { service: true } },
        parts: { include: { inventory: true } },
        transaction: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.workOrder.count({ where }),
  ]);

  return NextResponse.json({
    data: workOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST /api/work-orders — Create a new work order
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    vehicleId,
    employeeId,
    serviceType,
    serviceIds,
    notes,
  } = body;

  if (!vehicleId || !serviceType || !serviceIds?.length) {
    return NextResponse.json(
      { error: "Kendaraan, tipe layanan, dan minimal satu layanan wajib dipilih" },
      { status: 400 }
    );
  }

  // Fetch selected services to calculate prices
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  });

  if (services.length !== serviceIds.length) {
    return NextResponse.json(
      { error: "Beberapa layanan tidak ditemukan" },
      { status: 400 }
    );
  }

  const totalServiceCost = services.reduce(
    (sum, s) => sum + Number(s.price),
    0
  );

  // Generate unique tracking token
  let trackingToken = generateTrackingToken();
  let tokenExists = await prisma.workOrder.findUnique({
    where: { trackingToken },
  });
  while (tokenExists) {
    trackingToken = generateTrackingToken();
    tokenExists = await prisma.workOrder.findUnique({
      where: { trackingToken },
    });
  }

  // Create work order with services in transaction
  const workOrder = await prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.create({
      data: {
        vehicleId,
        employeeId: employeeId || null,
        userId: session.user.id,
        trackingToken,
        serviceType,
        totalCost: totalServiceCost,
        notes: notes || null,
        status: "ANTRI",
      },
    });

    // Create work order services
    await Promise.all(
      services.map((service) =>
        tx.workOrderService.create({
          data: {
            workOrderId: wo.id,
            serviceId: service.id,
            price: service.price,
          },
        })
      )
    );

    return wo;
  });

  // Return full work order with relations
  const fullWorkOrder = await prisma.workOrder.findUnique({
    where: { id: workOrder.id },
    include: {
      vehicle: { include: { customer: true } },
      employee: true,
      services: { include: { service: true } },
      parts: { include: { inventory: true } },
    },
  });

  return NextResponse.json(fullWorkOrder, { status: 201 });
}
