import { useQuery } from "@tanstack/react-query";
import { memberApi, memberKeys } from "@/features/member/api";
import { unwrapClientResult } from "@/features/shared/api/result";

export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: memberKeys.list(projectId),
    queryFn: async () => unwrapClientResult(await memberApi.list(projectId)).members,
    enabled: !!projectId,
  });
}
