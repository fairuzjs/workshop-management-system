import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createSupplierSchema, parseZodError } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();

    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parseZodError(parsed.error) }, { status: 400 });
    }
    const { name, phone, address } = parsed.data;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        phone: phone || null,
        address: address || null,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Failed to create supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
