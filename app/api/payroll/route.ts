import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/payroll
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const month = parseInt(req.nextUrl.searchParams.get("month") || String(new Date().getMonth() + 1));
  const year = parseInt(req.nextUrl.searchParams.get("year") || String(new Date().getFullYear()));

  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: {
      earnings: {
        where: {
          month,
          year,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const payrollData = employees.map((emp) => {
    const salary = Number(emp.salary || 0);
    const commission = emp.earnings.reduce((sum, e) => sum + Number(e.amount), 0);
    return {
      id: emp.id,
      name: emp.name,
      position: emp.position,
      salary,
      commission,
      total: salary + commission,
      earnings: emp.earnings,
    };
  });

  const summary = payrollData.reduce(
    (acc, cur) => {
      acc.totalSalary += cur.salary;
      acc.totalCommission += cur.commission;
      acc.totalPayroll += cur.total;
      return acc;
    },
    { totalSalary: 0, totalCommission: 0, totalPayroll: 0 }
  );

  return NextResponse.json({
    period: { month, year },
    summary: { ...summary, totalEmployees: payrollData.length },
    data: payrollData,
  });
}
