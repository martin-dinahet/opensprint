"use client";

import type { ReactNode } from "react";

type Props = {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  title: string;
};

export function AppShellHeader({ actions, description, eyebrow, title }: Props) {
  return (
    <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur sm:px-6">
      <div className="min-w-0">
        {eyebrow && <div className="mb-0.5 text-muted-foreground text-xs">{eyebrow}</div>}
        <h1 className="truncate font-medium text-sm">{title}</h1>
        {description && <div className="mt-1 truncate text-muted-foreground text-xs">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
