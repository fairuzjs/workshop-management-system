"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { useSidebarStore } from "@/stores/sidebar-store";
import {
  Sun,
  Moon,
  Menu,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { open } = useSidebarStore();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left side */}
      <div className="flex items-center gap-3">
        {/* Hamburger - mobile only */}
        <button
          onClick={open}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h2 className="text-base font-semibold text-foreground sm:text-lg">
          Workshop Management
        </h2>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick Add - mobile */}
        <button
          onClick={() => router.push("/work-orders/create")}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 sm:hidden"
          aria-label="Buat Work Order"
        >
          <Plus className="h-4 w-4" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </button>
      </div>
    </header>
  );
}

