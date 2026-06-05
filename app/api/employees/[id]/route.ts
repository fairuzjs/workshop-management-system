import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/employees/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const { id } = await params;
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { name, position, email, phone, salary, isActive } = body;

  if (position) {
    const validPositions = ["Mekanik", "Pencuci Mobil"];
    if (!validPositions.includes(position)) {
      return NextResponse.json(
        { error: "Posisi tidak valid. Harus Mekanik atau Pencuci Mobil" },
        { status: 400 }
      );
    }
  }

  if (salary !== undefined && salary < 0) {
    return NextResponse.json(
      { error: "Gaji tidak boleh negatif" },
      { status: 400 }
    );
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(position && { position }),
      email: email || null,
      phone: phone || null,
      ...(salary !== undefined && { salary }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return NextResponse.json(employee);
}

// DELETE /api/employees/[id] - Soft delete (deactivate)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const { id } = await params;
  const employee = await prisma.employee.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, employee });
}
