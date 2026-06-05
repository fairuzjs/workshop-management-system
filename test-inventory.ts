import 'dotenv/config';
import prisma from './lib/prisma';

async function main() {
  try {
    const item = await prisma.inventory.create({
      data: {
        name: "TEST ITEM",
        unit: "pcs",
        qty: 10,
        minStock: 5,
        capitalPrice: 10000,
        price: 15000,
      }
    });
    console.log("Success:", item.id);
    await prisma.inventory.delete({ where: { id: item.id } });
  } catch (e) {
    console.error("Failed:", e);
  }
}
main();
