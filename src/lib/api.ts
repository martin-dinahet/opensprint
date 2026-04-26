import { hc } from "hono/client";

const API_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/api";

type ApiClient = {
  projects: {
    $get: (args?: unknown) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
    $post: (args: { json: unknown }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
    [":id"]: {
      $get: (args: { param: { id: string } }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
      $patch: (args: {
        param: { id: string };
        json: unknown;
      }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
      $delete: (args: { param: { id: string } }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
      boards: {
        $get: (args?: unknown) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
        $post: (args: {
          param: { id: string };
          json: unknown;
        }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
        reorder: {
          $patch: (args: {
            param: { id: string };
            json: unknown;
          }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
        };
        [":boardId"]: {
          $get: (args: {
            param: { id: string; boardId: string };
          }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
          $patch: (args: {
            param: { id: string; boardId: string };
            json: unknown;
          }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
          $delete: (args: {
            param: { id: string; boardId: string };
          }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
        };
      };
    };
  };
  boards: {
    [":boardId"]: {
      tasks: {
        $get: (args: { param: { boardId: string } }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
        $post: (args: {
          param: { boardId: string };
          json: unknown;
        }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
        [":taskId"]: {
          $patch: (args: {
            param: { boardId: string; taskId: string };
            json: unknown;
          }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
          $delete: (args: {
            param: { boardId: string; taskId: string };
          }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
        };
      };
    };
  };
  tasks: {
    [":taskId"]: {
      assign: {
        $patch: (args: {
          param: { taskId: string };
          json: unknown;
        }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
      };
      move: {
        $patch: (args: {
          param: { taskId: string };
          json: unknown;
        }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
      };
      reorder: {
        $patch: (args: {
          param: { taskId: string };
          json: unknown;
        }) => Promise<{ json: () => Promise<unknown>; ok: boolean }>;
      };
    };
  };
};

export const api = hc(API_URL, {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      cache: "no-store",
      ...init,
    }),
}) as unknown as ApiClient;
