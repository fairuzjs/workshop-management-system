import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const allCuci = await prisma.service.findMany({
    where: { category: "CUCI" },
    orderBy: { createdAt: "asc" },
  });

  const grouped: Record<string, typeof allCuci> = {};
  allCuci.forEach((s) => {
    if (!grouped[s.name]) grouped[s.name] = [];
    grouped[s.name].push(s);
  });

  console.log("Grouped Cuci Services:");
  for (const [name, services] of Object.entries(grouped)) {
    console.log(`- ${name}: ${services.length} records`);
    
    if (services.length > 1) {
      // The first one is the oldest, we'll keep it as the canonical one
      const canonical = services[0];
      const duplicates = services.slice(1);
      
      console.log(`  Keeping ID: ${canonical.id}`);
      
      for (const dup of duplicates) {
        // 1. Update any existing WorkOrderService pointing to dup -> canonical
        const updatedWOS = await prisma.workOrderService.updateMany({
          where: { serviceId: dup.id },
          data: { serviceId: canonical.id },
        });
        
        console.log(`  Updated ${updatedWOS.count} WorkOrderServices from ${dup.id} to ${canonical.id}`);
        
        // 2. Delete duplicate commission if exists
        await prisma.serviceCommission.deleteMany({
          where: { serviceId: dup.id },
        });
        
        // 3. Delete the duplicate service
        await prisma.service.delete({
          where: { id: dup.id },
        });
        
        console.log(`  Deleted duplicate service: ${dup.id}`);
      }
    }
  }

  console.log("Duplication cleanup finished.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
