import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/employees — List active employees
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(employees);
}
