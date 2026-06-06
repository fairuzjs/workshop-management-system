import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/health — Public health check endpoint for monitoring/uptime checkers.
 * No authentication required.
 *
 * Returns:
 * - status: "ok" or "error"
 * - timestamp: ISO 8601 timestamp
 * - dbConnected: boolean
 * - version: app version from package.json
 */
export async function GET() {
  let dbConnected = false;

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbConnected = true;
  } catch (error) {
    console.error("[HealthCheck] Database connection failed:", error);
  }

  const status = dbConnected ? "ok" : "degraded";

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      dbConnected,
      version: process.env.npm_package_version || "0.1.0",
    },
    { status: dbConnected ? 200 : 503 }
  );
}
