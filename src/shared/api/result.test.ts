import { err, ok } from "@punpun-dev/ts-result";
import { describe, expect, it } from "vitest";
import { ClientApiError, readApiResult, unwrapClientResult } from "./result";

describe("API result helpers", () => {
  it("reads successful JSON responses", async () => {
    const response = Response.json({ value: 42 }, { status: 200 });

    const result = await readApiResult<{ value: number }>(response, "Fallback");

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual({ value: 42 });
  });

  it("uses a custom data reader", async () => {
    const response = Response.json({ items: ["a"] }, { status: 200 });

    const result = await readApiResult<string[]>(response, "Fallback", (body) => (body as { items: string[] }).items);

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual(["a"]);
  });

  it("returns an API error with the server root message", async () => {
    const response = Response.json({ errors: { root: ["Nope"] } }, { status: 403 });

    const result = await readApiResult(response, "Fallback");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ClientApiError);
      expect(result.error.message).toBe("Nope");
      expect(result.error.status).toBe(403);
    }
  });

  it("returns fallback errors when successful responses have no data", async () => {
    const response = new Response(null, { status: 204 });

    const result = await readApiResult(response, "Missing data", () => null);

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Missing data");
    }
  });

  it("unwraps successful results and throws failed results", () => {
    expect(unwrapClientResult(ok("done"))).toBe("done");
    expect(() => unwrapClientResult(err(new ClientApiError("Broken", 500)))).toThrow(ClientApiError);
  });
});
