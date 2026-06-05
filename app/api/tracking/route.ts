import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { trackingQuerySchema, parseZodError } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

// Rate limit config: 10 requests per 60 seconds per IP
const TRACKING_RATE_LIMIT = { maxRequests: 10, windowSeconds: 60 };

// GET /api/tracking?token=XXXXX&phone=XXXX
// Public endpoint — no auth required
export async function GET(req: NextRequest) {
  // Rate limiting by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  const rateResult = checkRateLimit(`tracking:${ip}`, TRACKING_RATE_LIMIT);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." },
      { status: 429 }
    );
  }

  const token = req.nextUrl.searchParams.get("token");
  const phone = req.nextUrl.searchParams.get("phone");

  const parsed = trackingQuerySchema.safeParse({ token, phone });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parseZodError(parsed.error) },
      { status: 400 }
    );
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { trackingToken: parsed.data.token.toUpperCase() },
    include: {
      vehicle: {
        include: { customer: true },
      },
      services: {
        include: {
          service: { select: { name: true, price: true } },
          employees: { select: { name: true, position: true } },
        },
      },
      parts: { include: { inventory: { select: { name: true } } } },
      historyItems: {
        select: { title: true, price: true, employees: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!workOrder) {
    return NextResponse.json(
      { error: "Work Order tidak ditemukan" },
      { status: 404 }
    );
  }

  // Verify with last 4 digits of phone
  const customerPhone = workOrder.vehicle.customer.phone;
  if (!customerPhone.endsWith(parsed.data.phone)) {
    return NextResponse.json(
      { error: "Nomor HP tidak cocok" },
      { status: 403 }
    );
  }

  // Return limited public-facing data
  return NextResponse.json({
    trackingToken: workOrder.trackingToken,
    status: workOrder.status,
    serviceType: workOrder.serviceType,
    vehiclePlate: workOrder.vehicle.plateNumber,
    vehicleBrand: workOrder.vehicle.brand,
    vehicleModel: workOrder.vehicle.model,
    customerPhone: customerPhone.length > 4
      ? "****" + customerPhone.slice(-4)
      : customerPhone,
    employeeName: null,
    services: workOrder.services.map((ws) => ({
      name: ws.service.name,
      price: Number(ws.service.price),
    })),
    parts: workOrder.parts.map((p) => ({
      name: p.inventory.name,
      qty: p.qty,
      price: Number(p.price) * p.qty,
    })),
    historyItems: workOrder.historyItems.map((h) => ({
      name: h.title,
      price: Number(h.price),
    })),
    totalCost: Number(workOrder.totalCost),
    createdAt: workOrder.createdAt,
    startedAt: workOrder.startedAt,
    completedAt: workOrder.completedAt,
  });
}
