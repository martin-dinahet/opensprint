"use client";

import type { FC } from "react";
import { InvitationNotificationBell } from "@/features/invitation-notifications";
import { SidebarTrigger } from "@/shared";
import { useDashboardHeaderState } from "../model";

export const HeaderWidget: FC = () => {
  const { actions, description, eyebrow, title } = useDashboardHeaderState();
  const context = eyebrow ?? description;

  return (
    <header className="grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 overflow-hidden border-b-2 bg-background px-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="size-8 shrink-0 rounded-none border border-border" />
        <div className="flex h-8 min-w-0 items-center gap-2 overflow-hidden">
          <h1 className="min-w-0 truncate font-black text-sm leading-none uppercase">{title ?? "OpenSprint"}</h1>
          {context ? (
            <>
              <span className="hidden h-4 w-px shrink-0 bg-border sm:block" aria-hidden="true" />
              <div className="hidden min-w-0 truncate text-muted-foreground text-xs sm:block">{context}</div>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex h-8 min-w-0 shrink-0 items-center gap-2 overflow-x-auto">
        <InvitationNotificationBell />
        {actions}
      </div>
    </header>
  );
};
