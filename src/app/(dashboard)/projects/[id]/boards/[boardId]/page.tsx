"use client";

import { use } from "react";
import { ProjectBoardPage } from "@/_pages/project-board/page";

type Props = {
  params: Promise<{ boardId: string; id: string }>;
};

export default function Page({ params }: Props) {
  const { boardId, id: projectId } = use(params);

  return <ProjectBoardPage boardId={boardId} projectId={projectId} />;
}
