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
