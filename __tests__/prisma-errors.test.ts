import { describe, it, expect } from "vitest";
import { handlePrismaError } from "@/lib/prisma-errors";
import { Prisma } from "@/generated/prisma/client";

describe("handlePrismaError", () => {
  it("handles P2002 unique constraint violation", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.0.0",
      meta: { target: ["plateNumber"] },
    });

    const result = handlePrismaError(error);
    expect(result.status).toBe(409);
    expect(result.message).toContain("plateNumber");
    expect(result.message).toContain("sudah ada");
  });

  it("handles P2025 record not found", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "5.0.0",
    });

    const result = handlePrismaError(error);
    expect(result.status).toBe(404);
    expect(result.message).toContain("tidak ditemukan");
  });

  it("handles P2003 foreign key constraint", () => {
    const error = new Prisma.PrismaClientKnownRequestError("FK constraint", {
      code: "P2003",
      clientVersion: "5.0.0",
      meta: { field_name: "customerId" },
    });

    const result = handlePrismaError(error);
    expect(result.status).toBe(400);
    expect(result.message).toContain("relasi");
  });

  it("handles P2014 relation violation", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Relation violation", {
      code: "P2014",
      clientVersion: "5.0.0",
    });

    const result = handlePrismaError(error);
    expect(result.status).toBe(400);
    expect(result.message).toContain("relasi");
  });

  it("handles unknown Prisma error codes with 500", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unknown error", {
      code: "P9999",
      clientVersion: "5.0.0",
    });

    const result = handlePrismaError(error);
    expect(result.status).toBe(500);
  });

  it("handles generic Error objects", () => {
    const error = new Error("Stok tidak cukup. Stok saat ini: 5");

    const result = handlePrismaError(error);
    expect(result.status).toBe(400);
    expect(result.message).toBe("Stok tidak cukup. Stok saat ini: 5");
  });

  it("handles unknown non-Error values", () => {
    const result = handlePrismaError("string error");
    expect(result.status).toBe(500);
    expect(result.message).toContain("kesalahan sistem");
  });

  it("handles null/undefined", () => {
    const result = handlePrismaError(null);
    expect(result.status).toBe(500);
  });
});
