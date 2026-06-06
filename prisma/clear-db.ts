import 'dotenv/config';
import { prisma } from '../lib/prisma';

async function main() {
  console.log('Clearing database tables...');

  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE 
        audit_logs, 
        monthly_closings, 
        expenses, 
        employee_earnings, 
        work_order_history_items, 
        transactions, 
        work_order_parts, 
        work_order_services, 
        work_orders, 
        service_commissions, 
        services, 
        vehicles, 
        customers, 
        inventory_logs, 
        inventory, 
        suppliers, 
        employees
      CASCADE;
    `);

    console.log('Database cleared successfully (users and system settings are preserved).');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
