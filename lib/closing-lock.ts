import prisma from "@/lib/prisma";

/**
 * Checks whether the month/year of a given date has been closed.
 * Used to prevent modifications to financial data (expenses, transactions)
 * that belong to a closed period.
 *
 * @param date - The date to check against monthly closing records
 * @returns true if the month is closed, false otherwise
 */
export async function isMonthClosed(date: Date): Promise<boolean> {
  const month = date.getMonth() + 1; // JS months are 0-indexed
  const year = date.getFullYear();

  const closing = await prisma.monthlyClosing.findFirst({
    where: { month, year, status: "CLOSED" },
    select: { id: true },
  });

  return !!closing;
}

/**
 * Returns a user-friendly error message if the month is closed.
 * Returns null if the month is open.
 */
export async function checkClosingLock(date: Date): Promise<string | null> {
  const closed = await isMonthClosed(date);
  if (closed) {
    const monthName = date.toLocaleString("id-ID", { month: "long", year: "numeric" });
    return `Data pada bulan ${monthName} sudah ditutup dan tidak dapat diubah`;
  }
  return null;
}
