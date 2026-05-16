"use client";

import type { FC } from "react";
import { useDashboardHeaderState } from "../model/dashboard-header-context";
import { HeaderBreadcrumbs } from "./breadcrumbs/ui/HeaderBreadcrumbs";
import { HeaderLogo } from "./logo/ui/HeaderLogo";
import { HeaderThemeSwitcher } from "./theme-switcher/ui/HeaderThemeSwitcher";
import { HeaderUserControls } from "./user-controls/ui/HeaderUserControls";

export const HeaderWidget: FC = () => {
  const { actions, description, eyebrow, title } = useDashboardHeaderState();

  return (
    <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <HeaderLogo />
        <span className="hidden text-muted-foreground sm:inline">{" • "}</span>
        <div className="min-w-0">
          <div className="hidden min-w-0 sm:block">{eyebrow ?? <HeaderBreadcrumbs />}</div>
          {title ? (
            <div className="min-w-0 sm:mt-0.5">
              <h1 className="truncate font-medium text-sm leading-tight">{title}</h1>
              {description ? <div className="mt-0.5 truncate text-muted-foreground text-xs">{description}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <HeaderThemeSwitcher />
        <HeaderUserControls />
      </div>
    </header>
  );
};
