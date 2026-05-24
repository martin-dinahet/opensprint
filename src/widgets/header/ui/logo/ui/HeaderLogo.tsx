"use client";

import { FolderKanbanIcon } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";
import { buttonVariants, cn } from "@/shared";

export const HeaderLogo: FC = () => {
  return (
    <Link href="/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0 font-medium")}>
      <FolderKanbanIcon />
      <span className="hidden sm:inline">OpenSprint</span>
    </Link>
  );
};
