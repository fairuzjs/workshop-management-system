"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Car,
  Users,
  Package,
  Receipt,
  Wallet,
  CalendarCheck,
  BarChart3,
  Settings,
  Wrench,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut,
  User,
  Archive,
} from "lucide-react";
import { useSidebarStore } from "@/stores/sidebar-store";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  superAdminOnly?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Work Orders", href: "/work-orders", icon: ClipboardList },
      { title: "Kendaraan", href: "/vehicles", icon: Car },
      { title: "Inventory", href: "/inventory", icon: Package },
    ],
  },
  {
    label: "Keuangan",
    items: [
      { title: "Transaksi", href: "/transactions", icon: Receipt },
      { title: "Pengeluaran", href: "/expenses", icon: Wallet },
      { title: "Laporan", href: "/financial", icon: BarChart3 },
      { title: "Tutup Buku", href: "/monthly-closing", icon: Archive, superAdminOnly: true },
    ],
  },
  {
    label: "Manajemen",
    items: [
      { title: "Karyawan", href: "/employees", icon: Users, superAdminOnly: true },
      { title: "Payroll", href: "/payroll", icon: CalendarCheck, superAdminOnly: true },
      { title: "Pengaturan", href: "/settings", icon: Settings, superAdminOnly: true },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, isOpen, toggle, close } = useSidebarStore();
  const userRole = (session?.user as { role?: string })?.role;

  const filteredSections = navSections.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.superAdminOnly || userRole === "SUPERADMIN"
    ),
  }));

  const sidebarContent = (
    <>
      {/* Logo & Toggle Header */}
      <div className="flex h-16 items-center border-b border-border px-4">
        {/* Full Logo: shown on desktop when NOT collapsed, or always shown on mobile */}
        <div className={cn("flex items-center gap-3 overflow-hidden", isCollapsed && "lg:hidden")}>
          <Link href="/" className="flex items-center gap-3" onClick={() => close()}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight text-foreground">
                Workshop
              </span>
              <span className="text-[10px] font-medium leading-tight text-muted-foreground">
                Management System
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Collapse Toggle (When expanded) */}
        {!isCollapsed && (
          <button
            onClick={toggle}
            className="ml-auto hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:flex"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Desktop Expand Toggle (When collapsed - centered) */}
        {isCollapsed && (
          <button
            onClick={toggle}
            className="mx-auto hidden h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:flex"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Mobile Close button (drawer close) */}
        <button
          onClick={close}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {filteredSections.map((section) => (
          <div key={section.label} className="mb-6 last:mb-0">
            {!isCollapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                {section.label}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => close()}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <item.icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0",
                          isActive && "text-primary"
                        )}
                      />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile Mini */}
      {!isCollapsed && session?.user && (
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">
                {session.user.name || "User"}
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {userRole || "Admin"}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}


    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-border bg-card transition-all duration-300 lg:flex",
          isCollapsed ? "w-[72px]" : "w-[272px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={close}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
