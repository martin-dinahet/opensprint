import { IconArrowRight } from "@tabler/icons-react";
import type { BoardOutput } from "@/entities/board";
import type { ColumnOutput } from "@/entities/column";
import type { ProjectListOutput } from "@/entities/project";
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared";

type Props = {
  pending: boolean;
  setTargetBoardId: (boardId: string) => void;
  setTargetColumnId: (columnId: string) => void;
  setTargetProjectId: (projectId: string) => void;
  targetBoardId: string;
  targetBoards: BoardOutput[];
  targetColumnId: string;
  targetColumns: ColumnOutput[];
  targetProjectId: string;
  transferCurrentTask: () => void;
  transferTargetProjects: ProjectListOutput[];
};

export function TransferSection({
  pending,
  setTargetBoardId,
  setTargetColumnId,
  setTargetProjectId,
  targetBoardId,
  targetBoards,
  targetColumnId,
  targetColumns,
  targetProjectId,
  transferCurrentTask,
  transferTargetProjects,
}: Props) {
  return (
    <section className="space-y-3 rounded-md border bg-muted/10 p-3">
      <div>
        <h3 className="flex items-center gap-2 font-medium text-sm">
          <IconArrowRight className="h-4 w-4 text-muted-foreground" />
          Transfer
        </h3>
        <p className="text-muted-foreground text-xs">Move this task to another board or project column.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          items={Object.fromEntries(transferTargetProjects.map((project) => [project.id, project.name]))}
          value={targetProjectId}
          onValueChange={(value) => {
            setTargetProjectId(typeof value === "string" ? value : "");
            setTargetBoardId("");
            setTargetColumnId("");
          }}
        >
          <SelectTrigger aria-label="Target project" className="h-9 w-full">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            {transferTargetProjects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={Object.fromEntries(targetBoards.map((board) => [board.id, board.name]))}
          value={targetBoardId}
          onValueChange={(value) => {
            setTargetBoardId(typeof value === "string" ? value : "");
            setTargetColumnId("");
          }}
          disabled={!targetProjectId}
        >
          <SelectTrigger aria-label="Target board" className="h-9 w-full">
            <SelectValue placeholder="Board" />
          </SelectTrigger>
          <SelectContent>
            {targetBoards.map((board) => (
              <SelectItem key={board.id} value={board.id}>
                {board.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={Object.fromEntries(targetColumns.map((column) => [column.id, column.name]))}
          value={targetColumnId}
          onValueChange={(value) => setTargetColumnId(typeof value === "string" ? value : "")}
          disabled={!targetBoardId}
        >
          <SelectTrigger aria-label="Target column" className="h-9 w-full">
            <SelectValue placeholder="Column" />
          </SelectTrigger>
          <SelectContent>
            {targetColumns.map((column) => (
              <SelectItem key={column.id} value={column.id}>
                {column.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={transferCurrentTask}
        disabled={!targetProjectId || !targetBoardId || !targetColumnId || pending}
      >
        <IconArrowRight className="h-4 w-4" />
        Transfer task
      </Button>
    </section>
  );
}
