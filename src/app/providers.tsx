"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { useState } from "react";
import { Toaster } from "@/shared/shadcn/sonner";
import { TooltipProvider } from "@/shared/shadcn/tooltip";

type Props = {
  children: ReactNode;
};

export function ClientProviders({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {children}
          <Toaster richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
