"use client";

import {
  IconArrowRight,
  IconCalendar,
  IconCheckbox,
  IconDotsVertical,
  IconLayoutKanban,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { ProjectListOutput } from "@/entities/project";
import { useDeleteProject } from "@/entities/project";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  handleClientResult,
} from "@/shared";

type Props = {
  project: ProjectListOutput;
};

export function ProjectCard({ project }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteProject = useDeleteProject();
  const href = project.defaultBoardId
    ? `/projects/${project.id}/boards/${project.defaultBoardId}`
    : `/projects/${project.id}`;

  const onDelete = async () => {
    const result = await handleClientResult(() => deleteProject.mutateAsync(project.id), "Unable to delete project");

    result.match({
      ok: () => {
        setConfirmDelete(false);
        toast.success("Project deleted");
      },
      err: (error) => toast.error(error.message),
    });
  };

  return (
    <>
      <Card className="group relative min-h-44 rounded-lg transition-[transform,background-color,box-shadow] hover:-translate-y-0.5 hover:bg-muted/35 hover:shadow-sm focus-within:ring-3 focus-within:ring-ring/50">
        <Link
          href={href}
          aria-label={`Open ${project.name}`}
          className="absolute inset-0 z-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <CardHeader className="gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <IconLayoutKanban className="h-4 w-4 shrink-0 text-primary" />
            <CardTitle className="truncate font-semibold text-lg">{project.name}</CardTitle>
          </div>
          <CardAction className="relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                <IconDotsVertical />
                <span className="sr-only">Project actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href={href} />}>
                    <IconArrowRight />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                    <IconTrash />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
          <CardDescription className="line-clamp-2 min-h-10">
            {project.description || "No description yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Active</Badge>
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <IconUsers className="h-3.5 w-3.5" />
                {project.memberCount}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <IconCheckbox className="h-3.5 w-3.5" />
                {project.openTaskCount} open
              </span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-muted-foreground text-xs">
              <IconCalendar className="h-3.5 w-3.5" />
              Updated {formatDate(project.updatedAt)}
            </p>
          </div>
          <IconArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" />
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              {project.name} and its workspace data will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete} disabled={deleteProject.isPending}>
              {deleteProject.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}
