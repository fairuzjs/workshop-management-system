import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const s = await prisma.service.findMany();
  console.log(s);
}

check();
