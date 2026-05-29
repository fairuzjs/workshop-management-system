import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MonthlyClosingClient } from "./client";

export const metadata: Metadata = {
  title: "Tutup Buku | Workshop Management",
};

export default async function MonthlyClosingPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "SUPERADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <MonthlyClosingClient />
    </div>
  );
}
