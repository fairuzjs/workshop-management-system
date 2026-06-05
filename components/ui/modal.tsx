"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  className?: string;
}

const sizeStyles = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
  "2xl": "sm:max-w-6xl",
  "3xl": "sm:max-w-7xl",
  "full": "sm:max-w-[95vw]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = "md",
  className,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={cn(
          "relative z-50 w-full bg-card shadow-2xl border border-border/80 transition-all duration-300",
          // Mobile: bottom sheet
          "max-h-[92vh] overflow-y-auto rounded-t-3xl p-6",
          // Desktop: centered modal
          "sm:rounded-3xl sm:max-w-lg sm:w-full sm:animate-slide-up",
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-90"
            aria-label="Close"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="text-sm text-foreground/90">{children}</div>
      </div>
    </div>
  );
}
