import { KanbanSquareIcon, UsersIcon } from "lucide-react";

type RouteParams = Readonly<Record<string, string | string[] | undefined>>;

export type ProjectNavigationItem = {
  href: string;
  icon: typeof KanbanSquareIcon;
  label: string;
};

export function getProjectId(pathname: string, params: RouteParams) {
  const paramId = params.id;
  if (typeof paramId === "string") return paramId;

  return pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? "";
}

export function getProjectNavigationItems(projectId: string): ProjectNavigationItem[] {
  return [
    { href: projectId ? `/projects/${projectId}` : "/dashboard", label: "Boards", icon: KanbanSquareIcon },
    { href: projectId ? `/projects/${projectId}/members` : "/dashboard", label: "Members", icon: UsersIcon },
  ];
}
