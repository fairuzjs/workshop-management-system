import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { handlePrismaError } from "@/lib/prisma-errors";
import { updateCustomerSchema, parseZodError } from "@/lib/validations";

// GET /api/customers/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: {
        include: {
          workOrders: {
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              trackingToken: true,
              status: true,
              serviceType: true,
              totalCost: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(customer);
}

// PUT /api/customers/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = updateCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parseZodError(parsed.error) }, { status: 400 });
  }
  const { name, phone, email } = parsed.data;

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: { name, phone, email },
      include: { vehicles: true },
    });

    return NextResponse.json(customer);
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hanya SUPERADMIN yang dapat menghapus customer" }, { status: 403 });
  }

  const { id } = await params;

  // Check if any vehicle under this customer has work orders
  const vehiclesWithWO = await prisma.vehicle.findMany({
    where: { customerId: id },
    include: { _count: { select: { workOrders: true } } },
  });

  const hasWorkOrders = vehiclesWithWO.some((v) => v._count.workOrders > 0);
  if (hasWorkOrders) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus customer karena masih memiliki kendaraan dengan Work Order terkait" },
      { status: 400 }
    );
  }

  try {
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
