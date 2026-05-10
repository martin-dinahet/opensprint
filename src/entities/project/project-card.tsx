"use client";

import { IconArrowRight, IconCalendar, IconFolder } from "@tabler/icons-react";
import Link from "next/link";
import type { ProjectListOutput } from "@/entities/project";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type Props = {
  project: ProjectListOutput;
};

export function ProjectCard({ project }: Props) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="group rounded-lg transition-colors hover:border-primary/30 hover:bg-muted/35">
        <CardHeader className="gap-3 pb-3">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-primary">
              <IconFolder className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="truncate font-semibold text-base">{project.name}</CardTitle>
                <IconArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
              </div>
              <p className="mt-1 text-muted-foreground text-xs">Project hub</p>
              {project.description && (
                <CardDescription className="mt-3 line-clamp-2">{project.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="flex items-center gap-1.5 border-t pt-3 text-muted-foreground text-xs">
            <IconCalendar className="h-3.5 w-3.5" />
            Created {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(project.createdAt))}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
