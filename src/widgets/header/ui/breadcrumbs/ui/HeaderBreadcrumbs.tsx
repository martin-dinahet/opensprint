"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type FC, Fragment } from "react";
import { useProject } from "@/entities/project";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/shadcn/breadcrumb";
import { formatLabel } from "../lib/format-label";

export const HeaderBreadcrumbs: FC = () => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const projectId = segments[0] === "projects" ? segments[1] : undefined;
  const { data: project } = useProject(projectId ?? "");
  const breadcrumbs = segments.map((segment, index) => ({
    label: index === 1 && segments[0] === "projects" ? (project?.name ?? formatLabel(segment)) : formatLabel(segment),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));

  if (!breadcrumbs.length) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <Fragment key={breadcrumb.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="truncate">{breadcrumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink className="truncate" render={<Link href={breadcrumb.href} />}>
                    {breadcrumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
