import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EmployeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if ((session?.user as any)?.role !== "SUPERADMIN") {
    redirect("/");
  }

  return <>{children}</>;
}
