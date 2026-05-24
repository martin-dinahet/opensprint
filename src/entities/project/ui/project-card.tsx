"use client";

import { IconArrowRight, IconCalendar, IconLayoutKanban } from "@tabler/icons-react";
import Link from "next/link";
import type { ProjectListOutput } from "@/entities/project";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared";

type Props = {
  project: ProjectListOutput;
};

export function ProjectCard({ project }: Props) {
  const href = project.defaultBoardId
    ? `/projects/${project.id}/boards/${project.defaultBoardId}`
    : `/projects/${project.id}`;

  return (
    <Link href={href} className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <Card className="group min-h-44 rounded-lg transition-colors hover:bg-muted/50">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <IconLayoutKanban className="h-4 w-4 shrink-0 text-primary" />
              <CardTitle className="truncate font-semibold text-lg">{project.name}</CardTitle>
            </div>
            <IconArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </div>
          <CardDescription className="line-clamp-2 min-h-10">{project.description || "\u00a0"}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <IconCalendar className="h-3.5 w-3.5" />
            Created {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(project.createdAt))}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
