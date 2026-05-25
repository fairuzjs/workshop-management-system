import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
  const body = await req.json();
  const { name, phone, email } = body;

  const customer = await prisma.customer.update({
    where: { id },
    data: { name, phone, email },
    include: { vehicles: true },
  });

  return NextResponse.json(customer);
}

// DELETE /api/customers/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
