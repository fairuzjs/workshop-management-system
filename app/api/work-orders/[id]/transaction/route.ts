import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/work-orders/[id]/transaction — Create payment and process items/commissions
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
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

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: { transaction: true },
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work Order tidak ditemukan" }, { status: 404 });
  }

  if (workOrder.transaction) {
    return NextResponse.json(
      { error: "Transaksi sudah ada untuk Work Order ini" },
      { status: 400 }
    );
  }

  if (workOrder.status !== "SELESAI") {
    return NextResponse.json(
      { error: "Work Order harus berstatus SELESAI sebelum pembayaran" },
      { status: 400 }
    );
  }

  // Calculate total price to ensure integrity
  let finalTotalCost = 0;

  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Fetch cuci commission rules
      const commissions = await tx.serviceCommission.findMany({ include: { service: true } });
      const systemSetting = await tx.systemSetting.findUnique({ where: { id: "global" } });

      const defaultServicePct = systemSetting ? Number(systemSetting.serviceCommissionPct) / 100 : 0.55;
      const defaultPartPct = systemSetting ? Number(systemSetting.partCommissionPct) / 100 : 0.03;

      // 1. Process Jasa (Services & Manual)
      for (const jasa of jasaItems) {
        finalTotalCost += Number(jasa.price);
        
        // Connect employees
        const employeeConnects = jasa.employeeIds.map((empId: string) => ({ id: empId }));

        if (jasa.tempId.startsWith("wo-svc-")) {
          // Update existing service
          const svcId = jasa.tempId.replace("wo-svc-", "");
          await tx.workOrderService.update({
            where: { id: svcId },
            data: {
              employees: { set: employeeConnects }
            }
          });
        } else if (jasa.tempId.startsWith("wo-hist-")) {
          // Update existing history item
          const histId = jasa.tempId.replace("wo-hist-", "");
          await tx.workOrderHistoryItem.update({
            where: { id: histId },
            data: {
              employees: { set: employeeConnects }
            }
          });
        } else {
          // Create new manual history item (manual or cuci preset)
          await tx.workOrderHistoryItem.create({
            data: {
              workOrderId: id,
              title: jasa.name,
              price: jasa.price,
              employees: { connect: employeeConnects }
            }
          });
        }

        // Add commission divided by employees (if any)
        if (jasa.employeeIds.length > 0) {
          const now = new Date();
          
          let commissionPerPerson = 0;

          // Determine serviceId for commission matching
          let matchServiceId = jasa.serviceId;
          if (!matchServiceId && jasa.tempId.startsWith("wo-svc-")) {
            // Look up serviceId from the existing WorkOrderService
            const svcId = jasa.tempId.replace("wo-svc-", "");
            const woSvc = await tx.workOrderService.findUnique({ where: { id: svcId }, select: { serviceId: true } });
            matchServiceId = woSvc?.serviceId;
          }

          // Match by serviceId first (reliable), fallback to name
          const commRule = matchServiceId
            ? commissions.find(c => c.serviceId === matchServiceId)
            : commissions.find(c => c.service.name === jasa.name);
          
          if (commRule) {
            commissionPerPerson = Number(commRule.commissionNominal) / jasa.employeeIds.length;
          } else {
            commissionPerPerson = (Number(jasa.price) * defaultServicePct) / jasa.employeeIds.length;
          }

          for (const empId of jasa.employeeIds) {
            await tx.employeeEarning.create({
              data: {
                employeeId: empId,
                workOrderId: id,
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

        if (part.tempId.startsWith("wo-part-")) {
          // Update existing part
          const partId = part.tempId.replace("wo-part-", "");
          await tx.workOrderPart.update({
            where: { id: partId },
            data: {
              employees: { set: employeeConnects }
            }
          });
        } else {
          // Create new part and deduct stock — validate stock first
          const currentInventory = await tx.inventory.findUnique({
            where: { id: part.inventoryId },
            select: { qty: true, name: true },
          });
          if (!currentInventory || currentInventory.qty < part.qty) {
            throw new Error(
              `Stok ${currentInventory?.name || 'item'} tidak mencukupi (tersedia: ${currentInventory?.qty ?? 0}, dibutuhkan: ${part.qty})`
            );
          }

          await tx.workOrderPart.create({
            data: {
              workOrderId: id,
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
              notes: `Digunakan untuk Work Order ${workOrder.trackingToken}`,
            }
          });
        }

        // Add 3% commission per mechanic for part installation (if any)
        if (part.employeeIds.length > 0) {
          const now = new Date();
          const commissionPerPerson = itemTotal * defaultPartPct; // Dynamic % of part total PER person
          for (const empId of part.employeeIds) {
            await tx.employeeEarning.create({
              data: {
                employeeId: empId,
                workOrderId: id,
                amount: commissionPerPerson,
                earningType: "COMMISSION",
                month: now.getMonth() + 1,
                year: now.getFullYear(),
              }
            });
          }
        }
      }

      // 3. Update WorkOrder total cost if it changed
      if (Number(workOrder.totalCost) !== finalTotalCost) {
        await tx.workOrder.update({
          where: { id },
          data: { totalCost: finalTotalCost }
        });
      }

      // 4. Create Transaction record
      const transaction = await tx.transaction.create({
        data: {
          workOrderId: id,
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
    console.error("Transaction Error:", error);
    const message = error?.message?.startsWith("Stok ")
      ? error.message
      : "Gagal memproses transaksi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
