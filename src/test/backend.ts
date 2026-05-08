import { ok, type Result } from "@punpun-dev/ts-result";
import { testClient } from "hono/testing";
import type { ServerType } from "@/server";

export function repositoryOk<T>(data: T): Result<T, Error> {
  return ok(data);
}

export function createHonoTestClient(server: ServerType) {
  return testClient(server);
}
