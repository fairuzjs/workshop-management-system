import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting service deduplication...");

  // Find all services
  const allServices = await prisma.service.findMany({
    orderBy: { createdAt: 'asc' }
  });

  // Group by name
  const serviceGroups: Record<string, typeof allServices> = {};
  for (const svc of allServices) {
    if (!serviceGroups[svc.name]) {
      serviceGroups[svc.name] = [];
    }
    serviceGroups[svc.name].push(svc);
  }

  // Deduplicate
  for (const [name, duplicates] of Object.entries(serviceGroups)) {
    if (duplicates.length > 1) {
      console.log(`Found ${duplicates.length} duplicates for "${name}"`);
      
      // Keep the first one (oldest), delete the rest
      const keep = duplicates[0];
      const toDelete = duplicates.slice(1);

      for (const svc of toDelete) {
        console.log(`Deleting duplicate: ${svc.id}`);
        // First delete any relations if needed, but onDelete: Cascade should handle most.
        // For Service, we might have WorkOrderItem or ServiceCommission.
        
        // 1. Re-link WorkOrderService to the kept service
        await prisma.workOrderService.updateMany({
          where: { serviceId: svc.id },
          data: { serviceId: keep.id }
        });

        // 2. Delete the duplicate service (this cascades to ServiceCommission if set up properly)
        await prisma.service.delete({
          where: { id: svc.id }
        });
      }
      
      console.log(`Successfully deduplicated "${name}"`);
    }
  }

  console.log("Deduplication complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
