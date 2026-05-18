import { describe, expect, it } from "vitest";
import { formatLabel } from "./format-label";

describe("formatLabel", () => {
  it("uses known navigation labels", () => {
    expect(formatLabel("dashboard")).toBe("Projects");
    expect(formatLabel("members")).toBe("Members");
  });

  it("converts unknown slugs to title case labels", () => {
    expect(formatLabel("release-notes")).toBe("Release Notes");
  });
});
