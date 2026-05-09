"use client";

import type { ReactNode } from "react";
import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";

type Props = {
  actions?: ReactNode;
  eyebrow?: ReactNode;
  title: string;
};

export function AppShellHeader({ actions, eyebrow, title }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <div className="min-w-0">
          {eyebrow && <div className="mb-0.5 text-muted-foreground text-xs">{eyebrow}</div>}
          <h1 className="truncate font-medium text-sm">{title}</h1>
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
