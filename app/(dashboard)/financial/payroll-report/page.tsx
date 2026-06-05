import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PayrollPageClient from "./_components/payroll-report-client";

export default async function PayrollReportPage() {
  const session = await auth();
  if (!session) redirect("/login");
  
  const userRole = (session.user as any)?.role || "ADMIN";
  if (userRole !== "SUPERADMIN") {
    redirect("/financial");
  }

  return <PayrollPageClient userRole={userRole} />;
}
