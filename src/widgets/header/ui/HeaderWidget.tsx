"use client";

import type { FC } from "react";
import { SidebarTrigger } from "@/shared/shadcn/sidebar";
import { HeaderBreadcrumbs } from "./breadcrumbs/ui/HeaderBreadcrumbs";
import { HeaderLogo } from "./logo/ui/HeaderLogo";
import { HeaderThemeSwitcher } from "./theme-switcher/ui/HeaderThemeSwitcher";
import { HeaderUserControls } from "./user-controls/ui/HeaderUserControls";

export const HeaderWidget: FC = () => {
  return (
    <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <HeaderLogo />
        <span className="hidden text-muted-foreground sm:inline">{" • "}</span>
        <div className="hidden min-w-0 sm:block">
          <HeaderBreadcrumbs />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <HeaderThemeSwitcher />
        <HeaderUserControls />
      </div>
    </header>
  );
};
