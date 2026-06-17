type RouteParams = Readonly<Record<string, string | string[] | undefined>>;

export function getProjectId(pathname: string, params: RouteParams) {
  const paramId = params.id;
  if (typeof paramId === "string") return paramId;

  return pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? "";
}

export function getBoardId(pathname: string, params: RouteParams) {
  const paramId = params.boardId;
  if (typeof paramId === "string") return paramId;

  return pathname.match(/^\/projects\/[^/]+\/boards\/([^/]+)/)?.[1] ?? "";
}
