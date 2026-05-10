"use client";

import { IconArrowRight, IconCalendar, IconFolder } from "@tabler/icons-react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ProjectListOutput } from "@/entities/project";
import { DeleteProjectDialog } from "@/features/delete-project";
import { EditProjectDialog } from "@/features/edit-project";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";

type Props = {
  project: ProjectListOutput;
};

export function ProjectCard({ project }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Card className="group relative rounded-lg transition-colors hover:border-primary/30 hover:bg-muted/35">
        <Link
          href={`/projects/${project.id}`}
          className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <CardHeader className="gap-3 pb-3">
            <div className="flex items-start gap-3 pr-8">
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
        </Link>
        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <MoreHorizontalIcon />
              <span className="sr-only">Project actions</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <PencilIcon />
                Edit project
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2Icon />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>
      <EditProjectDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
      <DeleteProjectDialog open={deleteOpen} onOpenChange={setDeleteOpen} project={project} />
    </>
  );
}
