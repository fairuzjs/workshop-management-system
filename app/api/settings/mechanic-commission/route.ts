import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let setting = await prisma.systemSetting.findUnique({
    where: { id: "global" }
  });

  if (!setting) {
    setting = await prisma.systemSetting.create({
      data: {
        id: "global",
        serviceCommissionPct: 55.0,
        partCommissionPct: 3.0,
      }
    });
  }

  return NextResponse.json(setting);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
  }

  try {
    const { serviceCommissionPct, partCommissionPct } = await req.json();

    const updated = await prisma.systemSetting.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        serviceCommissionPct,
        partCommissionPct
      },
      update: {
        serviceCommissionPct,
        partCommissionPct
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
