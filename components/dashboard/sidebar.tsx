"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Car,
  Users,
  Package,
  Receipt,
  Wallet,
  BadgeDollarSign,
  BarChart3,
  Settings,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebar-store";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Work Orders", href: "/work-orders", icon: ClipboardList },
  { title: "Kendaraan", href: "/vehicles", icon: Car },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Transaksi", href: "/transactions", icon: Receipt },
  { title: "Pengeluaran", href: "/expenses", icon: Wallet },
  { title: "Karyawan", href: "/employees", icon: Users, superAdminOnly: true },
  { title: "Payroll", href: "/payroll", icon: BadgeDollarSign, superAdminOnly: true },
  { title: "Laporan", href: "/financial", icon: BarChart3, superAdminOnly: true },
  { title: "Pengaturan", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, toggle } = useSidebarStore();
  const userRole = (session?.user as { role?: string })?.role;

  const filteredItems = navItems.filter(
    (item) => !item.superAdminOnly || userRole === "SUPERADMIN"
  );

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
        isCollapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight text-foreground">
                Workshop
              </span>
              <span className="text-[10px] font-medium leading-tight text-muted-foreground">
                Management System
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  title={isCollapsed ? item.title : undefined}
                >
                  <item.icon
                    className={cn("h-5 w-5 shrink-0", isActive && "text-primary")}
                  />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  );
}
