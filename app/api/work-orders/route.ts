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
  const completedToday = req.nextUrl.searchParams.get("completedToday");

  const where: Record<string, unknown> = {};

  if (status) where.status = status;
  if (serviceType) where.serviceType = serviceType;

  // Filter for today's completed work orders (used by right-side table)
  if (completedToday === "true") {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    where.completedAt = { gte: startOfDay, lte: endOfDay };
    where.status = "SELESAI";
  }

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
        services: { include: { service: true, employees: { select: { id: true, name: true } } } },
        parts: { include: { inventory: true, employees: { select: { id: true, name: true } } } },
        historyItems: { include: { employees: { select: { id: true, name: true } } } },
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

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const {
    vehicleId,
    serviceType,
    serviceIds,
    manualServices,
    notes,
  } = body;

  if (!vehicleId || !serviceType) {
    return NextResponse.json(
      { error: "Kendaraan dan tipe layanan wajib dipilih" },
      { status: 400 }
    );
  }

  if (serviceType === "CUCI" && (!serviceIds || serviceIds.length === 0)) {
    return NextResponse.json(
      { error: "Pilih minimal satu layanan cuci" },
      { status: 400 }
    );
  }

  if (serviceType === "SERVIS" && (!manualServices || manualServices.length === 0)) {
    return NextResponse.json(
      { error: "Tambahkan minimal satu jasa servis manual" },
      { status: 400 }
    );
  }

  try {
    let services: any[] = [];
    let totalServiceCost = 0;

    if (serviceType === "CUCI") {
      services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
      });

      if (services.length !== serviceIds.length) {
        return NextResponse.json(
          { error: "Beberapa layanan tidak ditemukan" },
          { status: 400 }
        );
      }

      totalServiceCost = services.reduce(
        (sum, s) => sum + Number(s.price),
        0
      );
    } else if (serviceType === "SERVIS") {
      if (serviceIds && serviceIds.length > 0) {
        services = await prisma.service.findMany({
          where: { id: { in: serviceIds } },
        });
      }
      totalServiceCost = manualServices.reduce(
        (sum: number, s: any) => sum + Number(s.price || 0),
        0
      ) + services.reduce((sum, s) => sum + Number(s.price), 0);
    }

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
          userId: session.user.id,
          trackingToken,
          serviceType,
          totalCost: totalServiceCost,
          notes: notes || null,
          status: "ANTRI",
        },
      });

      if (serviceType === "CUCI") {
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
      } else if (serviceType === "SERVIS") {
        // Create manual history items
        await Promise.all(
          manualServices.map((ms: any) =>
            tx.workOrderHistoryItem.create({
              data: {
                workOrderId: wo.id,
                title: ms.name,
                price: ms.price || 0,
              },
            })
          )
        );
        // Create work order services for any cuci services selected
        if (services.length > 0) {
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
        }
      }

      return wo;
    });

    // Return full work order with relations
    const fullWorkOrder = await prisma.workOrder.findUnique({
      where: { id: workOrder.id },
      include: {
        vehicle: { include: { customer: true } },
        services: { include: { service: true, employees: { select: { id: true, name: true } } } },
        parts: { include: { inventory: true } },
      },
    });

    return NextResponse.json(fullWorkOrder, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create work order:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
