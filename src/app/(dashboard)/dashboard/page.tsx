"use client";

import { IconPlus, IconSearch, IconStack } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import type { ProjectListOutput } from "@/entities/project";
import { ProjectCard, useProjects } from "@/entities/project";
import { CreateProjectDialog } from "@/features/create-project";
import { Badge, Button, Input, LoadingScreen, NativeSelect, NativeSelectOption } from "@/shared";
import { useDashboardHeader } from "@/widgets/header";

type SortValue = "name-asc" | "recent" | "oldest";

export default function Page() {
  const { data: projects, isLoading } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortValue>("recent");
  const header = useMemo(() => ({ title: "Projects" }), []);

  useDashboardHeader(header);

  const visibleProjects = useMemo(() => {
    return filterAndSortProjects(projects ?? [], query, sort);
  }, [projects, query, sort]);

  return (
    <>
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-5xl">
          {isLoading ? (
            <LoadingScreen label="Loading projects…" variant="shell" />
          ) : !projects?.length ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
              <IconStack className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-center text-muted-foreground">No projects yet</p>
              <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                Create your first project
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="relative min-w-0 flex-1 md:max-w-sm">
                  <IconSearch className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search projects…"
                    className="pl-8"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Active</Badge>
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
                <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
                  {visibleProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 text-muted-foreground text-sm transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <IconPlus className="h-5 w-5" />
                    New project
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed py-14 text-center text-muted-foreground text-sm">
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

function filterAndSortProjects(projects: ProjectListOutput[], query: string, sort: SortValue) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = normalizedQuery
    ? projects.filter((project) =>
        [project.name, project.description ?? ""].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)),
      )
    : [...projects];

  return filtered.sort((a, b) => {
    if (sort === "name-asc") return a.name.localeCompare(b.name);
    const aTime = new Date(a.updatedAt).getTime();
    const bTime = new Date(b.updatedAt).getTime();

    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });
}
