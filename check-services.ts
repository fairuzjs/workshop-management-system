import prisma from "./lib/prisma";
async function main() {
  const cuci = await prisma.service.findMany({ where: { category: "CUCI" } });
  console.log("CUCI:", cuci);
  const data = await prisma.service.findMany();
  console.log("ALL:", data);
}
main().catch(console.error);
