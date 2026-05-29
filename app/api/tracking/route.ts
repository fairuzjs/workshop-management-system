import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/tracking?token=XXXXX&phone=XXXX
// Public endpoint — no auth required
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const phone = req.nextUrl.searchParams.get("phone");

  if (!token || !phone) {
    return NextResponse.json(
      { error: "Token dan 4 digit terakhir nomor HP wajib diisi" },
      { status: 400 }
    );
  }

  if (phone.length !== 4) {
    return NextResponse.json(
      { error: "Masukkan 4 digit terakhir nomor HP" },
      { status: 400 }
    );
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { trackingToken: token.toUpperCase() },
    include: {
      vehicle: {
        include: { customer: true },
      },
      employee: { select: { name: true, position: true } },
      services: { include: { service: { select: { name: true, price: true } } } },
      parts: { include: { inventory: { select: { name: true } } } },
      historyItems: { select: { title: true, price: true }, orderBy: { createdAt: 'asc' } },
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
  if (!customerPhone.endsWith(phone)) {
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
    customerPhone: workOrder.vehicle.customer.phone,
    employeeName: workOrder.employee?.name || null,
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
