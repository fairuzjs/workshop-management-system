import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // --- Users ---
  const hashedPassword = await bcrypt.hash("admin123", 12);

  const superadmin = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      username: "superadmin",
      password: hashedPassword,
      name: "Super Admin",
      role: "SUPERADMIN",
    },
  });

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Admin Bengkel",
      role: "ADMIN",
    },
  });

  console.log("Users seeded:", { superadmin: superadmin.username, admin: admin.username });

  // --- Employees ---
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        name: "Budi Santoso",
        position: "Mekanik",
        phone: "081234567890",
        salary: 3500000,
      },
    }),
    prisma.employee.create({
      data: {
        name: "Agus Pratama",
        position: "Mekanik",
        phone: "081234567891",
        salary: 3000000,
      },
    }),
    prisma.employee.create({
      data: {
        name: "Rudi Hermawan",
        position: "Pencuci Mobil",
        phone: "081234567892",
        salary: 0,
      },
    }),
    prisma.employee.create({
      data: {
        name: "Deni Saputra",
        position: "Pencuci Mobil",
        phone: "081234567893",
        salary: 0,
      },
    }),
  ]);

  console.log("Employees seeded:", employees.length);

  // --- Services: SERVIS BENGKEL ---
  const servisServices = await Promise.all([
    prisma.service.create({
      data: { name: "Ganti Oli", category: "SERVIS", price: 150000 },
    }),
    prisma.service.create({
      data: { name: "Tune Up Mesin", category: "SERVIS", price: 250000 },
    }),
    prisma.service.create({
      data: { name: "Service Rem", category: "SERVIS", price: 200000 },
    }),
    prisma.service.create({
      data: { name: "Ganti Kampas Rem", category: "SERVIS", price: 350000 },
    }),
    prisma.service.create({
      data: { name: "Service AC", category: "SERVIS", price: 300000 },
    }),
  ]);

  console.log("Workshop services seeded:", servisServices.length);

  // --- Services: CUCI KENDARAAN ---
  const cuciSmall = await prisma.service.create({
    data: { name: "Cuci Kendaraan Kecil", category: "CUCI", price: 35000 },
  });

  const cuciMedium = await prisma.service.create({
    data: { name: "Cuci Kendaraan Sedang", category: "CUCI", price: 50000 },
  });

  const cuciLarge = await prisma.service.create({
    data: { name: "Cuci Kendaraan Besar", category: "CUCI", price: 75000 },
  });

  console.log("Car wash services seeded: 3");

  // --- Service Commissions (for CUCI) ---
  await Promise.all([
    prisma.serviceCommission.create({
      data: { serviceId: cuciSmall.id, commissionRate: 10 },
    }),
    prisma.serviceCommission.create({
      data: { serviceId: cuciMedium.id, commissionRate: 12 },
    }),
    prisma.serviceCommission.create({
      data: { serviceId: cuciLarge.id, commissionRate: 13 },
    }),
  ]);

  console.log("Service commissions seeded");

  // --- Inventory / Spareparts ---
  const inventoryItems = await Promise.all([
    prisma.inventory.create({
      data: { name: "Oli Mesin 1L", category: "Oli", qty: 50, unit: "liter", minStock: 10, price: 85000 },
    }),
    prisma.inventory.create({
      data: { name: "Kampas Rem Depan", category: "Rem", qty: 20, unit: "set", minStock: 5, price: 150000 },
    }),
    prisma.inventory.create({
      data: { name: "Filter Oli", category: "Filter", qty: 30, unit: "pcs", minStock: 10, price: 45000 },
    }),
    prisma.inventory.create({
      data: { name: "Busi", category: "Kelistrikan", qty: 40, unit: "pcs", minStock: 10, price: 35000 },
    }),
    prisma.inventory.create({
      data: { name: "Air Radiator 1L", category: "Cairan", qty: 25, unit: "liter", minStock: 5, price: 30000 },
    }),
  ]);

  console.log("Inventory seeded:", inventoryItems.length);
  console.log("\nSeeding complete!");
  console.log("Default credentials:");
  console.log("   SuperAdmin → username: superadmin, password: admin123");
  console.log("   Admin      → username: admin, password: admin123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
