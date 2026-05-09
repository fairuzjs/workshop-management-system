"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/providers/theme-provider";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed } = useSidebarStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userRole = (session?.user as { role?: string })?.role;

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-md transition-all duration-300",
        isCollapsed ? "left-[68px]" : "left-[260px]"
      )}
    >
      {/* Page Title area */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Workshop Management
        </h2>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="hidden flex-col items-start md:flex">
              <span className="text-sm font-medium text-foreground">
                {session?.user?.name || "User"}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {userRole || "Admin"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* Dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
