import { useQueries } from "@tanstack/react-query";
import type { ColumnOutput } from "@/entities/column";
import { taskApi, taskKeys } from "@/entities/task";
import { unwrapClientResult } from "@/shared";

export function useProjectTaskLists(columns: ColumnOutput[]) {
  const taskQueries = useQueries({
    queries: columns.map((column) => ({
      queryKey: taskKeys.list(column.id),
      queryFn: async () => unwrapClientResult(await taskApi.list(column.id)).tasks,
      enabled: !!column.id,
    })),
  });

  return taskQueries.map((query) => query.data ?? []);
}
