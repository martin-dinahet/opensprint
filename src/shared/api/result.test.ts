import { err, ok } from "@punpun-dev/ts-result";
import { describe, expect, it } from "vitest";
import { ClientApiError, handleClientResult, readApiResult, requestApiResult, unwrapClientResult } from "./result";

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

  it("uses a string root error message and falls back when JSON cannot be parsed", async () => {
    const response = Response.json({ errors: { root: "Denied" } }, { status: 401 });

    const result = await readApiResult(response, "Fallback");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Denied");
      expect(result.error.status).toBe(401);
    }

    const invalidJsonResponse = new Response("{", {
      status: 500,
      headers: { "content-type": "application/json" },
    });

    const invalidJsonResult = await readApiResult(invalidJsonResponse, "Broken response");

    expect(invalidJsonResult.isErr()).toBe(true);
    if (invalidJsonResult.isErr()) {
      expect(invalidJsonResult.error.message).toBe("Broken response");
      expect(invalidJsonResult.error.status).toBe(500);
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

  it("wraps request failures and preserves existing client API errors", async () => {
    const networkResult = await requestApiResult(async () => {
      throw new Error("Network down");
    }, "Fallback");

    expect(networkResult.isErr()).toBe(true);
    if (networkResult.isErr()) {
      expect(networkResult.error).toBeInstanceOf(ClientApiError);
      expect(networkResult.error.message).toBe("Network down");
      expect(networkResult.error.status).toBe(0);
    }

    const existingError = new ClientApiError("Already parsed", 418);
    const existingResult = await requestApiResult(async () => {
      throw existingError;
    }, "Fallback");

    expect(existingResult.isErr()).toBe(true);
    if (existingResult.isErr()) {
      expect(existingResult.error).toBe(existingError);
    }
  });

  it("handles client-side work as Result values", async () => {
    const success = await handleClientResult(() => "done", "Fallback");
    const failure = await handleClientResult(() => {
      throw "plain failure";
    }, "Fallback");

    expect(success.isOk()).toBe(true);
    expect(success.unwrap()).toBe("done");
    expect(failure.isErr()).toBe(true);
    if (failure.isErr()) {
      expect(failure.error.message).toBe("Fallback");
      expect(failure.error.status).toBe(0);
    }
  });
});
