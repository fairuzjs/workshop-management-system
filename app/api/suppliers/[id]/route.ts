import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, phone, address } = body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("Failed to update supplier:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete supplier:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
