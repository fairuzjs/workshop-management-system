import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('Memulai proses pembersihan data dummy (Inventory & Customer)...');

  try {
    // Hapus data terkait Inventory
    // Hapus WorkOrderPart terlebih dahulu karena memiliki relasi ke Inventory
    const woParts = await prisma.workOrderPart.deleteMany();
    console.log(`Berhasil menghapus ${woParts.count} data WorkOrderPart`);

    const invLogs = await prisma.inventoryLog.deleteMany();
    console.log(`Berhasil menghapus ${invLogs.count} data InventoryLog`);

    const inventories = await prisma.inventory.deleteMany();
    console.log(`Berhasil menghapus ${inventories.count} data Inventory`);

    const suppliers = await prisma.supplier.deleteMany();
    console.log(`Berhasil menghapus ${suppliers.count} data Supplier`);

    // Hapus data terkait Customer & Vehicle
    // Karena WorkOrder memiliki relasi ke Vehicle, dan Vehicle ke Customer
    // Kita hapus WorkOrder yang terkait dengan Vehicle terlebih dahulu
    
    // 1. Ambil semua WorkOrder yang memiliki Vehicle
    // Hapus data relasi WorkOrder terlebih dahulu
    const woServices = await prisma.workOrderService.deleteMany();
    console.log(`Berhasil menghapus ${woServices.count} data WorkOrderService`);

    const woHistory = await prisma.workOrderHistoryItem.deleteMany();
    console.log(`Berhasil menghapus ${woHistory.count} data WorkOrderHistoryItem`);

    const transactions = await prisma.transaction.deleteMany();
    console.log(`Berhasil menghapus ${transactions.count} data Transaction`);

    const employeeEarnings = await prisma.employeeEarning.deleteMany({
      where: {
        workOrderId: { not: null }
      }
    });
    console.log(`Berhasil menghapus ${employeeEarnings.count} data EmployeeEarning dari WorkOrder`);

    const wos = await prisma.workOrder.deleteMany();
    console.log(`Berhasil menghapus ${wos.count} data WorkOrder`);

    const vehicles = await prisma.vehicle.deleteMany();
    console.log(`Berhasil menghapus ${vehicles.count} data Vehicle`);

    const customers = await prisma.customer.deleteMany();
    console.log(`Berhasil menghapus ${customers.count} data Customer`);

    console.log('✅ Pembersihan data dummy selesai!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat menghapus data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
