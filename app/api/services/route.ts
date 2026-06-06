import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/services — List all active services
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const category = req.nextUrl.searchParams.get("category");

  const services = await prisma.service.findMany({
    where: {
      isActive: true,
      ...(category ? { category: category as "SERVIS" | "CUCI" } : {}),
    },
    include: {
      commission: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(services);
}

// POST /api/services — Create a new service
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, category, price } = body;

    if (!name || !category || price === undefined) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const newService = await prisma.service.create({
      data: {
        name,
        category,
        price: Number(price),
        isActive: true,
        ...(category === "CUCI" ? { commission: { create: { commissionNominal: 0 } } } : {})
      },
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Gagal membuat layanan" }, { status: 500 });
  }
}
