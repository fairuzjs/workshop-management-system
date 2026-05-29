import { create } from "zustand";

interface SidebarState {
  isCollapsed: boolean;
  isOpen: boolean; // mobile drawer
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  open: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isOpen: false,
  toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
