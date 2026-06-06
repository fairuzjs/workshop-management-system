import { Prisma } from "@/generated/prisma/client";

interface PrismaErrorResult {
  message: string;
  status: number;
}

/**
 * Translates Prisma errors into user-friendly messages with HTTP status codes.
 * Use this in catch blocks across all API routes for consistent error handling.
 *
 * @example
 * ```ts
 * try {
 *   await prisma.item.update({ ... });
 * } catch (error) {
 *   const { message, status } = handlePrismaError(error);
 *   return NextResponse.json({ error: message }, { status });
 * }
 * ```
 */
export function handlePrismaError(error: unknown): PrismaErrorResult {
  // Known request errors (constraint violations, not found, etc.)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        // Unique constraint violation
        const fields = (error.meta?.target as string[]) || [];
        const fieldNames = fields.length > 0 ? fields.join(", ") : "field";
        return {
          message: `Data dengan ${fieldNames} tersebut sudah ada`,
          status: 409,
        };
      }
      case "P2003": {
        // Foreign key constraint violation
        const field = (error.meta?.field_name as string) || "relasi";
        return {
          message: `Tidak dapat memproses karena relasi ${field} tidak valid`,
          status: 400,
        };
      }
      case "P2025":
        // Record not found
        return {
          message: "Data tidak ditemukan atau sudah dihapus",
          status: 404,
        };
      case "P2014":
        // Relation violation
        return {
          message: "Tidak dapat menghapus data karena masih memiliki relasi dengan data lain",
          status: 400,
        };
      default:
        console.error(`Prisma error ${error.code}:`, error.message);
        return {
          message: "Terjadi kesalahan pada database",
          status: 500,
        };
    }
  }

  // Validation errors (wrong data types, missing fields)
  if (error instanceof Prisma.PrismaClientValidationError) {
    console.error("Prisma validation error:", error.message);
    return {
      message: "Data yang dikirim tidak valid",
      status: 400,
    };
  }

  // Application-level errors (thrown manually, e.g. stock insufficient)
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 400,
    };
  }

  // Unknown errors
  console.error("Unknown error:", error);
  return {
    message: "Terjadi kesalahan sistem",
    status: 500,
  };
}
