"use client";

import {
  IconArchive,
  IconArrowRight,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProjectListOutput } from "@/entities/project";
import { useProjects } from "@/entities/project";
import { CreateProjectDialog } from "@/features/create-project";
import { Badge, Button, cn, Input, LoadingScreen, NativeSelect, NativeSelectOption } from "@/shared";
import { useDashboardHeader } from "@/widgets/header";

type SortValue = "name-asc" | "recent" | "oldest";
type StatusFilter = "all" | ProjectListOutput["status"];

const statusMeta = {
  active: { icon: IconPlayerPlay, label: "Active" },
  archived: { icon: IconArchive, label: "Archived" },
  paused: { icon: IconPlayerPause, label: "Paused" },
};

export function DashboardPage() {
  const { data: projects, isLoading } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortValue>("recent");
  const [status, setStatus] = useState<StatusFilter>("all");
  const header = useMemo(
    () => ({
      title: "Project index",
      description: "Status, ownership pressure, and next entry point in one list.",
      actions: (
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <IconPlus />
          New project
        </Button>
      ),
    }),
    [],
  );

  useDashboardHeader(header);

  const visibleProjects = useMemo(() => {
    return filterAndSortProjects(projects ?? [], query, sort, status);
  }, [projects, query, sort, status]);

  const statusCounts = useMemo(() => {
    const source = projects ?? [];
    return {
      active: source.filter((project) => project.status === "active").length,
      all: source.length,
      archived: source.filter((project) => project.status === "archived").length,
      paused: source.filter((project) => project.status === "paused").length,
    };
  }, [projects]);

  return (
    <>
      <main className="flex-1 p-4 sm:p-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          {isLoading ? (
            <LoadingScreen label="Loading projects…" variant="shell" />
          ) : !projects?.length ? (
            <div className="flex min-h-[22rem] flex-col items-start justify-end border-2 border-dashed bg-card p-6">
              <p className="font-semibold text-2xl">No projects yet</p>
              <p className="mt-2 max-w-md text-muted-foreground text-sm">
                Create the first workspace and OpenSprint will provision the default board workflow.
              </p>
              <Button className="mt-5" onClick={() => setCreateOpen(true)}>
                <IconPlus />
                Create project
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-3 border bg-card p-3 lg:grid-cols-[minmax(14rem,1fr)_auto] lg:items-center">
                <div className="relative min-w-0">
                  <IconSearch className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search projects…"
                    className="pl-8"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(["all", "active", "paused", "archived"] as const).map((value) => (
                    <Button
                      key={value}
                      variant={status === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatus(value)}
                      className="h-8"
                    >
                      {value === "all" ? "All" : statusMeta[value].label}
                      <span className="tabular-nums">{statusCounts[value]}</span>
                    </Button>
                  ))}
                  <NativeSelect
                    value={sort}
                    onChange={(event) => setSort(event.target.value as SortValue)}
                    aria-label="Sort projects"
                    className="w-40"
                  >
                    <NativeSelectOption value="recent">Recently updated</NativeSelectOption>
                    <NativeSelectOption value="oldest">Oldest first</NativeSelectOption>
                    <NativeSelectOption value="name-asc">Name A-Z</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>

              {visibleProjects.length ? (
                <div className="border bg-card">
                  {visibleProjects.map((project) => (
                    <ProjectRow key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed py-14 text-center text-muted-foreground text-sm">
                  No projects match your search.
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function ProjectRow({ project }: { project: ProjectListOutput }) {
  const href = project.defaultBoardId
    ? `/projects/${project.id}/boards/${project.defaultBoardId}`
    : `/projects/${project.id}`;
  const StatusIcon = statusMeta[project.status].icon;

  return (
    <Link
      href={href}
      className="grid gap-3 border-b p-3 transition-colors last:border-b-0 hover:bg-accent/45 focus-visible:bg-accent/45 sm:grid-cols-[minmax(0,1.2fr)_8rem_8rem_9rem_auto] sm:items-center"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-semibold">{project.name}</p>
          <Badge variant="outline" className="capitalize">
            <StatusIcon />
            {project.status}
          </Badge>
        </div>
        <p className="mt-1 truncate text-muted-foreground text-sm">{project.description ?? "No description"}</p>
      </div>
      <Metric label="Members" value={project.memberCount} />
      <Metric label="Open tasks" value={project.openTaskCount} />
      <Metric
        label="Updated"
        value={new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
          new Date(project.updatedAt),
        )}
      />
      <IconArrowRight className="hidden text-muted-foreground sm:block" />
    </Link>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={cn("min-w-0 text-sm")}>
      <p className="text-muted-foreground text-[0.68rem] uppercase">{label}</p>
      <p className="truncate font-medium tabular-nums">{value}</p>
    </div>
  );
}

function filterAndSortProjects(projects: ProjectListOutput[], query: string, sort: SortValue, status: StatusFilter) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = normalizedQuery
    ? projects.filter((project) =>
        [project.name, project.description ?? ""].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
      )
    : [...projects];
  const statusFiltered = status === "all" ? filtered : filtered.filter((project) => project.status === status);

  return statusFiltered.sort((a, b) => {
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();

    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });
}
