import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const allInventory = await prisma.inventory.findMany({
    orderBy: { createdAt: "asc" },
  });

  const grouped: Record<string, typeof allInventory> = {};
  allInventory.forEach((item) => {
    if (!grouped[item.name]) grouped[item.name] = [];
    grouped[item.name].push(item);
  });

  console.log("Grouped Inventory Items:");
  for (const [name, items] of Object.entries(grouped)) {
    console.log(`- ${name}: ${items.length} records`);
    
    if (items.length > 1) {
      // The first one is the oldest, we'll keep it as the canonical one
      const canonical = items[0];
      const duplicates = items.slice(1);
      
      console.log(`  Keeping ID: ${canonical.id}`);
      
      for (const dup of duplicates) {
        // 1. Update existing WorkOrderPart pointing to dup -> canonical
        const updatedWOP = await prisma.workOrderPart.updateMany({
          where: { inventoryId: dup.id },
          data: { inventoryId: canonical.id },
        });
        
        console.log(`  Updated ${updatedWOP.count} WorkOrderParts from ${dup.id} to ${canonical.id}`);
        
        // 2. Update existing InventoryLog pointing to dup -> canonical
        const updatedLog = await prisma.inventoryLog.updateMany({
          where: { inventoryId: dup.id },
          data: { inventoryId: canonical.id },
        });

        console.log(`  Updated ${updatedLog.count} InventoryLogs from ${dup.id} to ${canonical.id}`);
        
        // 3. Delete the duplicate item
        await prisma.inventory.delete({
          where: { id: dup.id },
        });
        
        console.log(`  Deleted duplicate item: ${dup.id}`);
      }
    }
  }

  console.log("Inventory deduplication finished.");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
