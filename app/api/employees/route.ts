import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/employees — List active employees
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const availableFor = url.searchParams.get("availableFor");

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      workOrderServices: {
        where: {
          workOrder: {
            status: { in: ["ANTRI", "PROSES"] },
          },
        },
        select: { workOrderId: true },
      },
      workOrderParts: {
        where: {
          workOrder: {
            status: { in: ["ANTRI", "PROSES"] },
          },
        },
        select: { workOrderId: true },
      },
      historyItems: {
        where: {
          workOrder: {
            status: { in: ["ANTRI", "PROSES"] },
          },
        },
        select: { workOrderId: true },
      },
    },
  });

  let result = employees;

  if (availableFor) {
    result = employees.filter((emp) => {
      const isBusyWithOtherService = emp.workOrderServices.some(
        (ws) => ws.workOrderId !== availableFor
      );
      const isBusyWithOtherPart = emp.workOrderParts.some(
        (wp) => wp.workOrderId !== availableFor
      );
      const isBusyWithOtherHistory = emp.historyItems.some(
        (hi) => hi.workOrderId !== availableFor
      );
      return !isBusyWithOtherService && !isBusyWithOtherPart && !isBusyWithOtherHistory;
    });
  }

  // Remove the relations from the final payload to keep it clean
  const cleanData = result.map(({ workOrderServices, workOrderParts, historyItems, ...rest }) => rest);

  return NextResponse.json(cleanData);
}

// POST /api/employees — Create employee
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, position, email, phone, salary, isActive } = body;

  if (!name || !position) {
    return NextResponse.json(
      { error: "Nama dan posisi wajib diisi" },
      { status: 400 }
    );
  }

  const validPositions = ["Mekanik", "Pencuci Mobil"];
  if (!validPositions.includes(position)) {
    return NextResponse.json(
      { error: "Posisi tidak valid. Harus Mekanik atau Pencuci Mobil" },
      { status: 400 }
    );
  }

  if (salary !== undefined && salary < 0) {
    return NextResponse.json(
      { error: "Gaji tidak boleh negatif" },
      { status: 400 }
    );
  }

  const employee = await prisma.employee.create({
    data: {
      name,
      position,
      email: email || null,
      phone: phone || null,
      salary: salary || 0,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  return NextResponse.json(employee, { status: 201 });
}
