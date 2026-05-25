import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT /api/expenses/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { category, amount, description, date } = body;

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      category,
      amount,
      description,
      ...(date ? { date: new Date(date) } : {}),
    },
  });

  return NextResponse.json(expense);
}

// DELETE /api/expenses/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
