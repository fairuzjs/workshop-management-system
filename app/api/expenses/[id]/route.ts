import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateExpenseSchema, parseZodError } from "@/lib/validations";
import { handlePrismaError } from "@/lib/prisma-errors";
import { checkClosingLock } from "@/lib/closing-lock";
import { logAudit, getClientIp } from "@/lib/audit";

// PUT /api/expenses/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hanya SUPERADMIN yang dapat mengubah pengeluaran" }, { status: 403 });
  }

  const { id } = await params;
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parseZodError(parsed.error) }, { status: 400 });
  }
  const { category, amount, description, date } = parsed.data;

  try {
    // Fetch existing expense to check its date for closing lock
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengeluaran tidak ditemukan" }, { status: 404 });
    }

    // Check closing lock against the existing expense date
    const lockMsg = await checkClosingLock(existing.date);
    if (lockMsg) {
      return NextResponse.json({ error: lockMsg }, { status: 403 });
    }

    // If updating date, also check the new date's month
    if (date) {
      const newDateLock = await checkClosingLock(new Date(date));
      if (newDateLock) {
        return NextResponse.json({ error: newDateLock }, { status: 403 });
      }
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(category !== undefined && { category }),
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { description }),
        ...(date ? { date: new Date(date) } : {}),
      },
    });

    logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entity: "Expense",
      entityId: id,
      details: { category, amount },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json(expense);
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/expenses/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any)?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Hanya SUPERADMIN yang dapat menghapus pengeluaran" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Fetch existing expense to check closing lock
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pengeluaran tidak ditemukan" }, { status: 404 });
    }

    const lockMsg = await checkClosingLock(existing.date);
    if (lockMsg) {
      return NextResponse.json({ error: lockMsg }, { status: 403 });
    }

    await prisma.expense.delete({ where: { id } });

    logAudit({
      userId: session.user.id,
      action: "DELETE",
      entity: "Expense",
      entityId: id,
      details: { category: existing.category, amount: Number(existing.amount) },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status } = handlePrismaError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
