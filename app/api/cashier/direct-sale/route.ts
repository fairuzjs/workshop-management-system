import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { paymentMethod, jasaItems = [], partItems = [] } = body;

  if (!paymentMethod) {
    return NextResponse.json(
      { error: "Metode pembayaran wajib dipilih" },
      { status: 400 }
    );
  }

  if (jasaItems.length === 0 && partItems.length === 0) {
    return NextResponse.json(
      { error: "Keranjang kosong" },
      { status: 400 }
    );
  }

  // Create Dummy Customer if not exists
  let dummyCustomer = await prisma.customer.findFirst({
    where: { name: "Pelanggan Umum (Beli Langsung)" },
  });

  if (!dummyCustomer) {
    dummyCustomer = await prisma.customer.create({
      data: {
        name: "Pelanggan Umum (Beli Langsung)",
        phone: "-",
      },
    });
  }

  // Create Dummy Vehicle if not exists
  let dummyVehicle = await prisma.vehicle.findFirst({
    where: { plateNumber: "PART-DIRECT" },
  });

  if (!dummyVehicle) {
    dummyVehicle = await prisma.vehicle.create({
      data: {
        plateNumber: "PART-DIRECT",
        brand: "PEMBELIAN SPAREPART",
        model: "LANGSUNG",
        customerId: dummyCustomer.id,
      },
    });
  }

  let finalTotalCost = 0;
  const trackingToken = `DS-${Date.now().toString().slice(-6)}`;

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      const commissions = await tx.serviceCommission.findMany({ include: { service: true } });
      const systemSetting = await tx.systemSetting.findUnique({ where: { id: "global" } });

      const defaultServicePct = systemSetting ? Number(systemSetting.serviceCommissionPct) / 100 : 0.55;
      const defaultPartPct = systemSetting ? Number(systemSetting.partCommissionPct) / 100 : 0.03;

      // Create Dummy Work Order
      const workOrder = await tx.workOrder.create({
        data: {
          vehicleId: dummyVehicle.id,
          userId: session.user.id,
          trackingToken,
          status: "SELESAI",
          serviceType: "SERVIS", // Using standard service mode to allow custom parts/services
          totalCost: 0,
        },
      });

      // 1. Process Jasa (Manual)
      for (const jasa of jasaItems) {
        finalTotalCost += Number(jasa.price);
        
        // Connect employees
        const employeeConnects = jasa.employeeIds.map((empId: string) => ({ id: empId }));

        // Always create new manual history item for direct sale
        await tx.workOrderHistoryItem.create({
          data: {
            workOrderId: workOrder.id,
            title: jasa.name,
            price: jasa.price,
            employees: { connect: employeeConnects }
          }
        });

        // Add commission divided by employees (if any)
        if (jasa.employeeIds.length > 0) {
          const now = new Date();
          
          let commissionPerPerson = 0;
          const commRule = commissions.find(c => c.service.name === jasa.name);
          
          if (commRule) {
            commissionPerPerson = Number(commRule.commissionNominal) / jasa.employeeIds.length;
          } else {
            commissionPerPerson = (Number(jasa.price) * defaultServicePct) / jasa.employeeIds.length;
          }

          for (const empId of jasa.employeeIds) {
            await tx.employeeEarning.create({
              data: {
                employeeId: empId,
                workOrderId: workOrder.id,
                amount: commissionPerPerson,
                earningType: "COMMISSION",
                month: now.getMonth() + 1,
                year: now.getFullYear(),
              }
            });
          }
        }
      }

      // 2. Process Parts
      for (const part of partItems) {
        const itemTotal = Number(part.price) * Number(part.qty);
        finalTotalCost += itemTotal;
        
        const employeeConnects = part.employeeIds.map((empId: string) => ({ id: empId }));

        // Create new part and deduct stock
        await tx.workOrderPart.create({
          data: {
            workOrderId: workOrder.id,
            inventoryId: part.inventoryId,
            qty: part.qty,
            price: part.price,
            employees: { connect: employeeConnects }
          }
        });
        
        await tx.inventory.update({
          where: { id: part.inventoryId },
          data: { qty: { decrement: part.qty } }
        });

        await tx.inventoryLog.create({
          data: {
            inventoryId: part.inventoryId,
            qty: part.qty,
            type: "OUT",
            notes: `Digunakan untuk Beli Langsung (WO: ${trackingToken})`,
          }
        });

        // Add 3% commission per mechanic for part installation (if any)
        if (part.employeeIds.length > 0) {
          const now = new Date();
          const commissionPerPerson = itemTotal * defaultPartPct;
          for (const empId of part.employeeIds) {
            await tx.employeeEarning.create({
              data: {
                employeeId: empId,
                workOrderId: workOrder.id,
                amount: commissionPerPerson,
                earningType: "COMMISSION",
                month: now.getMonth() + 1,
                year: now.getFullYear(),
              }
            });
          }
        }
      }

      // Update WorkOrder total cost
      await tx.workOrder.update({
        where: { id: workOrder.id },
        data: { totalCost: finalTotalCost }
      });

      // Create Transaction record
      const transaction = await tx.transaction.create({
        data: {
          workOrderId: workOrder.id,
          amount: finalTotalCost,
          paymentMethod,
          status: "LUNAS",
          paidAt: new Date(),
        },
      });

      return transaction;
    });

    return NextResponse.json(transactionResult, { status: 201 });
  } catch (error: any) {
    console.error("Direct Sale Transaction Error:", error);
    return NextResponse.json({ error: "Gagal memproses transaksi Beli Langsung" }, { status: 500 });
  }
}
