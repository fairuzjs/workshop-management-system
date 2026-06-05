import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Update cuci service prices to 50k, 55k, 60k
  const cuciServices = await prisma.service.findMany({
    where: { category: "CUCI", isActive: true },
    orderBy: { price: "asc" },
  });

  console.log("Current cuci services:");
  cuciServices.forEach((s) => console.log(`  ${s.name}: Rp ${Number(s.price).toLocaleString("id-ID")}`));

  const newPrices: Record<string, { name: string; price: number }> = {};
  
  if (cuciServices.length >= 3) {
    // Update the 3 cuci services: smallest → 50k, medium → 55k, largest → 60k
    newPrices[cuciServices[0].id] = { name: "Cuci Kendaraan Kecil", price: 50000 };
    newPrices[cuciServices[1].id] = { name: "Cuci Kendaraan Sedang", price: 55000 };
    newPrices[cuciServices[2].id] = { name: "Cuci Kendaraan Besar", price: 60000 };
  }

  for (const [id, data] of Object.entries(newPrices)) {
    await prisma.service.update({
      where: { id },
      data: { name: data.name, price: data.price },
    });
    console.log(`  Updated: ${data.name} → Rp ${data.price.toLocaleString("id-ID")}`);
  }

  console.log("\nDone! Cuci prices updated to 50k, 55k, 60k.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
