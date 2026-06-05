import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting employee deduplication...");

  const allEmployees = await prisma.employee.findMany({
    orderBy: { createdAt: "asc" },
  });

  const grouped: Record<string, typeof allEmployees> = {};
  for (const emp of allEmployees) {
    if (!grouped[emp.name]) grouped[emp.name] = [];
    grouped[emp.name].push(emp);
  }

  for (const [name, emps] of Object.entries(grouped)) {
    if (emps.length > 1) {
      console.log(`Found ${emps.length} duplicates for "${name}"`);
      const canonical = emps[0];
      const duplicates = emps.slice(1);

      for (const dup of duplicates) {
        console.log(`  Deleting duplicate ID: ${dup.id}`);

        // 1. Update WorkOrders
        const updatedWO = await prisma.workOrder.updateMany({
          where: { employeeId: dup.id },
          data: { employeeId: canonical.id },
        });
        console.log(`    Updated ${updatedWO.count} WorkOrders`);

        // 2. Update EmployeeEarnings
        const updatedEarnings = await prisma.employeeEarning.updateMany({
          where: { employeeId: dup.id },
          data: { employeeId: canonical.id },
        });
        console.log(`    Updated ${updatedEarnings.count} EmployeeEarnings`);

        // 3. Delete Duplicate Employee
        await prisma.employee.delete({
          where: { id: dup.id },
        });
      }
      console.log(`  Successfully deduplicated "${name}"`);
    }
  }

  console.log("Employee deduplication complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
