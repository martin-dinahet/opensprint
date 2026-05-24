"use client";

import Link from "next/link";
import { cn } from "@/shared";

type Props = {
  activeTab: "board" | "members";
  boardId?: string | null;
  projectId: string;
};

export function ProjectTabs({ activeTab, boardId, projectId }: Props) {
  const boardHref = boardId ? `/projects/${projectId}/boards/${boardId}` : `/projects/${projectId}`;

  return (
    <div className="flex items-center gap-1">
      <Link
        href={boardHref}
        className={cn(
          "relative inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium transition-colors",
          activeTab === "board"
            ? "text-foreground after:absolute after:inset-x-0 after:bottom-[-5px] after:h-0.5 after:bg-foreground after:opacity-100"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Board
      </Link>
      <Link
        href={`/projects/${projectId}/members`}
        className={cn(
          "relative inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium transition-colors",
          activeTab === "members"
            ? "text-foreground after:absolute after:inset-x-0 after:bottom-[-5px] after:h-0.5 after:bg-foreground after:opacity-100"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Members
      </Link>
    </div>
  );
}
