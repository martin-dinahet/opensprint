"use client";

import type { FC } from "react";
import { SidebarTrigger } from "@/shared";
import { useDashboardHeaderState } from "../model";
import { HeaderBreadcrumbs } from "./breadcrumbs";

export const HeaderWidget: FC = () => {
  const { actions, description, eyebrow, title } = useDashboardHeaderState();
  const leadingContent = eyebrow ?? (title ? null : <HeaderBreadcrumbs />);

  return (
    <header className="grid min-h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-background/90 px-3 py-2 backdrop-blur sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="shrink-0" />
        <div className="grid min-h-9 min-w-0 content-center">
          <div className="hidden min-h-4 min-w-0 text-xs sm:block">{leadingContent}</div>
          {title ? (
            <div className="min-w-0">
              <h1 className="truncate text-balance font-semibold text-sm leading-tight">{title}</h1>
              {description ? <div className="mt-0.5 truncate text-muted-foreground text-xs">{description}</div> : null}
            </div>
          ) : (
            <div className="min-h-5" aria-hidden="true" />
          )}
        </div>
      </div>
      <div className="flex min-h-9 min-w-0 shrink-0 items-center gap-2 overflow-x-auto">{actions}</div>
    </header>
  );
};
