import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { monthlyClosingQuerySchema, parseZodError } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  const monthParam = req.nextUrl.searchParams.get("month");
  const yearParam = req.nextUrl.searchParams.get("year");

  if (!monthParam || !yearParam) {
    return NextResponse.json({ error: "Bulan dan tahun wajib diisi" }, { status: 400 });
  }

  const month = parseInt(monthParam);
  const year = parseInt(yearParam);

  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Format bulan atau tahun tidak valid" }, { status: 400 });
  }

  try {
    // Cek apakah closing sudah ada
    const existingClosing = await prisma.monthlyClosing.findFirst({
      where: { month, year },
    });

    if (existingClosing) {
      return NextResponse.json({
        isClosed: true,
        data: existingClosing,
      });
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Revenue
    const transactions = await prisma.transaction.findMany({
      where: {
        status: "LUNAS",
        paidAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });
    const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

    // 2. Expense
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });
    const totalExpense = expenses.reduce((sum, ex) => sum + Number(ex.amount), 0);

    // 3. Payroll (Salaries + Earnings)
    const activeEmployees = await prisma.employee.findMany({
      where: { isActive: true },
    });
    const totalSalary = activeEmployees.reduce((sum, emp) => sum + Number(emp.salary), 0);

    const earnings = await prisma.employeeEarning.findMany({
      where: { month, year },
    });
    const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalPayroll = totalSalary + totalEarnings;

    // 4. Profit
    const profit = totalRevenue - totalExpense - totalPayroll;

    // 5. Operational Metrics
    const workOrders = await prisma.workOrder.findMany({
      where: {
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { transaction: true }
    });

    const totalWorkOrder = workOrders.length;
    const completedWorkOrder = workOrders.filter((wo) => wo.status === "SELESAI").length;
    const serviceWorkOrder = workOrders.filter((wo) => wo.serviceType === "SERVIS").length;
    const carWashWorkOrder = workOrders.filter((wo) => wo.serviceType === "CUCI").length;
    const totalTransaction = transactions.length;

    // Warnings
    const activeWorkOrders = workOrders.filter((wo) => wo.status === "ANTRI" || wo.status === "PROSES");
    const completedNoTransaction = workOrders.filter((wo) => wo.status === "SELESAI" && !wo.transaction);

    const warnings = [];
    if (activeWorkOrders.length > 0) {
      warnings.push(`Masih ada ${activeWorkOrders.length} Work Order yang belum selesai.`);
    }
    if (completedNoTransaction.length > 0) {
      warnings.push(`Ada ${completedNoTransaction.length} Work Order selesai yang belum dibuatkan transaksi.`);
    }

    return NextResponse.json({
      isClosed: false,
      data: {
        totalRevenue,
        totalExpense,
        totalPayroll,
        profit,
        metrics: {
          totalTransaction,
          totalWorkOrder,
          completedWorkOrder,
          serviceWorkOrder,
          carWashWorkOrder,
        },
        warnings,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = monthlyClosingQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parseZodError(parsed.error) }, { status: 400 });
    }
    const { month, year } = parsed.data;

    // Check duplicate
    const existingClosing = await prisma.monthlyClosing.findFirst({
      where: { month, year },
    });

    if (existingClosing) {
      return NextResponse.json({ error: "Bulan ini sudah ditutup" }, { status: 400 });
    }

    // === SERVER-SIDE RECALCULATION (never trust client-sent totals) ===
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Revenue — from LUNAS transactions by paidAt
    const transactions = await prisma.transaction.findMany({
      where: {
        status: "LUNAS",
        paidAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });
    const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

    // 2. Expense
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });
    const totalExpense = expenses.reduce((sum, ex) => sum + Number(ex.amount), 0);

    // 3. Payroll (Salaries + Earnings)
    const activeEmployees = await prisma.employee.findMany({
      where: { isActive: true },
    });
    const totalSalary = activeEmployees.reduce((sum, emp) => sum + Number(emp.salary), 0);

    const earnings = await prisma.employeeEarning.findMany({
      where: { month, year },
    });
    const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalPayroll = totalSalary + totalEarnings;

    // 4. Profit
    const profit = totalRevenue - totalExpense - totalPayroll;

    // Save closing
    const closing = await prisma.monthlyClosing.create({
      data: {
        month,
        year,
        totalRevenue,
        totalExpense,
        totalSalary: totalPayroll,
        profit,
        status: "CLOSED",
        closedAt: new Date(),
      },
    });

    return NextResponse.json(closing, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body atau terjadi kesalahan" }, { status: 400 });
  }
}
