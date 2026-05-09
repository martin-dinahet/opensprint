"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/shared/providers/query-provider";
import { ThemeProvider } from "@/shared/providers/theme-provider";
import { Toaster } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider>
          {children}
          <Toaster richColors />
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
