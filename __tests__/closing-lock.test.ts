import { describe, it, expect, vi, beforeEach } from "vitest";
import { isMonthClosed, checkClosingLock } from "@/lib/closing-lock";
import prisma from "@/lib/prisma";

// Mock prisma client
vi.mock("@/lib/prisma", () => ({
  default: {
    monthlyClosing: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Closing Lock Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isMonthClosed", () => {
    it("returns true if month is CLOSED", async () => {
      // Mock prisma returning a closing record
      vi.mocked(prisma.monthlyClosing.findFirst).mockResolvedValue({ id: "123" } as any);

      const date = new Date("2026-05-15T00:00:00.000Z");
      const result = await isMonthClosed(date);

      expect(prisma.monthlyClosing.findFirst).toHaveBeenCalledWith({
        where: { month: 5, year: 2026, status: "CLOSED" },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it("returns false if month is not CLOSED", async () => {
      // Mock prisma returning null (no closed record)
      vi.mocked(prisma.monthlyClosing.findFirst).mockResolvedValue(null);

      const date = new Date("2026-06-01T00:00:00.000Z");
      const result = await isMonthClosed(date);

      expect(prisma.monthlyClosing.findFirst).toHaveBeenCalledWith({
        where: { month: 6, year: 2026, status: "CLOSED" },
        select: { id: true },
      });
      expect(result).toBe(false);
    });
  });

  describe("checkClosingLock", () => {
    it("returns error message if month is closed", async () => {
      vi.mocked(prisma.monthlyClosing.findFirst).mockResolvedValue({ id: "123" } as any);

      const date = new Date("2026-05-15T00:00:00.000Z");
      const result = await checkClosingLock(date);

      expect(result).toContain("sudah ditutup dan tidak dapat diubah");
      expect(result).toContain("Mei"); // Indonesian month name
    });

    it("returns null if month is open", async () => {
      vi.mocked(prisma.monthlyClosing.findFirst).mockResolvedValue(null);

      const date = new Date("2026-06-01T00:00:00.000Z");
      const result = await checkClosingLock(date);

      expect(result).toBeNull();
    });
  });
});
