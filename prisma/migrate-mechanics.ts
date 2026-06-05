import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting mechanic migration...");

  const workOrders = await prisma.workOrder.findMany({
    where: { employeeId: { not: null } },
    include: {
      services: true,
      historyItems: true,
      parts: true,
    },
  });

  console.log(`Found ${workOrders.length} work orders with employee assigned.`);

  let successCount = 0;

  for (const wo of workOrders) {
    const employeeId = wo.employeeId;
    if (!employeeId) continue;

    // Connect to services
    for (const service of wo.services) {
      await prisma.workOrderService.update({
        where: { id: service.id },
        data: {
          employees: {
            connect: { id: employeeId },
          },
        },
      });
    }

    // Connect to history items
    for (const item of wo.historyItems) {
      await prisma.workOrderHistoryItem.update({
        where: { id: item.id },
        data: {
          employees: {
            connect: { id: employeeId },
          },
        },
      });
    }

    // Connect to parts (assuming the main mechanic installed the parts before we had multiple mechanics)
    for (const part of wo.parts) {
      await prisma.workOrderPart.update({
        where: { id: part.id },
        data: {
          employees: {
            connect: { id: employeeId },
          },
        },
      });
    }

    successCount++;
  }

  console.log(`Successfully migrated mechanics for ${successCount} work orders.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
