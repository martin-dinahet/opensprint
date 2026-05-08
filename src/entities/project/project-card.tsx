"use client";

import { IconArrowRight, IconCalendar, IconLayoutKanban } from "@tabler/icons-react";
import type { ProjectListOutput } from "@/entities/project";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type Props = {
  onOpen: () => void;
  project: ProjectListOutput;
};

export function ProjectCard({ onOpen, project }: Props) {
  return (
    <Card
      className="group cursor-pointer rounded-lg transition-colors hover:bg-muted/50"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <IconLayoutKanban className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CardTitle className="truncate font-semibold text-lg">{project.name}</CardTitle>
          </div>
          <IconArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        {project.description && <CardDescription className="line-clamp-2">{project.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
          <IconCalendar className="h-3.5 w-3.5" />
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
