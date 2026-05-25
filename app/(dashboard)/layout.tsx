"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
          "min-h-screen pt-16 transition-all duration-300",
          isCollapsed ? "pl-[68px]" : "pl-[260px]"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
