"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";
import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";

type BreadcrumbItemValue = {
  href?: string;
  label: ReactNode;
};

type Props = {
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItemValue[];
  eyebrow?: ReactNode;
  title: string;
};

export function AppShellHeader({ actions, breadcrumbs, eyebrow, title }: Props) {
  const hasBreadcrumbs = breadcrumbs && breadcrumbs.length > 0;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <div className="min-w-0">
          {hasBreadcrumbs ? (
            <Breadcrumb className="mb-0.5">
              <BreadcrumbList className="flex-nowrap gap-1 text-xs">
                {breadcrumbs.map((item, index) => {
                  const isCurrent = index === breadcrumbs.length - 1 || !item.href;
                  const breadcrumbKey =
                    item.href ??
                    (typeof item.label === "string" || typeof item.label === "number" ? item.label : title);

                  return (
                    <Fragment key={breadcrumbKey}>
                      {index > 0 && <BreadcrumbSeparator className="hidden sm:flex" />}
                      <BreadcrumbItem className="min-w-0">
                        {isCurrent ? (
                          <BreadcrumbPage className="truncate text-muted-foreground">{item.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink className="truncate" render={<Link href={item.href ?? "#"} />}>
                            {item.label}
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            eyebrow && <div className="mb-0.5 text-muted-foreground text-xs">{eyebrow}</div>
          )}
          <h1 className="truncate font-medium text-sm">{title}</h1>
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
