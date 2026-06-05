/**
 * Pre-migration script: Check for duplicate plate numbers before adding unique constraint.
 * Run this BEFORE applying the migration: npx tsx prisma/check-duplicate-plates.ts
 */
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Checking for duplicate plate numbers...\n");

  const vehicles = await prisma.vehicle.findMany({
    select: { id: true, plateNumber: true, customerId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by plateNumber
  const groups = new Map<string, typeof vehicles>();
  for (const v of vehicles) {
    const key = v.plateNumber.toUpperCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(v);
  }

  const duplicates = [...groups.entries()].filter(([_, vs]) => vs.length > 1);

  if (duplicates.length === 0) {
    console.log("✅ Tidak ada duplikasi plat nomor. Aman untuk menambahkan unique constraint.\n");
    return;
  }

  console.log(`⚠️  Ditemukan ${duplicates.length} plat nomor duplikat:\n`);

  for (const [plate, vs] of duplicates) {
    console.log(`  Plat: ${plate} (${vs.length} records)`);
    for (const v of vs) {
      // Check work order count
      const woCount = await prisma.workOrder.count({ where: { vehicleId: v.id } });
      console.log(`    - ID: ${v.id}, Customer: ${v.customerId}, WO: ${woCount}, Created: ${v.createdAt.toISOString()}`);
    }
    console.log();
  }

  console.log("---");
  console.log("Untuk setiap grup duplikat, pertahankan record dengan Work Order terbanyak.");
  console.log("Record tanpa Work Order akan dihapus otomatis.\n");

  const readline = await import("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  
  const answer = await new Promise<string>((resolve) => {
    rl.question("Hapus duplikat otomatis? (y/N): ", resolve);
  });
  rl.close();

  if (answer.toLowerCase() !== "y") {
    console.log("Dibatalkan. Perbaiki duplikat secara manual sebelum migration.");
    return;
  }

  for (const [plate, vs] of duplicates) {
    // Count WOs for each
    const withCounts = await Promise.all(
      vs.map(async (v) => ({
        ...v,
        woCount: await prisma.workOrder.count({ where: { vehicleId: v.id } }),
      }))
    );

    // Keep the one with most WOs (or earliest if tied)
    withCounts.sort((a, b) => b.woCount - a.woCount || a.createdAt.getTime() - b.createdAt.getTime());
    const keep = withCounts[0];
    const toDelete = withCounts.slice(1).filter(v => v.woCount === 0);

    for (const v of toDelete) {
      await prisma.vehicle.delete({ where: { id: v.id } });
      console.log(`  Deleted: ${v.id} (plate: ${plate}, 0 WOs)`);
    }

    const cantDelete = withCounts.slice(1).filter(v => v.woCount > 0);
    for (const v of cantDelete) {
      console.log(`  ⚠️  TIDAK BISA hapus: ${v.id} (plate: ${plate}, ${v.woCount} WOs) — perbaiki manual`);
    }
  }

  console.log("\n✅ Selesai. Jalankan migration sekarang.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
