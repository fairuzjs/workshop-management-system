import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/expenses — List expenses
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";
  const month = req.nextUrl.searchParams.get("month");
  const year = req.nextUrl.searchParams.get("year");
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { category: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (month && year) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    where.date = { gte: startDate, lte: endDate };
  }

  const [expenses, total, totalAmount] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ _sum: { amount: true }, where }),
  ]);

  return NextResponse.json({
    data: expenses,
    totalAmount: Number(totalAmount._sum.amount || 0),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

// POST /api/expenses — Create expense
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { category, amount, description, date } = body;

  if (!category || !amount) {
    return NextResponse.json(
      { error: "Kategori dan jumlah wajib diisi" },
      { status: 400 }
    );
  }

  const expense = await prisma.expense.create({
    data: {
      category,
      amount,
      description: description || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
