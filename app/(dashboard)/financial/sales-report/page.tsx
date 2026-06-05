import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SalesReportClient } from "./_components/sales-report-client";
import { FinancialTabs } from "@/components/dashboard/financial-tabs";
import { getPeriodParams, getDateFilter } from "@/lib/utils";

export default async function SalesReportPage(props: { searchParams: Promise<{ period?: string, date?: string, month?: string, year?: string }> }) {
  const session = await auth();
  if (!session) redirect("/login");
  const userRole = (session.user as any)?.role || "ADMIN";
  
  const resolvedParams = await props.searchParams;
  const { period, date, month, year } = getPeriodParams(resolvedParams);
  const dateFilter = getDateFilter(period, date, month, year);


  // Fetch Services
  const woServices = await prisma.workOrderService.findMany({
    where: {
      workOrder: {
        status: "SELESAI",
        transaction: {
          status: "LUNAS",
          ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
        }
      }
    },
    include: {
      service: true
    }
  });

  // Group Services by Name
  const servicesMap = new Map();
  woServices.forEach(ws => {
    let name = ws.service.name.toUpperCase();
    
    if (name.includes('CUCI')) {
      name = 'JASA CUCI MOBIL';
    }

    if (!servicesMap.has(name)) {
      servicesMap.set(name, {
        kode: 'JS',
        keterangan: name,
        jumlah: 0,
        totalPenjualan: 0,
        hpp: 0,
        laba: 0
      });
    }
    const item = servicesMap.get(name);
    item.jumlah += 1;
    item.totalPenjualan += Number(ws.price);
    item.laba += Number(ws.price);
  });

  // Fetch Parts
  const woParts = await prisma.workOrderPart.findMany({
    where: {
      workOrder: {
        status: "SELESAI",
        transaction: {
          status: "LUNAS",
          ...(Object.keys(dateFilter).length > 0 ? { paidAt: dateFilter } : {})
        }
      }
    },
    include: {
      inventory: true
    }
  });

  // Group Parts by Category
  const partsMap = new Map();
  woParts.forEach(wp => {
    const category = (wp.inventory.category || 'LAINNYA').toUpperCase();
    const name = `PENJUALAN ${category}`;
    if (!partsMap.has(name)) {
      partsMap.set(name, {
        kode: 'IN',
        keterangan: name,
        jumlah: 0,
        totalPenjualan: 0,
        hpp: 0,
        laba: 0
      });
    }
    const item = partsMap.get(name);
    const qty = wp.qty;
    const totalSales = Number(wp.price) * qty;
    const hpp = Number(wp.inventory.capitalPrice) * qty;
    
    item.jumlah += qty;
    item.totalPenjualan += totalSales;
    item.hpp += hpp;
    item.laba += (totalSales - hpp);
  });

  const reportData = [
    ...Array.from(servicesMap.values()),
    ...Array.from(partsMap.values())
  ];

  const totalPenjualan = reportData.reduce((sum, item) => sum + item.totalPenjualan, 0);
  const totalHpp = reportData.reduce((sum, item) => sum + item.hpp, 0);
  const totalLaba = reportData.reduce((sum, item) => sum + item.laba, 0);

  return (
    <div className="space-y-6">
      <FinancialTabs activeTab="sales-report" userRole={userRole} />
      <SalesReportClient 
        data={reportData}
        totals={{
          totalPenjualan,
          totalHpp,
          totalLaba
        }}
        period={period as "daily" | "monthly" | "yearly"}
        date={date}
        month={month}
        year={year}
      />
    </div>
  );
}
